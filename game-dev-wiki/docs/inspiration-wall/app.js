// --- 灵感墙 (Inspiration Wall) 核心状态与数据引擎 ---
const STORAGE_KEY = 'inspiration-wall-data';
const SYNC_CONFIG_KEY = 'inspiration-wall-sync-config';

// 默认数据结构 (全画板架构)
const defaultData = {
    items: {
        'root': { id: 'root', type: 'board', name: '主页', cards: [], parentId: null }
    },
    currentViewId: 'root'
};

let appData = defaultData;
let syncConfig = { token: '', gistId: '', enabled: false };

try {
    const savedSync = localStorage.getItem(SYNC_CONFIG_KEY);
    if (savedSync) {
        syncConfig = { ...syncConfig, ...JSON.parse(savedSync) };
    }
} catch (e) {}

// 加载本地存储并执行全白板架构平滑迁移
try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items) {
            appData = parsed;
            // 自动迁移所有旧文件夹为白板画布，并将 children 转换为画板卡片
            Object.values(appData.items).forEach(item => {
                if (!item.cards) item.cards = [];
                if (item.type === 'folder') {
                    item.type = 'board';
                }
                if (item.children && item.children.length > 0) {
                    const startX = 2800;
                    const startY = 2800;
                    item.children.forEach((childId, idx) => {
                        const child = appData.items[childId];
                        if (child && !item.cards.some(c => c.id === childId || c.targetBoardId === childId)) {
                            item.cards.push({
                                id: childId,
                                type: 'board',
                                targetBoardId: childId,
                                title: child.name,
                                cover: child.cover || null,
                                icon: 'ph-kanban',
                                badgeColor: '#3b82f6',
                                x: startX + (idx % 4) * 200,
                                y: startY + Math.floor(idx / 4) * 200,
                                width: 170
                            });
                        }
                    });
                    delete item.children;
                }
            });
        }
    }
} catch (e) {
    console.error("加载数据失败", e);
}

if (!appData.items[appData.currentViewId]) {
    appData.currentViewId = 'root';
}

const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

let silentSyncTimeout = null;

const saveData = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        scheduleSilentGistSync();
    } catch (err) {
        console.error("保存数据失败", err);
    }
};

// 预设文字颜色
const TEXT_COLORS = [
    { name: '默认深黑', color: '#1e293b' },
    { name: '石墨灰', color: '#64748b' },
    { name: '活力红', color: '#ef4444' },
    { name: '暖阳橙', color: '#f97316' },
    { name: '琥珀黄', color: '#d97706' },
    { name: '翡翠绿', color: '#10b981' },
    { name: '湖水蓝', color: '#0284c7' },
    { name: '经典蓝', color: '#3b82f6' },
    { name: '薰衣紫', color: '#8b5cf6' },
    { name: '蔷薇粉', color: '#ec4899' }
];

// 预设卡片背景颜色 (Milanote 风格主题)
const CARD_BG_COLORS = [
    { name: '经典纯白', bg: '#ffffff', border: '#e2e8f0', text: '#1e293b' },
    { name: '暖阳米黄', bg: '#fef9c3', border: '#fef08a', text: '#713f12' },
    { name: '清新浅绿', bg: '#dcfce7', border: '#bbf7d0', text: '#14532d' },
    { name: '晴空浅蓝', bg: '#e0f2fe', border: '#bae6fd', text: '#0c4a6e' },
    { name: '梦幻浅紫', bg: '#f3e8ff', border: '#e9d5ff', text: '#581c87' },
    { name: '樱花浅粉', bg: '#ffe4e6', border: '#fecdd3', text: '#881337' },
    { name: '低调浅灰', bg: '#f1f5f9', border: '#e2e8f0', text: '#334155' },
    { name: '极客深黑', bg: '#1e293b', border: '#334155', text: '#f8fafc' }
];

// Column 强调色
const COLUMN_ACCENTS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#64748b'];

// Milanote 画板卡片图标与色系预设
const BOARD_ICON_PRESETS = [
    'ph-kanban', 'ph-folder', 'ph-clock', 'ph-check-square-offset', 'ph-game-controller',
    'ph-book-open', 'ph-briefcase', 'ph-sparkle', 'ph-star', 'ph-heart', 'ph-camera', 'ph-lightbulb'
];
const BOARD_COLOR_PRESETS = [
    '#8b5cf6', '#f97316', '#64748b', '#10b981', '#06b6d4', '#3b82f6', '#f43f5e', '#eab308', '#ec4899', '#6366f1'
];

// --- DOM 引用 ---
const views = {
    canvas: document.getElementById('canvas-view')
};
const boardEl = document.getElementById('board');
const breadcrumbsEl = document.getElementById('breadcrumbs');
const newBoardBtn = document.getElementById('new-board-btn');
const syncModalBtn = document.getElementById('sync-modal-btn');
const syncStatusDot = document.getElementById('sync-status-dot');

// 左侧工具栏
const sidebar = {
    el: document.getElementById('canvas-sidebar'),
    board: document.getElementById('tool-board'),
    note: document.getElementById('tool-note'),
    column: document.getElementById('tool-column'),
    todo: document.getElementById('tool-todo'),
    heading: document.getElementById('tool-heading'),
    image: document.getElementById('tool-image'),
    video: document.getElementById('tool-video'),
    link: document.getElementById('tool-link'),
    color: document.getElementById('tool-color')
};

// 格式化浮动工具栏
const fmt = {
    toolbar: document.getElementById('formatting-toolbar'),
    block: document.getElementById('fmt-block'),
    bold: document.getElementById('fmt-bold'),
    italic: document.getElementById('fmt-italic'),
    underline: document.getElementById('fmt-underline'),
    strike: document.getElementById('fmt-strike'),
    ul: document.getElementById('fmt-ul'),
    ol: document.getElementById('fmt-ol'),
    alignLeft: document.getElementById('fmt-align-left'),
    alignCenter: document.getElementById('fmt-align-center'),
    colorBtn: document.getElementById('fmt-color-btn'),
    colorIndicator: document.getElementById('fmt-color-indicator'),
    colorPalette: document.getElementById('fmt-color-palette'),
    bgBtn: document.getElementById('fmt-bg-btn'),
    bgPalette: document.getElementById('fmt-bg-palette'),
    widthBtn: document.getElementById('fmt-width-btn'),
    widthMenu: document.getElementById('fmt-width-menu')
};

// 多媒体模态框与同步模态框
const mediaModal = {
    el: document.getElementById('media-modal'),
    title: document.getElementById('mediaModalTitle'),
    body: document.getElementById('mediaModalBody'),
    cancel: document.getElementById('mediaModalCancel'),
    confirm: document.getElementById('mediaModalConfirm')
};

const syncModal = {
    el: document.getElementById('sync-modal'),
    close: document.getElementById('sync-modal-close'),
    tokenInput: document.getElementById('gist-token-input'),
    gistIdInput: document.getElementById('gist-id-input'),
    saveGistBtn: document.getElementById('save-gist-sync-btn'),
    testGistPullBtn: document.getElementById('test-gist-pull-btn'),
    exportDataJsonBtn: document.getElementById('export-data-json-btn'),
    pullRepoDataBtn: document.getElementById('pull-repo-data-btn'),
    exportBackupBtn: document.getElementById('export-backup-btn'),
    importBackupFile: document.getElementById('import-backup-file')
};

let activeCardId = null;
let activeCardElement = null;
let boardOffset = { x: -2500, y: -2500 }; 

// --- 路由与导航 ---

function navigateTo(id) {
    const target = appData.items[id];
    if (!target) return;

    appData.currentViewId = id;
    hideFormattingToolbar();
    saveData();
    renderApp();
}

function renderBreadcrumbs() {
    let path = [];
    let currentId = appData.currentViewId;
    
    while (currentId) {
        const item = appData.items[currentId];
        if (item) {
            path.unshift(item);
            currentId = item.parentId;
        } else {
            break;
        }
    }

    breadcrumbsEl.innerHTML = '';
    path.forEach((item, index) => {
        const isLast = index === path.length - 1;
        
        const span = document.createElement('span');
        span.className = `cursor-pointer hover:text-blue-600 transition-colors flex items-center whitespace-nowrap ${isLast ? 'text-gray-900 font-bold' : ''}`;
        
        const iconClass = item.id === 'root' ? 'ph-house' : 'ph-kanban';
        span.innerHTML = `<i class="ph-fill ${iconClass} mr-1 text-base ${item.id === 'root' ? 'text-gray-600' : 'text-blue-500'}"></i>${item.name}`;
        
        if (!isLast) {
            span.onclick = () => navigateTo(item.id);
        }

        breadcrumbsEl.appendChild(span);

        if (!isLast) {
            const sep = document.createElement('span');
            sep.className = 'text-gray-300 mx-1.5';
            sep.innerText = '/';
            breadcrumbsEl.appendChild(sep);
        }
    });
}

function renderApp() {
    const currentItem = appData.items[appData.currentViewId];
    if (!currentItem) {
        appData.currentViewId = 'root';
        renderApp();
        return;
    }
    renderBreadcrumbs();
    renderBoard(currentItem);
    updateSyncStatusDot();
}

function getCenterPlacementCoords(width = 280, height = 100) {
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    return {
        x: viewportCenterX - boardOffset.x - width / 2,
        y: viewportCenterY - boardOffset.y - height / 2 - 64
    };
}


// --- 🚀 全局极致 60/120FPS 零延迟拖拽引擎 ---

let dragContext = null;
let rafId = null;
let latestPointerEvent = null;
let cachedColumns = [];

function getHoveredColumnByCoords(clientX, clientY, excludeColumnId = null) {
    for (let i = 0; i < cachedColumns.length; i++) {
        const col = cachedColumns[i];
        if (excludeColumnId && col.id === excludeColumnId) continue;
        const r = col.rect;
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
            return col.el;
        }
    }
    return null;
}

function updateDragFrame() {
    if (!dragContext || !latestPointerEvent) {
        rafId = null;
        return;
    }

    const e = latestPointerEvent;
    const { cardEl, card, isNested, startX, startY, initialX, initialY } = dragContext;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (isNested) {
        if (Math.hypot(dx, dy) > 3) {
            cardEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            cardEl.style.zIndex = '999';
            if (!cardEl.classList.contains('card-dragging')) {
                cardEl.classList.add('card-dragging');
            }
        }
    } else {
        cardEl.style.left = `${initialX + dx}px`;
        cardEl.style.top = `${initialY + dy}px`;
    }

    for (let i = 0; i < cachedColumns.length; i++) {
        cachedColumns[i].el.classList.remove('column-drag-over');
    }
    
    if (card.type !== 'column') {
        const hoveredColEl = getHoveredColumnByCoords(e.clientX, e.clientY, card.id);
        if (hoveredColEl) {
            hoveredColEl.classList.add('column-drag-over');
        }
    }

    rafId = requestAnimationFrame(updateDragFrame);
}

window.addEventListener('pointermove', (e) => {
    if (!dragContext) return;
    
    if (e.buttons === 0) {
        endCardDrag(e);
        return;
    }

    latestPointerEvent = e;
    if (!rafId) {
        rafId = requestAnimationFrame(updateDragFrame);
    }
}, { passive: true });

function endCardDrag(e) {
    if (!dragContext) return;
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    const { cardEl, card, boardItem, isNested, parentColumn, startX, startY, initialX, initialY, headerEl, pointerId } = dragContext;
    
    try {
        if (headerEl && headerEl.hasPointerCapture && headerEl.hasPointerCapture(pointerId)) {
            headerEl.releasePointerCapture(pointerId);
        }
    } catch(err) {}

    cardEl.classList.remove('card-dragging');
    cardEl.style.transform = '';
    document.body.classList.remove('select-none');
    document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = 'auto');
    for (let i = 0; i < cachedColumns.length; i++) {
        cachedColumns[i].el.classList.remove('column-drag-over');
    }

    const endEvent = e || latestPointerEvent;

    if (endEvent && boardItem) {
        const dx = endEvent.clientX - startX;
        const dy = endEvent.clientY - startY;
        const isMoved = Math.hypot(dx, dy) > 5;

        const targetColEl = getHoveredColumnByCoords(endEvent.clientX, endEvent.clientY, card.id);
        const targetColId = targetColEl ? targetColEl.dataset.id : null;
        const targetColumn = targetColId ? boardItem.cards.find(c => c.id === targetColId && c.type === 'column') : null;

        if (isNested && parentColumn) {
            // 场景 1: 从 Column 内部拖动
            if (isMoved) {
                if (targetColumn && targetColumn.id !== parentColumn.id) {
                    parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
                    targetColumn.cards = targetColumn.cards || [];
                    targetColumn.cards.push(card);
                    saveData();
                    renderBoard(boardItem);
                } else if (!targetColumn) {
                    const canvasX = endEvent.clientX - boardOffset.x - (card.width || 280) / 2;
                    const canvasY = endEvent.clientY - boardOffset.y - 64;

                    parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
                    card.x = canvasX;
                    card.y = canvasY;
                    card.width = card.width || 280;

                    boardItem.cards = boardItem.cards || [];
                    if (!boardItem.cards.some(c => c.id === card.id)) {
                        boardItem.cards.push(card);
                    }
                    saveData();
                    renderBoard(boardItem);
                }
            }
        } else {
            // 场景 2: 自由卡片拖动
            if (targetColumn && card.type !== 'column') {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
                targetColumn.cards = targetColumn.cards || [];
                targetColumn.cards.push(card);
                saveData();
                renderBoard(boardItem);
            } else {
                const targetCard = boardItem.cards.find(c => c.id === card.id);
                if (targetCard) {
                    targetCard.x = initialX + dx;
                    targetCard.y = initialY + dy;
                    saveData();
                }
                if (activeCardId === card.id) {
                    positionFormattingToolbar(cardEl);
                }
            }
        }
    }
    
    dragContext = null;
    latestPointerEvent = null;
    cachedColumns = [];
}

window.addEventListener('pointerup', endCardDrag);
window.addEventListener('pointercancel', endCardDrag);
window.addEventListener('blur', endCardDrag);

function attachCardDrag(cardEl, headerEl, card, boardItem, isNested = false, parentColumn = null) {
    headerEl.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('label')) return;

        if (dragContext) endCardDrag(e);

        try {
            headerEl.setPointerCapture(e.pointerId);
        } catch(err) {}

        document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = 'none');
        hideFormattingToolbar();

        cachedColumns = Array.from(document.querySelectorAll('.column-container')).map(col => ({
            el: col,
            id: col.dataset.id,
            rect: col.getBoundingClientRect()
        }));

        dragContext = {
            pointerId: e.pointerId,
            cardEl,
            headerEl,
            card,
            boardItem,
            isNested,
            parentColumn,
            startX: e.clientX,
            startY: e.clientY,
            initialX: card.x || 0,
            initialY: card.y || 0
        };
        latestPointerEvent = e;

        document.body.classList.add('select-none');

        const allCards = document.querySelectorAll('#board > .card-item');
        allCards.forEach(c => c.style.zIndex = '1');
        cardEl.style.zIndex = '50';

        e.stopPropagation();
    });
}

function ejectCardFromColumn(card, parentColumn, boardItem) {
    parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
    card.x = (parentColumn.x || 0) + (parentColumn.width || 320) + 30;
    card.y = parentColumn.y || 0;
    card.width = card.width || 280;
    boardItem.cards = boardItem.cards || [];
    if (!boardItem.cards.some(c => c.id === card.id)) {
        boardItem.cards.push(card);
    }
    saveData();
    renderBoard(boardItem);
}


// --- 渲染画板与全套卡片渲染引擎 ---

function renderBoard(boardItem) {
    boardEl.innerHTML = '';
    boardEl.style.transform = `translate(${boardOffset.x}px, ${boardOffset.y}px)`;
    
    const cards = boardItem.cards || [];
    cards.forEach(card => {
        const cardEl = renderCardDispatcher(card, boardItem);
        if (cardEl) boardEl.appendChild(cardEl);
    });
}

function renderCardDispatcher(card, boardItem, isNested = false, parentColumn = null) {
    switch (card.type) {
        case 'board':
        case 'board-link':
            return createBoardCardElement(card, boardItem, isNested, parentColumn);
        case 'column':
            return createColumnElement(card, boardItem);
        case 'todo':
            return createTodoCardElement(card, boardItem, isNested, parentColumn);
        case 'image':
            return createImageCardElement(card, boardItem, isNested, parentColumn);
        case 'video':
            return createVideoCardElement(card, boardItem, isNested, parentColumn);
        case 'link':
            return createLinkCardElement(card, boardItem, isNested, parentColumn);
        case 'color':
            return createColorCardElement(card, boardItem, isNested, parentColumn);
        case 'heading':
            return createHeadingCardElement(card, boardItem, isNested, parentColumn);
        case 'text':
        default:
            return createNoteCardElement(card, boardItem, isNested, parentColumn);
    }
}

// 0. Milanote 风格画板/文件夹卡片
function createBoardCardElement(card, boardItem, isNested = false, parentColumn = null) {
    const cardEl = document.createElement('div');
    const targetBoardId = card.targetBoardId || card.id;
    let targetBoard = appData.items[targetBoardId];
    
    if (!targetBoard) {
        targetBoard = {
            id: targetBoardId,
            type: 'board',
            name: card.title || '画板',
            cover: card.cover || null,
            cards: [],
            parentId: boardItem.id
        };
        appData.items[targetBoardId] = targetBoard;
    }

    const width = card.width || 170;
    cardEl.className = `card-item board-card ${isNested ? 'relative w-full mb-3' : 'absolute'} bg-white rounded-2xl border border-gray-200/90 shadow-md overflow-hidden flex flex-col group select-text cursor-pointer hover:shadow-xl transition-shadow`;
    if (!isNested) {
        cardEl.style.left = `${card.x}px`;
        cardEl.style.top = `${card.y}px`;
        cardEl.style.width = `${width}px`;
    }
    cardEl.dataset.id = card.id;
    cardEl.dataset.targetId = targetBoardId;

    const visualHeader = document.createElement('div');
    visualHeader.className = 'card-header card-drag-handle relative w-full flex flex-col items-center justify-center cursor-move';

    const currentCover = card.cover || targetBoard.cover;
    const badgeColor = card.badgeColor || '#8b5cf6';
    const badgeIcon = card.icon || 'ph-kanban';

    if (currentCover) {
        visualHeader.innerHTML = `
            <div class="w-full h-24 bg-cover bg-center" style="background-image: url('${currentCover}')"></div>
        `;
    } else {
        visualHeader.className += ' py-4 bg-gray-50/70';
        visualHeader.innerHTML = `
            <div class="w-13 h-13 rounded-2xl text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 pointer-events-none" style="background-color: ${badgeColor}; width: 52px; height: 52px;">
                <i class="ph-fill ${badgeIcon} text-2xl"></i>
            </div>
        `;
    }

    const actionOverlay = document.createElement('div');
    actionOverlay.className = 'absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20';

    const coverBtn = document.createElement('button');
    coverBtn.className = 'w-6 h-6 rounded-lg bg-black/50 hover:bg-black/80 text-white flex items-center justify-center text-xs backdrop-blur-xs transition-colors shadow-xs cursor-pointer';
    coverBtn.title = '自定义封面与图标';
    coverBtn.innerHTML = '<i class="ph-bold ph-image"></i>';
    coverBtn.onclick = (e) => {
        e.stopPropagation();
        openBoardCoverModal(card, targetBoard, boardItem);
    };
    actionOverlay.appendChild(coverBtn);

    if (isNested && parentColumn) {
        const ejectBtn = document.createElement('button');
        ejectBtn.className = 'w-6 h-6 rounded-lg bg-black/50 hover:bg-blue-600 text-white flex items-center justify-center text-xs backdrop-blur-xs transition-colors shadow-xs cursor-pointer';
        ejectBtn.title = '移出到画布';
        ejectBtn.innerHTML = '<i class="ph-bold ph-arrow-square-out"></i>';
        ejectBtn.onclick = (e) => {
            e.stopPropagation();
            ejectCardFromColumn(card, parentColumn, boardItem);
        };
        actionOverlay.appendChild(ejectBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'w-6 h-6 rounded-lg bg-black/50 hover:bg-red-600 text-white flex items-center justify-center text-xs backdrop-blur-xs transition-colors shadow-xs cursor-pointer';
    delBtn.title = '删除画板';
    delBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`确定要删除画板 [${targetBoard.name}] 吗？内部卡片将被一并删除！`)) {
            if (isNested && parentColumn) {
                parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
            } else {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
            }
            delete appData.items[targetBoardId];
            saveData();
            renderBoard(boardItem);
        }
    };
    actionOverlay.appendChild(delBtn);
    visualHeader.appendChild(actionOverlay);
    cardEl.appendChild(visualHeader);

    const infoBox = document.createElement('div');
    infoBox.className = 'p-2.5 bg-white border-t border-gray-100 flex flex-col items-center text-center';

    const titleInput = document.createElement('input');
    titleInput.className = 'font-bold text-gray-800 text-xs sm:text-sm text-center bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none w-full truncate transition-colors';
    titleInput.value = card.title || targetBoard.name || '未命名画板';
    titleInput.addEventListener('change', (e) => {
        const val = e.target.value.trim() || '未命名画板';
        card.title = val;
        targetBoard.name = val;
        saveData();
    });
    titleInput.addEventListener('pointerdown', e => e.stopPropagation());

    const totalSubCards = (targetBoard.cards || []).length;
    const statsBadge = document.createElement('span');
    statsBadge.className = 'text-[11px] text-gray-400 mt-0.5 pointer-events-none';
    statsBadge.innerText = `${totalSubCards} 个卡片`;

    const enterBtn = document.createElement('button');
    enterBtn.className = 'mt-1.5 px-3 py-0.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer';
    enterBtn.innerHTML = '进入 <i class="ph-bold ph-arrow-right text-[10px]"></i>';
    enterBtn.onclick = (e) => {
        e.stopPropagation();
        navigateTo(targetBoardId);
    };
    enterBtn.addEventListener('pointerdown', e => e.stopPropagation());

    infoBox.appendChild(titleInput);
    infoBox.appendChild(statsBadge);
    infoBox.appendChild(enterBtn);
    cardEl.appendChild(infoBox);

    cardEl.ondblclick = (e) => {
        e.stopPropagation();
        navigateTo(targetBoardId);
    };

    attachCardDrag(cardEl, visualHeader, card, boardItem, isNested, parentColumn);
    return cardEl;
}

// 弹出画板自定义封面与图标模态框
function openBoardCoverModal(card, targetBoard, boardItem) {
    const currentCover = card.cover || targetBoard.cover || '';
    const currentIcon = card.icon || 'ph-kanban';
    const currentColor = card.badgeColor || '#8b5cf6';

    let iconPresetHtml = BOARD_ICON_PRESETS.map(icon => `
        <button type="button" class="preset-icon-btn p-2 rounded-xl border border-gray-200 hover:border-blue-500 flex items-center justify-center text-lg text-gray-700 ${icon === currentIcon ? 'bg-blue-50 border-blue-500 text-blue-600' : ''}" data-icon="${icon}">
            <i class="ph-bold ${icon}"></i>
        </button>
    `).join('');

    let colorPresetHtml = BOARD_COLOR_PRESETS.map(col => `
        <button type="button" class="preset-color-btn w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform ${col === currentColor ? 'ring-2 ring-blue-500 ring-offset-2' : ''}" style="background-color: ${col}" data-color="${col}"></button>
    `).join('');

    mediaModal.title.innerHTML = '<i class="ph-fill ph-palette text-blue-600"></i> 自定义画板封面';
    mediaModal.body.innerHTML = `
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1.5">方式 1：上传图片封面</label>
            <input type="file" id="boardCoverFile" accept="image/*" class="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer">
        </div>
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">或者输入网络图片 URL</label>
            <input type="text" id="boardCoverUrl" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://example.com/cover.png" value="${currentCover}">
        </div>
        <div class="border-t border-gray-100 pt-3">
            <label class="block text-xs font-semibold text-gray-700 mb-2">方式 2：Milanote 风格图标徽章</label>
            <div class="flex items-center gap-2 mb-2">
                <span class="text-xs text-gray-500">选择颜色:</span>
                <div class="flex gap-1.5 flex-wrap">${colorPresetHtml}</div>
            </div>
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-gray-500">选择图标:</span>
                <div class="grid grid-cols-6 gap-1.5 flex-1">${iconPresetHtml}</div>
            </div>
        </div>
        ${currentCover ? `
        <div class="pt-1">
            <button type="button" id="removeCoverBtn" class="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <i class="ph-bold ph-trash"></i> 移除图片封面 (恢复为图标徽章)
            </button>
        </div>` : ''}
    `;
    mediaModal.el.classList.remove('hidden');

    let selectedIcon = currentIcon;
    let selectedColor = currentColor;
    let uploadedCoverBase64 = null;

    document.querySelectorAll('.preset-icon-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.preset-icon-btn').forEach(b => b.classList.remove('bg-blue-50', 'border-blue-500', 'text-blue-600'));
            btn.classList.add('bg-blue-50', 'border-blue-500', 'text-blue-600');
            selectedIcon = btn.dataset.icon;
        };
    });

    document.querySelectorAll('.preset-color-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.preset-color-btn').forEach(b => b.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
            btn.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            selectedColor = btn.dataset.color;
        };
    });

    document.getElementById('boardCoverFile').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => uploadedCoverBase64 = ev.target.result;
            reader.readAsDataURL(file);
        }
    };

    const removeBtn = document.getElementById('removeCoverBtn');
    if (removeBtn) {
        removeBtn.onclick = () => {
            card.cover = null;
            targetBoard.cover = null;
            uploadedCoverBase64 = null;
            document.getElementById('boardCoverUrl').value = '';
            saveData();
            mediaModal.el.classList.add('hidden');
            renderBoard(boardItem);
        };
    }

    mediaModal.confirm.onclick = () => {
        const inputUrl = document.getElementById('boardCoverUrl').value.trim();
        const finalCover = uploadedCoverBase64 || inputUrl || null;

        card.cover = finalCover;
        targetBoard.cover = finalCover;
        card.icon = selectedIcon;
        card.badgeColor = selectedColor;

        saveData();
        mediaModal.el.classList.add('hidden');
        renderBoard(boardItem);
    };
}

// 1. 基础便签笔记 (Note)
function createNoteCardElement(card, boardItem, isNested = false, parentColumn = null) {
    const cardEl = document.createElement('div');
    const bg = card.bg || '#ffffff';
    const textColor = card.textColor || '#1e293b';
    const borderColor = card.borderColor || '#e2e8f0';

    cardEl.className = `card-item ${isNested ? 'relative w-full mb-3' : 'absolute'} rounded-2xl shadow-md border flex flex-col group select-text`;
    if (!isNested) {
        cardEl.style.left = `${card.x}px`;
        cardEl.style.top = `${card.y}px`;
        cardEl.style.width = `${card.width || 280}px`;
    }
    cardEl.style.minHeight = '90px';
    cardEl.style.backgroundColor = bg;
    cardEl.style.color = textColor;
    cardEl.style.borderColor = borderColor;
    cardEl.dataset.id = card.id;

    const headerEl = document.createElement('div');
    headerEl.className = 'card-header h-6 card-drag-handle rounded-t-2xl flex items-center justify-between px-3 relative opacity-60 hover:opacity-100 cursor-move';
    headerEl.innerHTML = '<div class="flex items-center gap-1 text-xs opacity-60 pointer-events-none"><i class="ph-bold ph-dots-six-vertical text-base"></i></div>';

    const actionContainer = document.createElement('div');
    actionContainer.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

    if (isNested && parentColumn) {
        const ejectBtn = document.createElement('button');
        ejectBtn.className = 'text-gray-400 hover:text-blue-600 p-0.5 rounded cursor-pointer';
        ejectBtn.title = '移出到画布';
        ejectBtn.innerHTML = '<i class="ph-bold ph-arrow-square-out text-sm"></i>';
        ejectBtn.onclick = (e) => {
            e.stopPropagation();
            ejectCardFromColumn(card, parentColumn, boardItem);
        };
        actionContainer.appendChild(ejectBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'text-gray-400 hover:text-red-500 p-0.5 rounded cursor-pointer';
    delBtn.title = '删除';
    delBtn.innerHTML = '<i class="ph-bold ph-x text-sm"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('确定删除此笔记卡片吗？')) {
            if (isNested && parentColumn) {
                parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
            } else {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
            }
            if (activeCardId === card.id) hideFormattingToolbar();
            saveData();
            renderBoard(boardItem);
        }
    };
    actionContainer.appendChild(delBtn);
    headerEl.appendChild(actionContainer);

    const editor = document.createElement('div');
    editor.className = 'card-editor w-full flex-grow p-3.5 pt-1 text-sm leading-relaxed outline-none';
    editor.contentEditable = 'true';
    editor.setAttribute('data-placeholder', '输入笔记内容...');
    editor.innerHTML = card.content || '';

    const activateThisCard = () => {
        if (activeCardElement && activeCardElement !== cardEl) {
            activeCardElement.classList.remove('card-selected');
        }
        activeCardId = card.id;
        activeCardElement = cardEl;
        cardEl.classList.add('card-selected');
        positionFormattingToolbar(cardEl);
    };

    editor.addEventListener('focus', activateThisCard);
    cardEl.addEventListener('click', (e) => {
        e.stopPropagation();
        activateThisCard();
    });

    editor.addEventListener('input', () => {
        card.content = editor.innerHTML;
        saveData();
    });
    editor.addEventListener('pointerdown', e => e.stopPropagation());

    cardEl.appendChild(headerEl);
    cardEl.appendChild(editor);

    attachCardDrag(cardEl, headerEl, card, boardItem, isNested, parentColumn);
    return cardEl;
}

// 2. Milanote 风格 Column (嵌套卡片列)
function createColumnElement(column, boardItem) {
    const colEl = document.createElement('div');
    colEl.className = 'column-container card-item absolute rounded-2xl flex flex-col group select-text shadow-sm';
    colEl.style.left = `${column.x}px`;
    colEl.style.top = `${column.y}px`;
    colEl.style.width = `${column.width || 320}px`;
    colEl.style.minHeight = '140px';
    colEl.dataset.id = column.id;

    const accentColor = column.accentColor || '#10b981';
    const accentBar = document.createElement('div');
    accentBar.className = 'h-1.5 w-full rounded-t-2xl';
    accentBar.style.backgroundColor = accentColor;
    colEl.appendChild(accentBar);

    const headerEl = document.createElement('div');
    headerEl.className = 'card-header card-drag-handle p-3.5 pb-2 flex items-center justify-between gap-2 border-b border-gray-200/60 cursor-move';

    const titleContainer = document.createElement('div');
    titleContainer.className = 'flex items-center gap-2 flex-1';

    const gripIcon = document.createElement('i');
    gripIcon.className = 'ph-bold ph-dots-six-vertical text-gray-400 text-base flex-shrink-0 pointer-events-none';

    const titleBox = document.createElement('div');
    titleBox.className = 'flex flex-col flex-1';

    const titleInput = document.createElement('input');
    titleInput.className = 'font-bold text-gray-800 text-base bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors w-full';
    titleInput.value = column.title || '未命名分组';
    titleInput.addEventListener('change', (e) => {
        column.title = e.target.value;
        saveData();
    });
    titleInput.addEventListener('pointerdown', e => e.stopPropagation());

    const countBadge = document.createElement('span');
    countBadge.className = 'text-xs text-gray-400 mt-0.5 pointer-events-none';
    countBadge.innerText = `${(column.cards || []).length} 个卡片 (可拖入/拖出)`;

    titleBox.appendChild(titleInput);
    titleBox.appendChild(countBadge);

    titleContainer.appendChild(gripIcon);
    titleContainer.appendChild(titleBox);

    const headerActions = document.createElement('div');
    headerActions.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

    const colorToggleBtn = document.createElement('button');
    colorToggleBtn.className = 'p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 transition-colors cursor-pointer';
    colorToggleBtn.title = '切换强调色';
    colorToggleBtn.innerHTML = '<i class="ph-bold ph-palette text-sm"></i>';
    colorToggleBtn.onclick = (e) => {
        e.stopPropagation();
        const nextColor = COLUMN_ACCENTS[(COLUMN_ACCENTS.indexOf(column.accentColor) + 1) % COLUMN_ACCENTS.length];
        column.accentColor = nextColor;
        accentBar.style.backgroundColor = nextColor;
        saveData();
    };

    const delColBtn = document.createElement('button');
    delColBtn.className = 'p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer';
    delColBtn.title = '删除此列';
    delColBtn.innerHTML = '<i class="ph-bold ph-trash text-sm"></i>';
    delColBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`确定要删除分组列 [${column.title}] 及其内部所有卡片吗？`)) {
            boardItem.cards = boardItem.cards.filter(c => c.id !== column.id);
            saveData();
            renderBoard(boardItem);
        }
    };

    headerActions.appendChild(colorToggleBtn);
    headerActions.appendChild(delColBtn);

    headerEl.appendChild(titleContainer);
    headerEl.appendChild(headerActions);
    colEl.appendChild(headerEl);

    const cardsBody = document.createElement('div');
    cardsBody.className = 'p-3 flex flex-col flex-grow';

    column.cards = column.cards || [];
    column.cards.forEach(nestedCard => {
        const nestedEl = renderCardDispatcher(nestedCard, boardItem, true, column);
        if (nestedEl) cardsBody.appendChild(nestedEl);
    });

    const addCardBtn = document.createElement('button');
    addCardBtn.className = 'w-full mt-1 py-2 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-gray-400 hover:text-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer';
    addCardBtn.innerHTML = '<i class="ph-bold ph-plus"></i> 添加卡片到本列';
    addCardBtn.onclick = (e) => {
        e.stopPropagation();
        const newSubCard = {
            id: generateId(),
            type: 'text',
            content: '',
            bg: '#ffffff'
        };
        column.cards.push(newSubCard);
        saveData();
        renderBoard(boardItem);
    };

    cardsBody.appendChild(addCardBtn);
    colEl.appendChild(cardsBody);

    attachCardDrag(colEl, headerEl, column, boardItem);
    return colEl;
}

// 3. 待办清单卡片 (To-do List)
function createTodoCardElement(card, boardItem, isNested = false, parentColumn = null) {
    const cardEl = document.createElement('div');
    const bg = card.bg || '#ffffff';

    cardEl.className = `card-item ${isNested ? 'relative w-full mb-3' : 'absolute'} bg-white rounded-2xl shadow-md border border-gray-200/80 p-4 flex flex-col group select-text`;
    if (!isNested) {
        cardEl.style.left = `${card.x}px`;
        cardEl.style.top = `${card.y}px`;
        cardEl.style.width = `${card.width || 300}px`;
    }
    cardEl.style.backgroundColor = bg;
    cardEl.dataset.id = card.id;

    const headerEl = document.createElement('div');
    headerEl.className = 'card-header card-drag-handle flex items-center justify-between pb-2 mb-2 border-b border-gray-100 cursor-move';
    
    const dragGrip = document.createElement('i');
    dragGrip.className = 'ph-bold ph-dots-six-vertical text-gray-400 text-base mr-1.5 flex-shrink-0 pointer-events-none';

    const titleInput = document.createElement('input');
    titleInput.className = 'font-bold text-gray-800 text-sm bg-transparent outline-none flex-1';
    titleInput.value = card.title || '待办清单';
    titleInput.addEventListener('change', (e) => {
        card.title = e.target.value;
        saveData();
    });
    titleInput.addEventListener('pointerdown', e => e.stopPropagation());

    const actionContainer = document.createElement('div');
    actionContainer.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

    if (isNested && parentColumn) {
        const ejectBtn = document.createElement('button');
        ejectBtn.className = 'text-gray-400 hover:text-blue-600 p-0.5 rounded cursor-pointer';
        ejectBtn.title = '移出到画布';
        ejectBtn.innerHTML = '<i class="ph-bold ph-arrow-square-out text-sm"></i>';
        ejectBtn.onclick = (e) => {
            e.stopPropagation();
            ejectCardFromColumn(card, parentColumn, boardItem);
        };
        actionContainer.appendChild(ejectBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'text-gray-400 hover:text-red-500 p-0.5 rounded cursor-pointer';
    delBtn.title = '删除';
    delBtn.innerHTML = '<i class="ph-bold ph-x text-sm"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('确定删除此待办卡片吗？')) {
            if (isNested && parentColumn) {
                parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
            } else {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
            }
            saveData();
            renderBoard(boardItem);
        }
    };
    actionContainer.appendChild(delBtn);

    headerEl.appendChild(dragGrip);
    headerEl.appendChild(titleInput);
    headerEl.appendChild(actionContainer);
    cardEl.appendChild(headerEl);

    const listContainer = document.createElement('div');
    listContainer.className = 'space-y-2 mb-3';

    card.items = card.items || [
        { id: generateId(), text: '第一项任务', done: false }
    ];

    const renderTodoItems = () => {
        listContainer.innerHTML = '';
        card.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 group/item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer';
            checkbox.checked = item.done;
            checkbox.onchange = (e) => {
                item.done = e.target.checked;
                saveData();
                renderTodoItems();
            };

            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = `flex-1 text-sm bg-transparent outline-none ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`;
            textInput.value = item.text;
            textInput.onchange = (e) => {
                item.text = e.target.value;
                saveData();
            };
            textInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    card.items.push({ id: generateId(), text: '', done: false });
                    saveData();
                    renderTodoItems();
                }
            };
            textInput.addEventListener('pointerdown', e => e.stopPropagation());

            const itemDelBtn = document.createElement('button');
            itemDelBtn.className = 'text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity text-xs cursor-pointer';
            itemDelBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
            itemDelBtn.onclick = (e) => {
                e.stopPropagation();
                card.items = card.items.filter(i => i.id !== item.id);
                saveData();
                renderTodoItems();
            };

            row.appendChild(checkbox);
            row.appendChild(textInput);
            row.appendChild(itemDelBtn);
            listContainer.appendChild(row);
        });
    };

    renderTodoItems();
    cardEl.appendChild(listContainer);

    const addTodoBtn = document.createElement('button');
    addTodoBtn.className = 'text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer';
    addTodoBtn.innerHTML = '<i class="ph-bold ph-plus"></i> 添加事项';
    addTodoBtn.onclick = (e) => {
        e.stopPropagation();
        card.items.push({ id: generateId(), text: '', done: false });
        saveData();
        renderTodoItems();
    };
    cardEl.appendChild(addTodoBtn);

    attachCardDrag(cardEl, headerEl, card, boardItem, isNested, parentColumn);
    return cardEl;
}

// 4. 图片卡片 (Image)
function createImageCardElement(card, boardItem, isNested = false, parentColumn = null) {
    const cardEl = document.createElement('div');
    cardEl.className = `card-item ${isNested ? 'relative w-full mb-3' : 'absolute'} bg-white rounded-2xl shadow-md border border-gray-200/80 overflow-hidden flex flex-col group select-text`;
    if (!isNested) {
        cardEl.style.left = `${card.x}px`;
        cardEl.style.top = `${card.y}px`;
        cardEl.style.width = `${card.width || 300}px`;
    }
    cardEl.dataset.id = card.id;

    const topBar = document.createElement('div');
    topBar.className = 'card-header card-drag-handle absolute top-0 left-0 w-full h-8 z-10 flex items-center justify-between px-2 cursor-move bg-gradient-to-b from-black/40 to-transparent';

    const dragGrip = document.createElement('div');
    dragGrip.className = 'text-white/80 text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1';
    dragGrip.innerHTML = '<i class="ph-bold ph-dots-six-vertical text-sm"></i>';

    const actionContainer = document.createElement('div');
    actionContainer.className = 'flex items-center gap-1';

    if (isNested && parentColumn) {
        const ejectBtn = document.createElement('button');
        ejectBtn.className = 'bg-black/60 hover:bg-blue-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs';
        ejectBtn.title = '移出到画布';
        ejectBtn.innerHTML = '<i class="ph-bold ph-arrow-square-out text-xs"></i>';
        ejectBtn.onclick = (e) => {
            e.stopPropagation();
            ejectCardFromColumn(card, parentColumn, boardItem);
        };
        actionContainer.appendChild(ejectBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'bg-black/60 hover:bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs';
    delBtn.title = '删除图片';
    delBtn.innerHTML = '<i class="ph-bold ph-x text-xs"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('确定删除此图片卡片吗？')) {
            if (isNested && parentColumn) {
                parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
            } else {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
            }
            saveData();
            renderBoard(boardItem);
        }
    };
    actionContainer.appendChild(delBtn);

    topBar.appendChild(dragGrip);
    topBar.appendChild(actionContainer);
    cardEl.appendChild(topBar);

    const img = document.createElement('img');
    img.src = card.src || '';
    img.className = 'w-full h-auto object-cover max-h-80 bg-gray-100';
    cardEl.appendChild(img);

    const captionInput = document.createElement('input');
    captionInput.className = 'p-2.5 text-xs text-gray-600 bg-white border-t border-gray-100 outline-none w-full placeholder-gray-300';
    captionInput.placeholder = '添加图片说明...';
    captionInput.value = card.caption || '';
    captionInput.onchange = (e) => {
        card.caption = e.target.value;
        saveData();
    };
    captionInput.addEventListener('pointerdown', e => e.stopPropagation());
    cardEl.appendChild(captionInput);

    attachCardDrag(cardEl, topBar, card, boardItem, isNested, parentColumn);
    return cardEl;
}

// 5. 视频卡片 (Video - B站 / YouTube / MP4)
function createVideoCardElement(card, boardItem, isNested = false, parentColumn = null) {
    const cardEl = document.createElement('div');
    cardEl.className = `card-item ${isNested ? 'relative w-full mb-3' : 'absolute'} bg-white rounded-2xl shadow-md border border-gray-200/80 overflow-hidden flex flex-col group select-text`;
    if (!isNested) {
        cardEl.style.left = `${card.x}px`;
        cardEl.style.top = `${card.y}px`;
        cardEl.style.width = `${card.width || 360}px`;
    }
    cardEl.dataset.id = card.id;

    const headerEl = document.createElement('div');
    headerEl.className = 'card-header card-drag-handle p-3 pb-2 flex items-center justify-between border-b border-gray-100 cursor-move';
    
    const title = document.createElement('div');
    title.className = 'flex items-center gap-1.5 text-xs font-semibold text-gray-700 truncate pointer-events-none';
    title.innerHTML = '<i class="ph-bold ph-dots-six-vertical text-gray-400 text-sm"></i><i class="ph-bold ph-video text-sky-500 text-sm"></i> 视频卡片';

    const actionContainer = document.createElement('div');
    actionContainer.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

    if (isNested && parentColumn) {
        const ejectBtn = document.createElement('button');
        ejectBtn.className = 'text-gray-400 hover:text-blue-600 p-0.5 rounded cursor-pointer';
        ejectBtn.title = '移出到画布';
        ejectBtn.innerHTML = '<i class="ph-bold ph-arrow-square-out text-sm"></i>';
        ejectBtn.onclick = (e) => {
            e.stopPropagation();
            ejectCardFromColumn(card, parentColumn, boardItem);
        };
        actionContainer.appendChild(ejectBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'text-gray-400 hover:text-red-500 p-0.5 rounded cursor-pointer';
    delBtn.title = '删除';
    delBtn.innerHTML = '<i class="ph-bold ph-x text-sm"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('确定删除此视频卡片吗？')) {
            if (isNested && parentColumn) {
                parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
            } else {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
            }
            saveData();
            renderBoard(boardItem);
        }
    };
    actionContainer.appendChild(delBtn);

    headerEl.appendChild(title);
    headerEl.appendChild(actionContainer);
    cardEl.appendChild(headerEl);

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-responsive-container bg-black';

    const url = card.videoUrl || '';
    if (url.includes('bilibili.com') || url.startsWith('BV')) {
        let bvid = url;
        const match = url.match(/video\/(BV\w+)/i) || url.match(/(BV\w+)/i);
        if (match) bvid = match[1];
        videoContainer.innerHTML = `<iframe src="//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0" allowfullscreen="true" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"></iframe>`;
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let ytid = '';
        if (url.includes('youtu.be/')) ytid = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) ytid = url.split('v=')[1].split('&')[0];
        videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytid}" allowfullscreen></iframe>`;
    } else {
        videoContainer.innerHTML = `<video controls src="${url}" class="w-full h-full object-contain"></video>`;
    }

    cardEl.appendChild(videoContainer);

    attachCardDrag(cardEl, headerEl, card, boardItem, isNested, parentColumn);
    return cardEl;
}

// 6. 网页书签链接卡片 (Web Link)
function createLinkCardElement(card, boardItem, isNested = false, parentColumn = null) {
    const cardEl = document.createElement('div');
    cardEl.className = `card-item ${isNested ? 'relative w-full mb-3' : 'absolute'} bg-white rounded-2xl shadow-md border border-gray-200/80 p-3.5 flex flex-col group select-text`;
    if (!isNested) {
        cardEl.style.left = `${card.x}px`;
        cardEl.style.top = `${card.y}px`;
        cardEl.style.width = `${card.width || 280}px`;
    }
    cardEl.dataset.id = card.id;

    const headerEl = document.createElement('div');
    headerEl.className = 'card-header card-drag-handle flex items-center justify-between pb-2 border-b border-gray-100 cursor-move';
    
    const domainSpan = document.createElement('span');
    domainSpan.className = 'text-xs text-indigo-500 font-semibold flex items-center gap-1.5 truncate pointer-events-none';
    let hostname = '链接';
    try { hostname = new URL(card.url).hostname; } catch(e){}
    domainSpan.innerHTML = `<i class="ph-bold ph-dots-six-vertical text-gray-400 text-sm"></i><i class="ph-bold ph-link"></i> ${hostname}`;

    const actionContainer = document.createElement('div');
    actionContainer.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

    if (isNested && parentColumn) {
        const ejectBtn = document.createElement('button');
        ejectBtn.className = 'text-gray-400 hover:text-blue-600 p-0.5 rounded cursor-pointer';
        ejectBtn.title = '移出到画布';
        ejectBtn.innerHTML = '<i class="ph-bold ph-arrow-square-out text-sm"></i>';
        ejectBtn.onclick = (e) => {
            e.stopPropagation();
            ejectCardFromColumn(card, parentColumn, boardItem);
        };
        actionContainer.appendChild(ejectBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'text-gray-400 hover:text-red-500 p-0.5 rounded cursor-pointer';
    delBtn.title = '删除';
    delBtn.innerHTML = '<i class="ph-bold ph-x text-sm"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('确定删除此链接卡片吗？')) {
            if (isNested && parentColumn) {
                parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
            } else {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
            }
            saveData();
            renderBoard(boardItem);
        }
    };
    actionContainer.appendChild(delBtn);

    headerEl.appendChild(domainSpan);
    headerEl.appendChild(actionContainer);
    cardEl.appendChild(headerEl);

    const contentBox = document.createElement('div');
    contentBox.className = 'pt-2.5';

    const titleEl = document.createElement('div');
    titleEl.className = 'font-bold text-gray-800 text-sm mb-1 line-clamp-1';
    titleEl.innerText = card.title || '网页链接';

    const descEl = document.createElement('div');
    descEl.className = 'text-xs text-gray-500 mb-3 line-clamp-2';
    descEl.innerText = card.desc || card.url || '';

    const openLinkBtn = document.createElement('a');
    openLinkBtn.href = card.url || '#';
    openLinkBtn.target = '_blank';
    openLinkBtn.className = 'inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium py-1 px-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors';
    openLinkBtn.innerHTML = '访问链接 <i class="ph-bold ph-arrow-square-out text-xs"></i>';
    openLinkBtn.addEventListener('pointerdown', e => e.stopPropagation());

    contentBox.appendChild(titleEl);
    contentBox.appendChild(descEl);
    contentBox.appendChild(openLinkBtn);
    cardEl.appendChild(contentBox);

    attachCardDrag(cardEl, headerEl, card, boardItem, isNested, parentColumn);
    return cardEl;
}

// 7. 色卡卡片 (Pantone Swatch)
function createColorCardElement(card, boardItem, isNested = false, parentColumn = null) {
    const cardEl = document.createElement('div');
    cardEl.className = `card-item color-swatch-card ${isNested ? 'relative w-full mb-3' : 'absolute'} bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col group select-text shadow-md`;
    if (!isNested) {
        cardEl.style.left = `${card.x}px`;
        cardEl.style.top = `${card.y}px`;
        cardEl.style.width = `${card.width || 200}px`;
    }
    cardEl.dataset.id = card.id;

    const colorBlock = document.createElement('div');
    colorBlock.className = 'h-28 card-drag-handle relative flex items-start justify-between p-2.5 cursor-move transition-colors';
    colorBlock.style.backgroundColor = card.color || '#3b82f6';

    const dragGrip = document.createElement('div');
    dragGrip.className = 'w-6 h-6 rounded-lg bg-black/30 text-white/90 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs pointer-events-none shadow-xs';
    dragGrip.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';

    const actionContainer = document.createElement('div');
    actionContainer.className = 'flex items-center gap-1.5 z-10';

    const colorPickerLabel = document.createElement('label');
    colorPickerLabel.className = 'w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-xs shadow-xs';
    colorPickerLabel.title = '更换颜色';
    colorPickerLabel.innerHTML = '<i class="ph-bold ph-paint-brush-broad text-xs"></i>';

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = card.color || '#3b82f6';
    colorPicker.className = 'sr-only';
    
    colorPicker.oninput = (e) => {
        const hex = e.target.value.toUpperCase();
        card.color = hex;
        colorBlock.style.backgroundColor = hex;
        hexCode.innerText = hex;
    };
    colorPicker.onchange = (e) => {
        card.color = e.target.value.toUpperCase();
        saveData();
    };

    colorPickerLabel.appendChild(colorPicker);
    actionContainer.appendChild(colorPickerLabel);

    if (isNested && parentColumn) {
        const ejectBtn = document.createElement('button');
        ejectBtn.className = 'w-7 h-7 rounded-lg bg-black/40 hover:bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs shadow-xs';
        ejectBtn.title = '移出到画布';
        ejectBtn.innerHTML = '<i class="ph-bold ph-arrow-square-out text-xs"></i>';
        ejectBtn.onclick = (e) => {
            e.stopPropagation();
            ejectCardFromColumn(card, parentColumn, boardItem);
        };
        actionContainer.appendChild(ejectBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'w-7 h-7 rounded-lg bg-black/40 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs shadow-xs';
    delBtn.title = '删除色卡';
    delBtn.innerHTML = '<i class="ph-bold ph-x text-xs"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('确定删除此色卡吗？')) {
            if (isNested && parentColumn) {
                parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
            } else {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
            }
            saveData();
            renderBoard(boardItem);
        }
    };
    actionContainer.appendChild(delBtn);

    colorBlock.appendChild(dragGrip);
    colorBlock.appendChild(actionContainer);
    cardEl.appendChild(colorBlock);

    const labelBox = document.createElement('div');
    labelBox.className = 'p-3 bg-white';

    const nameInput = document.createElement('input');
    nameInput.className = 'font-bold text-gray-800 text-xs uppercase tracking-wider bg-transparent outline-none w-full mb-1';
    nameInput.value = card.name || 'COLOR SWATCH';
    nameInput.onchange = (e) => {
        card.name = e.target.value;
        saveData();
    };
    nameInput.addEventListener('pointerdown', e => e.stopPropagation());

    const hexCode = document.createElement('div');
    hexCode.className = 'text-xs text-gray-400 font-mono';
    hexCode.innerText = (card.color || '#3B82F6').toUpperCase();

    labelBox.appendChild(nameInput);
    labelBox.appendChild(hexCode);
    cardEl.appendChild(labelBox);

    attachCardDrag(cardEl, colorBlock, card, boardItem, isNested, parentColumn);
    return cardEl;
}

// 8. 独立大标题文字 (Heading)
function createHeadingCardElement(card, boardItem, isNested = false, parentColumn = null) {
    const cardEl = document.createElement('div');
    cardEl.className = `card-item ${isNested ? 'relative w-full mb-3' : 'absolute'} flex items-center group select-text py-1`;
    if (!isNested) {
        cardEl.style.left = `${card.x}px`;
        cardEl.style.top = `${card.y}px`;
        cardEl.style.width = `${card.width || 320}px`;
    }
    cardEl.dataset.id = card.id;

    const dragHandle = document.createElement('div');
    dragHandle.className = 'card-header card-drag-handle text-gray-400 hover:text-gray-700 pr-2 cursor-move';
    dragHandle.innerHTML = '<i class="ph-bold ph-dots-six-vertical text-lg"></i>';

    const textInput = document.createElement('input');
    textInput.className = 'font-extrabold text-2xl text-gray-900 bg-transparent outline-none flex-1 tracking-tight border-b-2 border-transparent hover:border-gray-200 focus:border-purple-500 transition-colors';
    textInput.value = card.text || '大标题分区';
    textInput.oninput = (e) => {
        card.text = e.target.value;
        saveData();
    };
    textInput.addEventListener('pointerdown', e => e.stopPropagation());

    const actionContainer = document.createElement('div');
    actionContainer.className = 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2';

    if (isNested && parentColumn) {
        const ejectBtn = document.createElement('button');
        ejectBtn.className = 'text-gray-400 hover:text-blue-600 p-0.5 rounded cursor-pointer';
        ejectBtn.title = '移出到画布';
        ejectBtn.innerHTML = '<i class="ph-bold ph-arrow-square-out text-sm"></i>';
        ejectBtn.onclick = (e) => {
            e.stopPropagation();
            ejectCardFromColumn(card, parentColumn, boardItem);
        };
        actionContainer.appendChild(ejectBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'text-gray-300 hover:text-red-500 cursor-pointer';
    delBtn.title = '删除标题';
    delBtn.innerHTML = '<i class="ph-bold ph-trash text-sm"></i>';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('确定删除此标题吗？')) {
            if (isNested && parentColumn) {
                parentColumn.cards = parentColumn.cards.filter(c => c.id !== card.id);
            } else {
                boardItem.cards = boardItem.cards.filter(c => c.id !== card.id);
            }
            saveData();
            renderBoard(boardItem);
        }
    };
    actionContainer.appendChild(delBtn);

    cardEl.appendChild(dragHandle);
    cardEl.appendChild(textInput);
    cardEl.appendChild(actionContainer);

    attachCardDrag(cardEl, dragHandle, card, boardItem, isNested, parentColumn);
    return cardEl;
}


// --- 新建画板核心函数 ---

function createNewBoardCard(title = '新子画板') {
    const currentBoard = appData.items[appData.currentViewId];
    if (!currentBoard) return;

    const newBoardId = generateId();
    const coords = getCenterPlacementCoords(170, 150);

    appData.items[newBoardId] = {
        id: newBoardId,
        type: 'board',
        name: title,
        cover: null,
        cards: [],
        parentId: currentBoard.id
    };

    const newBoardCard = {
        id: newBoardId,
        type: 'board',
        targetBoardId: newBoardId,
        title: title,
        cover: null,
        icon: BOARD_ICON_PRESETS[Math.floor(Math.random() * BOARD_ICON_PRESETS.length)],
        badgeColor: BOARD_COLOR_PRESETS[Math.floor(Math.random() * BOARD_COLOR_PRESETS.length)],
        x: coords.x,
        y: coords.y,
        width: 170
    };

    currentBoard.cards = currentBoard.cards || [];
    currentBoard.cards.push(newBoardCard);
    saveData();
    renderBoard(currentBoard);
}

newBoardBtn.onclick = () => createNewBoardCard('新画板');
sidebar.board.onclick = () => createNewBoardCard('新子画板');


// --- 侧边栏卡片添加事件绑定 ---

sidebar.note.onclick = () => {
    const currentBoard = appData.items[appData.currentViewId];
    if (!currentBoard) return;
    const coords = getCenterPlacementCoords(280, 100);
    const newCard = {
        id: generateId(),
        type: 'text',
        x: coords.x,
        y: coords.y,
        width: 280,
        content: '',
        bg: '#ffffff'
    };
    currentBoard.cards = currentBoard.cards || [];
    currentBoard.cards.push(newCard);
    saveData();
    renderBoard(currentBoard);
};

sidebar.column.onclick = () => {
    const currentBoard = appData.items[appData.currentViewId];
    if (!currentBoard) return;
    const coords = getCenterPlacementCoords(320, 200);
    const newCol = {
        id: generateId(),
        type: 'column',
        title: '新分组列',
        accentColor: '#10b981',
        x: coords.x,
        y: coords.y,
        width: 320,
        cards: [
            { id: generateId(), type: 'text', content: '第一条笔记...', bg: '#ffffff' }
        ]
    };
    currentBoard.cards = currentBoard.cards || [];
    currentBoard.cards.push(newCol);
    saveData();
    renderBoard(currentBoard);
};

sidebar.todo.onclick = () => {
    const currentBoard = appData.items[appData.currentViewId];
    if (!currentBoard) return;
    const coords = getCenterPlacementCoords(300, 150);
    const newTodo = {
        id: generateId(),
        type: 'todo',
        title: '待办任务',
        x: coords.x,
        y: coords.y,
        width: 300,
        items: [
            { id: generateId(), text: '待办事项 1', done: false },
            { id: generateId(), text: '待办事项 2', done: false }
        ]
    };
    currentBoard.cards = currentBoard.cards || [];
    currentBoard.cards.push(newTodo);
    saveData();
    renderBoard(currentBoard);
};

sidebar.heading.onclick = () => {
    const currentBoard = appData.items[appData.currentViewId];
    if (!currentBoard) return;
    const coords = getCenterPlacementCoords(320, 60);
    const newHeading = {
        id: generateId(),
        type: 'heading',
        text: '画板主题区域',
        x: coords.x,
        y: coords.y,
        width: 320
    };
    currentBoard.cards = currentBoard.cards || [];
    currentBoard.cards.push(newHeading);
    saveData();
    renderBoard(currentBoard);
};

sidebar.color.onclick = () => {
    const currentBoard = appData.items[appData.currentViewId];
    if (!currentBoard) return;
    const coords = getCenterPlacementCoords(200, 160);
    const newColor = {
        id: generateId(),
        type: 'color',
        name: 'EMERALD GREEN',
        color: '#10B981',
        x: coords.x,
        y: coords.y,
        width: 200
    };
    currentBoard.cards = currentBoard.cards || [];
    currentBoard.cards.push(newColor);
    saveData();
    renderBoard(currentBoard);
};

sidebar.image.onclick = () => {
    mediaModal.title.innerHTML = '<i class="ph-fill ph-image text-rose-500"></i> 添加图片卡片';
    mediaModal.body.innerHTML = `
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">本地图片上传</label>
            <input type="file" id="mediaImgFile" accept="image/*" class="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer">
        </div>
        <div class="text-center text-xs text-gray-400 font-medium my-1">或者</div>
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">网络图片 URL</label>
            <input type="text" id="mediaImgUrl" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none" placeholder="https://example.com/image.png">
        </div>
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">说明文字 (可选)</label>
            <input type="text" id="mediaImgCaption" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none" placeholder="输入图片注解...">
        </div>
    `;
    mediaModal.el.classList.remove('hidden');

    let uploadedBase64 = null;
    document.getElementById('mediaImgFile').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => uploadedBase64 = ev.target.result;
            reader.readAsDataURL(file);
        }
    };

    mediaModal.confirm.onclick = () => {
        const currentBoard = appData.items[appData.currentViewId];
        const urlInput = document.getElementById('mediaImgUrl').value.trim();
        const caption = document.getElementById('mediaImgCaption').value.trim();
        const src = uploadedBase64 || urlInput;
        if (!src) { alert('请上传图片或输入图片链接'); return; }

        const coords = getCenterPlacementCoords(300, 220);
        const newImgCard = {
            id: generateId(),
            type: 'image',
            src: src,
            caption: caption,
            x: coords.x,
            y: coords.y,
            width: 300
        };
        currentBoard.cards = currentBoard.cards || [];
        currentBoard.cards.push(newImgCard);
        saveData();
        mediaModal.el.classList.add('hidden');
        renderBoard(currentBoard);
    };
};

sidebar.video.onclick = () => {
    mediaModal.title.innerHTML = '<i class="ph-fill ph-video text-sky-500"></i> 添加视频卡片';
    mediaModal.body.innerHTML = `
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">视频链接 (支持 Bilibili BV号 / YouTube / MP4直链)</label>
            <input type="text" id="mediaVideoUrl" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none" placeholder="https://www.bilibili.com/video/BV1xx411c7mD 或 https://youtu.be/...">
        </div>
        <p class="text-[11px] text-gray-400">💡 提示：输入 B站 BV 号或完整链接，即可直接在画板内嵌入免跳转流畅播放！</p>
    `;
    mediaModal.el.classList.remove('hidden');

    mediaModal.confirm.onclick = () => {
        const currentBoard = appData.items[appData.currentViewId];
        const videoUrl = document.getElementById('mediaVideoUrl').value.trim();
        if (!videoUrl) { alert('请输入视频链接'); return; }

        const coords = getCenterPlacementCoords(360, 220);
        const newVideoCard = {
            id: generateId(),
            type: 'video',
            videoUrl: videoUrl,
            x: coords.x,
            y: coords.y,
            width: 360
        };
        currentBoard.cards = currentBoard.cards || [];
        currentBoard.cards.push(newVideoCard);
        saveData();
        mediaModal.el.classList.add('hidden');
        renderBoard(currentBoard);
    };
};

sidebar.link.onclick = () => {
    mediaModal.title.innerHTML = '<i class="ph-fill ph-link text-indigo-500"></i> 添加网页书签';
    mediaModal.body.innerHTML = `
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">网页 URL</label>
            <input type="text" id="mediaLinkUrl" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://milanote.com">
        </div>
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">书签标题</label>
            <input type="text" id="mediaLinkTitle" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="网站名称...">
        </div>
        <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">描述概要 (可选)</label>
            <input type="text" id="mediaLinkDesc" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="简介说明...">
        </div>
    `;
    mediaModal.el.classList.remove('hidden');

    mediaModal.confirm.onclick = () => {
        const currentBoard = appData.items[appData.currentViewId];
        const url = document.getElementById('mediaLinkUrl').value.trim();
        const title = document.getElementById('mediaLinkTitle').value.trim() || '书签链接';
        const desc = document.getElementById('mediaLinkDesc').value.trim();
        if (!url) { alert('请输入网页链接'); return; }

        const coords = getCenterPlacementCoords(280, 140);
        const newLinkCard = {
            id: generateId(),
            type: 'link',
            url: url,
            title: title,
            desc: desc,
            x: coords.x,
            y: coords.y,
            width: 280
        };
        currentBoard.cards = currentBoard.cards || [];
        currentBoard.cards.push(newLinkCard);
        saveData();
        mediaModal.el.classList.add('hidden');
        renderBoard(currentBoard);
    };
};

mediaModal.cancel.onclick = () => mediaModal.el.classList.add('hidden');


// --- 画布平移逻辑 ---

let isPanning = false;
let panStartX, panStartY, initialOffsetX, initialOffsetY;

views.canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('#mobile-sidebar-toggle') || e.target.closest('#canvas-sidebar') || e.target.closest('#mobile-sidebar-backdrop') || e.target.closest('#sync-modal') || e.target.closest('#media-modal') || e.target.closest('#formatting-toolbar')) {
        return;
    }
    if (e.target === views.canvas || e.target === boardEl) {
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        initialOffsetX = boardOffset.x;
        initialOffsetY = boardOffset.y;
        
        try {
            views.canvas.setPointerCapture(e.pointerId);
        } catch(err) {}

        document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = 'none');
        views.canvas.classList.remove('canvas-grab');
        views.canvas.classList.add('canvas-grabbing');
        hideFormattingToolbar();
    }
});

window.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    if (e.buttons === 0) {
        endCanvasPan();
        return;
    }
    boardOffset.x = initialOffsetX + (e.clientX - panStartX);
    boardOffset.y = initialOffsetY + (e.clientY - panStartY);
    boardEl.style.transform = `translate(${boardOffset.x}px, ${boardOffset.y}px)`;
});

function endCanvasPan() {
    if (!isPanning) return;
    isPanning = false;
    document.querySelectorAll('iframe').forEach(iframe => iframe.style.pointerEvents = 'auto');
    views.canvas.classList.remove('canvas-grabbing');
    views.canvas.classList.add('canvas-grab');
}

window.addEventListener('pointerup', endCanvasPan);
window.addEventListener('pointercancel', endCanvasPan);


// --- 格式化工具栏定位与初始化 ---

function initFormattingPalettes() {
    fmt.colorPalette.innerHTML = '';
    TEXT_COLORS.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform shadow-xs flex items-center justify-center';
        btn.style.backgroundColor = item.color;
        btn.title = item.name;
        btn.onmousedown = (e) => {
            e.preventDefault();
            document.execCommand('foreColor', false, item.color);
            fmt.colorIndicator.style.backgroundColor = item.color;
            fmt.colorPalette.classList.add('hidden');
        };
        fmt.colorPalette.appendChild(btn);
    });

    fmt.bgPalette.innerHTML = '';
    CARD_BG_COLORS.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'w-7 h-7 rounded-lg border border-gray-300 hover:scale-105 transition-all shadow-xs flex items-center justify-center relative';
        btn.style.backgroundColor = item.bg;
        btn.title = item.name;
        btn.innerHTML = `<span class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.text}"></span>`;
        btn.onmousedown = (e) => {
            e.preventDefault();
            applyCardTheme(item);
            fmt.bgPalette.classList.add('hidden');
        };
        fmt.bgPalette.appendChild(btn);
    });

    fmt.bold.onmousedown = (e) => { e.preventDefault(); document.execCommand('bold'); };
    fmt.italic.onmousedown = (e) => { e.preventDefault(); document.execCommand('italic'); };
    fmt.underline.onmousedown = (e) => { e.preventDefault(); document.execCommand('underline'); };
    fmt.strike.onmousedown = (e) => { e.preventDefault(); document.execCommand('strikeThrough'); };
    fmt.ul.onmousedown = (e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); };
    fmt.ol.onmousedown = (e) => { e.preventDefault(); document.execCommand('insertOrderedList'); };
    fmt.alignLeft.onmousedown = (e) => { e.preventDefault(); document.execCommand('justifyLeft'); };
    fmt.alignCenter.onmousedown = (e) => { e.preventDefault(); document.execCommand('justifyCenter'); };

    fmt.block.onchange = (e) => {
        document.execCommand('formatBlock', false, e.target.value);
    };

    fmt.colorBtn.onclick = (e) => {
        e.stopPropagation();
        fmt.colorPalette.classList.toggle('hidden');
        fmt.bgPalette.classList.add('hidden');
        fmt.widthMenu.classList.add('hidden');
    };

    fmt.bgBtn.onclick = (e) => {
        e.stopPropagation();
        fmt.bgPalette.classList.toggle('hidden');
        fmt.colorPalette.classList.add('hidden');
        fmt.widthMenu.classList.add('hidden');
    };

    fmt.widthBtn.onclick = (e) => {
        e.stopPropagation();
        fmt.widthMenu.classList.toggle('hidden');
        fmt.colorPalette.classList.add('hidden');
        fmt.bgPalette.classList.add('hidden');
    };

    fmt.widthMenu.querySelectorAll('button').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const w = parseInt(btn.dataset.width);
            if (activeCardId && activeCardElement) {
                const currentBoard = appData.items[appData.currentViewId];
                const targetCard = currentBoard?.cards?.find(c => c.id === activeCardId);
                if (targetCard) {
                    targetCard.width = w;
                    activeCardElement.style.width = `${w}px`;
                    saveData();
                    positionFormattingToolbar(activeCardElement);
                }
            }
            fmt.widthMenu.classList.add('hidden');
        };
    });
}

function applyCardTheme(theme) {
    if (!activeCardId || !activeCardElement) return;
    const currentBoard = appData.items[appData.currentViewId];
    const targetCard = currentBoard?.cards?.find(c => c.id === activeCardId);
    if (!targetCard) return;

    targetCard.bg = theme.bg;
    targetCard.textColor = theme.text;
    targetCard.borderColor = theme.border;
    
    activeCardElement.style.backgroundColor = theme.bg;
    activeCardElement.style.color = theme.text;
    activeCardElement.style.borderColor = theme.border;
    saveData();
}

function positionFormattingToolbar(cardEl) {
    if (!cardEl || !activeCardId) {
        hideFormattingToolbar();
        return;
    }
    
    const rect = cardEl.getBoundingClientRect();
    fmt.toolbar.classList.remove('hidden');
    
    let top = rect.top - 54;
    let left = rect.left + rect.width / 2;
    
    if (top < 70) top = rect.bottom + 12;
    
    const tbWidth = 440;
    if (left - tbWidth / 2 < 12) left = tbWidth / 2 + 12;
    if (left + tbWidth / 2 > window.innerWidth - 12) left = window.innerWidth - tbWidth / 2 - 12;
    
    fmt.toolbar.style.top = `${top}px`;
    fmt.toolbar.style.left = `${left}px`;
    fmt.toolbar.style.transform = 'translateX(-50%)';
}

function hideFormattingToolbar() {
    if (fmt.toolbar) fmt.toolbar.classList.add('hidden');
    if (fmt.colorPalette) fmt.colorPalette.classList.add('hidden');
    if (fmt.bgPalette) fmt.bgPalette.classList.add('hidden');
    if (fmt.widthMenu) fmt.widthMenu.classList.add('hidden');
    if (activeCardElement) {
        activeCardElement.classList.remove('card-selected');
    }
    activeCardId = null;
    activeCardElement = null;
}

window.addEventListener('click', (e) => {
    if (!fmt.toolbar?.contains(e.target) && !e.target.closest('.card-item') && !e.target.closest('#canvas-sidebar')) {
        hideFormattingToolbar();
    }
});

// --- 移动端抽屉工具栏控制 ---
const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');
const mobileBackdrop = document.getElementById('mobile-sidebar-backdrop');

function toggleMobileSidebar(open) {
    const isOpen = open !== undefined ? open : !sidebar.el.classList.contains('mobile-open');
    if (isOpen) {
        sidebar.el.classList.add('mobile-open');
        mobileBackdrop?.classList.remove('hidden');
    } else {
        sidebar.el.classList.remove('mobile-open');
        mobileBackdrop?.classList.add('hidden');
    }
}

if (mobileToggleBtn) {
    const handleFabToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileSidebar();
    };
    mobileToggleBtn.addEventListener('click', handleFabToggle);
    mobileToggleBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    mobileToggleBtn.addEventListener('touchstart', handleFabToggle, { passive: false });
}

if (mobileBackdrop) {
    const handleBackdropTap = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileSidebar(false);
    };
    mobileBackdrop.addEventListener('click', handleBackdropTap);
    mobileBackdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
    mobileBackdrop.addEventListener('touchstart', handleBackdropTap, { passive: false });
}

sidebar.el?.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (window.innerWidth <= 640) {
            toggleMobileSidebar(false);
        }
    });
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
});


// --- ☁️ 数据备份与多端静默云同步引擎 (Silent Cloud Sync) ---

function updateSyncStatusDot(status = 'idle') {
    if (!syncStatusDot) return;
    if (status === 'syncing') {
        syncStatusDot.className = 'w-2 h-2 rounded-full bg-blue-500 animate-ping';
    } else if (syncConfig.enabled && syncConfig.token) {
        syncStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    } else {
        syncStatusDot.className = 'w-2 h-2 rounded-full bg-gray-400';
    }
}

// 调度静默 Gist 云同步 (3秒防抖，在后台无感上传)
function scheduleSilentGistSync() {
    if (!syncConfig.enabled || !syncConfig.token || !syncConfig.gistId) return;
    
    if (silentSyncTimeout) clearTimeout(silentSyncTimeout);
    updateSyncStatusDot('syncing');

    silentSyncTimeout = setTimeout(async () => {
        try {
            await pushToGistSilent();
            updateSyncStatusDot('idle');
        } catch (e) {
            console.error("静默云同步失败:", e);
            updateSyncStatusDot('idle');
        }
    }, 2500);
}

async function pushToGistSilent() {
    const payload = {
        description: 'Inspiration Wall Auto-Sync Data',
        files: {
            'inspiration-wall-data.json': {
                content: JSON.stringify(appData, null, 2)
            }
        }
    };

    const res = await fetch(`https://api.github.com/gists/${syncConfig.gistId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${syncConfig.token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function pullFromGistDirect() {
    if (!syncConfig.token || !syncConfig.gistId) {
        alert('请先输入 Token 和 Gist ID');
        return;
    }

    try {
        updateSyncStatusDot('syncing');
        const res = await fetch(`https://api.github.com/gists/${syncConfig.gistId}`, {
            headers: {
                'Authorization': `Bearer ${syncConfig.token}`,
                'Accept': 'application/vnd.github+json'
            }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const fileContent = data.files['inspiration-wall-data.json']?.content;
        if (fileContent) {
            const parsed = JSON.parse(fileContent);
            if (parsed.items && parsed.items['root']) {
                appData = parsed;
                saveData();
                renderApp();
                alert('🎉 成功从云端 Gist 同步最新画板数据！');
            }
        }
    } catch (err) {
        alert('拉取云端数据失败: ' + err.message);
    } finally {
        updateSyncStatusDot('idle');
    }
}

// 导出 data.json (方便提交到仓库作为默认画板)
function downloadDataJson() {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 导出离线备份文件
function downloadBackupJson() {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspiration-wall-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 从当前仓库读取 data.json
async function fetchRepoDataJson(showNotice = false) {
    try {
        const res = await fetch('./data.json', { cache: 'no-cache' });
        if (res.ok) {
            const repoData = await res.json();
            if (repoData && repoData.items && repoData.items['root']) {
                appData = repoData;
                saveData();
                renderApp();
                if (showNotice) alert('🎉 已成功从仓库加载最新数据！');
                return true;
            }
        }
    } catch (e) {
        if (showNotice) alert('从仓库拉取数据失败: ' + e.message);
    }
    return false;
}

// 同步模态框事件绑定
if (syncModalBtn) {
    syncModalBtn.onclick = () => {
        syncModal.tokenInput.value = syncConfig.token || '';
        syncModal.gistIdInput.value = syncConfig.gistId || '';
        syncModal.el.classList.remove('hidden');
    };
}

if (syncModal.close) {
    syncModal.close.onclick = () => syncModal.el.classList.add('hidden');
}

if (syncModal.exportDataJsonBtn) {
    syncModal.exportDataJsonBtn.onclick = downloadDataJson;
}

if (syncModal.pullRepoDataBtn) {
    syncModal.pullRepoDataBtn.onclick = () => fetchRepoDataJson(true);
}

if (syncModal.exportBackupBtn) {
    syncModal.exportBackupBtn.onclick = downloadBackupJson;
}

if (syncModal.importBackupFile) {
    syncModal.importBackupFile.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (parsed.items && parsed.items['root']) {
                        appData = parsed;
                        saveData();
                        renderApp();
                        alert('🎉 成功恢复备份数据！');
                        syncModal.el.classList.add('hidden');
                    } else {
                        alert('备份文件格式不正确。');
                    }
                } catch (err) {
                    alert('解析备份文件失败: ' + err.message);
                }
            };
            reader.readAsText(file);
        }
    };
}

if (syncModal.saveGistBtn) {
    syncModal.saveGistBtn.onclick = async () => {
        const token = syncModal.tokenInput.value.trim();
        let gistId = syncModal.gistIdInput.value.trim();

        if (!token) {
            alert('请输入有效的 GitHub Token (需包含 gist 权限)');
            return;
        }

        try {
            updateSyncStatusDot('syncing');
            // 如果未填 Gist ID，则自动创建一个私有 Gist
            if (!gistId) {
                const createRes = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: 'Inspiration Wall Auto-Sync Data',
                        public: false,
                        files: {
                            'inspiration-wall-data.json': {
                                content: JSON.stringify(appData, null, 2)
                            }
                        }
                    })
                });

                if (!createRes.ok) throw new Error(`创建 Gist 失败 (HTTP ${createRes.status})`);
                const gistData = await createRes.json();
                gistId = gistData.id;
                syncModal.gistIdInput.value = gistId;
            }

            syncConfig = { token, gistId, enabled: true };
            localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncConfig));
            updateSyncStatusDot('idle');
            alert(`🎉 静默云同步已成功开启！\n\n你的私有 Gist ID: ${gistId}\n在手机端同样输入此 Token 与 Gist ID，即可实现多端实时无感同步！`);
            syncModal.el.classList.add('hidden');
        } catch (err) {
            alert('开启云同步失败: ' + err.message);
            updateSyncStatusDot('idle');
        }
    };
}

if (syncModal.testGistPullBtn) {
    syncModal.testGistPullBtn.onclick = () => {
        syncConfig.token = syncModal.tokenInput.value.trim();
        syncConfig.gistId = syncModal.gistIdInput.value.trim();
        pullFromGistDirect();
    };
}

// 首次启动静默初始化 (如果本地没有任何卡片且有仓库 data.json，则自动读取预载)
async function initStartupSync() {
    // 1. 如果已开启 Gist 云同步，启动时静默从 Gist 拉取最新状态
    if (syncConfig.enabled && syncConfig.token && syncConfig.gistId) {
        try {
            const res = await fetch(`https://api.github.com/gists/${syncConfig.gistId}`, {
                headers: {
                    'Authorization': `Bearer ${syncConfig.token}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                const content = data.files['inspiration-wall-data.json']?.content;
                if (content) {
                    const parsed = JSON.parse(content);
                    if (parsed.items && parsed.items['root']) {
                        appData = parsed;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
                        renderApp();
                    }
                }
            }
        } catch(e) {}
    } else if (!localStorage.getItem(STORAGE_KEY)) {
        // 2. 手机首次打开 (LocalStorage 为空) 时，自动静默拉取仓库 data.json
        await fetchRepoDataJson(false);
    }
}


// --- 初始化入口 ---
initFormattingPalettes();
renderApp();
initStartupSync();
