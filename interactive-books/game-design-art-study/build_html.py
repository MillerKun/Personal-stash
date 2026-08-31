html_content = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>游戏设计艺术 (第2版) - 沉浸式互动学习</title>
    <style>
        :root {
            --bg-color: #121212;
            --surface-color: #1e1e1e;
            --primary-color: #bb86fc;
            --secondary-color: #03dac6;
            --text-color: #e0e0e0;
            --text-muted: #888888;
            --learned-bg: #2a2a2a;
            --border-color: #333333;
            --success-color: #4caf50;
            --error-color: #f44336;
        }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--bg-color); color: var(--text-color); margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
        
        header { background-color: var(--surface-color); padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); height: 50px;}
        header h1 { margin: 0; font-size: 1.4rem; }
        
        #main-layout { display: flex; flex: 1; height: calc(100vh - 70px); }
        
        /* Sidebar */
        #sidebar { width: 280px; background-color: var(--surface-color); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; }
        .search-box { padding: 15px; }
        .search-box input { width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px; box-sizing: border-box; }
        #chapter-list { flex: 1; overflow-y: auto; padding: 0 10px 15px 10px; }
        
        .chapter-item { padding: 10px 15px; cursor: pointer; border-radius: 6px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; transition: 0.2s; border: 1px solid transparent;}
        .chapter-item:hover { background-color: rgba(255,255,255,0.05); }
        .chapter-item.active { background-color: rgba(187, 134, 252, 0.1); border-color: rgba(187, 134, 252, 0.3); color: var(--primary-color); font-weight: bold;}
        .chapter-item.is-learned { opacity: 0.6; }
        
        /* PDF Pane */
        #pdf-pane { flex: 2; position: relative; border-right: 1px solid var(--border-color); background: #333;}
        iframe { width: 100%; height: 100%; border: none; }
        
        /* Tools Pane */
        #tools-pane { flex: 1.2; min-width: 350px; max-width: 500px; background-color: var(--bg-color); display: flex; flex-direction: column; }
        
        .tools-header { padding: 15px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;}
        .btn-learned { background: var(--secondary-color); color: #000; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem;}
        .btn-learned.active { background: #444; color: #aaa; }
        
        .tools-nav { display: flex; border-bottom: 1px solid var(--border-color); background: var(--surface-color); }
        .tab-btn { flex: 1; padding: 12px; background: none; border: none; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; font-weight: bold;}
        .tab-btn.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
        
        .tools-content { flex: 1; overflow-y: auto; padding: 20px; }
        .tab-panel { display: none; }
        .tab-panel.active { display: block; animation: fadeIn 0.3s; }
        
        /* Lens Card */
        .lens-card { background: #1e1e1e; border: 1px solid #444; border-radius: 8px; padding: 15px; margin-bottom: 15px; position: relative; }
        .lens-title { color: var(--secondary-color); margin: 0 0 10px 0; font-size: 1.1rem; padding-right: 25px;}
        .lens-num { position: absolute; top: 10px; right: 10px; background: var(--primary-color); color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;}
        .tag-open { display: inline-block; background: rgba(255,152,0,0.15); color: #ffb74d; padding: 2px 6px; border-radius: 3px; font-size: 0.75rem; margin-bottom: 10px; border: 1px solid #ff9800;}
        .lens-q { font-style: italic; color: #ccc; font-size: 0.9rem; margin-bottom: 5px;}
        
        /* Q&A */
        .qa-card { background: #1e1e1e; border: 1px solid #444; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .qa-title { margin: 0 0 15px 0; font-size: 1.05rem; line-height: 1.4;}
        .options { list-style: none; padding: 0; margin: 0; }
        .options li { padding: 10px 15px; background: #252525; border-radius: 4px; margin-bottom: 8px; cursor: pointer; border: 1px solid transparent; font-size: 0.95rem; }
        .options li:hover { background: #2a2a2a; }
        .options li.correct { background: rgba(76, 175, 80, 0.2); border-color: var(--success-color); pointer-events: none;}
        .options li.wrong { background: rgba(244, 67, 54, 0.2); border-color: var(--error-color); pointer-events: none;}
        .feedback { display: none; margin-top: 10px; padding: 10px; border-radius: 4px; font-size: 0.9rem; }
        
        /* Comments */
        .comment-box { margin-top: 15px; border-top: 1px dashed #444; padding-top: 15px;}
        .c-input { width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: white; border-radius: 4px; box-sizing: border-box; margin-bottom: 8px; font-family: inherit;}
        textarea.c-input { resize: vertical; min-height: 60px; }
        .btn-submit { background: var(--primary-color); color: #000; border: none; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;}
        .c-list { margin-top: 15px; display: flex; flex-direction: column; gap: 10px; }
        .c-item { background: #222; padding: 10px; border-radius: 4px; border-left: 2px solid var(--secondary-color); font-size: 0.9rem;}
        .c-author { font-weight: bold; color: var(--secondary-color); margin-right: 10px;}
        .c-time { color: #666; font-size: 0.8rem; }
        .c-text { margin: 5px 0 0 0; color: #ddd; white-space: pre-wrap; line-height: 1.4;}
        
        @keyframes fadeIn { from {opacity: 0;} to {opacity: 1;} }
    </style>
</head>
<body>

    <header>
        <h1>🎮 游戏设计艺术 (第2版) - 沉浸式互动学习</h1>
    </header>

    <div id="main-layout">
        <div id="sidebar">
            <div class="search-box">
                <input type="text" id="search" placeholder="搜索章节..." onkeyup="renderChapters()">
            </div>
            <div id="chapter-list"></div>
        </div>
        
        <div id="pdf-pane">
            <iframe id="pdf-viewer" src="book.pdf#page=49"></iframe>
        </div>
        
        <div id="tools-pane">
            <div class="tools-header">
                <h3 id="tools-chapter-title" style="margin: 0; font-size: 1.1rem; color: var(--primary-color);">第1章</h3>
                <button id="btn-learn-toggle" class="btn-learned" onclick="toggleLearned()">📖 标记已学</button>
            </div>
            
            <div class="tools-nav">
                <button class="tab-btn active" onclick="switchTab('lenses')">🔍 本章透镜</button>
                <button class="tab-btn" onclick="switchTab('qa')">📝 问答探讨</button>
            </div>
            
            <div class="tools-content">
                <div id="tab-lenses" class="tab-panel active"></div>
                <div id="tab-qa" class="tab-panel"></div>
            </div>
        </div>
    </div>

<script>
    const chapters = [
        { id: 1, title: "第1章：太初之时，有设计师", page: 49 },
        { id: 2, title: "第2章：设计师创造体验", page: 57 },
        { id: 3, title: "第3章：体验发生于场景", page: 73 },
        { id: 4, title: "第4章：体验从游戏中诞生", page: 81 },
        { id: 5, title: "第5章：游戏由元素构成", page: 99 },
        { id: 6, title: "第6章：元素支撑起主题", page: 107 },
        { id: 7, title: "第7章：游戏始于一个创意", page: 119 },
        { id: 8, title: "第8章：游戏通过迭代提高", page: 141 },
        { id: 9, title: "第9章：游戏为玩家而生", page: 167 },
        { id: 10, title: "第10章：体验在玩家的脑中", page: 185 },
        { id: 11, title: "第11章：玩家的动机驱使着玩家", page: 199 },
        { id: 12, title: "第12章：有些元素是游戏机制", page: 209 },
        { id: 13, title: "第13章：游戏机制必须平衡", page: 253 },
        { id: 14, title: "第14章：游戏机制支持谜题", page: 291 },
        { id: 15, title: "第15章：玩家通过界面玩游戏", page: 307 },
        { id: 16, title: "第16章：体验可以用它们的兴趣曲线来评价", page: 333 },
        { id: 17, title: "第17章：有种体验叫作故事", page: 351 },
        { id: 18, title: "第18章：游戏和游戏结构可以用间接控制艺术性地融为一体", page: 373 },
        { id: 19, title: "第19章：在世界里发生的故事与游戏", page: 391 },
        { id: 20, title: "第20章：世界中的角色", page: 401 },
        { id: 21, title: "第21章：世界里的空间", page: 425 },
        { id: 22, title: "第22章：世界的外观与感觉是由其美学所定义的", page: 441 },
        { id: 23, title: "第23章：一些游戏让多人快乐", page: 451 },
        { id: 24, title: "第24章：其他玩家有时会形成社群", page: 457 },
        { id: 25, title: "第25章：设计师常与团队合作", page: 473 },
        { id: 26, title: "第26章：团队有时通过文档进行沟通", page: 485 },
        { id: 27, title: "第27章：通过试玩创造好游戏", page: 493 },
        { id: 28, title: "第28章：制作游戏的技术", page: 511 },
        { id: 29, title: "第29章：你的游戏总有个客户", page: 521 },
        { id: 30, title: "第30章：设计师要向客户推销自己的想法", page: 531 },
        { id: 31, title: "第31章：设计师和客户都希望游戏能盈利", page: 539 },
        { id: 32, title: "第32章：游戏改变玩家", page: 553 },
        { id: 33, title: "第33章：设计师担负的责任", page: 561 },
        { id: 34, title: "第34章：每个设计师都有个目标", page: 569 }
    ];

    const lenses = [
        { id: 1, chapter: 1, name: "情感透镜", open: true, qs: ["我希望玩家体验到哪些情感？", "他们实际上体验到了什么情感？", "如何缩小两者差距？"] },
        { id: 2, chapter: 2, name: "本质体验透镜", open: true, qs: ["我希望玩家获得的体验是什么？", "这个体验的核心本质是什么？", "我的游戏如何捕捉这种本质？"] },
        { id: 3, chapter: 3, name: "场地透镜", open: false, qs: ["玩家会在什么样的环境中玩我的游戏？", "这个环境会对体验产生什么影响？"] },
        { id: 4, chapter: 4, name: "惊喜透镜", open: false, qs: ["我的游戏在哪些地方能给玩家惊喜？"] },
        { id: 5, chapter: 4, name: "乐趣透镜", open: true, qs: ["我的游戏好玩吗？为什么？"] },
        { id: 6, chapter: 5, name: "元素四面体透镜", open: false, qs: ["机制、故事、美学、技术是否协调一致并支持主题？"] },
        { id: 7, chapter: 6, name: "全息透镜", open: false, qs: ["游戏中的每一个元素是否都反映了整体主题？"] },
        // ... (在实际使用中可补充更多)
    ];

    const qaDB = [
        { id: "q1", chapter: 1, type: "obj", text: "根据第1章，设计师最重要的技能是什么？", opts: [{id:1,t:"编程"},{id:2,t:"倾听"},{id:3,t:"画画"}], ans: 2, exp:"倾听团队、受众和客户是核心。" },
        { id: "q2", chapter: 1, type: "open", text: "【开放性探讨】举一个游戏例子，说明设计师如何通过环境(场地)影响了你的情绪。" },
        { id: "q3", chapter: 2, type: "obj", text: "体验存在于哪里？", opts: [{id:1,t:"游戏引擎中"},{id:2,t:"玩家的脑中"},{id:3,t:"屏幕上"}], ans: 2, exp:"游戏是产生体验的机器，体验发生在脑中。" },
        { id: "q4", chapter: 2, type: "open", text: "【开放性探讨 - 本质体验透镜】如果你要做一款以“孤独”为体验的游戏，你会设计什么核心机制？" },
        { id: "q5", chapter: 5, type: "obj", text: "以下哪项不属于元素四面体？", opts: [{id:1,t:"机制"},{id:2,t:"代码"},{id:3,t:"美学"}], ans: 2, exp:"技术是元素之一，而代码只是技术的实现方式。" }
    ];

    let state = {
        learned: JSON.parse(localStorage.getItem('agy_learned')) || [],
        answers: JSON.parse(localStorage.getItem('agy_answers')) || {},
        comments: JSON.parse(localStorage.getItem('agy_comments')) || {},
        currentChapter: 1
    };

    function saveState() {
        localStorage.setItem('agy_learned', JSON.stringify(state.learned));
        localStorage.setItem('agy_answers', JSON.stringify(state.answers));
        localStorage.setItem('agy_comments', JSON.stringify(state.comments));
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
                     onclick="loadChapter(${c.id})">
                    <span>${c.title}</span>
                    ${isL ? '<span style="color:#4caf50">✅</span>' : ''}
                </div>
            `;
        });
    }

    function loadChapter(id) {
        state.currentChapter = id;
        const c = chapters.find(x => x.id === id);
        
        // Update PDF iframe
        document.getElementById('pdf-viewer').src = `book.pdf#page=${c.page}`;
        
        // Update Tools Header
        document.getElementById('tools-chapter-title').textContent = c.title;
        const btn = document.getElementById('btn-learn-toggle');
        if (state.learned.includes(id)) {
            btn.textContent = "✅ 已学";
            btn.classList.add('active');
        } else {
            btn.textContent = "📖 标记已学";
            btn.classList.remove('active');
        }

        renderChapters(); // refresh active state
        renderTools();
    }

    function toggleLearned() {
        const id = state.currentChapter;
        if (state.learned.includes(id)) state.learned = state.learned.filter(x => x !== id);
        else state.learned.push(id);
        saveState();
        loadChapter(id);
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
    }

    function renderTools() {
        const id = state.currentChapter;
        
        // Render Lenses
        const cLenses = lenses.filter(l => l.chapter === id || l.chapter === id - 1 || l.chapter === id + 1).slice(0, 3); // show related
        let lHtml = cLenses.length ? '' : '<p style="color:#666">本章暂无对应透镜展示。</p>';
        cLenses.forEach(l => {
            let qs = l.qs.map(q => `<p class="lens-q">• ${q}</p>`).join('');
            lHtml += `
                <div class="lens-card">
                    <div class="lens-num">${l.id}</div>
                    <h4 class="lens-title">${l.name}</h4>
                    ${l.open ? '<span class="tag-open">🔓 开放性探讨</span>' : ''}
                    <div>${qs}</div>
                </div>
            `;
        });
        document.getElementById('tab-lenses').innerHTML = lHtml;

        // Render Q&A
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
                
                let feedback = savedAns ? `<div class="feedback" style="display:block; background: ${savedAns===q.ans?'rgba(76,175,80,0.1)':'rgba(244,67,54,0.1)'}; border-left: 3px solid ${savedAns===q.ans?'#4caf50':'#f44336'}">${savedAns===q.ans?'✅ 正确！':'❌ 错误。'} ${q.exp}</div>` : '';
                
                qHtml += `
                    <div class="qa-card">
                        <h4 class="qa-title"><span style="background:rgba(3,218,198,0.2);color:#03dac6;padding:2px 6px;border-radius:3px;font-size:0.8rem;margin-right:8px">客观题</span>${q.text}</h4>
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
        renderTools();
    }

    function addComment(qId) {
        const u = document.getElementById(`usr-${qId}`).value.trim() || '匿名玩家';
        const t = document.getElementById(`txt-${qId}`).value.trim();
        if(!t) return alert("内容不能为空");
        if(!state.comments[qId]) state.comments[qId] = [];
        state.comments[qId].unshift({ user: u, txt: t, time: new Date().toLocaleString() });
        saveState();
        renderTools();
    }

    // Init
    renderChapters();
    loadChapter(1);
</script>
</body>
</html>"""

with open(r"C:\Users\Eugen\.gemini\antigravity\scratch\game-design-art-study\index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Updated index.html to embed PDF")
