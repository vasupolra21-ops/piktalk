// Initialize Socket.io with error handling
let socket;
try {
    socket = io({
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
    });
} catch (e) {
    console.error("Socket.io initialization failed:", e);
}

// DOM Elements
let homeView, chatView, createRoomBtn, nicknameModal, nicknameInput, joinChatBtn, roomDisplayId, onlineStatus, messagesContainer, messageInput, sendBtn, inviteBtn, shareSection, roomLinkInput, copyBtn, leaveBtn, msgSound, emojiBtn, themeToggle, homeThemeToggle, attachBtn, imgInput, joinRoomInput, joinRoomBtn, emojiPicker, profilePicInput, avatarPreviewContainer, avatarPreviewImg, avatarPreviewIcon;

function initDOMElements() {
    homeView = document.getElementById('home-view');
    chatView = document.getElementById('chat-view');
    createRoomBtn = document.getElementById('create-room-btn');
    nicknameModal = document.getElementById('nickname-modal');
    nicknameInput = document.getElementById('nickname-input');
    joinChatBtn = document.getElementById('join-chat-btn');
    roomDisplayId = document.getElementById('room-display-id');
    onlineStatus = document.getElementById('online-status');
    messagesContainer = document.getElementById('messages-container');
    messageInput = document.getElementById('message-input');
    sendBtn = document.getElementById('send-btn');
    inviteBtn = document.getElementById('invite-btn');
    shareSection = document.getElementById('share-section');
    roomLinkInput = document.getElementById('room-link');
    copyBtn = document.getElementById('copy-btn');
    leaveBtn = document.getElementById('leave-btn');
    msgSound = document.getElementById('msg-sound');
    emojiBtn = document.getElementById('emoji-btn');
    themeToggle = document.getElementById('theme-toggle');
    homeThemeToggle = document.getElementById('home-theme-toggle');
    attachBtn = document.getElementById('attach-btn');
    imgInput = document.getElementById('image-input');
    joinRoomInput = document.getElementById('join-room-input');
    joinRoomBtn = document.getElementById('join-room-btn');
    emojiPicker = document.getElementById('emoji-picker');
    profilePicInput = document.getElementById('profile-pic-input');
    avatarPreviewContainer = document.getElementById('avatar-preview-container');
    avatarPreviewImg = document.getElementById('avatar-preview-img');
    avatarPreviewIcon = avatarPreviewContainer ? avatarPreviewContainer.querySelector('i') : null;
}

// State
let currentRoomID = null;
let myNickname = null;
let myProfilePic = null;
let serverIP = null;
let serverPort = null;

const EMOJI_CATEGORIES = {
    "Smileys": ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃'],
    "Body": ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'],
    "Animals": ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🧪'],
    "Nature": ['🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐️', '🌟', '✨', '⚡️', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅️', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄️', '🌬️', '💨', '💧', '💦', '☔️', '🌊'],
    "Food": ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🥯', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🍜', '🍝', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕️', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥢', '🧂'],
    "Activities": ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '⛸️', '🎿', '🛷', '🥌', '🎯', '🪀', '🪄', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '♠️', '♥️', '♦️', '♣️', '♟️', '🎭', '🎨', '🧵', '🧶', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎬'],
    "Travel": ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🚏', '🛣️', '🛤️', '⛽️', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓️', '⛵️', '🛶', '🚤', '🛳️', '⛴️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🎆', '🎇', '🎑', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲️', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺️', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏦', '🏥', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪️', '🕌', '🕍', '🕋', '⛩️'],
    "Objects": ['⌚️', '📱', '📲', '💻', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪠', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🧬', '🦠', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🖼️', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📧', '📨', '📤', '📥', '📦', '🏷️', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'],
    "Symbols": ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🏙️', '📶', '⏺', '⏹', '⏏', '⏯', '⏮', '⏭', '◀️', '▶️', '🔼', '🔽', '⏫', '⏬', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '⤴️', '⤵️', '🔄', '🔁', '🔂', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾', '💲', '💱', '™️', '©️', '®️', '👁‍🗨', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿', '✔️', '☑️', '🔘', '⚪️', '⚫️', '🔴', '🔵', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾️', '◽️', '◼️', '◻️', '🟥', '🟦', '🟧', '🟨', '🟩', '🟪', '🟫', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞', '⭐️', '🌟', '🌠', '☁️', '⛅️', '⛈', '🌤', '🌥', '🌦', '🌧', '🌨', '🌩', '🌪', '🌫', '🌬', '🌈', '🌅', '🌆', '🌇', '🌃', '🌉', '🌁']
};

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    
    const path = window.location.pathname;
    if (path.startsWith('/chat/')) {
        currentRoomID = path.split('/chat/')[1];
        showNicknameModal();
    } else {
        showHome();
    }

    // Populate Emoji Categories
    if (emojiPicker) {
        renderEmojiPicker();
    }

    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const icon = '<i class="fas fa-sun"></i>';
        if (themeToggle) themeToggle.innerHTML = icon;
        if (homeThemeToggle) homeThemeToggle.innerHTML = icon;
    }

    setupEventListeners();
});

function renderEmojiPicker() {
    if (!emojiPicker) return;
    
    emojiPicker.innerHTML = `
        <div class="emoji-tabs" style="display: flex; overflow-x: auto; padding: 10px; background: rgba(0,0,0,0.2);">
            <button data-cat="Smileys" class="active">😊</button>
            <button data-cat="Body">👍</button>
            <button data-cat="Animals">🐶</button>
            <button data-cat="Food">🍕</button>
            <button data-cat="Travel">🚗</button>
            <button data-cat="Objects">💡</button>
            <button data-cat="Symbols">❤️</button>
        </div>
        <div id="emoji-list-container" class="emoji-grid" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(5, 1fr); padding: 10px;"></div>
    `;

    const container = document.getElementById('emoji-list-container');
    const tabs = emojiPicker.querySelectorAll('.emoji-tabs button');
    
    if (!container) {
        console.error("Emoji container not found!");
        return;
    }

    function loadCategory(catName) {
        container.innerHTML = '';
        EMOJI_CATEGORIES[catName].forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.addEventListener('click', () => {
                if (messageInput.value.trim() === '') {
                    socket.emit('send-message', {
                        roomID: currentRoomID,
                        message: emoji,
                        nickname: myNickname,
                        profilePic: myProfilePic
                    });
                } else {
                    messageInput.value += emoji;
                    messageInput.focus();
                }
                emojiPicker.classList.add('hidden');
            });
            container.appendChild(span);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadCategory(tab.dataset.cat);
        });
    });

    // Initial load
    loadCategory("Smileys");
}

function setupEventListeners() {
    if (createRoomBtn) createRoomBtn.addEventListener('click', () => {
        const roomID = Math.random().toString(36).substring(2, 9);
        window.history.pushState({}, '', `/chat/${roomID}`);
        currentRoomID = roomID;
        showNicknameModal();
    });

    if (joinRoomBtn) joinRoomBtn.addEventListener('click', () => {
        const roomID = joinRoomInput.value.trim();
        if (roomID) {
            window.history.pushState({}, '', `/chat/${roomID}`);
            currentRoomID = roomID;
            showNicknameModal();
        }
    });

    if (joinChatBtn) joinChatBtn.addEventListener('click', () => {
        const nick = nicknameInput.value.trim();
        if (nick) {
            myNickname = nick;
            showChat();
            socket.emit('join-room', { roomID: currentRoomID, nickname: myNickname, profilePic: myProfilePic });
        }
    });

    if (inviteBtn) inviteBtn.addEventListener('click', () => {
        if (shareSection) shareSection.classList.toggle('hidden');
    });

    if (copyBtn) copyBtn.addEventListener('click', () => {
        roomLinkInput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });

    if (leaveBtn) leaveBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    if (emojiBtn) emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.classList.add('hidden');
        }
    });

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (homeThemeToggle) homeThemeToggle.addEventListener('click', toggleTheme);
    
    // Rely on standard HTML label behavior for better mobile compatibility

    if (profilePicInput) profilePicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.size < 10000000) { // Support up to 10MB raw photos before compression
            const reader = new FileReader();
            reader.onload = (event) => {
                // Compress avatar to small size (120x120) for fast room joins
                compressImage(event.target.result, 120, 120, 0.8, (compressedBase64) => {
                    myProfilePic = compressedBase64;
                    avatarPreviewImg.src = myProfilePic;
                    avatarPreviewImg.classList.remove('hidden');
                    avatarPreviewImg.style.objectFit = 'cover';
                    if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
                });
            };
            reader.readAsDataURL(file);
        } else if (file) alert('Profile picture too large (Max 10MB before compression)');
    });

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    if (attachBtn) attachBtn.addEventListener('click', () => imgInput.click());
    if (imgInput) imgInput.addEventListener('change', () => {
        const file = imgInput.files[0];
        if (file && file.size < 50000000) { // Support up to 50MB photos
            const reader = new FileReader();
            reader.onload = (e) => {
                // Compress image to max 1600px width/height at 75% quality
                compressImage(e.target.result, 1600, 1600, 0.75, (compressedBase64) => {
                    socket.emit('send-message', {
                        roomID: currentRoomID,
                        message: '',
                        image: compressedBase64,
                        nickname: myNickname,
                        profilePic: myProfilePic
                    });
                });
            };
            reader.readAsDataURL(file);
        } else if (file) alert('Image too large (Max 50MB)');
    });
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    const icon = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    if (themeToggle) themeToggle.innerHTML = icon;
    if (homeThemeToggle) homeThemeToggle.innerHTML = icon;
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function showHome() {
    [homeView, chatView, nicknameModal].forEach(v => { if (v) v.classList.remove('active'); });
    if (homeView) homeView.classList.add('active');
}

function showChat() {
    [homeView, chatView, nicknameModal].forEach(v => { if (v) v.classList.remove('active'); });
    if (chatView) chatView.classList.add('active');
    if (roomDisplayId) roomDisplayId.textContent = `Room: ${currentRoomID}`;
    
    let shareUrl = window.location.href;
    if (window.location.hostname === 'localhost' && serverIP) {
        shareUrl = `http://${serverIP}:${serverPort}/chat/${currentRoomID}`;
    }
    if (roomLinkInput) roomLinkInput.value = shareUrl;
    if (onlineStatus) {
        onlineStatus.textContent = 'Online';
        onlineStatus.style.color = 'var(--accent)';
    }
}

function showNicknameModal() {
    if (nicknameModal) nicknameModal.classList.add('active');
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentRoomID) {
        socket.emit('send-message', {
            roomID: currentRoomID,
            message: text,
            nickname: myNickname,
            profilePic: myProfilePic
        });
        messageInput.value = '';
    }
}

// Socket Events
if (socket) {
    socket.on('receive-message', (data) => {
        appendMessage(data, data.id === socket.id);
        if (msgSound) msgSound.play().catch(() => {});
    });

    socket.on('system-message', (data) => {
        appendSystemMessage(data.message);
    });

    socket.on('ip-info', (data) => {
        serverIP = data.ip;
        serverPort = data.port;
    });
}

function appendMessage(data, isSentByMe) {
    if (!messagesContainer) return;
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    if (isSentByMe) msgDiv.classList.add('sent');
    
    const color = isSentByMe ? '#fff' : getNicknameColor(data.nickname);
    const avatar = isSentByMe ? '' : getAvatar(data.nickname, data.profilePic);
    
    let content = `<div class="bubble">${data.message}</div>`;
    if (data.image) content = `<div class="bubble"><img src="${data.image}" class="message-image"></div>`;
    
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    msgDiv.innerHTML = `
        <div class="message-info">
            <span class="user-name" style="color: ${color}">${isSentByMe ? 'You' : data.nickname}</span>
            <span class="timestamp">${timeStr}</span>
        </div>
        <div class="message-content">
            ${avatar}
            ${content}
        </div>
    `;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendSystemMessage(text) {
    if (!messagesContainer) return;
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('system-message');
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getNicknameColor(name) {
    if (!name) return '#ccc';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
}

function getAvatar(name, profilePic) {
    if (profilePic) return `<div class="avatar"><img src="${profilePic}"></div>`;
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return `<div class="avatar" style="background: ${getNicknameColor(name)}">${initial}</div>`;
}

function compressImage(base64Str, maxWidth, maxHeight, quality, callback) {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        callback(compressedBase64);
    };
    img.onerror = (err) => {
        console.error("Image loading failed for compression:", err);
        callback(base64Str);
    };
}
