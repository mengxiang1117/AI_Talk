// 全局状态
const state = {
    characters: [],
    groups: [],
    models: [],
    hasVision: false,
    currentChat: null,
    currentChatType: 'single',
    selectedCharactersForGroup: [],
    pendingImage: null,
    editingCharacter: null,
    confirmCallback: null,
    alertCallback: null,
    confirmPromiseResolve: null
};

// DOM 元素
let elements = {};

// 初始化 DOM 元素引用
function initElements() {
    elements = {
        navTabs: document.querySelectorAll('.nav-tab'),
        panels: document.querySelectorAll('.panel'),
        characterList: document.getElementById('character-list'),
        groupList: document.getElementById('group-list'),
        chatList: document.getElementById('chat-list'),
        chatTypeTabs: document.querySelectorAll('.chat-type-tab'),
        welcomeScreen: document.getElementById('welcome-screen'),
        chatScreen: document.getElementById('chat-screen'),
        messagesContainer: document.getElementById('messages-container'),
        messageInput: document.getElementById('message-input'),
        sendBtn: document.getElementById('send-btn'),
        closeChatBtn: document.getElementById('close-chat-btn'),
        chatTitle: document.getElementById('chat-title'),
        characterModal: document.getElementById('character-modal'),
        groupModal: document.getElementById('group-modal'),
        createCharacterBtn: document.getElementById('create-character-btn'),
        createGroupBtn: document.getElementById('create-group-btn'),
        saveCharacterBtn: document.getElementById('save-character-btn'),
        cancelBtn: document.getElementById('cancel-btn'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        closeGroupModalBtn: document.getElementById('close-group-modal-btn'),
        cancelGroupBtn: document.getElementById('cancel-group-btn'),
        startGroupBtn: document.getElementById('start-group-btn'),
        groupCharacterList: document.getElementById('group-character-list'),
        imageBtn: document.getElementById('image-btn'),
        imageUpload: document.getElementById('image-upload'),
        imagePreviewContainer: document.getElementById('image-preview-container'),
        characterModelSelect: document.getElementById('character-model'),
        characterNameInput: document.getElementById('character-name'),
        characterPersonaInput: document.getElementById('character-persona'),
        characterMemoryInput: document.getElementById('character-memory'),
        characterFileInput: document.getElementById('character-file'),
        modalTitle: document.getElementById('modal-title'),
        toastOverlay: document.getElementById('toast-overlay'),
        toast: document.getElementById('toast'),
        toastSpinner: document.getElementById('toast-spinner'),
        toastMessage: document.getElementById('toast-message'),
        confirmModal: document.getElementById('confirm-modal'),
        confirmMessage: document.getElementById('confirm-message'),
        confirmOkBtn: document.getElementById('confirm-ok-btn'),
        confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
        alertModal: document.getElementById('alert-modal'),
        alertMessage: document.getElementById('alert-message'),
        alertOkBtn: document.getElementById('alert-ok-btn')
    };
}

// 初始化
function init() {
    console.log('初始化开始');

    initElements();
    console.log('confirmModal 元素:', elements.confirmModal);
    console.log('confirmOkBtn 元素:', elements.confirmOkBtn);
    console.log('toastOverlay 元素:', elements.toastOverlay);
    bindEvents();
    loadModels();
    loadCharacters();
    loadGroups();
    loadChats('single');
    initModalEvents();
}

// 绑定事件
function bindEvents() {
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchNavTab(tab.dataset.tab));
    });

    elements.chatTypeTabs.forEach(tab => {
        tab.addEventListener('click', () => switchChatTypeTab(tab.dataset.type));
    });

    elements.createCharacterBtn.addEventListener('click', showCharacterModal);
    elements.saveCharacterBtn.addEventListener('click', saveCharacter);
    elements.cancelBtn.addEventListener('click', hideCharacterModal);
    elements.closeModalBtn.addEventListener('click', hideCharacterModal);

    elements.createGroupBtn.addEventListener('click', showGroupModal);
    elements.closeGroupModalBtn.addEventListener('click', hideGroupModal);
    elements.cancelGroupBtn.addEventListener('click', hideGroupModal);
    elements.startGroupBtn.addEventListener('click', saveAndStartGroupChat);

    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    elements.closeChatBtn.addEventListener('click', closeChat);

    elements.characterModal.addEventListener('click', (e) => {
        if (e.target === elements.characterModal) hideCharacterModal();
    });
    elements.groupModal.addEventListener('click', (e) => {
        if (e.target === elements.groupModal) hideGroupModal();
    });

    elements.imageBtn.addEventListener('click', () => elements.imageUpload.click());
    elements.imageUpload.addEventListener('change', handleImageSelect);
}

// 加载模型列表
async function loadModels() {
    try {
        const res = await fetch('/api/models');
        const data = await res.json();
        state.models = data.llm_models || [];
        state.hasVision = data.has_vision || false;
        renderModelSelect();
    } catch (err) {
        console.error('加载模型失败:', err);
    }
}

// 渲染模型选择下拉
function renderModelSelect() {
    let html = '<option value="">-- 默认模型 --</option>';
    state.models.forEach(m => {
        html += `<option value="${m.name}">${m.name} (${m.model_name})</option>`;
    });
    elements.characterModelSelect.innerHTML = html;
}

// 切换导航标签
function switchNavTab(tabName) {
    elements.navTabs.forEach(t => t.classList.remove('active'));
    elements.panels.forEach(p => p.classList.remove('active'));

    document.querySelector(`.nav-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-panel`).classList.add('active');
}

// 切换聊天类型
function switchChatTypeTab(type) {
    elements.chatTypeTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.chat-type-tab[data-type="${type}"]`).classList.add('active');
    state.currentChatType = type;
    loadChats(type);
}

// 加载角色列表
async function loadCharacters() {
    try {
        const res = await fetch('/api/characters');
        state.characters = await res.json();
        renderCharacterList();
    } catch (err) {
        console.error('加载角色失败:', err);
    }
}

// 渲染角色列表
function renderCharacterList() {
    elements.characterList.innerHTML = state.characters.map(char => `
        <div class="character-item">
            <span style="display:flex;align-items:center;" onclick="startSingleChat('${char.name}')">
                <span class="name">${char.name}</span>
                ${char.model ? `<span class="model-tag">${char.model}</span>` : ''}
            </span>
            <div class="actions">
                <button class="action-btn" onclick="summarizeMemory('${char.name}')" title="记忆总结">📝</button>
                <button class="action-btn" onclick="editCharacter('${char.name}')" title="编辑">✏️</button>
                <button class="action-btn delete" onclick="deleteCharacter('${char.name}')" title="删除">🗑️</button>
            </div>
        </div>
    `).join('');
}

// 显示提示对话框
function showAlertModal(message) {
    alert(message);
}

// 显示确认对话框
function showConfirmModal(message) {
    return new Promise((resolve) => {
        resolve(confirm(message));
    });
}

// 显示加载提示
function showLoadingToast(message) {
    elements.toastSpinner.classList.remove('hidden');
    elements.toast.classList.remove('success');
    elements.toastMessage.textContent = message;
    elements.toastOverlay.classList.add('show');
}

// 显示成功提示
function showSuccessToast(message) {
    elements.toastSpinner.classList.add('hidden');
    elements.toast.classList.add('success');
    elements.toastMessage.textContent = message;
}

// 隐藏提示
function hideToast() {
    elements.toastOverlay.classList.remove('show');
}

// 记忆总结
async function summarizeMemory(name) {
    const confirmed = await showConfirmModal(`确定要总结角色「${name}」的聊天记录吗？\n\n这将收集所有相关聊天并总结，追加到历史记忆中。`);
    if (!confirmed) return;

    showLoadingToast('正在总结记忆...');

    try {
        const res = await fetch(`/api/characters/${encodeURIComponent(name)}/summarize-memory`, {
            method: 'POST'
        });

        if (!res.ok) {
            const err = await res.json();
            hideToast();
            showAlertModal(err.error || '总结失败');
            return;
        }

        const data = await res.json();
        showSuccessToast('总结成功！');
        await loadCharacters();

        // 1秒后自动隐藏
        setTimeout(hideToast, 1000);
    } catch (err) {
        console.error('总结记忆失败:', err);
        hideToast();
        showAlertModal('总结失败，请重试');
    }
}

// 编辑角色
async function editCharacter(name) {
    const char = state.characters.find(c => c.name === name);
    if (!char) return;

    state.editingCharacter = name;
    elements.modalTitle.textContent = '✏️ 编辑角色';
    elements.characterNameInput.value = char.name;
    elements.characterNameInput.disabled = true;
    elements.characterPersonaInput.value = char.persona || '';
    elements.characterMemoryInput.value = char.memory || '';
    elements.characterFileInput.value = '';

    renderModelSelect();
    if (char.model) {
        elements.characterModelSelect.value = char.model;
    }

    elements.characterModal.classList.add('show');
}

// 加载群聊列表
async function loadGroups() {
    try {
        const res = await fetch('/api/groups');
        state.groups = await res.json();
        renderGroupList();
    } catch (err) {
        console.error('加载群聊失败:', err);
    }
}

// 渲染群聊列表
function renderGroupList() {
    elements.groupList.innerHTML = state.groups.map(group => `
        <div class="group-item">
            <div class="group-name" onclick="startGroupFromList('${group.name}')">${group.name}</div>
            <div class="group-characters">
                ${group.characters.map(c => `<span class="chat-char-tag">${c}</span>`).join('')}
            </div>
            <div class="group-actions">
                <button class="action-btn delete" onclick="deleteGroup('${group.name}')" title="删除">🗑️</button>
            </div>
        </div>
    `).join('') || '<p style="color: var(--text-muted); text-align: center; padding: 40px 20px; font-family: \'Space Grotesk\', sans-serif; font-weight: 600;">还没有群聊<br><span style="font-size: 12px; color: var(--text-muted); font-weight: 400; font-family: \'Sora\', sans-serif;">点击上方按钮创建</span></p>';
}

// 从列表开始群聊
function startGroupFromList(groupName) {
    const group = state.groups.find(g => g.name === groupName);
    if (!group) return;

    state.currentChat = {
        type: 'group',
        target: group.name,
        filename: null,
        isNew: true,
        characters: [...group.characters]
    };

    clearPendingImage();
    showChatScreen();
    elements.chatTitle.textContent = group.name;
    elements.messagesContainer.innerHTML = '';
}

// 删除群聊
async function deleteGroup(name) {
    const confirmed = await showConfirmModal(`确定要删除群聊「${name}」吗？`);
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/groups/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            loadGroups();
        }
    } catch (err) {
        console.error('删除群聊失败:', err);
    }
}

// 显示创建角色模态框
function showCharacterModal() {
    state.editingCharacter = null;
    elements.modalTitle.textContent = '🎭 创建角色';
    elements.characterNameInput.value = '';
    elements.characterNameInput.disabled = false;
    elements.characterPersonaInput.value = '';
    elements.characterMemoryInput.value = '';
    elements.characterFileInput.value = '';
    renderModelSelect();
    elements.characterModal.classList.add('show');
}

// 隐藏创建角色模态框
function hideCharacterModal() {
    state.editingCharacter = null;
    elements.characterModal.classList.remove('show');
}

// 保存角色
async function saveCharacter() {
    const name = elements.characterNameInput.value.trim();
    const persona = elements.characterPersonaInput.value.trim();
    const memory = elements.characterMemoryInput.value.trim();
    const model = elements.characterModelSelect.value;
    const file = elements.characterFileInput.files[0];

    if (!name) {
        showAlertModal('请输入角色名称');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('persona', persona);
    formData.append('memory', memory);
    formData.append('model', model);
    if (file) formData.append('file', file);

    try {
        let res;
        if (state.editingCharacter) {
            res = await fetch(`/api/characters/${encodeURIComponent(state.editingCharacter)}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            res = await fetch('/api/characters', {
                method: 'POST',
                body: formData
            });
        }

        if (!res.ok) {
            const err = await res.json();
            showAlertModal(err.error || '保存角色失败');
            return;
        }

        hideCharacterModal();
        loadCharacters();
    } catch (err) {
        console.error('保存角色失败:', err);
        showAlertModal('保存角色失败');
    }
}

// 删除角色
async function deleteCharacter(name) {
    const confirmed = await showConfirmModal(`确定要删除角色「${name}」吗？`);
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/characters/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            loadCharacters();
        }
    } catch (err) {
        console.error('删除角色失败:', err);
    }
}

// 加载聊天记录
async function loadChats(type) {
    try {
        const res = await fetch(`/api/chats?type=${type}`);
        const chats = await res.json();
        renderChatList(chats);
    } catch (err) {
        console.error('加载聊天记录失败:', err);
    }
}

// 渲染聊天列表
function renderChatList(chats) {
    elements.chatList.innerHTML = chats.map(chat => {
        let charactersHtml = '';
        if (chat.type === 'group' && chat.characters && chat.characters.length > 0) {
            charactersHtml = '<div class="chat-characters">' +
                chat.characters.map(c => `<span class="chat-char-tag">${c}</span>`).join('') +
                '</div>';
        }
        return `
        <div class="chat-item" onclick="openChat('${chat.type}', '${chat.filename}')">
            <div class="chat-header-row">
                <span class="chat-name">${chat.name}</span>
                <button class="delete-chat-btn" onclick="event.stopPropagation(); deleteChat('${chat.type}', '${chat.filename}')" title="删除">×</button>
            </div>
            <div class="chat-time">${chat.time}</div>
            ${charactersHtml}
            ${chat.preview ? `<div class="chat-preview">${chat.preview}</div>` : ''}
            <div class="chat-hint">点击继续聊天 →</div>
        </div>
    `}).join('') || '<p style="color: var(--text-muted); text-align: center; padding: 40px 20px; font-family: \'Space Grotesk\', sans-serif; font-weight: 600;">暂无聊天记录<br><span style="font-size: 12px; color: var(--text-muted); font-weight: 400; font-family: \'Sora\', sans-serif;">去「角色」页面开始新对话吧</span></p>';
}

// 删除聊天
async function deleteChat(type, filename) {
    const confirmed = await showConfirmModal('确定要删除这条聊天记录吗？');
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/chats/${type}/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            loadChats(type);
        }
    } catch (err) {
        console.error('删除聊天失败:', err);
    }
}

// 开始单聊
function startSingleChat(characterName) {
    state.currentChat = {
        type: 'single',
        target: characterName,
        filename: null,
        isNew: true,
        characters: [characterName]
    };
    clearPendingImage();
    showChatScreen();
    elements.chatTitle.textContent = characterName;
    elements.messagesContainer.innerHTML = '';
}

// 显示群聊选择
function showGroupModal() {
    renderGroupCharacterSelect();
    document.getElementById('group-name').value = '';
    state.selectedCharactersForGroup = [];
    elements.groupModal.classList.add('show');
}

// 渲染群聊角色选择
function renderGroupCharacterSelect() {
    elements.groupCharacterList.innerHTML = state.characters.map(char => `
        <label class="character-select-item" data-name="${char.name}">
            <input type="checkbox" onchange="toggleGroupCharacter('${char.name}')">
            <span>${char.name}</span>
        </label>
    `).join('');
}

// 切换群聊角色选择
function toggleGroupCharacter(name) {
    const item = document.querySelector(`.character-select-item[data-name="${name}"]`);
    const checkbox = item.querySelector('input');

    if (checkbox.checked) {
        state.selectedCharactersForGroup.push(name);
        item.classList.add('selected');
    } else {
        state.selectedCharactersForGroup = state.selectedCharactersForGroup.filter(n => n !== name);
        item.classList.remove('selected');
    }
}

// 隐藏群聊模态框
function hideGroupModal() {
    elements.groupModal.classList.remove('show');
}

// 保存并开始群聊
async function saveAndStartGroupChat() {
    const groupName = document.getElementById('group-name').value.trim();
    if (!groupName) {
        showAlertModal('请输入群聊名称');
        return;
    }
    if (state.selectedCharactersForGroup.length < 2) {
        showAlertModal('请至少选择2个角色');
        return;
    }

    // 保存群聊定义
    try {
        const res = await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: groupName,
                characters: [...state.selectedCharactersForGroup]
            })
        });

        if (!res.ok) {
            const err = await res.json();
            showAlertModal(err.error || '创建群聊失败');
            return;
        }

        await loadGroups();
    } catch (err) {
        console.error('保存群聊失败:', err);
    }

    // 开始聊天
    state.currentChat = {
        type: 'group',
        target: groupName,
        filename: null,
        isNew: true,
        characters: [...state.selectedCharactersForGroup]
    };

    hideGroupModal();
    clearPendingImage();
    showChatScreen();
    elements.chatTitle.textContent = groupName;
    elements.messagesContainer.innerHTML = '';
}

// 打开历史聊天
async function openChat(type, filename) {
    try {
        const res = await fetch(`/api/chats/${type}/${encodeURIComponent(filename)}`);
        const data = await res.json();

        const name = filename.replace(/\.md$/, '').replace(/_\d{8}_\d{6}$/, '');

        state.currentChat = {
            type: type,
            target: name,
            filename: filename,
            isNew: false,
            characters: data.metadata?.characters || []
        };

        clearPendingImage();
        showChatScreen();
        elements.chatTitle.textContent = name;
        renderMessages(data.messages);
    } catch (err) {
        console.error('打开聊天失败:', err);
    }
}

// 图片选择处理
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        state.pendingImage = {
            file: file,
            dataUrl: event.target.result
        };
        renderImagePreview();
    };
    reader.readAsDataURL(file);
}

// 渲染图片预览
function renderImagePreview() {
    if (!state.pendingImage) {
        elements.imagePreviewContainer.innerHTML = '';
        return;
    }

    elements.imagePreviewContainer.innerHTML = `
        <div class="image-preview-wrapper">
            <img src="${state.pendingImage.dataUrl}" class="image-preview">
            <button class="remove-image" onclick="clearPendingImage()">×</button>
        </div>
    `;
}

// 清除待上传图片
function clearPendingImage() {
    state.pendingImage = null;
    elements.imageUpload.value = '';
    renderImagePreview();
}

// 显示聊天界面
function showChatScreen() {
    elements.welcomeScreen.style.display = 'none';
    elements.chatScreen.style.display = 'flex';
    elements.messageInput.focus();
}

// 关闭聊天
function closeChat() {
    state.currentChat = null;
    elements.chatScreen.style.display = 'none';
    elements.welcomeScreen.style.display = 'flex';
    clearPendingImage();
    loadChats(state.currentChatType);
}

// 渲染消息
function renderMessages(messages) {
    elements.messagesContainer.innerHTML = messages.map(msg => {
        const isUser = msg.sender === '你';
        let content = msg.content;
        let imageHtml = '';

        // 检查消息内容中是否有图片语法，提取图片
        const imageRegex = /!\[图片\]\((\/data\/images\/[^\)]+)\)\n?/;
        const imageMatch = content.match(imageRegex);
        if (imageMatch) {
            imageHtml = `<img src="${imageMatch[1]}" style="max-width: 100%; border-radius: 8px; margin-bottom: 10px; border: 2px solid var(--border-dark);">`;
            content = content.replace(imageRegex, '');
        }

        return `
            <div class="message ${isUser ? 'user' : 'ai'}">
                <div class="sender">${msg.sender}</div>
                <div class="bubble">${imageHtml}${formatMessage(content)}</div>
            </div>
        `;
    }).join('');
    scrollToBottom();
}

// 格式化消息内容
function formatMessage(content) {
    // 直接转义 HTML，CSS 的 white-space: pre-wrap 会处理换行
    return escapeHtml(content);
}

// 发送消息
async function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message && !state.pendingImage) return;
    if (!state.currentChat) return;

    // 保存图片信息
    let hasPendingImage = !!state.pendingImage;
    let pendingImageDataUrl = state.pendingImage?.dataUrl;
    let pendingImageFile = state.pendingImage?.file;

    // 立即清除图片预览（点击发送后图片消失）
    clearPendingImage();

    // 立即显示用户消息（不等待图片识别）
    let displayMessage = message;
    if (hasPendingImage) {
        displayMessage = message + (message ? '\n' : '') + '[图片]';
    }
    appendMessage('你', displayMessage, pendingImageDataUrl);
    elements.messageInput.value = '';

    // 保存对刚才追加的消息的引用，后面可能需要更新它
    const messages = elements.messagesContainer.querySelectorAll('.message:not(.system-msg)');
    const userMessageEl = messages[messages.length - 1];

    let imageFilename = null;
    let imageDesc = '';

    // 如果有图片，在后台上传并识别
    if (hasPendingImage && pendingImageFile) {
        try {
            const formData = new FormData();
            formData.append('image', pendingImageFile);

            const res = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            imageFilename = data.filename;
            imageDesc = data.description;

            // 更新用户消息，添加图片信息
            if (userMessageEl) {
                const bubbleEl = userMessageEl.querySelector('.bubble');
                if (bubbleEl) {
                    let finalMessage = message;
                    if (imageFilename && imageDesc) {
                        finalMessage = message + (message ? '\n' : '') +
                            `![图片](/data/images/${imageFilename})\n` +
                            `[图片内容: ${imageDesc}]`;
                    } else if (imageDesc) {
                        finalMessage = message + (message ? '\n' : '') +
                            `[图片内容: ${imageDesc}]`;
                    }
                    // 如果有图片预览，保留它
                    let imageHtml = '';
                    if (pendingImageDataUrl) {
                        imageHtml = `<img src="${pendingImageDataUrl}" style="max-width: 100%; border-radius: 8px; margin-bottom: 10px; border: 2px solid var(--border-dark);">`;
                    }
                    bubbleEl.innerHTML = imageHtml + escapeHtml(finalMessage);
                }
            }
        } catch (err) {
            console.error('图片上传失败:', err);
            imageDesc = '[图片识别失败]';
        }
    }

    try {
        const res = await fetch('/api/chats/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: state.currentChat.type,
                target: state.currentChat.target,
                message: message,
                image_description: imageDesc,
                image_filename: imageFilename,
                filename: state.currentChat.filename,
                is_new: state.currentChat.isNew,
                characters: state.currentChat.characters
            })
        });

        const data = await res.json();

        if (state.currentChat.isNew) {
            state.currentChat.filename = data.filename;
            state.currentChat.isNew = false;
        }

        if (data.replies) {
            data.replies.forEach(r => appendMessage(r.sender, r.content));
        }
    } catch (err) {
        console.error('发送消息失败:', err);
        appendSystemMessage('消息发送失败，请重试');
    }
}

// 追加系统消息
function appendSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'message system-msg';
    div.style.textAlign = 'center';
    div.style.color = '#999';
    div.style.fontSize = '12px';
    div.style.margin = '10px 0';
    div.textContent = text;
    elements.messagesContainer.appendChild(div);
    scrollToBottom();
}

// 追加消息
function appendMessage(sender, content, imageDataUrl = null) {
    const isUser = sender === '你';
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'ai'}`;

    // 格式化消息内容，支持图片显示
    let formattedContent = formatMessage(content);

    // 如果有图片dataUrl，在消息开头显示图片
    let imageHtml = '';
    if (imageDataUrl) {
        imageHtml = `<img src="${imageDataUrl}" style="max-width: 100%; border-radius: 8px; margin-bottom: 10px; border: 2px solid var(--border-dark);">`;
    }

    div.innerHTML = `
        <div class="sender">${sender}</div>
        <div class="bubble">${imageHtml}${formattedContent}</div>
    `;
    elements.messagesContainer.appendChild(div);
    scrollToBottom();
}

// 滚动到底部
function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

// HTML 转义
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 初始化模态框事件
function initModalEvents() {
    // 提示框 - 确定按钮
    const alertOkBtn = document.getElementById('alert-ok-btn');
    const alertModal = document.getElementById('alert-modal');
    if (alertOkBtn && alertModal) {
        alertOkBtn.addEventListener('click', () => {
            alertModal.classList.remove('show');
            if (state.alertCallback) {
                state.alertCallback();
                state.alertCallback = null;
            }
        });
        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) {
                alertModal.classList.remove('show');
                if (state.alertCallback) {
                    state.alertCallback();
                    state.alertCallback = null;
                }
            }
        });
    }

    // 确认框 - 按钮
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmOkBtn && confirmCancelBtn && confirmModal) {
        confirmOkBtn.addEventListener('click', () => {
            confirmModal.classList.remove('show');
            if (state.confirmPromiseResolve) {
                state.confirmPromiseResolve(true);
                state.confirmPromiseResolve = null;
            }
        });
        confirmCancelBtn.addEventListener('click', () => {
            confirmModal.classList.remove('show');
            if (state.confirmPromiseResolve) {
                state.confirmPromiseResolve(false);
                state.confirmPromiseResolve = null;
            }
        });
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.classList.remove('show');
                if (state.confirmPromiseResolve) {
                    state.confirmPromiseResolve(false);
                    state.confirmPromiseResolve = null;
                }
            }
        });
    }
}

// 显示提示对话框
function showAlertModal(message) {
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');

    if (!alertModal || !alertMessage) {
        alert(message);
        return;
    }

    alertMessage.textContent = message;
    alertModal.classList.add('show');
}

// 显示确认对话框
function showConfirmModal(message) {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById('confirm-modal');
        const confirmMessage = document.getElementById('confirm-message');

        if (!confirmModal || !confirmMessage) {
            resolve(confirm(message));
            return;
        }

        confirmMessage.textContent = message;
        confirmModal.classList.add('show');
        state.confirmPromiseResolve = resolve;
    });
}

// 等待 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 已加载完成');
    init();
});
