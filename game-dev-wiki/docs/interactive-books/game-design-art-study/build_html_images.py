html_content = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>馃幃 娓告垙璁捐鑹烘湳 (绗?鐗? - 娌夋蹈寮忎簰鍔ㄥ涔?/title>
    <style>
        :root {
            --bg-color: #f5f5f7;
            --surface-color: #ffffff;
            --primary-color: #6200ee;
            --secondary-color: #ff9800;
            --text-color: #333333;
            --text-muted: #666666;
            --learned-bg: #e0e0e0;
            --border-color: #e0e0e0;
            --success-color: #4caf50;
            --error-color: #f44336;
        }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--bg-color); color: var(--text-color); margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #bbb; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #999; }
        
        header { background-color: var(--surface-color); padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); height: 50px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);}
        header h1 { margin: 0; font-size: 1.4rem; color: #111;}
        
        #main-layout { display: flex; flex: 1; height: calc(100vh - 70px); }
        
        /* Sidebar */
        #sidebar { width: 280px; background-color: #fafafa; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; }
        .search-box { padding: 15px; }
        .search-box input { width: 100%; padding: 8px; background: #fff; border: 1px solid #ccc; color: #333; border-radius: 4px; box-sizing: border-box; }
        #chapter-list { flex: 1; overflow-y: auto; padding: 0 10px 15px 10px; }
        
        .chapter-item { padding: 10px 15px; cursor: pointer; border-radius: 6px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; transition: 0.2s; border: 1px solid transparent;}
        .chapter-item:hover { background-color: rgba(0,0,0,0.04); }
        .chapter-item.active { background-color: rgba(98, 0, 238, 0.08); border-color: rgba(98, 0, 238, 0.2); color: var(--primary-color); font-weight: bold;}
        .chapter-item.is-learned { color: #aaa; }
        
        /* Images Pane */
        #pdf-pane { flex: 2; position: relative; border-right: 1px solid var(--border-color); background: #dcdcdc; overflow-y: auto; text-align: center; scroll-behavior: smooth; --img-scale: 100%; padding-top: 10px;}
        .page-img { width: var(--img-scale); display: block; margin: 0 auto 10px auto; box-shadow: 0 4px 10px rgba(0,0,0,0.15); background-color: white; transition: width 0.2s ease; aspect-ratio: 2126/2938; }
        
        /* Zoom Controls */
        .zoom-controls { position: sticky; top: 10px; z-index: 100; display: inline-flex; background: rgba(255,255,255,0.9); padding: 5px 10px; border-radius: 20px; align-items: center; gap: 10px; margin-bottom: -40px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); backdrop-filter: blur(5px);}
        .zoom-btn { background: #f0f0f0; color: #333; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-weight: bold; font-size: 1.1rem; display: flex; justify-content: center; align-items: center; transition: 0.2s;}
        .zoom-btn:hover { background: var(--primary-color); color: white;}
        .zoom-label { color: #333; font-size: 0.9rem; min-width: 45px; text-align: center; font-weight: bold;}
        
        /* Tools Pane */
        #tools-pane { flex: 1.2; min-width: 350px; max-width: 500px; background-color: var(--surface-color); display: flex; flex-direction: column; }
        
        .tools-header { padding: 15px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;}
        .btn-learned { background: var(--secondary-color); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem;}
        .btn-learned.active { background: #e0e0e0; color: #666; }
        
        .tools-nav { display: flex; border-bottom: 1px solid var(--border-color); background: #fafafa; }
        .tab-btn { flex: 1; padding: 12px; background: none; border: none; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; font-weight: bold;}
        .tab-btn.active { color: var(--primary-color); border-bottom-color: var(--primary-color); background: #fff;}
        
        .tools-content { flex: 1; overflow-y: auto; padding: 20px; background: var(--bg-color); }
        .tab-panel { display: none; }
        .tab-panel.active { display: block; animation: fadeIn 0.3s; }
        
        /* Lens Card */
        .lens-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05);}
        .lens-title { color: var(--primary-color); margin: 0 0 10px 0; font-size: 1.1rem; padding-right: 25px;}
        .lens-num { position: absolute; top: 10px; right: 10px; background: var(--primary-color); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;}
        .tag-open { display: inline-block; background: rgba(255,152,0,0.1); color: #e65100; padding: 2px 6px; border-radius: 3px; font-size: 0.75rem; margin-bottom: 10px; border: 1px solid #ffa726;}
        .lens-q { font-style: italic; color: #555; font-size: 0.9rem; margin-bottom: 5px;}
        
        /* Q&A */
        .qa-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);}
        .qa-title { margin: 0 0 15px 0; font-size: 1.05rem; line-height: 1.4; color: #222;}
        .options { list-style: none; padding: 0; margin: 0; }
        .options li { padding: 10px 15px; background: #f5f5f5; border-radius: 4px; margin-bottom: 8px; cursor: pointer; border: 1px solid #e0e0e0; font-size: 0.95rem; color: #333;}
        .options li:hover { background: #ebebeb; }
        .options li.correct { background: #e8f5e9; border-color: var(--success-color); pointer-events: none;}
        .options li.wrong { background: #ffebee; border-color: var(--error-color); pointer-events: none;}
        .feedback { display: none; margin-top: 10px; padding: 10px; border-radius: 4px; font-size: 0.9rem; }
        
        /* Comments */
        .comment-box { margin-top: 15px; border-top: 1px dashed #ddd; padding-top: 15px;}
        .c-input { width: 100%; padding: 8px; background: #fff; border: 1px solid #ccc; color: #333; border-radius: 4px; box-sizing: border-box; margin-bottom: 8px; font-family: inherit;}
        textarea.c-input { resize: vertical; min-height: 60px; }
        .btn-submit { background: var(--primary-color); color: #fff; border: none; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;}
        .c-list { margin-top: 15px; display: flex; flex-direction: column; gap: 10px; }
        .c-item { background: #f9f9f9; padding: 10px; border-radius: 4px; border-left: 3px solid var(--secondary-color); font-size: 0.9rem;}
        .c-author { font-weight: bold; color: #d84315; margin-right: 10px;}
        .c-time { color: #888; font-size: 0.8rem; }
        .c-text { margin: 5px 0 0 0; color: #444; white-space: pre-wrap; line-height: 1.4;}
        
        @keyframes fadeIn { from {opacity: 0;} to {opacity: 1;} }
    </style>
</head>
<body>

    <header>
        <h1>馃幃 娓告垙璁捐鑹烘湳 (绗?鐗? - 娌夋蹈寮忎簰鍔ㄥ涔?/h1>
    </header>

    <div id="main-layout">
        <div id="sidebar">
            <div class="search-box">
                <input type="text" id="search" placeholder="鎼滅储绔犺妭..." onkeyup="renderChapters()">
            </div>
            <div id="chapter-list"></div>
        </div>
        
        <div id="pdf-pane">
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="changeZoom(-10)">-</button>
                <span id="zoom-text" class="zoom-label">100%</span>
                <button class="zoom-btn" onclick="changeZoom(10)">+</button>
            </div>
            <div id="pages-container">
                <!-- Images will be injected here -->
            </div>
        </div>
        
        <div id="tools-pane">
            <div class="tools-header">
                <h3 id="tools-chapter-title" style="margin: 0; font-size: 1.1rem; color: var(--primary-color);">绗?绔?/h3>
                <button id="btn-learn-toggle" class="btn-learned" onclick="toggleLearned()">馃摉 鏍囪宸插</button>
            </div>
            
            <div class="tools-nav">
                <button class="tab-btn active" onclick="switchTab('lenses')">馃攳 鏈珷閫忛暅</button>
                <button class="tab-btn" onclick="switchTab('qa')">馃摑 闂瓟鎺㈣</button>
            </div>
            
            <div class="tools-content">
                <div id="tab-lenses" class="tab-panel active"></div>
                <div id="tab-qa" class="tab-panel"></div>
            </div>
        </div>
    </div>

<script>
    // Hardcoded simple mapping for first few chapters of Art of Game Design
    const chapters = __CHAPTERS_PLACEHOLDER__;

    const pageToChapter = {};
    for (let i = 0; i < chapters.length; i++) {
        const start = chapters[i].page;
        const end = i < chapters.length - 1 ? chapters[i+1].page - 1 : 638;
        for (let p = start; p <= end; p++) {
            pageToChapter[p] = chapters[i].id;
        }
    }

    const lenses = [
        { id: 1, chapter: 1, name: "鎯呮劅閫忛暅", open: true, qs: ["鎴戝笇鏈涚帺瀹朵綋楠屽埌鍝簺鎯呮劅锛?, "浠栦滑瀹為檯涓婁綋楠屽埌浜嗕粈涔堟儏鎰燂紵", "濡備綍缂╁皬涓よ€呭樊璺濓紵"] },
        { id: 2, chapter: 2, name: "鏈川浣撻獙閫忛暅", open: true, qs: ["鎴戝笇鏈涚帺瀹惰幏寰楃殑浣撻獙鏄粈涔堬紵", "杩欎釜浣撻獙鐨勬牳蹇冩湰璐ㄦ槸浠€涔堬紵", "鎴戠殑娓告垙濡備綍鎹曟崏杩欑鏈川锛?] },
        { id: 3, chapter: 3, name: "鍦哄湴閫忛暅", open: false, qs: ["鐜╁浼氬湪浠€涔堟牱鐨勭幆澧冧腑鐜╂垜鐨勬父鎴忥紵", "杩欎釜鐜浼氬浣撻獙浜х敓浠€涔堝奖鍝嶏紵"] },
        { id: 4, chapter: 4, name: "鎯婂枩閫忛暅", open: false, qs: ["鎴戠殑娓告垙鍦ㄥ摢浜涘湴鏂硅兘缁欑帺瀹舵儕鍠滐紵"] },
        { id: 5, chapter: 4, name: "涔愯叮閫忛暅", open: true, qs: ["鎴戠殑娓告垙濂界帺鍚楋紵涓轰粈涔堬紵"] },
        { id: 6, chapter: 5, name: "鍏冪礌鍥涢潰浣撻€忛暅", open: false, qs: ["鏈哄埗銆佹晠浜嬨€佺編瀛︺€佹妧鏈槸鍚﹀崗璋冧竴鑷村苟鏀寔涓婚锛?] },
        { id: 7, chapter: 6, name: "鍏ㄦ伅閫忛暅", open: false, qs: ["娓告垙涓殑姣忎竴涓厓绱犳槸鍚﹂兘鍙嶆槧浜嗘暣浣撲富棰橈紵"] },
    ];

    const qaDB = __QA_DB_PLACEHOLDER__;

    let state = {
        learned: JSON.parse(localStorage.getItem('agy_learned')) || [],
        answers: JSON.parse(localStorage.getItem('agy_answers')) || {},
        comments: JSON.parse(localStorage.getItem('agy_comments')) || {},
        currentChapter: parseInt(localStorage.getItem('agy_lastChapter')) || 1,
        zoom: parseInt(localStorage.getItem('agy_zoom')) || 100
    };

    let isScrollingFromClick = false;

    function saveState() {
        localStorage.setItem('agy_learned', JSON.stringify(state.learned));
        localStorage.setItem('agy_answers', JSON.stringify(state.answers));
        localStorage.setItem('agy_comments', JSON.stringify(state.comments));
        localStorage.setItem('agy_lastChapter', state.currentChapter);
        localStorage.setItem('agy_zoom', state.zoom);
    }
    
    function changeZoom(delta) {
        let newZoom = state.zoom + delta;
        if (newZoom < 30) newZoom = 30;
        if (newZoom > 250) newZoom = 250;
        state.zoom = newZoom;
        applyZoom();
        saveState();
    }
    
    function applyZoom() {
        document.getElementById('zoom-text').textContent = state.zoom + '%';
        document.getElementById('pdf-pane').style.setProperty('--img-scale', state.zoom + '%');
    }

    function loadPages() {
        applyZoom();
        const pane = document.getElementById('pages-container');
        let html = '';
        for(let i = 1; i <= 638; i++) {
            html += `<img id="page-${i}" data-page="${i}" class="page-img" src="pages/page_${i}.jpg" loading="lazy" alt="Page ${i}">`;
        }
        pane.innerHTML = html;
        
        const observer = new IntersectionObserver((entries) => {
            if (isScrollingFromClick) return; 
            
            let maxVisible = null;
            let maxRatio = 0;
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    maxVisible = entry.target;
                }
            });
            
            if (maxVisible) {
                const pageNum = parseInt(maxVisible.getAttribute('data-page'));
                const chId = pageToChapter[pageNum];
                if (chId && chId !== state.currentChapter) {
                    state.currentChapter = chId;
                    saveState();
                    updateToolsPane();
                    renderChapters();
                }
            }
        }, {
            root: window.innerWidth <= 768 ? null : document.getElementById('pdf-pane'),
            threshold: [0.1, 0.5]
        });
        
        document.querySelectorAll('.page-img').forEach(img => observer.observe(img));
    }

    function renderChapters() {
        const text = document.getElementById('search').value.toLowerCase();
        const list = document.getElementById('chapter-list');
        list.innerHTML = '';
        
        chapters.filter(c => c.title.toLowerCase().includes(text)).forEach(c => {
            const isL = state.learned.includes(c.id);
            const isActive = state.currentChapter === c.id;
            list.innerHTML += `
                <div class="chapter-item ${isL ? 'is-learned' : ''} ${isActive ? 'active' : ''}" 
                     onclick="jumpToChapter(${c.id})">
                    <span>${c.title}</span>
                    ${isL ? '<span style="color:#4caf50">鉁?/span>' : ''}
                </div>
            `;
        });
    }

    function jumpToChapter(id) {
        state.currentChapter = id;
        saveState();
        
        const c = chapters.find(x => x.id === id);
        const img = document.getElementById('page-' + c.page);
        
        if (img) {
            isScrollingFromClick = true;
            img.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => { isScrollingFromClick = false; }, 800);
        }
        
        updateToolsPane();
        renderChapters();
    }

    function updateToolsPane() {
        const id = state.currentChapter;
        const c = chapters.find(x => x.id === id);
        if(!c) return;
        
        document.getElementById('tools-chapter-title').textContent = c.title;
        const btn = document.getElementById('btn-learn-toggle');
        if (state.learned.includes(id)) {
            btn.textContent = "鉁?宸插";
            btn.classList.add('active');
        } else {
            btn.textContent = "馃摉 鏍囪宸插";
            btn.classList.remove('active');
        }

        renderToolsContent(id);
    }

    function toggleLearned() {
        const id = state.currentChapter;
        if (state.learned.includes(id)) state.learned = state.learned.filter(x => x !== id);
        else state.learned.push(id);
        saveState();
        updateToolsPane();
        renderChapters();
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
    }

    function renderToolsContent(id) {
        const cLenses = lenses.filter(l => l.chapter === id || l.chapter === id - 1 || l.chapter === id + 1).slice(0, 3);
        let lHtml = cLenses.length ? '' : '<p style="color:#666">鏈珷鏆傛棤瀵瑰簲閫忛暅灞曠ず銆?/p>';
        cLenses.forEach(l => {
            let qs = l.qs.map(q => `<p class="lens-q">馃挰 ${q}</p>`).join('');
            lHtml += `
                <div class="lens-card">
                    <div class="lens-num">${l.id}</div>
                    <h4 class="lens-title">${l.name}</h4>
                    ${l.open ? '<span class="tag-open">馃敁 寮€鏀炬€ф帰璁?/span>' : ''}
                    <div>${qs}</div>
                </div>
            `;
        });
        document.getElementById('tab-lenses').innerHTML = lHtml;

        const cQA = qaDB.filter(q => q.chapter === id);
        let qHtml = cQA.length ? '' : '<p style="color:#666">鏈珷鏆傛棤娴嬭瘯棰樸€?/p>';
        cQA.forEach(q => {
            if (q.type === 'obj') {
                const savedAns = state.answers[q.id];
                const opts = q.opts.map(o => {
                    let cls = '';
                    if (savedAns) {
                        if (o.id === q.ans) cls = 'correct';
                        else if (o.id === savedAns) cls = 'wrong';
                    }
                    return `<li class="${cls}" onclick="ansObj('${q.id}', ${o.id})">${o.t}</li>`;
                }).join('');
                
                let feedback = savedAns ? `<div class="feedback" style="display:block; background: ${savedAns===q.ans?'rgba(52, 199, 89,0.1)':'rgba(255, 59, 48,0.1)'}; border-left: 3px solid ${savedAns===q.ans?'#34c759':'#ff3b30'}">${savedAns===q.ans?'鉁?姝ｇ‘锛?:'鉂?閿欒銆?} ${q.exp}</div>` : '';
                
                qHtml += `
                    <div class="qa-card">
                        <h4 class="qa-title"><span style="background:rgba(98,0,238,0.1);color:#6200ee;padding:2px 6px;border-radius:3px;font-size:0.8rem;margin-right:8px">瀹㈣棰?/span>${q.text}</h4>
                        <ul class="options">${opts}</ul>
                        ${feedback}
                    </div>
                `;
            } else {
                const cmts = state.comments[q.id] || [];
                const cmtHtml = cmts.map(c => `
                    <div class="c-item">
                        <div><span class="c-author">馃懁 ${c.user}</span><span class="c-time">${c.time}</span></div>
                        <p class="c-text">${c.txt}</p>
                    </div>
                `).join('');
                
                qHtml += `
                    <div class="qa-card">
                        <h4 class="qa-title"><span class="tag-open">馃敁 寮€鏀炬€?/span>${q.text}</h4>
                        <div class="comment-box">
                            <input type="text" id="usr-${q.id}" class="c-input" placeholder="鏄电О (閫夊～)" />
                            <textarea id="txt-${q.id}" class="c-input" placeholder="鍐欎笅浣犵殑瑙佽В..."></textarea>
                            <button class="btn-submit" onclick="addComment('${q.id}')">鍙戝竷鐪嬫硶</button>
                        </div>
                        <div class="c-list">${cmtHtml}</div>
                    </div>
                `;
            }
        });
        document.getElementById('tab-qa').innerHTML = qHtml;
    }

    function ansObj(qId, oId) {
        if(state.answers[qId]) return;
        state.answers[qId] = oId;
        saveState();
        renderToolsContent(state.currentChapter);
    }

    function addComment(qId) {
        const u = document.getElementById(`usr-${qId}`).value.trim() || '鍖垮悕鐜╁';
        const t = document.getElementById(`txt-${qId}`).value.trim();
        if(!t) return alert("鍐呭涓嶈兘涓虹┖");
        if(!state.comments[qId]) state.comments[qId] = [];
        state.comments[qId].unshift({ user: u, txt: t, time: new Date().toLocaleString() });
        saveState();
        renderToolsContent(state.currentChapter);
    }

    loadPages();
    renderChapters();
    updateToolsPane();
    
    setTimeout(() => {
        const c = chapters.find(x => x.id === state.currentChapter);
        if (c) {
            const img = document.getElementById('page-' + c.page);
            if (img) img.scrollIntoView();
        }
    }, 500);

</script>
</body>
</html>"""

import json

with open('qa_art.json', 'r', encoding='utf-8') as f:
    qa_data = json.load(f)

qa_js = json.dumps(qa_data, ensure_ascii=False)
html_content = html_content.replace('__QA_DB_PLACEHOLDER__', qa_js)

with open('chapters.json', 'r', encoding='utf-8') as f:
    chapters_data = json.load(f)
html_content = html_content.replace('__CHAPTERS_PLACEHOLDER__', json.dumps(chapters_data, ensure_ascii=False))


with open(r"index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Updated index.html for image-based viewing with rich QA and zoom fixes")
