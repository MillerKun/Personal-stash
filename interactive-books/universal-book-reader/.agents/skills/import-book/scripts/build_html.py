html_content = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>通关！游戏设计之道 - 通用图书学习平台</title>
    <style>
        :root {
            --bg-color: #f5f5f7;
            --surface-color: #ffffff;
            --primary-color: #007aff;
            --secondary-color: #ff9500;
            --text-color: #333333;
            --text-muted: #666666;
            --learned-bg: #e0e0e0;
            --border-color: #e0e0e0;
            --success-color: #34c759;
            --error-color: #ff3b30;
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
        .chapter-item.active { background-color: rgba(0, 122, 255, 0.1); border-color: rgba(0, 122, 255, 0.2); color: var(--primary-color); font-weight: bold;}
        .chapter-item.is-learned { color: #aaa; }
        
        /* Images Pane */
        #pdf-pane { flex: 2; position: relative; border-right: 1px solid var(--border-color); background: #dcdcdc; overflow-y: auto; text-align: center; scroll-behavior: smooth; --img-scale: 100%; padding-top: 10px;}
        .page-img { width: var(--img-scale); display: block; margin: 0 auto 10px auto; box-shadow: 0 4px 10px rgba(0,0,0,0.15); background-color: white; transition: width 0.2s ease;}
        
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
        
        /* Q&A */
        .qa-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);}
        .qa-title { margin: 0 0 15px 0; font-size: 1.05rem; line-height: 1.4; color: #222;}
        .options { list-style: none; padding: 0; margin: 0; }
        .options li { padding: 10px 15px; background: #f5f5f5; border-radius: 4px; margin-bottom: 8px; cursor: pointer; border: 1px solid #e0e0e0; font-size: 0.95rem; color: #333;}
        .options li:hover { background: #ebebeb; }
        .options li.correct { background: #e8f5e9; border-color: var(--success-color); pointer-events: none;}
        .options li.wrong { background: #ffebee; border-color: var(--error-color); pointer-events: none;}
        .feedback { display: none; margin-top: 10px; padding: 10px; border-radius: 4px; font-size: 0.9rem; }
        
        .tag-open { display: inline-block; background: rgba(255,149,0,0.1); color: #d87d00; padding: 2px 6px; border-radius: 3px; font-size: 0.75rem; margin-bottom: 10px; border: 1px solid #ff9500;}
        
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
        <h1>📖 通用图书学习平台 - 当前书籍：通关！游戏设计之道</h1>
    </header>

    <div id="main-layout">
        <div id="sidebar">
            <div class="search-box">
                <input type="text" id="search" placeholder="搜索章节..." onkeyup="renderChapters()">
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
                <h3 id="tools-chapter-title" style="margin: 0; font-size: 1.1rem; color: var(--primary-color);">第1章</h3>
                <button id="btn-learn-toggle" class="btn-learned" onclick="toggleLearned()">📖 标记已学</button>
            </div>
            
            <div class="tools-nav">
                <button class="tab-btn active" onclick="switchTab('qa')">📝 问答探讨</button>
            </div>
            
            <div class="tools-content">
                <div id="tab-qa" class="tab-panel active"></div>
            </div>
        </div>
    </div>

<script>
    // Mock chapters for "Level Up! The Guide to Great Video Game Design"
    const chapters = [
        { id: 1, title: "第1关：欢迎来到游戏行业", page: 16 },
        { id: 2, title: "第2关：创意", page: 44 },
        { id: 3, title: "第3关：编写故事", page: 59 },
        { id: 4, title: "第4关：游戏文档", page: 86 },
        { id: 5, title: "第5关：游戏控制与界面", page: 113 },
        { id: 6, title: "第6关：关卡设计", page: 160 },
        { id: 7, title: "第7关：战斗设计", page: 203 },
        { id: 8, title: "第8关：各种游戏元素", page: 227 },
        { id: 9, title: "第9关：多人游戏", page: 264 },
        { id: 10, title: "第10关：音乐和声音", page: 319 },
        { id: 11, title: "第11关：过场动画", page: 389 },
        { id: 12, title: "第12关：继续制作", page: 493 },
        { id: 13, title: "第13关：发行与营销", page: 529 }
    ];

    const pageToChapter = {};
    for (let i = 0; i < chapters.length; i++) {
        const start = chapters[i].page;
        const end = i < chapters.length - 1 ? chapters[i+1].page - 1 : 800;
        for (let p = start; p <= end; p++) {
            pageToChapter[p] = chapters[i].id;
        }
    }

    const qaDB = [
        { id: "q1", chapter: 1, type: "obj", text: "根据作者的观点，设计游戏时谁是第一位的？", opts: [{id:1,t:"发行商"},{id:2,t:"玩家"},{id:3,t:"制作人"}], ans: 2, exp:"永远记住，玩家是第一位的。" },
        { id: "q2", chapter: 1, type: "open", text: "【开放性探讨】你为什么想做游戏设计？你认为最重要的素质是什么？" },
        { id: "q3", chapter: 2, type: "obj", text: "创意从哪里来？", opts: [{id:1,t:"只在洗澡时"},{id:2,t:"抄袭别人"},{id:3,t:"任何地方，通过观察和记录"}], ans: 3, exp:"创意无处不在，好的设计师会随身携带笔记本记录灵感。" },
        { id: "q4", chapter: 6, type: "open", text: "【开放性探讨】你认为一个引人入胜的新手教程关卡应该具备哪些要素？" },
        { id: "q5", chapter: 7, type: "obj", text: "在战斗设计中，哪一点非常关键？", opts: [{id:1,t:"难度要尽可能高"},{id:2,t:"提供清晰的反馈（击中反馈）"},{id:3,t:"让玩家经常死"}], ans: 2, exp:"没有反馈的战斗是无聊的，必须让玩家知道他们的攻击是否有效。" }
    ];

    let state = {
        learned: JSON.parse(localStorage.getItem('uni_learned')) || [],
        answers: JSON.parse(localStorage.getItem('uni_answers')) || {},
        comments: JSON.parse(localStorage.getItem('uni_comments')) || {},
        currentChapter: parseInt(localStorage.getItem('uni_lastChapter')) || 1,
        zoom: parseInt(localStorage.getItem('uni_zoom')) || 100
    };

    let isScrollingFromClick = false;
    let TOTAL_PAGES = 714; 

    function saveState() {
        localStorage.setItem('uni_learned', JSON.stringify(state.learned));
        localStorage.setItem('uni_answers', JSON.stringify(state.answers));
        localStorage.setItem('uni_comments', JSON.stringify(state.comments));
        localStorage.setItem('uni_lastChapter', state.currentChapter);
        localStorage.setItem('uni_zoom', state.zoom);
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

    // Init Images
    function loadPages() {
        applyZoom();
        const pane = document.getElementById('pages-container');
        let html = '';
        for(let i = 1; i <= TOTAL_PAGES; i++) {
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
            root: document.getElementById('pdf-pane'),
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
                    ${isL ? '<span style="color:#34c759">✅</span>' : ''}
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
            btn.textContent = "✅ 已学";
            btn.classList.add('active');
        } else {
            btn.textContent = "📖 标记已学";
            btn.classList.remove('active');
        }

        renderToolsContent(id);
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
    }

    function renderToolsContent(id) {
        const cQA = qaDB.filter(q => q.chapter === id);
        let qHtml = cQA.length ? '' : '<p style="color:#666">本章暂无测试题。</p>';
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
                
                let feedback = savedAns ? `<div class="feedback" style="display:block; background: ${savedAns===q.ans?'rgba(52, 199, 89,0.1)':'rgba(255, 59, 48,0.1)'}; border-left: 3px solid ${savedAns===q.ans?'#34c759':'#ff3b30'}">${savedAns===q.ans?'✅ 正确！':'❌ 错误。'} ${q.exp}</div>` : '';
                
                qHtml += `
                    <div class="qa-card">
                        <h4 class="qa-title"><span style="background:rgba(0,122,255,0.1);color:#007aff;padding:2px 6px;border-radius:3px;font-size:0.8rem;margin-right:8px">客观题</span>${q.text}</h4>
                        <ul class="options">${opts}</ul>
                        ${feedback}
                    </div>
                `;
            } else {
                const cmts = state.comments[q.id] || [];
                const cmtHtml = cmts.map(c => `
                    <div class="c-item">
                        <div><span class="c-author">👤 ${c.user}</span><span class="c-time">${c.time}</span></div>
                        <p class="c-text">${c.txt}</p>
                    </div>
                `).join('');
                
                qHtml += `
                    <div class="qa-card">
                        <h4 class="qa-title"><span class="tag-open">🔓 开放性</span>${q.text}</h4>
                        <div class="comment-box">
                            <input type="text" id="usr-${q.id}" class="c-input" placeholder="昵称 (选填)" />
                            <textarea id="txt-${q.id}" class="c-input" placeholder="写下你的见解..."></textarea>
                            <button class="btn-submit" onclick="addComment('${q.id}')">发布看法</button>
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
        const u = document.getElementById(`usr-${qId}`).value.trim() || '匿名玩家';
        const t = document.getElementById(`txt-${qId}`).value.trim();
        if(!t) return alert("内容不能为空");
        if(!state.comments[qId]) state.comments[qId] = [];
        state.comments[qId].unshift({ user: u, txt: t, time: new Date().toLocaleString() });
        saveState();
        renderToolsContent(state.currentChapter);
    }

    // Init
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

with open(r"C:\Users\Eugen\.gemini\antigravity\scratch\universal-book-reader\index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Created universal index.html")
