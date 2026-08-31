import pymupdf
import json
import re

pdf_path = r"C:\Users\Eugen\Downloads\游戏设计艺术(第2版) -- （美）Jesse Schell（杰西·谢尔） -- Di 1 ban, Beijing, 2016 -- 北京：电子工业出版社 -- isbn13 9787121282669 -- 6ee20cb064d04c3856bf4ba5205871a5 -- Anna’s Archive.pdf"

doc = pymupdf.open(pdf_path)
toc = doc.get_toc()

# Find chapter boundaries
chapters = []
for item in toc:
    level, title, page_num = item
    if level == 1 and "章" in title: # e.g. 第1章
        chapters.append({"title": title, "start_page": page_num})

print(f"Found {len(chapters)} chapters.")

# Calculate end pages
for i in range(len(chapters)):
    if i < len(chapters) - 1:
        chapters[i]["end_page"] = chapters[i+1]["start_page"]
    else:
        chapters[i]["end_page"] = len(doc) + 1

# Extract text for each chapter
chapter_data = []

# To keep the file size manageable and clean, we'll process paragraph by paragraph
def clean_text(text):
    # Remove excessive newlines or page numbers if necessary
    # simple clean for now
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    return "\n\n".join(lines)

for i, ch in enumerate(chapters):
    print(f"Extracting {ch['title']}...")
    text_content = ""
    start_p = ch["start_page"] - 1 # 0-indexed
    end_p = ch["end_page"] - 1
    
    for page_num in range(start_p, min(end_p, len(doc))):
        page = doc[page_num]
        text = page.get_text()
        text_content += text + "\n"
    
    # We will just split it into paragraphs roughly
    paragraphs = [p.strip() for p in text_content.split('\n\n') if p.strip()]
    if not paragraphs:
        # Fallback to simple split if no double newlines
        paragraphs = [p.strip() for p in text_content.split('\n') if p.strip() and len(p.strip()) > 5]
        
    chapter_data.append({
        "id": i + 1,
        "title": ch["title"],
        "content": paragraphs
    })

# Extract lenses? It might be hard to parse exactly, but we can search for "X号透镜" in the text
# Or we can just let the user read the text, as they requested "the experience of reading the content"
# The UI can just render the paragraphs.

js_content = "const bookData = " + json.dumps(chapter_data, ensure_ascii=False, indent=2) + ";\n"

out_path = r"C:\Users\Eugen\.gemini\antigravity\scratch\game-design-art-study\data.js"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print("Data exported successfully.")
