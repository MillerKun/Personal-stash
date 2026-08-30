import os
import sys
import json
import subprocess
import time
from datetime import datetime
from deep_translator import GoogleTranslator
import textwrap

def get_video_info(url):
    print(f"Fetching video info for {url}...")
    cmd = [
        "python", "-m", "yt_dlp",
        "--dump-json",
        "--write-auto-sub",
        "--sub-lang", "en",
        "--skip-download",
        url
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"Error fetching info: {result.stderr}")
        return None
        
    try:
        # Sometimes yt-dlp outputs multiple JSON objects, take the last one
        lines = [line.strip() for line in result.stdout.split('\n') if line.strip().startswith('{')]
        if not lines:
            return None
        info = json.loads(lines[-1])
        return info
    except Exception as e:
        print(f"Failed to parse JSON: {e}")
        return None

def translate_text(text):
    if not text or not text.strip():
        return ""
    try:
        translator = GoogleTranslator(source='en', target='zh-CN')
        # Splitting by paragraphs to avoid length limits
        chunks = textwrap.wrap(text, width=4000, break_long_words=False)
        translated = []
        for chunk in chunks:
            translated.append(translator.translate(chunk))
            time.sleep(0.5) # simple rate limit avoidance
        return "\n".join(translated)
    except Exception as e:
        print(f"Translation error: {e}")
        return text

def parse_vtt(vtt_file):
    if not os.path.exists(vtt_file):
        return []
        
    lines = []
    with open(vtt_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # simple parser for VTT
    subtitles = []
    current_time = ""
    current_text = []
    
    for line in lines:
        line = line.strip()
        if '-->' in line:
            if current_time and current_text:
                subtitles.append({
                    "time": current_time,
                    "text": " ".join(current_text)
                })
            current_time = line.split(' ')[0][:8] # roughly get HH:MM:SS
            current_text = []
        elif line and not line.startswith('WEBVTT') and not line.startswith('Kind:') and not line.startswith('Language:'):
            # remove formatting tags like <c>
            import re
            clean_text = re.sub(r'<[^>]+>', '', line)
            if clean_text and clean_text not in current_text:
                current_text.append(clean_text)
                
    if current_time and current_text:
        subtitles.append({"time": current_time, "text": " ".join(current_text)})
        
    # Group every 5 subtitles to avoid too many small chunks
    grouped = []
    group_text = []
    start_time = ""
    
    for i, sub in enumerate(subtitles):
        if not start_time:
            start_time = sub['time']
        group_text.append(sub['text'])
        
        if len(group_text) >= 15 or i == len(subtitles) - 1:
            grouped.append({
                "time": start_time,
                "text": " ".join(group_text)
            })
            start_time = ""
            group_text = []
            
    return grouped

def main():
    if len(sys.argv) < 2:
        print("Usage: python process_gdc.py <youtube_url>")
        sys.exit(1)
        
    url = sys.argv[1]
    
    info = get_video_info(url)
    if not info:
        print("Failed to fetch video info.")
        sys.exit(1)
        
    title = info.get('title', 'Unknown Title')
    vid = info.get('id')
    desc = info.get('description', '')[:500] + "..." # truncate for brevity
    upload_date = info.get('upload_date', '20200101')
    formatted_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}"
    
    print(f"Title: {title}")
    print("Translating title and description...")
    zh_title = translate_text(title)
    zh_desc = translate_text(desc)
    
    # check for subtitles
    vtt_file = None
    for f in os.listdir('.'):
        if f.endswith(f"{vid}.en.vtt"):
            vtt_file = f
            break
            
    subtitles = []
    if vtt_file:
        print(f"Parsing subtitles from {vtt_file}...")
        subtitles = parse_vtt(vtt_file)
        print(f"Found {len(subtitles)} subtitle blocks. Translating (this may take a while)...")
        
        # for demo, only translate first 10 blocks to save time
        max_blocks = min(20, len(subtitles))
        for i in range(max_blocks):
            print(f"Translating block {i+1}/{max_blocks}...")
            subtitles[i]['zh_text'] = translate_text(subtitles[i]['text'])
            
    # Generate markdown
    docs_dir = os.path.join("docs", "videos")
    os.makedirs(docs_dir, exist_ok=True)
    
    safe_title = "".join(c if c.isalnum() else "_" for c in title)
    filename = f"{formatted_date}_{safe_title}.md"
    filepath = os.path.join(docs_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f"---\n")
        f.write(f"title: {zh_title}\n")
        f.write(f"date: {formatted_date}\n")
        f.write(f"---\n\n")
        
        f.write(f"# {zh_title}\n\n")
        f.write(f"> 原标题: {title}\n\n")
        
        f.write(f'<iframe width="100%" height="450" src="https://www.youtube.com/embed/{vid}" frameborder="0" allowfullscreen></iframe>\n\n')
        
        f.write(f"## 简介\n\n{zh_desc}\n\n")
        
        if subtitles:
            f.write("## 视频文稿 (中英对照)\n\n")
            f.write("*注：当前为演示版本，仅展示开头部分的文稿翻译。*\n\n")
            for i in range(min(20, len(subtitles))):
                sub = subtitles[i]
                f.write(f"**[{sub['time']}]**\n")
                f.write(f"> {sub['text']}\n\n")
                f.write(f"{sub.get('zh_text', '')}\n\n")
                f.write("---\n\n")
                
    print(f"\nDone! Article generated at {filepath}")
    
    # Update mkdocs.yml nav
    mkdocs_file = "mkdocs.yml"
    with open(mkdocs_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "videos" not in content:
        content = content.replace("nav:\n  - 首页: index.md", f"nav:\n  - 首页: index.md\n  - GDC 演讲:\n    - {zh_title}: videos/{filename}")
        with open(mkdocs_file, 'w', encoding='utf-8') as f:
            f.write(content)
            
if __name__ == "__main__":
    main()
