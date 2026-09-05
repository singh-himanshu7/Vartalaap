/**
 * Vartalaap Application Controller & UI Logic
 * Coral & Peach Dashboard - Real-time rooms & WebSocket integration
 */

// Application State
window.currentUser = '';
window.currentRoomId = '';

// Load recent user joined rooms from localStorage (No demo/mock chats)
let conversations = loadSavedConversations();

function loadSavedConversations() {
    try {
        const stored = localStorage.getItem('vartalaap_joined_rooms');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error loading rooms from localStorage:", e);
        return [];
    }
}

function saveConversationsToStorage() {
    try {
        localStorage.setItem('vartalaap_joined_rooms', JSON.stringify(conversations));
    } catch (e) {
        console.error("Error saving rooms to localStorage:", e);
    }
}

// DOM Elements
const modalOverlay = document.getElementById('modal-overlay');
const chatDashboard = document.getElementById('chat-dashboard');
const joinRoomForm = document.getElementById('join-room-form');
const createRoomForm = document.getElementById('create-room-form');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const conversationListContainer = document.getElementById('conversation-list');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Render recent rooms sidebar
    renderConversationList();

    // Initialize interactive Emoji Picker
    initEmojiPicker();

    // Check if URL parameters have room ID for direct link joining
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        document.getElementById('join-room-id').value = roomParam;
    }

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        const picker = document.getElementById('emoji-picker');
        const wrapper = document.querySelector('.emoji-picker-wrapper');
        if (picker && !picker.classList.contains('hidden') && wrapper && !wrapper.contains(e.target)) {
            picker.classList.add('hidden');
        }
    });
});

/**
 * Switch tabs in the welcome modal
 */
function switchTab(tab) {
    const joinBtn = document.getElementById('tab-join-btn');
    const createBtn = document.getElementById('tab-create-btn');

    if (tab === 'join') {
        joinBtn.classList.add('active');
        createBtn.classList.remove('active');
        joinRoomForm.classList.add('active');
        createRoomForm.classList.remove('active');
    } else {
        createBtn.classList.add('active');
        joinBtn.classList.remove('active');
        createRoomForm.classList.add('active');
        joinRoomForm.classList.remove('active');
    }
}

/**
 * Open Modal to Join or Create Room
 */
function openJoinModal() {
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
        if (window.currentUser) {
            closeBtn.classList.remove('hidden');
        } else {
            closeBtn.classList.add('hidden');
        }
    }
    modalOverlay.classList.remove('hidden');
}

/**
 * Close Modal Overlay
 */
function closeJoinModal() {
    if (window.currentUser) {
        modalOverlay.classList.add('hidden');
    } else {
        showToast("Please enter nickname and join a room first", "info");
    }
}

/**
 * Handle backdrop click outside modal card
 */
function handleOverlayClick(e) {
    if (e.target === modalOverlay && window.currentUser) {
        closeJoinModal();
    }
}

/**
 * Open Settings Toast / Modal
 */
function openSettingsModal() {
    showToast('Settings & Preferences coming soon!', 'info');
}

/**
 * Helper to generate random room IDs without submitting the form
 */
function generateRandomRoomId(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const prefixes = ['chat', 'lounge', 'dev', 'cafe', 'nexus', 'room'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `${randomPrefix}-${randomNum}`;
    document.getElementById('create-room-id').value = generatedId;
    showToast(`Generated Room ID: ${generatedId}`, 'info');
}

/**
 * Create a new room via Backend REST API
 */
async function handleCreateRoom(e) {
    e.preventDefault();
    const username = document.getElementById('create-username').value.trim();
    const roomId = document.getElementById('create-room-id').value.trim();

    if (!username || !roomId) {
        showToast("Please enter both Nickname and Room ID", "error");
        return;
    }

    const submitBtn = document.getElementById('create-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Creating...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/v1/room`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: roomId
        });

        if (response.ok || response.status === 201) {
            showToast("Room created successfully!", "success");
            enterChatDashboard(username, roomId);
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg || "Room already exists or invalid ID", "error");
        }
    } catch (err) {
        console.error("Create room error:", err);
        showToast("Cannot connect to server. Is Spring Boot running on 8080?", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Create & Join Room</span> <i class="fa-solid fa-sparkles"></i>`;
    }
}

/**
 * Join an existing room via Backend REST API
 */
async function handleJoinRoom(e) {
    e.preventDefault();
    const username = document.getElementById('join-username').value.trim();
    const roomId = document.getElementById('join-room-id').value.trim();

    if (!username || !roomId) {
        showToast("Please enter both Nickname and Room ID", "error");
        return;
    }

    const submitBtn = document.getElementById('join-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Joining...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/v1/room/${encodeURIComponent(roomId)}`);

        if (response.ok) {
            showToast(`Joined room "${roomId}"`, "success");
            enterChatDashboard(username, roomId);
        } else {
            showToast(`Room "${roomId}" not found. Create it first!`, "error");
        }
    } catch (err) {
        console.error("Join room error:", err);
        showToast("Cannot connect to server. Is Spring Boot running on 8080?", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Enter Room</span> <i class="fa-solid fa-arrow-right"></i>`;
    }
}

/**
 * Transition from Modal to Chat Dashboard
 */
function enterChatDashboard(username, roomId) {
    window.currentUser = username;
    window.currentRoomId = roomId;

    // Set Rail Profile Avatar Initials
    const initial = username.charAt(0).toUpperCase();
    document.getElementById('rail-avatar-initials').innerText = initial;

    // Add or update room in conversations list
    let existing = conversations.find(c => c.id.toLowerCase() === roomId.toLowerCase());
    if (!existing) {
        existing = {
            id: roomId,
            name: formatRoomName(roomId),
            snippet: 'Joined chat room',
            time: getCurrentFormattedTime(),
            unread: 0
        };
        conversations.unshift(existing);
    } else {
        existing.time = getCurrentFormattedTime();
    }

    saveConversationsToStorage();
    renderConversationList();

    // Update UI headers
    document.getElementById('current-room-name').innerText = existing.name || roomId;

    // Hide Modal, Show Dashboard
    modalOverlay.classList.add('hidden');
    chatDashboard.classList.remove('hidden');

    // Load past message history from backend
    loadMessageHistory(roomId);

    // Connect WebSocket
    connectWebSocket(roomId, handleIncomingMessage, updateStatusBadge);
}

/**
 * Format raw room ID into pretty name
 */
function formatRoomName(id) {
    if (!id) return '';
    if (!id.includes('-') && !id.includes('_')) {
        return id.charAt(0).toUpperCase() + id.slice(1);
    }
    return id.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Get formatted current time (e.g. 10:32)
 */
function getCurrentFormattedTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Render the conversation list in middle sidebar
 */
function renderConversationList() {
    if (!conversationListContainer) return;
    conversationListContainer.innerHTML = '';

    if (!conversations || conversations.length === 0) {
        conversationListContainer.innerHTML = `
            <div class="empty-sidebar">
                <i class="fa-solid fa-comments"></i>
                <p>No recent rooms</p>
                <button class="join-first-room-btn" type="button" onclick="openJoinModal()">+ Join or Create Room</button>
            </div>
        `;
        return;
    }

    conversations.forEach(item => {
        const isActive = item.id.toLowerCase() === (window.currentRoomId || '').toLowerCase();
        const convEl = document.createElement('div');
        convEl.className = `conversation-item ${isActive ? 'active' : ''}`;
        convEl.onclick = () => switchActiveConversation(item);

        const avatarHtml = getInitialsBadge(item.name);

        convEl.innerHTML = `
            <div class="item-avatar">${avatarHtml}</div>
            <div class="item-details">
                <div class="item-top-row">
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <span class="item-time">${escapeHtml(item.time || '')}</span>
                </div>
                <div class="item-bottom-row">
                    <span class="item-snippet">${escapeHtml(item.snippet || 'Active room')}</span>
                    ${item.unread > 0 ? `<span class="unread-badge">${item.unread}</span>` : ''}
                </div>
            </div>
        `;

        conversationListContainer.appendChild(convEl);
    });
}

/**
 * Switch Active Conversation
 */
function switchActiveConversation(item) {
    item.unread = 0;
    saveConversationsToStorage();
    
    if (window.currentUser) {
        enterChatDashboard(window.currentUser, item.id);
    } else {
        document.getElementById('join-room-id').value = item.id;
        openJoinModal();
    }
}

/**
 * Filter Conversations search
 */
function filterConversations() {
    const query = document.getElementById('search-conversations').value.toLowerCase();
    const items = conversationListContainer.querySelectorAll('.conversation-item');
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
    });
}

/**
 * Fetch past message history from REST endpoint
 */
async function loadMessageHistory(roomId) {
    try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/v1/room/${encodeURIComponent(roomId)}/messages?page=0&size=50`);
        
        clearMessagesUI();

        if (response.ok) {
            const messages = await response.json();
            
            if (messages && messages.length > 0) {
                messages.forEach(msg => appendMessageToUI(msg));
            } else {
                showEmptyStateUI(roomId);
            }
        } else {
            showEmptyStateUI(roomId);
        }
    } catch (err) {
        console.error("Error loading message history:", err);
        clearMessagesUI();
        showEmptyStateUI(roomId);
    }
}

/**
 * Render empty chat state when room has no messages
 */
function showEmptyStateUI(roomId) {
    const roomDisplayName = formatRoomName(roomId);
    messagesContainer.innerHTML = `
        <div id="empty-state" class="empty-state">
            <div class="empty-icon">
                <i class="fa-regular fa-comments"></i>
            </div>
            <h3>Welcome to ${escapeHtml(roomDisplayName)}!</h3>
            <p>This is the beginning of real-time messages in this room. Say hello!</p>
        </div>
    `;
}

/**
 * Send message triggered by input form submission
 */
function handleSendMessage(e) {
    e.preventDefault();
    const content = messageInput.value.trim();

    if (!content) return;

    if (!window.currentUser) {
        showToast("Please join a room with your nickname first!", "error");
        openJoinModal();
        return;
    }

    const sent = sendStompMessage(window.currentRoomId, window.currentUser, content);
    if (sent) {
        // Update local room snippet
        updateRoomSnippet(window.currentRoomId, content);

        messageInput.value = '';
        messageInput.focus();
    } else {
        // Local echo fallback if server offline
        appendMessageToUI({
            sender: window.currentUser,
            content: content,
            timeStamp: new Date().toISOString()
        });
        updateRoomSnippet(window.currentRoomId, content);
        messageInput.value = '';
    }
}

/**
 * Process new message incoming from WebSocket broadcast
 */
function handleIncomingMessage(message) {
    appendMessageToUI(message);
    updateRoomSnippet(window.currentRoomId, message.content);
}

/**
 * Update room snippet in sidebar & localStorage
 */
function updateRoomSnippet(roomId, snippetText) {
    const activeConv = conversations.find(c => c.id.toLowerCase() === roomId.toLowerCase());
    if (activeConv) {
        activeConv.snippet = snippetText;
        activeConv.time = getCurrentFormattedTime();
        saveConversationsToStorage();
        renderConversationList();
    }
}

/**
 * Clear existing messages container
 */
function clearMessagesUI() {
    messagesContainer.innerHTML = '';
}

/**
 * Render a single message bubble into the chat body matching reference UI
 */
function appendMessageToUI(message) {
    // Hide empty state if visible
    const curEmptyState = document.getElementById('empty-state');
    if (curEmptyState) {
        curEmptyState.remove();
    }

    const isSentByMe = message.sender === window.currentUser;
    
    const messageItem = document.createElement('div');
    messageItem.className = `message-item ${isSentByMe ? 'sent' : 'received'}`;

    // Format Timestamp
    let formattedTime = getCurrentFormattedTime();
    if (message.timeStamp) {
        try {
            const date = new Date(message.timeStamp);
            formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            formattedTime = message.timeStamp;
        }
    }

    const avatarHtml = getInitialsBadge(message.sender);

    messageItem.innerHTML = `
        <div class="msg-avatar">${avatarHtml}</div>
        <div class="msg-content-block">
            <span class="msg-sender-name">${escapeHtml(message.sender)}</span>
            <div class="msg-bubble-row">
                <div class="msg-bubble">${escapeHtml(message.content)}</div>
                <span class="msg-time">${formattedTime}</span>
            </div>
        </div>
    `;

    messagesContainer.appendChild(messageItem);
    scrollToBottom();
}

/**
 * Generate Avatar Badge Initials
 */
function getInitialsBadge(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    let initials = parts[0].charAt(0).toUpperCase();
    if (parts.length > 1) {
        initials += parts[parts.length - 1].charAt(0).toUpperCase();
    }
    return initials;
}

/**
 * Auto-scroll chat area to bottom on new message
 */
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Update connection status badge UI
 */
function updateStatusBadge(status) {
    if (!statusBadge) return;
    statusBadge.className = 'rail-status';
    if (status === 'CONNECTED') {
        statusBadge.classList.add('status-connected');
        statusText.innerText = 'Connected';
    } else if (status === 'CONNECTING') {
        statusBadge.classList.add('status-connecting');
        statusText.innerText = 'Connecting...';
    } else {
        statusBadge.classList.add('status-disconnected');
        statusText.innerText = 'Disconnected';
    }
}

/**
 * Leave Room & return to login modal
 */
function leaveRoom() {
    disconnectWebSocket();
    window.currentRoomId = '';

    chatDashboard.classList.add('hidden');
    modalOverlay.classList.remove('hidden');
    showToast("Left room", "info");
}

/**
 * Copy room ID to clipboard
 */
function copyRoomId() {
    if (!window.currentRoomId) return;
    navigator.clipboard.writeText(window.currentRoomId).then(() => {
        showToast(`Copied "${window.currentRoomId}" to clipboard!`, "success");
    }).catch(err => {
        console.error("Copy failed:", err);
    });
}

// Emoji Collection for Picker
const emojiList = [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😉','😊','😇','🥰','😍','🤩','😘','😗','😚',
    '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄',
    '😬','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠',
    '🥳','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😦','😧','📁','🔥','✨','🎉',
    '❤️','💙','💜','🖤','👍','👎','👏','🙌','🤝','🚀','💡','🏆','⭐','🎯','💯','🍕','☕','🍾'
];

/**
 * Initialize Emoji Picker Popover Grid
 */
function initEmojiPicker() {
    const grid = document.getElementById('emoji-grid');
    if (!grid) return;
    grid.innerHTML = '';

    emojiList.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'emoji-item';
        span.innerText = emoji;
        span.onclick = (e) => {
            e.stopPropagation();
            insertEmojiChar(emoji);
        };
        grid.appendChild(span);
    });
}

/**
 * Toggle Emoji Picker Popover Visibility
 */
function toggleEmojiPicker(e) {
    if (e) e.stopPropagation();
    const picker = document.getElementById('emoji-picker');
    if (picker) {
        picker.classList.toggle('hidden');
    }
}

/**
 * Insert chosen emoji character into message input field at cursor location
 */
function insertEmojiChar(emoji) {
    if (!messageInput) return;
    const start = messageInput.selectionStart || messageInput.value.length;
    const end = messageInput.selectionEnd || messageInput.value.length;
    const text = messageInput.value;

    messageInput.value = text.substring(0, start) + emoji + text.substring(end);
    messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
    messageInput.focus();
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
