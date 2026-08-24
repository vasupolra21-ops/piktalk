// Initialize Socket.io – websocket-first for fastest connection
let socket;
try {
    socket = io({
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 8000,
        reconnectionDelay: 300
    });
} catch (e) {
    console.error("Socket.io initialization failed:", e);
}

// DOM Elements
let homeView, chatView, createRoomBtn, nicknameModal, nicknameInput, joinChatBtn, roomDisplayId, onlineStatus, messagesContainer, messageInput, sendBtn, inviteBtn, shareSection, roomLinkInput, copyBtn, leaveBtn, msgSound, emojiBtn, themeToggle, homeThemeToggle, attachBtn, imgInput, joinRoomInput, joinRoomBtn, emojiPicker, profilePicInput, avatarPreviewContainer, avatarPreviewImg, avatarPreviewIcon;
let micBtn, voiceRecordingBar, cancelRecordingBtn, recordingTimerEl, audioPreviewBar, discardAudioBtn, playPreviewBtn, audioProgressBar, audioPreviewDuration, sendAudioBtn;

// Settings DOM Elements
let settingsBtn, settingsModal, settingsCloseBtn, settingsNickname, settingsBioStatus, settingsRemoveFaceBtn, settingsRegisterFaceBtn;
let settingsScanContainer, settingsVideo, settingsCanvas, settingsScanStatus, settingsScanDemoBtn;
let settingsNicknameForm, settingsNicknameInput, settingsSaveNameBtn;

// Face ID Modal DOM Elements
let faceScanSection, profileSetupSection, faceVideo, faceCanvas, faceStatus, faceDetail, faceDemoBtn;

// Start loading AI models in background immediately
loadFaceModels();

// Custom Room & Password DOM Elements
let createRoomModal, createRoomIdInput, createRoomPasswordInput, confirmCreateRoomBtn, cancelCreateRoomBtn, createRoomError, toggleCreatePasswordBtn;
let passwordModal, joinRoomPasswordInput, submitPasswordBtn, cancelPasswordBtn, joinPasswordError, toggleJoinPasswordBtn;
let roomNotFoundModal, roomNotFoundHomeBtn;
let sharePasswordArea, sharePasswordInput, copyPasswordBtn;

// Reactions + Reply state
const msgReactions = {};   // msgId → { emoji → Map<socketId, nickname> }
let replyingTo = null;     // { msgId, nickname, preview } or null
let replyBarEl = null;     // the reply preview bar DOM element
let globalFullEmojiPanel = null;
let currentReactionMsgId = null;
let currentRoomUsersCount = 0;

// AI Smart Reply variables
let aiBtn, aiRepliesBar, aiRepliesList, closeAiBtn;
const chatHistory = [];
let currentAISuggestions = [];
let currentAISuggestionsIndex = 0;
let shownIndices = new Set();
let refreshAISuggestions = null;


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
    micBtn = document.getElementById('mic-btn');
    voiceRecordingBar = document.getElementById('voice-recording-bar');
    cancelRecordingBtn = document.getElementById('cancel-recording-btn');
    recordingTimerEl = document.getElementById('recording-timer');
    audioPreviewBar = document.getElementById('audio-preview-bar');
    discardAudioBtn = document.getElementById('discard-audio-btn');
    playPreviewBtn = document.getElementById('play-preview-btn');
    audioProgressBar = document.getElementById('audio-progress-bar');
    audioPreviewDuration = document.getElementById('audio-preview-duration');
    sendAudioBtn = document.getElementById('send-audio-btn');

    // AI smart reply element initializations
    aiBtn = document.getElementById('ai-btn');
    aiRepliesBar = document.getElementById('ai-replies-bar');
    aiRepliesList = document.getElementById('ai-replies-list');
    closeAiBtn = document.getElementById('close-ai-btn');

    // Room ID & Password Modal Elements
    createRoomModal = document.getElementById('create-room-modal');
    createRoomIdInput = document.getElementById('create-room-id-input');
    createRoomPasswordInput = document.getElementById('create-room-password-input');
    confirmCreateRoomBtn = document.getElementById('confirm-create-room-btn');
    cancelCreateRoomBtn = document.getElementById('cancel-create-room-btn');
    createRoomError = document.getElementById('create-room-error');
    toggleCreatePasswordBtn = document.getElementById('toggle-create-password');

    passwordModal = document.getElementById('password-modal');
    joinRoomPasswordInput = document.getElementById('join-room-password-input');
    submitPasswordBtn = document.getElementById('submit-password-btn');
    cancelPasswordBtn = document.getElementById('cancel-password-btn');
    joinPasswordError = document.getElementById('join-password-error');
    toggleJoinPasswordBtn = document.getElementById('toggle-join-password');

    roomNotFoundModal = document.getElementById('room-not-found-modal');
    roomNotFoundHomeBtn = document.getElementById('room-not-found-home-btn');

    // Share password inputs
    sharePasswordArea = document.getElementById('share-password-area');
    sharePasswordInput = document.getElementById('share-password-input');
    copyPasswordBtn = document.getElementById('copy-password-btn');

    // Settings DOM Elements
    settingsBtn = document.getElementById('settings-btn');
    settingsModal = document.getElementById('settings-modal');
    settingsCloseBtn = document.getElementById('settings-close-btn');
    settingsNickname = document.getElementById('settings-nickname');
    settingsBioStatus = document.getElementById('settings-bio-status');
    settingsRemoveFaceBtn = document.getElementById('settings-remove-face-btn');
    settingsRegisterFaceBtn = document.getElementById('settings-register-face-btn');
    settingsScanContainer = document.getElementById('settings-scan-container');
    settingsVideo = document.getElementById('settings-video');
    settingsCanvas = document.getElementById('settings-canvas');
    settingsScanStatus = document.getElementById('settings-scan-status');
    settingsScanDemoBtn = document.getElementById('settings-scan-demo-btn');
    settingsNicknameForm  = document.getElementById('settings-nickname-form');
    settingsNicknameInput = document.getElementById('settings-nickname-input');
    settingsSaveNameBtn   = document.getElementById('settings-save-name-btn');

    // Face ID Modal DOM Elements
    faceScanSection = document.getElementById('face-scan-section');
    profileSetupSection = document.getElementById('profile-setup-section');
    faceVideo = document.getElementById('face-video');
    faceCanvas = document.getElementById('face-canvas');
    faceStatus = document.getElementById('face-status');
    faceDetail = document.getElementById('face-detail');
    faceDemoBtn = document.getElementById('face-demo-btn');
}

// State
let currentRoomID = null;
let myNickname = null;
let myProfilePic = null;
let serverIP = null;
let serverPort = null;
let currentRoomPassword = null;
let amIAdmin = false; // true only for the room creator / current admin

// Persistent user identity — stored in sessionStorage (isolated per browser tab/window)
function getOrCreateUserId() {
    try {
        let uid = sessionStorage.getItem('piktalk_userId');
        if (!uid || uid === 'null' || uid === 'undefined') {
            // Check for persistent face identity from localStorage
            uid = localStorage.getItem('piktalk_face_userid');
        }
        if (!uid || uid === 'null' || uid === 'undefined') {
            uid = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem('piktalk_userId', uid);
        }
        return uid;
    } catch(e) {
        // Fallback if storage is blocked
        return 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }
}
let myUserId = getOrCreateUserId();

// Load this tab's saved profile directly from sessionStorage (no server needed).
// This is isolated per tab: opening a new tab to test will start with a fresh, empty profile.
// Returns localStorage key for this face's profile
function _profileKey() {
    const faceId = localStorage.getItem('piktalk_face_userid');
    return faceId ? `piktalk_profile_${faceId}` : 'piktalk_profile_guest';
}

function loadSavedProfile() {
    try {
        const raw = localStorage.getItem(_profileKey());
        if (!raw) return;
        const profile = JSON.parse(raw);
        if (!profile) return;
        // Restore profile picture preview
        if (profile.profilePic) {
            myProfilePic = profile.profilePic;
            if (avatarPreviewImg) {
                avatarPreviewImg.src = profile.profilePic;
                avatarPreviewImg.classList.remove('hidden');
                avatarPreviewImg.style.objectFit = 'cover';
            }
            if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
        }
        // NOTE: do NOT pre-fill nickname here — it is set only after face scan
        // identifies who this person is (in handleScanSuccess)
    } catch(e) {
        console.warn('Could not load saved profile from localStorage:', e);
    }
}

// Save this user's profile locally — keyed to their Face ID
function saveProfileLocally(nickname, profilePic) {
    try {
        localStorage.setItem(_profileKey(), JSON.stringify({ nickname, profilePic: profilePic || null }));

        const faceUserId = localStorage.getItem('piktalk_face_userid');
        if (faceUserId) {
            let descriptor = null;
            const descRaw = localStorage.getItem('piktalk_face_descriptor');
            if (descRaw) {
                try { descriptor = new Float32Array(JSON.parse(descRaw)); } catch(e) {}
            }
            if (!descriptor) {
                descriptor = loadFaceDescriptor(); // try loading from users list
            }

            // Update local users database list
            saveUserInDatabase(faceUserId, descriptor, nickname, profilePic);

            // Sync to server face registry for cross-device match
            if (descriptor) {
                _syncFaceToServer(faceUserId, descriptor, nickname, profilePic);
            }
        }
    } catch(e) {
        console.warn('Could not save profile to localStorage:', e);
    }
}

// Voice recording state
let mediaRecorder = null;
let audioChunks = [];
let recordingTimerInterval = null;
let recordingSeconds = 0;
let recordedAudioBlob = null;
let previewAudio = null;
let previewPlaying = false;

// Typing indicator state
let typingTimeout = null;
let isCurrentlyTyping = false;

const EMOJI_CATEGORIES = {
    "Smileys": ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃'],
    "Love": ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💋', '💌', '❤️‍🔥', '❤️‍🩹'],
    "Reactions": ['🔥', '✨', '⚡️', '💥', '💯', '👏', '🙌', '🎉', '🌟', '🚀', '👀', '💡', '🤔', '🤫', '🤣', '😂', '😅', '💩', '👍', '👎', '🥳', '😡', '😱', '🤡', '☠️', '💀', '👽', '👾'],
    "Fun": ['🎉', '🥳', '🎈', '🎊', '🎁', '🎂', '🎄', '🎆', '🎇', '🎑', '🎐', '🏮', '🎪', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎸', '🎺', '🎻', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸'],
    "Gestures": ['👍', '👎', '👌', '🤌', '🤙', '🤞', '✌️', '🤟', '🤘', '👈', '👉', '👆', '👇', '🖕', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '👋', '🤚', '🖐️', '✋', '🖖']
};

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    
    const path = window.location.pathname;
    if (path.startsWith('/chat/')) {
        currentRoomID = path.split('/chat/')[1];

        // ── Show connecting overlay instantly – don't wait for socket ──
        showConnectingOverlay(currentRoomID);

        const checkDirectRoom = () => {
            if (socket) {
                socket.emit('check-room', { roomID: currentRoomID });
            }
        };
        if (socket) {
            if (socket.connected) {
                checkDirectRoom();
            } else {
                socket.once('connect', checkDirectRoom);
                // Fallback: if socket takes > 6s, retry once
                setTimeout(() => {
                    if (socket && !socket.connected) {
                        socket.connect();
                    }
                }, 6000);
            }
        }
    } else {
        showHome();
    }

    // Populate Emoji Categories
    if (emojiPicker) {
        renderEmojiPicker();
    }

    // Load theme: use saved theme if set, otherwise detect OS system default mode
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    // Listen for OS system theme changes if user hasn't manually overridden it
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setupEventListeners();
    initLightbox();
    initCropModal();
    initMembersModal();
    initViewportHandler();
    initModalKeyboardHandler();
});

// ── Visual Viewport Handler ──
// Fixes the iOS/Android mobile keyboard issue:
// When keyboard opens, resize the app to the visible area so:
// - No white gap appears below the input bar
// ── Visual Viewport Modal Alignment Helper ──
// Positions active modals absolute relative to the visual viewport to prevent 
// them from getting pushed/scrolled out of view by the mobile keyboard.
function updateActiveModalViewport() {
    if (window.visualViewport) {
        const vv = window.visualViewport;
        const activeModal = document.querySelector('.modal.active');
        if (activeModal && activeModal.classList.contains('keyboard-active')) {
            activeModal.style.setProperty('position', 'absolute', 'important');
            activeModal.style.setProperty('top', `${vv.offsetTop}px`, 'important');
            activeModal.style.setProperty('left', `${vv.offsetLeft}px`, 'important');
            activeModal.style.setProperty('width', `${vv.width}px`, 'important');
            activeModal.style.setProperty('height', `${vv.height}px`, 'important');
        } else if (activeModal) {
            activeModal.style.removeProperty('position');
            activeModal.style.removeProperty('top');
            activeModal.style.removeProperty('left');
            activeModal.style.removeProperty('width');
            activeModal.style.removeProperty('height');
        }
    }
}

// Mobile keyboard handler for iOS/Android:
// - CSS baseline: #chat-view has height:100dvh (correct when no keyboard)
// - When keyboard opens: JS sets chatView.style.height = visualViewport.height
// - When keyboard closes: JS clears inline height so CSS 100dvh takes over
// We ONLY listen to visualViewport resize while the input is focused to avoid
// false positives from browser chrome (URL bar) showing/hiding.
function initViewportHandler() {
    const chatView = document.getElementById('chat-view');
    let vpResizeHandler = null;

    function applyKeyboardHeight() {
        if (!window.visualViewport || !chatView) return;
        const vv = window.visualViewport;
        const vh = vv.height;
        const top = vv.offsetTop || 0;

        // Set CSS variable on root and element with !important priority
        document.documentElement.style.setProperty('--viewport-height', vh + 'px');
        chatView.style.setProperty('height', vh + 'px', 'important');
        chatView.style.setProperty('top', top + 'px', 'important');

        // Scroll to bottom so latest message stays visible above keyboard
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        updateActiveModalViewport();
    }

    function clearKeyboardHeight() {
        document.documentElement.style.removeProperty('--viewport-height');
        if (!chatView) return;
        // Remove inline styles — CSS 100dvh takes back over
        chatView.style.removeProperty('height');
        chatView.style.removeProperty('top');
    }

    // Prevent iOS page scroll (it creates white gaps)
    window.addEventListener('scroll', () => {
        if (window.scrollY !== 0) window.scrollTo(0, 0);
        if (document.body.scrollTop !== 0) document.body.scrollTop = 0;
        if (document.documentElement.scrollTop !== 0) document.documentElement.scrollTop = 0;
    }, { passive: true });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('scroll', () => {
            if (window.scrollY !== 0 || document.body.scrollTop !== 0 || document.documentElement.scrollTop !== 0) {
                window.scrollTo(0, 0);
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            }
            updateActiveModalViewport();
        });
    }

    if (messageInput) {
        messageInput.addEventListener('focus', () => {
            document.body.classList.add('keyboard-active');
            // Start listening to viewport resize ONLY while keyboard is open
            if (window.visualViewport && !vpResizeHandler) {
                vpResizeHandler = applyKeyboardHeight;
                window.visualViewport.addEventListener('resize', vpResizeHandler);
            }
            // Staggered calls to catch Safari's slow keyboard animation (300-400ms)
            setTimeout(applyKeyboardHeight, 100);
            setTimeout(applyKeyboardHeight, 300);
            setTimeout(applyKeyboardHeight, 500);
        });

        messageInput.addEventListener('blur', () => {
            document.body.classList.remove('keyboard-active');
            // Stop listening to viewport resize — prevent false positives from chrome changes
            if (window.visualViewport && vpResizeHandler) {
                window.visualViewport.removeEventListener('resize', vpResizeHandler);
                vpResizeHandler = null;
            }
            // Restore CSS 100dvh after keyboard dismisses
            setTimeout(clearKeyboardHeight, 100);
            setTimeout(clearKeyboardHeight, 300);
        });
    }
}


// ── Modal Keyboard Handler ──
// When any input inside a modal is focused on mobile, shrinks margins/padding
// to ensure the card fits perfectly inside the visual viewport.
function initModalKeyboardHandler() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const inputs = modal.querySelectorAll('input');
        let blurTimeout = null;
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (blurTimeout) {
                    clearTimeout(blurTimeout);
                    blurTimeout = null;
                }
                modal.classList.add('keyboard-active');
                updateActiveModalViewport();
            });
            
            input.addEventListener('blur', () => {
                blurTimeout = setTimeout(() => {
                    modal.classList.remove('keyboard-active');
                    updateActiveModalViewport();
                }, 100);
            });
        });
    });
}

// ── Manage Focusable Inputs State ──
// Dynamically enables/disables inputs depending on the active view.
// This ensures iOS Safari's Form Assistant knows there is only exactly ONE focusable
// input on the page at any time, which hides/disables the navigation arrows (^ v) and Done bar.
function updateInputsState() {
    const isHomeActive = homeView && homeView.classList.contains('active');
    const isChatActive = chatView && chatView.classList.contains('active');
    const isModalActive = nicknameModal && nicknameModal.classList.contains('active');
    const isCreateRoomModalActive = createRoomModal && createRoomModal.classList.contains('active');
    const isPasswordModalActive = passwordModal && passwordModal.classList.contains('active');
    const isRoomNotFoundModalActive = roomNotFoundModal && roomNotFoundModal.classList.contains('active');
    const anyModalActive = isModalActive || isCreateRoomModalActive || isPasswordModalActive || isRoomNotFoundModalActive;

    // Home view input
    if (joinRoomInput) {
        joinRoomInput.disabled = !isHomeActive || anyModalActive;
        joinRoomInput.setAttribute('tabindex', (isHomeActive && !anyModalActive) ? '0' : '-1');
    }

    // Modal input
    if (nicknameInput) {
        nicknameInput.disabled = !isModalActive;
        nicknameInput.setAttribute('tabindex', isModalActive ? '0' : '-1');
    }

    // Chat input
    if (messageInput) {
        messageInput.disabled = !isChatActive;
        messageInput.setAttribute('tabindex', isChatActive ? '0' : '-1');
    }

    // Custom Room setup inputs
    if (createRoomIdInput) {
        createRoomIdInput.disabled = !isCreateRoomModalActive;
        createRoomIdInput.setAttribute('tabindex', isCreateRoomModalActive ? '0' : '-1');
    }
    if (createRoomPasswordInput) {
        createRoomPasswordInput.disabled = !isCreateRoomModalActive;
        createRoomPasswordInput.setAttribute('tabindex', isCreateRoomModalActive ? '0' : '-1');
    }

    // Password verification input
    if (joinRoomPasswordInput) {
        joinRoomPasswordInput.disabled = !isPasswordModalActive;
        joinRoomPasswordInput.setAttribute('tabindex', isPasswordModalActive ? '0' : '-1');
    }

    // Room link input (always disabled, copy uses modern clipboard API)
    if (roomLinkInput) {
        roomLinkInput.disabled = true;
        roomLinkInput.setAttribute('tabindex', '-1');
    }

    // Hidden file inputs should also be disabled when their views are inactive to satisfy iOS Safari
    if (profilePicInput) {
        profilePicInput.disabled = !isModalActive;
    }
    if (imgInput) {
        imgInput.disabled = !isChatActive;
    }
}

// ── Manage Theme Color & Elastic Scroll Background ──
// Dynamically adjusts meta theme-color and body background classes.
// This forces iOS Safari to dynamically color its virtual keyboard accessory bar:
// - BLACK/DARK (#000000) when any modal (e.g. Set Your Profile, Crop Avatar) is open,
//   so the keyboard toolbar seamlessly matches the dark overlay background.
// - WHITE (#ffffff) when in Light Mode chat, matching the clean white inputs and messages.
// - INDIGO/NAVY (#0f172a) when in Dark Mode chat, matching the deep dark interface.
function updateThemeColor() {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const isLightMode = document.body.classList.contains('light-mode');
    
    // Check if any modal is currently visible
    const isNicknameActive = nicknameModal && nicknameModal.classList.contains('active');
    const isCreateRoomActive = createRoomModal && createRoomModal.classList.contains('active');
    const isPasswordActive = passwordModal && passwordModal.classList.contains('active');
    const isNotFoundActive = roomNotFoundModal && roomNotFoundModal.classList.contains('active');
    const cropModal = document.getElementById('crop-modal');
    const isCropActive = cropModal && cropModal.classList.contains('open');
    const membersModal = document.getElementById('members-modal');
    const isMembersActive = membersModal && membersModal.classList.contains('open');
    
    const isAnyModalActive = isNicknameActive || isCreateRoomActive || isPasswordActive || isNotFoundActive || isCropActive || isMembersActive;

    if (isAnyModalActive) {
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
        if (metaThemeColor) metaThemeColor.setAttribute('content', '#000000');
    } else {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isLightMode ? '#ffffff' : '#0f172a');
        }
    }
    updateActiveModalViewport();
}


function initLightbox() {
    const lb = document.getElementById('img-lightbox');
    const lbImg = document.getElementById('img-lightbox-img');
    const lbClose = document.getElementById('img-lightbox-close');
    if (!lb || !lbImg || !lbClose) return;

    lbClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
    });
    lb.addEventListener('click', () => closeLightbox());
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}

function openLightbox(src) {
    const lb = document.getElementById('img-lightbox');
    const lbImg = document.getElementById('img-lightbox-img');
    if (!lb || !lbImg) return;
    lbImg.src = src;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lb = document.getElementById('img-lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
}

function renderEmojiPicker() {
    if (!emojiPicker) return;

    // Prevent focus loss when clicking background/scrollbars on desktop
    emojiPicker.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
    
    emojiPicker.innerHTML = `
        <div class="emoji-tabs">
            <button data-cat="Smileys" class="active" title="Smileys">😀</button>
            <button data-cat="Love" title="Love">❤️</button>
            <button data-cat="Reactions" title="Reactions">🔥</button>
            <button data-cat="Fun" title="Fun">🎉</button>
            <button data-cat="Gestures" title="Gestures">👍</button>
        </div>
        <div id="emoji-list-container" class="emoji-grid"></div>
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
            
            // Prevent focus steal and maintain keyboard on touch/click
            span.addEventListener('mousedown', (e) => e.preventDefault());

            span.addEventListener('click', (e) => {
                e.stopPropagation();
                if (messageInput) {
                    messageInput.value += emoji;
                    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
                    setTimeout(() => {
                        if (messageInput && !messageInput.disabled) messageInput.focus();
                    }, 50);
                }
            });
            container.appendChild(span);
        });
    }

    tabs.forEach(tab => {
        // Prevent focus steal and maintain keyboard on tab switches
        tab.addEventListener('mousedown', (e) => e.preventDefault());

        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadCategory(tab.dataset.cat);
            setTimeout(() => {
                if (messageInput && !messageInput.disabled) messageInput.focus();
            }, 50);
        });
    });

    // Initial load
    loadCategory("Smileys");
}

function initPasswordToggle(inputEl, btnEl) {
    if (inputEl && btnEl) {
        btnEl.addEventListener('click', (e) => {
            e.preventDefault();
            const type = inputEl.getAttribute('type') === 'password' ? 'text' : 'password';
            inputEl.setAttribute('type', type);
            const icon = btnEl.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }
}

function setupEventListeners() {
    // Settings toggles
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', closeSettings);
    }
    if (settingsRemoveFaceBtn) {
        settingsRemoveFaceBtn.addEventListener('click', removeFaceCredentials);
    }
    if (settingsRegisterFaceBtn) {
        settingsRegisterFaceBtn.addEventListener('click', startSettingsFaceRegistration);
    }
    if (settingsScanDemoBtn) {
        settingsScanDemoBtn.addEventListener('click', simulateSettingsFaceScan);
    }

    // Settings backdrop click to close settings modal
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettings();
            }
        });
    }

    // Face ID Modal buttons
    if (faceDemoBtn) {
        faceDemoBtn.addEventListener('click', simulateFaceScan);
    }

    // Settings nickname save button
    if (settingsSaveNameBtn) {
        settingsSaveNameBtn.addEventListener('click', saveSettingsNickname);
    }

    // Face-not-found retry button
    const faceRetryBtn = document.getElementById('face-retry-btn');
    if (faceRetryBtn) {
        faceRetryBtn.addEventListener('click', () => {
            const faceNotFoundEl = document.getElementById('face-not-found');
            if (faceNotFoundEl) {
                faceNotFoundEl.classList.add('hidden');
                const msgEl = faceNotFoundEl.querySelector('.face-not-found-msg');
                if (msgEl) msgEl.innerHTML = 'Face not found.<br>Please look directly at the camera.';
            }
            if (faceScanStatusEl) {
                faceScanStatusEl.className = 'face-status';
                faceScanStatusEl.innerHTML = '<i class="fas fa-camera"></i> Align face in camera frame...';
            }
            if (faceScanDetailEl) faceScanDetailEl.textContent = 'Blink/head movement slowly';
            stopFaceScanFlow();
            setTimeout(() => startFaceScanFlow(faceScanIsSettings), 300);
        });
    }

    // Settings Face-not-found retry button
    const settingsFaceRetryBtn = document.getElementById('settings-face-retry-btn');
    if (settingsFaceRetryBtn) {
        settingsFaceRetryBtn.addEventListener('click', () => {
            const settingsFaceNotFoundEl = document.getElementById('settings-face-not-found');
            if (settingsFaceNotFoundEl) {
                settingsFaceNotFoundEl.classList.add('hidden');
                const msgEl = settingsFaceNotFoundEl.querySelector('.face-not-found-msg');
                if (msgEl) msgEl.innerHTML = 'Face not found.<br>Please look directly at the camera.';
            }
            if (faceScanStatusEl) {
                faceScanStatusEl.className = 'face-status';
                faceScanStatusEl.innerHTML = '<i class="fas fa-camera"></i> Align face in camera frame...';
            }
            stopFaceScanFlow();
            setTimeout(() => startFaceScanFlow(faceScanIsSettings), 300);
        });
    }

    // Password toggles
    initPasswordToggle(createRoomPasswordInput, toggleCreatePasswordBtn);
    initPasswordToggle(joinRoomPasswordInput, toggleJoinPasswordBtn);

    // Host room creation modal triggers
    if (createRoomBtn) createRoomBtn.addEventListener('click', () => {
        const randomID = Math.random().toString(36).substring(2, 9);
        if (createRoomIdInput) createRoomIdInput.value = randomID;
        if (createRoomPasswordInput) createRoomPasswordInput.value = '';
        if (createRoomError) createRoomError.style.display = 'none';
        if (createRoomModal) createRoomModal.classList.add('active');
        updateInputsState();
        updateThemeColor();
    });

    if (cancelCreateRoomBtn) cancelCreateRoomBtn.addEventListener('click', () => {
        if (createRoomModal) createRoomModal.classList.remove('active');
        updateInputsState();
        updateThemeColor();
    });

    if (confirmCreateRoomBtn) confirmCreateRoomBtn.addEventListener('click', () => {
        let roomID = createRoomIdInput.value.trim();
        if (!roomID) {
            roomID = Math.random().toString(36).substring(2, 9);
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(roomID)) {
            if (createRoomError) {
                createRoomError.textContent = 'Room ID can only contain letters, numbers, hyphens, and underscores.';
                createRoomError.style.display = 'block';
            }
            return;
        }
        if (socket) {
            socket.emit('check-room-id-available', { roomID });
        }
    });

    // Enter Room ID on home screen
    if (joinRoomBtn) joinRoomBtn.addEventListener('click', () => {
        const roomID = joinRoomInput.value.trim();
        if (roomID) {
            if (socket) {
                socket.emit('check-room', { roomID });
            }
        }
    });

    if (joinRoomInput) joinRoomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinRoomBtn.click();
        }
    });

    // Password modal cancel/submit
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', () => {
        if (passwordModal) passwordModal.classList.remove('active');
        window.location.href = '/';
    });

    if (submitPasswordBtn) submitPasswordBtn.addEventListener('click', () => {
        const password = joinRoomPasswordInput.value.trim();
        if (socket && currentRoomID) {
            socket.emit('verify-password', { roomID: currentRoomID, password });
        }
    });

    if (joinRoomPasswordInput) joinRoomPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitPasswordBtn.click();
        }
    });

    // Room not found modal triggers
    if (roomNotFoundHomeBtn) roomNotFoundHomeBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    if (joinChatBtn) joinChatBtn.addEventListener('click', () => {
        const nick = nicknameInput.value.trim();
        if (nick) {
            myNickname = nick;
            saveProfileLocally(myNickname, myProfilePic);
            // Sync nickname + profilePic to server so cross-device face match returns correct profile
            const faceId = localStorage.getItem('piktalk_face_userid');
            const savedDescRaw = localStorage.getItem('piktalk_face_descriptor');
            if (faceId && savedDescRaw) {
                try {
                    const desc = JSON.parse(savedDescRaw);
                    _syncFaceToServer(faceId, desc, myNickname, myProfilePic);
                } catch(e) {}
            }
            showChat();
            if (socket) {
                socket.emit('join-room', {
                    roomID: currentRoomID,
                    nickname: myNickname,
                    profilePic: myProfilePic,
                    userId: myUserId,
                    password: currentRoomPassword
                });
            } else {
                console.warn("Socket not initialized. Attempting fallback join...");
            }
        }
    });

    if (nicknameInput) nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinChatBtn.click();
        }
    });

    if (inviteBtn) inviteBtn.addEventListener('click', () => {
        if (shareSection) {
            shareSection.classList.toggle('hidden');
            if (!shareSection.classList.contains('hidden')) {
                if (currentRoomPassword && amIAdmin) {
                    if (sharePasswordArea) sharePasswordArea.style.display = 'block';
                    if (sharePasswordInput) sharePasswordInput.value = currentRoomPassword;
                } else {
                    if (sharePasswordArea) sharePasswordArea.style.display = 'none';
                }
            }
        }
    });

    if (copyBtn) copyBtn.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(roomLinkInput.value).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
            }).catch(() => {
                fallbackCopy();
            });
        } else {
            fallbackCopy();
        }

        // Internal helper to support clipboard-incompatible environments
        function fallbackCopy() {
            const wasDisabled = roomLinkInput.disabled;
            roomLinkInput.disabled = false;
            roomLinkInput.select();
            document.execCommand('copy');
            roomLinkInput.disabled = wasDisabled;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        }
    });

    if (copyPasswordBtn) copyPasswordBtn.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(sharePasswordInput.value).then(() => {
                copyPasswordBtn.textContent = 'Copied!';
                setTimeout(() => { copyPasswordBtn.textContent = 'Copy'; }, 2000);
            }).catch(() => {
                fallbackCopyPassword();
            });
        } else {
            fallbackCopyPassword();
        }

        function fallbackCopyPassword() {
            const wasDisabled = sharePasswordInput.disabled;
            sharePasswordInput.disabled = false;
            sharePasswordInput.select();
            document.execCommand('copy');
            sharePasswordInput.disabled = wasDisabled;
            copyPasswordBtn.textContent = 'Copied!';
            setTimeout(() => { copyPasswordBtn.textContent = 'Copy'; }, 2000);
        }
    });

    if (leaveBtn) leaveBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    if (emojiBtn) {
        // Prevent focus steal (keyboard close) on mobile
        emojiBtn.addEventListener('mousedown', (e) => e.preventDefault());
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPicker.classList.toggle('hidden');
            setTimeout(() => {
                if (messageInput && !messageInput.disabled) messageInput.focus();
            }, 50);
        });
    }

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
        if (!file) return;
        if (file.size > 20000000) { alert('Image too large (Max 20MB)'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => openCropModal(ev.target.result);
        reader.readAsDataURL(file);
        profilePicInput.value = '';
    });

    if (sendBtn) {
        // Prevent send button from stealing focus from the textarea on mobile
        // Using mousedown preventDefault stops iOS Safari from dismissing the keyboard
        sendBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
        sendBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            sendMessage();
        }, { passive: false });
        sendBtn.addEventListener('click', sendMessage);
    }
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';

            // Emit typing event (optimized throttle)
            if (socket && currentRoomID && myNickname) {
                if (!isCurrentlyTyping) {
                    isCurrentlyTyping = true;
                    socket.emit('typing', { nickname: myNickname });
                }
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    isCurrentlyTyping = false;
                    socket.emit('stop-typing');
                }, 2000);
            }
        });

        messageInput.addEventListener('keydown', (e) => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                clearTimeout(typingTimeout);
                isCurrentlyTyping = false;
                if (socket) socket.emit('stop-typing');
                sendMessage();
            }
        });
    }

    if (attachBtn) {
        // Standard click event listener works reliably across all mobile and desktop browsers
        attachBtn.addEventListener('click', () => {
            if (imgInput) imgInput.click();
        });
    }
    
    // AI smart replies trigger
    if (aiBtn) {
        const renderAISuggestionsBatch = () => {
            if (!aiRepliesList) return;
            aiRepliesList.innerHTML = '';

            const total = currentAISuggestions.length;
            if (total === 0) {
                aiRepliesBar.classList.add('hidden');
                return;
            }

            // If all have been shown, reset the shown set and re-shuffle (start fresh cycle)
            if (shownIndices.size >= total) {
                shownIndices.clear();
                currentAISuggestionsIndex = 0;
                // Re-shuffle so it feels fresh and new
                for (let i = total - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [currentAISuggestions[i], currentAISuggestions[j]] = [currentAISuggestions[j], currentAISuggestions[i]];
                }
            }

            // Collect up to 3 suggestions that haven't been shown yet
            const batch = [];
            let checked = 0;
            let idx = currentAISuggestionsIndex;
            while (batch.length < 3 && checked < total) {
                if (!shownIndices.has(idx)) {
                    batch.push({ idx, reply: currentAISuggestions[idx] });
                }
                idx = (idx + 1) % total;
                checked++;
            }

            // Mark these as shown
            batch.forEach(b => shownIndices.add(b.idx));
            // Next "More" starts from where we left off
            currentAISuggestionsIndex = idx;

            batch.forEach(({ reply }) => {
                const chip = document.createElement('button');
                chip.className = 'ai-reply-chip';
                chip.textContent = reply;

                const handleSelect = (ev) => {
                    if (ev) ev.stopPropagation();
                    if (messageInput) {
                        messageInput.value = reply;
                        messageInput.focus();
                        messageInput.style.height = 'auto';
                        messageInput.style.height = (messageInput.scrollHeight) + 'px';
                    }
                    aiRepliesBar.classList.add('hidden');
                };

                // Prevent keyboard dismissal on click/tap
                chip.addEventListener('mousedown', (ev) => ev.preventDefault());
                chip.addEventListener('click', handleSelect);

                aiRepliesList.appendChild(chip);
            });

            // Always show More button if total > 3 to allow infinite cycling
            if (total > 3) {
                const moreChip = document.createElement('button');
                moreChip.className = 'ai-reply-chip more-btn';
                moreChip.innerHTML = '<i class="fas fa-arrows-rotate" style="margin-right: 4px; font-size: 0.75rem;"></i> More';

                const handleMore = (ev) => {
                    if (ev) ev.stopPropagation();
                    renderAISuggestionsBatch();
                    setTimeout(() => {
                        if (messageInput && !messageInput.disabled) messageInput.focus();
                    }, 50);
                };

                // Prevent keyboard dismissal on click/tap
                moreChip.addEventListener('mousedown', (ev) => ev.preventDefault());
                moreChip.addEventListener('click', handleMore);

                aiRepliesList.appendChild(moreChip);
            }
        };

        refreshAISuggestions = () => {
            currentAISuggestions = generateAISmartReplies();
            // Shuffle so suggestions feel fresh each time
            for (let i = currentAISuggestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentAISuggestions[i], currentAISuggestions[j]] = [currentAISuggestions[j], currentAISuggestions[i]];
            }
            currentAISuggestionsIndex = 0;
            shownIndices = new Set();
            renderAISuggestionsBatch();
        };

        const toggleAISuggestions = (e) => {
            if (e) e.stopPropagation();
            const isHidden = aiRepliesBar.classList.contains('hidden');
            if (!isHidden) {
                aiRepliesBar.classList.add('hidden');
                return;
            }

            aiRepliesBar.classList.remove('hidden');
            aiRepliesList.innerHTML = `
                <div class="ai-replies-loading">
                    <div class="ai-sparkle-container">
                        <div class="ai-sparkle-dot"></div>
                        <div class="ai-sparkle-dot"></div>
                        <div class="ai-sparkle-dot"></div>
                    </div>
                    Analyzing chat context...
                </div>
            `;

            setTimeout(() => {
                refreshAISuggestions();
            }, 450);
        };

        // Prevent keyboard from closing when tapping the AI suggestions button
        aiBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        aiBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleAISuggestions(e);
        }, { passive: false });

        aiBtn.addEventListener('click', (e) => {
            toggleAISuggestions(e);
        });
    }

    if (closeAiBtn) {
        closeAiBtn.addEventListener('mousedown', (e) => e.preventDefault());
        closeAiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            aiRepliesBar.classList.add('hidden');
            setTimeout(() => {
                if (messageInput && !messageInput.disabled) messageInput.focus();
            }, 50);
        });
    }

    // ── Image Editor Preview & Editor Logic ──
    let editorSelectedFile = null;
    let editorRotationAngle = 0;

    const editorModal = document.getElementById('image-editor-modal');
    const editorCloseBtn = document.getElementById('image-editor-close-btn');
    const editorCancelBtn = document.getElementById('image-editor-cancel-btn');
    const editorSendBtn = document.getElementById('image-editor-send-btn');
    const editorRotateBtn = document.getElementById('image-editor-rotate-btn');
    const editorFilterSelect = document.getElementById('image-editor-filter');
    const editorPreviewImg = document.getElementById('image-editor-preview');

    function openImageEditor(file) {
        editorSelectedFile = file;
        editorRotationAngle = 0;
        
        if (!editorModal || !editorPreviewImg) return;
        
        if (editorFilterSelect) editorFilterSelect.value = 'none';
        editorPreviewImg.style.transform = 'rotate(0deg)';
        editorPreviewImg.style.filter = 'none';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            editorPreviewImg.src = e.target.result;
            editorModal.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }

    const closeEditor = () => {
        if (editorModal) editorModal.style.display = 'none';
        editorSelectedFile = null;
        if (imgInput) imgInput.value = '';
    };

    if (editorCloseBtn) editorCloseBtn.addEventListener('click', closeEditor);
    if (editorCancelBtn) editorCancelBtn.addEventListener('click', closeEditor);

    if (editorRotateBtn && editorPreviewImg) {
        editorRotateBtn.addEventListener('click', () => {
            editorRotationAngle = (editorRotationAngle + 90) % 360;
            editorPreviewImg.style.transform = `rotate(${editorRotationAngle}deg)`;
        });
    }

    if (editorFilterSelect && editorPreviewImg) {
        editorFilterSelect.addEventListener('change', () => {
            const val = editorFilterSelect.value;
            if (val === 'grayscale') editorPreviewImg.style.filter = 'grayscale(100%)';
            else if (val === 'sepia') editorPreviewImg.style.filter = 'sepia(100%)';
            else if (val === 'invert') editorPreviewImg.style.filter = 'invert(100%)';
            else if (val === 'brightness') editorPreviewImg.style.filter = 'brightness(1.3)';
            else editorPreviewImg.style.filter = 'none';
        });
    }

    if (editorSendBtn) {
        editorSendBtn.addEventListener('click', () => {
            if (!editorSelectedFile) return;

            const oldHtml = editorSendBtn.innerHTML;
            editorSendBtn.disabled = true;
            editorSendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            const reader = new FileReader();
            reader.onload = (e) => {
                if (editorSelectedFile.type === 'image/gif' && editorRotationAngle === 0 && (!editorFilterSelect || editorFilterSelect.value === 'none')) {
                    // Send raw GIF directly if not rotated or filtered to preserve animation
                    if (socket) {
                        socket.emit('send-message', {
                            roomID: currentRoomID,
                            message: '',
                            image: e.target.result,
                            replyTo: replyingTo || null
                        });
                        clearReply();
                        if (aiRepliesBar) aiRepliesBar.classList.add('hidden');
                        setTimeout(() => {
                            if (messageInput && !messageInput.disabled) messageInput.focus();
                        }, 50);
                    }
                    editorSendBtn.disabled = false;
                    editorSendBtn.innerHTML = oldHtml;
                    closeEditor();
                } else {
                    // Render rotation + filters to canvas
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        const isRotated90or270 = (editorRotationAngle === 90 || editorRotationAngle === 270);
                        const destW = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
                        const destH = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

                        const maxW = 1200;
                        const maxH = 1200;
                        let width = destW;
                        let height = destH;
                        if (width > maxW || height > maxH) {
                            if (width > height) {
                                height = Math.round((height * maxW) / width);
                                width = maxW;
                            } else {
                                width = Math.round((width * maxH) / height);
                                height = maxH;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate((editorRotationAngle * Math.PI) / 180);

                        const val = editorFilterSelect ? editorFilterSelect.value : 'none';
                        if (val === 'grayscale') ctx.filter = 'grayscale(100%)';
                        else if (val === 'sepia') ctx.filter = 'sepia(100%)';
                        else if (val === 'invert') ctx.filter = 'invert(100%)';
                        else if (val === 'brightness') ctx.filter = 'brightness(1.3)';
                        else ctx.filter = 'none';

                        const drawW = isRotated90or270 ? height : width;
                        const drawH = isRotated90or270 ? width : height;
                        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

                        if (socket) {
                            socket.emit('send-message', {
                                roomID: currentRoomID,
                                message: '',
                                image: compressedBase64,
                                replyTo: replyingTo || null
                            });
                            clearReply();
                            if (aiRepliesBar) aiRepliesBar.classList.add('hidden');
                            setTimeout(() => {
                                if (messageInput && !messageInput.disabled) messageInput.focus();
                            }, 50);
                        }

                        editorSendBtn.disabled = false;
                        editorSendBtn.innerHTML = oldHtml;
                        closeEditor();
                    };
                    img.onerror = () => {
                        if (socket) {
                            socket.emit('send-message', {
                                roomID: currentRoomID,
                                message: '',
                                image: e.target.result,
                                replyTo: replyingTo || null
                            });
                            clearReply();
                        }
                        editorSendBtn.disabled = false;
                        editorSendBtn.innerHTML = oldHtml;
                        closeEditor();
                    };
                    img.src = e.target.result;
                }
            };
            reader.readAsDataURL(editorSelectedFile);
        });
    }

    if (imgInput) imgInput.addEventListener('change', () => {
        const file = imgInput.files[0];
        if (!file) return;
        if (file.size > 50000000) { alert('Image too large (Max 50MB)'); return; }
        openImageEditor(file);
    });

    // ── Voice message listeners ──
    if (micBtn) {
        // Desktop: mousedown / mouseup
        micBtn.addEventListener('mousedown', startRecording);
        micBtn.addEventListener('mouseup',   stopRecording);
        micBtn.addEventListener('mouseleave', () => { if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording(); });

        // Mobile: touchstart / touchend
        micBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); }, { passive: false });
        micBtn.addEventListener('touchend',   (e) => { e.preventDefault(); stopRecording(); },  { passive: false });
    }

    // Voice bar buttons: prevent focus steal so keyboard stays open
    const noFocusSteal = (btn, handler) => {
        if (!btn) return;
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (handler) handler();
        }, { passive: false });
        btn.addEventListener('click', (e) => { if (handler) handler(); });
    };

    noFocusSteal(cancelRecordingBtn, cancelRecording);
    noFocusSteal(discardAudioBtn,    discardPreview);
    noFocusSteal(playPreviewBtn,     togglePreviewPlayback);
    noFocusSteal(sendAudioBtn,       sendVoiceMessage);

    // Close any open menus when tapping elsewhere (optimized: defined once globally)
    document.addEventListener('click', () => {
        document.querySelectorAll('.quick-react-menu.visible').forEach(m => m.classList.remove('visible'));
        document.querySelectorAll('.emoji-bottom-sheet-overlay').forEach(m => m.remove());
        document.querySelectorAll('.message.action-visible').forEach(m => m.classList.remove('action-visible'));
    }, { once: false, capture: true, passive: true });
}

// ── Voice Recording Functions ──

function formatSeconds(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function startRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support voice recording.');
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioChunks = [];
            recordingSeconds = 0;

            // Prefer webm/opus; fall back to first supported type
            const mimeType = ['audio/webm;codecs=opus','audio/webm','audio/ogg',''].find(t => !t || MediaRecorder.isTypeSupported(t));
            mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                recordedAudioBlob = blob;
                showAudioPreview(blob, recordingSeconds);
            };

            mediaRecorder.start(100);
            micBtn.classList.add('recording');
            voiceRecordingBar.classList.remove('hidden');

            // Notify others that we are recording
            if (socket && currentRoomID && myNickname) {
                socket.emit('voice-recording-start', { nickname: myNickname, profilePic: myProfilePic });
            }

            recordingTimerInterval = setInterval(() => {
                recordingSeconds++;
                recordingTimerEl.textContent = formatSeconds(recordingSeconds);
                // Auto-stop at 3 minutes
                if (recordingSeconds >= 180) stopRecording();
            }, 1000);
        })
        .catch(err => {
            console.error('Mic permission denied:', err);
            alert('Microphone access denied. Please allow microphone access to record voice messages.');
        });
}

function stopRecording() {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
    clearInterval(recordingTimerInterval);
    mediaRecorder.stop();
    micBtn.classList.remove('recording');
    voiceRecordingBar.classList.add('hidden');
    recordingTimerEl.textContent = '0:00';
    if (socket) socket.emit('voice-recording-stop');
    setTimeout(() => {
        if (messageInput && !messageInput.disabled) messageInput.focus();
    }, 50);
}

function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.ondataavailable = null; // discard chunks
        mediaRecorder.onstop = null;
        mediaRecorder.stop();
        if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    clearInterval(recordingTimerInterval);
    micBtn.classList.remove('recording');
    voiceRecordingBar.classList.add('hidden');
    recordingTimerEl.textContent = '0:00';
    audioChunks = [];
    recordedAudioBlob = null;
    if (socket) socket.emit('voice-recording-stop');
    setTimeout(() => {
        if (messageInput && !messageInput.disabled) messageInput.focus();
    }, 50);
}

function showAudioPreview(blob, durationSec) {
    if (previewAudio) { previewAudio.pause(); previewAudio = null; }
    previewAudio = new Audio(URL.createObjectURL(blob));
    previewAudio.ontimeupdate = () => {
        const pct = previewAudio.duration ? (previewAudio.currentTime / previewAudio.duration) * 100 : 0;
        audioProgressBar.style.width = pct + '%';
        audioPreviewDuration.textContent = formatSeconds(Math.floor(previewAudio.currentTime));
    };
    previewAudio.onended = () => {
        previewPlaying = false;
        playPreviewBtn.innerHTML = '<i class="fas fa-play"></i>';
        audioProgressBar.style.width = '0%';
        audioPreviewDuration.textContent = formatSeconds(durationSec);
    };
    audioPreviewDuration.textContent = formatSeconds(durationSec);
    audioProgressBar.style.width = '0%';
    audioPreviewBar.classList.remove('hidden');
}

function togglePreviewPlayback() {
    if (!previewAudio) return;
    if (previewPlaying) {
        previewAudio.pause();
        previewPlaying = false;
        playPreviewBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        previewAudio.play();
        previewPlaying = true;
        playPreviewBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    setTimeout(() => {
        if (messageInput && !messageInput.disabled) messageInput.focus();
    }, 50);
}

function discardPreview() {
    if (previewAudio) { previewAudio.pause(); previewAudio = null; }
    previewPlaying = false;
    audioPreviewBar.classList.add('hidden');
    audioProgressBar.style.width = '0%';
    recordedAudioBlob = null;
    setTimeout(() => {
        if (messageInput && !messageInput.disabled) messageInput.focus();
    }, 50);
}

function sendVoiceMessage() {
    if (!recordedAudioBlob) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (socket) {
            socket.emit('voice-recording-stop');
            socket.emit('send-message', {
                roomID: currentRoomID,
                message: '',
                audio: e.target.result,
                audioDuration: recordingSeconds,
                replyTo: replyingTo || null
            });
            clearReply();
            discardPreview();
            if (aiRepliesBar) aiRepliesBar.classList.add('hidden');
            setTimeout(() => {
                if (messageInput && !messageInput.disabled) messageInput.focus();
            }, 50);
        } else {
            alert("Not connected to server. Voice message could not be sent.");
        }
    };
    reader.readAsDataURL(recordedAudioBlob);
}

function applyTheme(theme) {
    const isLight = (theme === 'light');
    if (isLight) {
        document.body.classList.add('light-mode');
        document.documentElement.classList.add('light-mode-active');
    } else {
        document.body.classList.remove('light-mode');
        document.documentElement.classList.remove('light-mode-active');
    }
    const icon = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    if (themeToggle) themeToggle.innerHTML = icon;
    if (homeThemeToggle) homeThemeToggle.innerHTML = icon;
    updateThemeColor();
}

function toggleTheme() {
    const isCurrentlyLight = document.body.classList.contains('light-mode');
    const newTheme = isCurrentlyLight ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function showHome() {
    [homeView, chatView, nicknameModal, createRoomModal, passwordModal, roomNotFoundModal].forEach(v => { if (v) v.classList.remove('active'); });
    // Remove connecting overlay if present
    const existingOverlay = document.getElementById('connecting-overlay');
    if (existingOverlay) existingOverlay.remove();
    if (homeView) homeView.classList.add('active');
    updateInputsState();
    updateThemeColor();
}

// ── Instant connecting overlay shown before socket handshakes ──
function showConnectingOverlay(roomID) {
    // Hide home so user doesn't see it flash
    if (homeView) homeView.classList.remove('active');

    let overlay = document.getElementById('connecting-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'connecting-overlay';
        overlay.innerHTML = `
            <div class="connecting-box">
                <div class="connecting-spinner"></div>
                <div class="connecting-room-id">Room: <strong>${roomID}</strong></div>
                <div class="connecting-status">Connecting to room&hellip;</div>
                <button id="connecting-cancel-btn" class="btn btn-secondary" style="margin-top: 10px; font-size: 0.85rem; padding: 6px 12px; display: none;">Go Back</button>
            </div>`;
        document.body.appendChild(overlay);

        // Show cancel button and update status if it takes more than 4 seconds
        setTimeout(() => {
            const cancelBtn = document.getElementById('connecting-cancel-btn');
            if (cancelBtn) {
                cancelBtn.style.display = 'block';
                cancelBtn.onclick = () => {
                    hideConnectingOverlay();
                    showHome();
                    window.history.pushState({}, '', '/');
                };
            }
            const statusEl = overlay.querySelector('.connecting-status');
            if (statusEl) {
                statusEl.textContent = 'Server is waking up, please wait&hellip;';
            }
        }, 4000);
    }
}

function hideConnectingOverlay() {
    const overlay = document.getElementById('connecting-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.25s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

function showChat() {
    [homeView, chatView, nicknameModal, createRoomModal, passwordModal, roomNotFoundModal].forEach(v => { if (v) v.classList.remove('active'); });
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
    // Show invite button by default — visible to all members
    if (inviteBtn) inviteBtn.style.display = '';
    updateInputsState();
    updateThemeColor();
    // Load chat history for this room
    setTimeout(() => loadAndRenderHistory(currentRoomID), 100);
}

// Show or hide admin-only UI elements based on current admin status
function updateAdminUI() {
    // Invite button (reveals room link + password) — visible to all members
    if (inviteBtn) inviteBtn.style.display = '';
    // Only the admin should see the password in the sharing overlay
    if (!amIAdmin && sharePasswordArea) {
        sharePasswordArea.style.display = 'none';
    }
}

function showNicknameModal() {
    [homeView, chatView, createRoomModal, passwordModal, roomNotFoundModal].forEach(v => { if (v) v.classList.remove('active'); });
    if (nicknameModal) nicknameModal.classList.add('active');

    // Only start the scan if we are not already on the profile setup step
    const alreadyOnSetup = profileSetupSection && !profileSetupSection.classList.contains('hidden');
    if (!alreadyOnSetup) {
        // Show scanner, hide profile form
        if (faceScanSection) faceScanSection.classList.remove('hidden');
        if (profileSetupSection) profileSetupSection.classList.add('hidden');

        // Set initial status
        if (faceStatus) {
            faceStatus.className = 'face-status';
            faceStatus.innerHTML = '<i class="fas fa-camera"></i> Align face in camera frame...';
        }
        if (faceDetail) faceDetail.textContent = 'Blink/head movement slowly';

        // Load saved profile pic
        loadSavedProfile();
        updateInputsState();
        updateThemeColor();

        // Start face scan scanner
        startFaceScanFlow(false);
    } else {
        updateInputsState();
        updateThemeColor();
    }
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentRoomID) {
        if (socket) {
            // Stop typing indicator instantly upon sending
            clearTimeout(typingTimeout);
            isCurrentlyTyping = false;
            socket.emit('stop-typing');

            socket.emit('send-message', {
                roomID: currentRoomID,
                message: text,
                replyTo: replyingTo || null
            });
            messageInput.value = '';
            messageInput.style.height = '38px';
            clearReply();

            const isEmojiOpen = emojiPicker && !emojiPicker.classList.contains('hidden');
            if (emojiPicker) emojiPicker.classList.add('hidden');
            if (aiRepliesBar) aiRepliesBar.classList.add('hidden');
            if (!isEmojiOpen) {
                setTimeout(() => {
                    if (messageInput && !messageInput.disabled) messageInput.focus();
                }, 0);
            }
        } else {
            alert("Not connected to server. Message could not be sent.");
        }
    }
}

// Socket Events
if (socket) {
    socket.on('receive-message', (data) => {
        hideTyping();
        appendMessage(data, data.id === socket.id);
        saveMsgToHistory(data);
        if (msgSound) msgSound.play().catch(() => {});

        // Auto-refresh smart replies in real time if suggestions bar is currently open
        if (aiRepliesBar && !aiRepliesBar.classList.contains('hidden') && typeof refreshAISuggestions === 'function') {
            refreshAISuggestions();
        }
    });

    // Real-time reaction update
    socket.on('reaction-toggled', ({ msgId, emoji, socketId, nickname, profilePic, previousEmoji }) => {
        if (!msgReactions[msgId]) msgReactions[msgId] = {};
        // Remove previous reaction if the user switched emojis (1 reaction per person)
        if (previousEmoji && previousEmoji !== emoji && msgReactions[msgId][previousEmoji]) {
            msgReactions[msgId][previousEmoji].delete(socketId);
            if (msgReactions[msgId][previousEmoji].size === 0) delete msgReactions[msgId][previousEmoji];
        }
        if (!msgReactions[msgId][emoji]) msgReactions[msgId][emoji] = new Map();
        const map = msgReactions[msgId][emoji];
        if (map.has(socketId)) map.delete(socketId);
        else map.set(socketId, { nickname: nickname || 'Anonymous', profilePic: profilePic || null });
        if (map.size === 0) delete msgReactions[msgId][emoji];
        renderReactions(msgId);
    });

    socket.on('system-message', (data) => {
        appendSystemMessage(data.message);
    });

    socket.on('ip-info', (data) => {
        serverIP = data.ip;
        serverPort = data.port;
    });

    socket.on('user-typing', (data) => {
        showTyping(data.nickname, data.profilePic);
    });

    socket.on('user-stop-typing', () => {
        hideTyping();
    });

    socket.on('user-voice-recording', (data) => {
        showTyping(data.nickname, data.profilePic, 'voice');
    });

    socket.on('user-voice-stop-recording', () => {
        hideTyping();
    });

    socket.on('room-users', (usersList) => {
        currentRoomUsersCount = usersList.length;
        updateMembersList(usersList);
        // Re-render reactions on all messages when user count changes
        Object.keys(msgReactions).forEach(msgId => {
            renderReactions(msgId);
        });
    });

    // Server tells this socket directly that it is the admin
    socket.on('you-are-admin', ({ password }) => {
        amIAdmin = true;
        if (password) currentRoomPassword = password;
        updateAdminUI();
    });

    socket.on('kicked', () => {
        alert('You have been removed from the chat by the admin.');
        window.location.href = '/';
    });

    // profile-data is no longer used for auto-fill (localStorage handles that).
    // Kept here as a no-op so the server event doesn't cause unhandled warnings.
    socket.on('profile-data', () => {});

    // Profile saved to MongoDB Atlas (logging only)
    socket.on('profile-saved', (saved) => {
        console.log('Profile saved to database:', saved && saved.nickname);
    });

    // Room ID verification during host creation
    socket.on('room-id-available-checked', ({ roomID, available }) => {
        if (available) {
            if (createRoomError) createRoomError.style.display = 'none';
            if (createRoomModal) createRoomModal.classList.remove('active');
            
            currentRoomID = roomID;
            currentRoomPassword = createRoomPasswordInput.value.trim() || null;
            
            window.history.pushState({}, '', `/chat/${currentRoomID}`);
            showPhoneModal(showNicknameModal);
        } else {
            if (createRoomError) {
                createRoomError.textContent = 'Room ID is already in use. Please try another one.';
                createRoomError.style.display = 'block';
            }
        }
    });

    // Room presence and password requirement verification
    socket.on('room-checked', ({ roomID, exists, hasPassword }) => {
        hideConnectingOverlay();
        if (!exists) {
            if (roomNotFoundModal) roomNotFoundModal.classList.add('active');
            updateInputsState();
            updateThemeColor();
        } else {
            currentRoomID = roomID;
            if (hasPassword) {
                if (joinRoomPasswordInput) joinRoomPasswordInput.value = '';
                if (joinPasswordError) joinPasswordError.style.display = 'none';
                if (passwordModal) passwordModal.classList.add('active');
                updateInputsState();
                updateThemeColor();
            } else {
                currentRoomPassword = null;
                window.history.pushState({}, '', `/chat/${currentRoomID}`);
                showPhoneModal(showNicknameModal);
            }
        }
    });

    // Password verification feedback
    socket.on('password-verified', ({ roomID, success }) => {
        if (success) {
            if (joinPasswordError) joinPasswordError.style.display = 'none';
            if (passwordModal) passwordModal.classList.remove('active');
            currentRoomPassword = joinRoomPasswordInput.value.trim();
            
            window.history.pushState({}, '', `/chat/${roomID}`);
            showPhoneModal(showNicknameModal);
        } else {
            if (joinPasswordError) {
                joinPasswordError.textContent = 'Incorrect password. Please try again.';
                joinPasswordError.style.display = 'block';
            }
        }
    });

    // Fallback error during actual join-room trigger
    socket.on('join-failed', ({ reason }) => {
        if (reason === 'invalid-password') {
            alert('Session expired or incorrect password. Please re-enter.');
            window.location.href = '/';
        }
    });
}

function showTyping(name, profilePic, mode) {
    const indicator = document.getElementById('typing-indicator');
    const typingText = document.getElementById('typing-text');
    const avatarEl   = document.getElementById('typing-avatar');
    if (!indicator || !typingText) return;

    // Render avatar
    if (avatarEl) {
        avatarEl.innerHTML = '';
        if (profilePic) {
            const img = document.createElement('img');
            img.src = profilePic;
            img.alt = name;
            avatarEl.appendChild(img);
            avatarEl.style.background = 'transparent';
        } else {
            const initial = name ? name.charAt(0).toUpperCase() : '?';
            avatarEl.textContent = initial;
            avatarEl.style.background = getNicknameColor(name);
        }
    }

    // Label differs for voice vs text
    if (mode === 'voice') {
        typingText.textContent = name + ' \uD83C\uDFA4 recording\u2026';
    } else {
        typingText.textContent = name + ' is typing\u2026';
    }

    indicator.classList.add('visible');
    const container = document.getElementById('messages-container');
    if (container) container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;
    indicator.classList.remove('visible');
}

// Detect if a string is a single emoji (no other text)
function isSingleEmoji(str) {
    if (!str) return false;
    const trimmed = str.trim();
    // Use Intl segmenter if available (modern browsers)
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments = [...seg.segment(trimmed)];
        if (segments.length !== 1) return false;
        const cp = trimmed.codePointAt(0);
        // Must be in emoji range
        return (
            (cp >= 0x1F600 && cp <= 0x1F64F) || // emoticons
            (cp >= 0x1F300 && cp <= 0x1F5FF) || // symbols & pictographs
            (cp >= 0x1F680 && cp <= 0x1F6FF) || // transport
            (cp >= 0x1F700 && cp <= 0x1F77F) || // alchemical
            (cp >= 0x1F780 && cp <= 0x1F7FF) || // geometric
            (cp >= 0x1F800 && cp <= 0x1F8FF) || // supp arrows
            (cp >= 0x1F900 && cp <= 0x1F9FF) || // supp symbols
            (cp >= 0x1FA00 && cp <= 0x1FA6F) || // chess
            (cp >= 0x1FA70 && cp <= 0x1FAFF) || // symbols extended
            (cp >= 0x2600  && cp <= 0x26FF)  || // misc symbols
            (cp >= 0x2700  && cp <= 0x27BF)  || // dingbats
            (cp >= 0xFE00  && cp <= 0xFE0F)  || // variation selectors
            cp === 0x200D                        // ZWJ
        );
    }
    // Fallback regex for older browsers
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\uFE0F|\u20D0-\u20FF|\uFE0E|\uFE0F)*$/u;
    return emojiRegex.test(trimmed);
}

function appendMessage(data, isSentByMe) {
    if (!messagesContainer) return;

    // Log chat history for AI Smart Reply context
    chatHistory.push({
        nickname: data.nickname || 'Anonymous',
        message: data.message || '',
        isSentByMe: isSentByMe
    });
    if (chatHistory.length > 20) chatHistory.shift();

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    if (isSentByMe) msgDiv.classList.add('sent');
    else msgDiv.classList.add('received');
    if (data.msgId) msgDiv.dataset.msgId = data.msgId;

    const color = isSentByMe ? 'var(--text-muted)' : getNicknameColor(data.nickname);
    const avatar = isSentByMe ? '' : getAvatar(data.nickname, data.profilePic);
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    let contentEl;

    if (data.audio) {
        const bubbleId = 'vb-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
        _voiceData[bubbleId] = data.audio;
        const durLabel = data.audioDuration ? formatSeconds(data.audioDuration) : '0:00';

        const bubble = document.createElement('div');
        bubble.className = 'voice-bubble';
        bubble.id = bubbleId;

        const playBtn = document.createElement('button');
        playBtn.className = 'voice-bubble-play';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        
        // Prevent focus stealing
        playBtn.addEventListener('mousedown', (e) => e.preventDefault());
        playBtn.addEventListener('click', () => toggleVoiceBubble(bubbleId));

        const progressWrap = document.createElement('div');
        progressWrap.className = 'voice-bubble-progress';
        progressWrap.id = 'waveform-container-' + bubbleId;
        
        // Prevent focus stealing
        progressWrap.addEventListener('mousedown', (e) => e.preventDefault());
        progressWrap.addEventListener('click', (e) => seekVoiceBubble(e, bubbleId));

        const barCount = 28;
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'waveform-bar';
            let hash = 0;
            const str = bubbleId + i;
            for (let j = 0; j < str.length; j++) hash = str.charCodeAt(j) + ((hash << 5) - hash);
            const heightPercent = 15 + (Math.abs(hash) % 76);
            bar.style.height = heightPercent + '%';
            progressWrap.appendChild(bar);
        }

        const durSpan = document.createElement('span');
        durSpan.className = 'voice-bubble-duration';
        durSpan.id = 'dur-' + bubbleId;
        durSpan.textContent = durLabel;

        bubble.appendChild(playBtn);
        bubble.appendChild(progressWrap);
        bubble.appendChild(durSpan);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'bubble-timestamp';
        timeSpan.appendChild(document.createTextNode(timeStr));
        bubble.appendChild(timeSpan);
        contentEl = bubble;

    } else if (data.image) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble bubble-image';
        const img = document.createElement('img');
        img.src = data.image;
        img.alt = 'Sent image';
        img.className = 'message-image';
        img.addEventListener('click', () => openLightbox(data.image));
        bubble.appendChild(img);
        const timeSpan = document.createElement('span');
        timeSpan.className = 'bubble-timestamp';
        timeSpan.appendChild(document.createTextNode(timeStr));
        bubble.appendChild(timeSpan);
        contentEl = bubble;

    } else {
        const bubble = document.createElement('div');
        const singleEmoji = isSingleEmoji(data.message);

        // ── Reply quote block ──
        if (data.replyTo) {
            const quote = document.createElement('div');
            quote.className = 'reply-quote';
            const qName = document.createElement('div');
            qName.className = 'reply-quote-name';
            qName.textContent = data.replyTo.nickname;
            const qText = document.createElement('div');
            qText.className = 'reply-quote-text';
            qText.textContent = data.replyTo.preview;
            quote.appendChild(qName);
            quote.appendChild(qText);
            // Click to scroll to original
            quote.addEventListener('click', () => scrollToMessage(data.replyTo.msgId));
            bubble.appendChild(quote);
        }

        if (singleEmoji) {
            bubble.className = 'bubble big-emoji';
            const textSpan = document.createElement('span');
            textSpan.className = 'bubble-text big-emoji-text';
            textSpan.textContent = data.message;
            bubble.appendChild(textSpan);
            const timeSpan = document.createElement('span');
            timeSpan.className = 'bubble-timestamp big-emoji-timestamp';
            timeSpan.appendChild(document.createTextNode(timeStr));
            bubble.appendChild(timeSpan);
        } else {
            bubble.className = 'bubble';
            const textSpan = document.createElement('span');
            textSpan.className = 'bubble-text';
            textSpan.textContent = data.message;
            bubble.appendChild(textSpan);
            const timeSpan = document.createElement('span');
            timeSpan.className = 'bubble-timestamp';
            timeSpan.appendChild(document.createTextNode(timeStr));
            bubble.appendChild(timeSpan);
        }
        contentEl = bubble;
    }

    // Build message DOM
    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = 'bubble-wrapper';
    bubbleWrapper.appendChild(contentEl);

    if (!isSentByMe) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'message-info';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'sender-name';
        nameSpan.style.color = color;
        nameSpan.textContent = data.nickname;
        infoDiv.appendChild(nameSpan);
        msgDiv.appendChild(infoDiv);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    if (avatar) contentDiv.innerHTML = avatar;
    contentDiv.appendChild(bubbleWrapper);
    msgDiv.appendChild(contentDiv);

    // ── Reaction row (populated later) ──
    if (data.msgId) {
        const reactionRow = document.createElement('div');
        reactionRow.className = 'reaction-row';
        reactionRow.id = 'reactions-' + data.msgId;
        bubbleWrapper.appendChild(reactionRow);
    }

    // ── Action bar (react + reply) ──
    if (data.msgId) {
        const actionBar = document.createElement('div');
        actionBar.className = 'msg-action-bar';

        // Quick react popup (WhatsApp-style: 6 emojis + plus icon)
        const quickMenu = document.createElement('div');
        quickMenu.className = 'quick-react-menu';
        const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🙏'];
        QUICK_EMOJIS.forEach(em => {
            const btn = document.createElement('button');
            btn.className = 'quick-react-btn';
            btn.textContent = em;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                quickMenu.classList.remove('visible');
                msgDiv.classList.remove('action-visible');
                const previousEmoji = getMyReactionOnMsg(data.msgId);
                if (socket) socket.emit('toggle-reaction', { msgId: data.msgId, emoji: em, previousEmoji });
            });
            quickMenu.appendChild(btn);
        });
        
        // Plus button to open full emoji panel
        const plusBtn = document.createElement('button');
        plusBtn.className = 'quick-react-btn plus-btn';
        plusBtn.textContent = '+';
        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            quickMenu.classList.remove('visible');
            msgDiv.classList.remove('action-visible');
            showEmojiBottomSheet(data.msgId);
        });
        quickMenu.appendChild(plusBtn);
        
        bubbleWrapper.appendChild(quickMenu);

        // React button
        const reactBtn = document.createElement('button');
        reactBtn.className = 'msg-action-btn';
        reactBtn.title = 'React';
        reactBtn.innerHTML = '<i class="far fa-smile"></i>';
        reactBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = quickMenu.classList.contains('visible');
            // Close any open quick menus and bottom sheets first
            document.querySelectorAll('.quick-react-menu.visible').forEach(m => m.classList.remove('visible'));
            document.querySelectorAll('.emoji-bottom-sheet-overlay').forEach(m => m.remove());
            if (!isOpen) quickMenu.classList.add('visible');
        });

        // Reply button
        const replyBtn = document.createElement('button');
        replyBtn.className = 'msg-action-btn';
        replyBtn.title = 'Reply';
        replyBtn.innerHTML = '<i class="fas fa-reply"></i>';
        replyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            msgDiv.classList.remove('action-visible');
            const preview = data.audio ? '🎤 Voice message'
                          : data.image ? '🖼️ Image'
                          : (data.message || '').slice(0, 80);
            setReply({ msgId: data.msgId, nickname: data.nickname || 'You', preview });
        });

        actionBar.appendChild(reactBtn);
        actionBar.appendChild(replyBtn);
        bubbleWrapper.appendChild(actionBar);
    }

    // ── Long-press for mobile ──
    if (data.msgId) {
        let lpTimer = null;
        const startLP = () => {
            lpTimer = setTimeout(() => {
                document.querySelectorAll('.message.action-visible').forEach(m => m.classList.remove('action-visible'));
                msgDiv.classList.add('action-visible');
            }, 500);
        };
        const cancelLP = () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } };
        msgDiv.addEventListener('touchstart', startLP, { passive: true });
        msgDiv.addEventListener('touchend', cancelLP);
        msgDiv.addEventListener('touchmove', cancelLP);
    }

    // (Global menu closing listener handled in setupEventListeners)

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ── EMOJI PICKER CATEGORIES ──
const EMOJI_KEYBOARD_CATEGORIES = [
    {
        id: 'frequent',
        name: 'FREQUENTLY USED',
        iconClass: 'far fa-clock',
        emojis: ['❤️', '😍', '👍', '😂', '🔥', '👏', '🙏', '🥺', '😊', '🥰', '😘', '😮', '😢', '🙌', '🎉', '🌟']
    },
    {
        id: 'smileys',
        name: 'SMILEYS & PEOPLE',
        iconClass: 'far fa-smile',
        emojis: [
            '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🤫','🤥','😶','😐','😑','😬','🫠','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','😵‍💫','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕',
            '👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘','👌','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙','💪','🦾','🖕','✍️','🙏','🤝','👏','🙌','👐','🤲','💅','🤳'
        ]
    },
    {
        id: 'animals',
        name: 'ANIMALS & NATURE',
        iconClass: 'fas fa-paw',
        emojis: [
            '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦢','🦉','🦚','🦜','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🕷️','🕸️','🦂','🐢','🐍','🦎','🐙','🦑','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐑','🐐','🦌','🐕','🐩','🐈','🐇','🦡','🦫','🦦','🦥','🌲','🌳','🌴','🌵','🌱','🌿','☘️','🍀','🍁','🍂','🍃','🌸','🌹','🌺','🌻','🌼','🌷'
        ]
    },
    {
        id: 'food',
        name: 'FOOD & DRINK',
        iconClass: 'fas fa-hamburger',
        emojis: [
            '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🍄','🥜','🌰','🍞','🥐','🥖','🥨','🥯','🥞','🧀','🍖','🍗','🥩','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🍳','🥘','🍲','🥣','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🍨','🍧','🍦','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🥤','🧋','🧃','🧊'
        ]
    },
    {
        id: 'activity',
        name: 'ACTIVITY',
        iconClass: 'fas fa-running',
        emojis: [
            '👾','⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥅','🏒','🥍','🏏','🪃','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','🎿','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚴','🚵','🏆','🥇','🥈','🥉','🏅','🎖️','🎫','🎟️','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎸','🎺','🎻','🪕','🎲','🧩','🎳','🎯','🎮','🎰'
        ]
    },
    {
        id: 'travel',
        name: 'TRAVEL & PLACES',
        iconClass: 'fas fa-plane',
        emojis: [
            '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🚲','🛴','🛸','🚀','🚁','🛩️','✈️','🛫','🛬','⛵','🛥️','🚤','🚢','⚓','🛟','🚦','🚥','🚧','🗺️','🗿','🗽','🗼','🏰','🏯','⛰️','🏔️','🗻','🏕️','🏖️','🏜️','🏝️','🏡','🏢','🏥','🏫','🏛️','⛪','🕌','🕍','🌅','🌇','🌆','🌃','🌉','🪐','🌑','🌕','☀️','🌤️','⛈️','❄️','☔','🌀','🌈','🔥'
        ]
    },
    {
        id: 'objects',
        name: 'OBJECTS',
        iconClass: 'far fa-lightbulb',
        emojis: [
            '⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏳','📡','💡','🔦','🏮','🕯️','🪔','🗑️','🪞','🧳','🌂','☂️','🔑','🗝️','🔨','⛏️','🛠️','🗡️','🛡️','🔧','⚙️','🔩','⚖️','⛓️','🩹','🩺','🔬','🔭','🪛','🪚','🪜','🔗','📎','📌','📍','📝','💼','📁','📂','📅','📆','🗒️','📈','📉','📊','📋','📮','📫','📬','📦','📯','📜','📃','📑','🏷️','🎫','🎟️','🔍','🔎','✉️','📧','📨','📩','🧷','🧴','🧻','🧼','🧽','🪣','🧹','🧺','🧯','🛒','🚬'
        ]
    },
    {
        id: 'symbols',
        name: 'SYMBOLS',
        iconClass: 'fas fa-icons',
        emojis: [
            '💘','💖','💗','💓','💞','💕','💟','❣️','💔','❤️‍🔥','❤️‍🩹','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💯','💯','💢','💬','👁️‍🗨️','🗯️','💭','💤','🌐','🌀','🛐','🎴','🃏','🀄','🔔','🔕','🔇','🔈','🔉','🔊','📢','📣','🚩','🏳️','🏴','🏴‍☠️','🕉️','✡️','☸️','☯️','✝️','☦️','☪️','☮️','🕎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪','⏮️','🔼','▼️','🔽','🎦','📶','📳','📴','🪬','🧿','🪙','🧱','🪵','🪨','🛢️'
        ]
    },
    {
        id: 'flags',
        name: 'FLAGS',
        iconClass: 'far fa-flag',
        emojis: [
            '🏁','🚩','🎌','🏴','🏳','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇦🇫','🇦🇱','🇩🇿','🇦🇩','🇦🇴','🇦🇷','🇦🇲','🇦🇺','🇦🇹','🇦🇿','🇧🇸','🇧🇭','🇧🇩','🇧🇪','🇧🇿','🇧🇯','🇧🇹','🇧🇴','🇧🇦','🇧🇷','🇧🇳','🇧🇬','🇰🇭','🇨🇲','🇨🇦','🇨🇱','🇨🇳','🇨🇴','🇨🇷','🇭🇷','🇨🇺','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇪🇪','🇪🇹','🇪🇺','🇫🇯','🇫🇮','🇫🇷','🇬🇦','🇬🇪','🇩🇪','🇬🇭','🇬🇷','🇬🇹','🇭🇹','🇭🇳','🇭🇰','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇱','🇮🇹','🇯🇲','🇯🇵','🇩🇪','🇰🇪','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇮','🇱🇹','🇱🇺','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇽','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇦','🇲🇿','🇲🇲'
        ]
    }
];

// ── EMOJI SEARCH KEYWORDS ──
const EMOJI_KEYWORDS = {
    '❤️': 'love heart red like', '😍': 'love eyes heart smile face happy', '👍': 'thumbs up ok yes like',
    '😂': 'laugh tears joy face happy lol', '🔥': 'fire hot lit trend', '👏': 'clap hand praise',
    '🙏': 'please pray thank you hands thanks', '🥺': 'pleading cry face sad beg', '😊': 'smile blush happy face',
    '🥰': 'love hearts face happy blush', '😘': 'kiss face love blow', '😮': 'gasp mouth open surprise face wow',
    '😢': 'cry tear sad face', '🙌': 'hooray hands high five celebrate', '🎉': 'party celebrate congrats',
    '🌟': 'star shine bright', '😀': 'smile face happy', '😃': 'smile face happy open mouth',
    '😄': 'smile face happy squint eyes', '😁': 'grin face happy teeth', '😆': 'laugh squint face happy',
    '😅': 'sweat smile face happy relived', '🤣': 'lol roll floor laughing face', '😇': 'angel halo innocent face',
    '🙂': 'slight smile face', '🙃': 'upside down face', '😉': 'wink face', '😌': 'relieved face calm',
    '😋': 'yum delicious face food tongue', '😛': 'tongue face stick out', '😝': 'squint tongue face stick out',
    '😜': 'wink tongue face stick out crazy', '🤪': 'zany face crazy goofy', '🤨': 'eyebrow face suspicious raise',
    '🧐': 'monocle face class gentleman', '🤓': 'nerd geek face glasses', '😎': 'cool sunglasses face',
    '🥸': 'disguise mask mustache face', '🤩': 'star eyes face wow', '🥳': 'party horn hat face celebrate',
    '😏': 'smirk face sly grin', '😒': 'unamused face bored glare', '😞': 'disappointed sad face',
    '😔': 'pensive sad face deep', '😟': 'worried face anxious', '😕': 'confused face unsure',
    '🙁': 'slight frown face sad', '☹️': 'frown sad face', '😣': 'persevere face struggle stress',
    '😖': 'confounded face stress', '😫': 'tired face exhausted yawn', '😩': 'weary face exhausted cry',
    '😭': 'sob cry tears face heavy sad', '😤': 'triumph steam nose face angry', '😠': 'angry face mad',
    '😡': 'pout angry red face mad', '🤬': 'swear curse symbols mouth face angry', '🤯': 'explode head mind blown face',
    '😳': 'blush flushed wide eyes face embarrassed', '🥵': 'hot red sweat tongue face sun', '🥶': 'cold blue teeth ice face',
    '😱': 'scream fear shock face gasp', '😨': 'fear scared face', '😰': 'sweat fear face anxious',
    '😥': 'sad relieved sweat face cry', '😓': 'sweat face stress downcast', '🤗': 'hug hands face open',
    '🤔': 'think hand chin face ponder', '🫣': 'peep eye hand face peek hide', '🤭': 'giggle hand mouth face',
    '🤫': 'shh quiet finger mouth whisper', '🤥': 'lie nose grow long face liar', '😶': 'no mouth silent face',
    '😐': 'neutral face flat straight', '😑': 'expressionless face flat closed eyes', '😬': 'grimace teeth face awkward',
    '🫠': 'melt smile hot face', '🙄': 'roll eyes face bored dismiss', '😯': 'hushed surprise face',
    '😦': 'frown open mouth face sad surprise', '😧': 'anguished face pain', '😲': 'astonished face shock gasp',
    '🥱': 'yawn mouth open hand sleep face', '😴': 'sleep zzz face closed eyes', '🤤': 'drool face delicious sleep',
    '😪': 'sleepy snot bubble face tired', '😵': 'dizzy eyes crossed face', '😵‍💫': 'dizzy spiral eyes face',
    '🤐': 'zipper mouth face secret', '🥴': 'woozy drunk face sick uneven', '🤢': 'nauseated green face vomit sick',
    '🤮': 'vomit spew face barf sick', '🤧': 'sneeze tissue face cold sick', '😷': 'mask medical face sick protection',
    '🤒': 'thermometer sick face temperature', '🤕': 'bandage head hurt face injury', '👎': 'thumbs down no dislike',
    '👊': 'fist punch hit face', '✊': 'fist raise power solid', '🤛': 'fist left punch', '🤜': 'fist right punch',
    '🤞': 'fingers crossed luck hope', '✌️': 'peace victory sign fingers', '🤟': 'love you hand sign gesture',
    '🤘': 'rock on horns hand sign gesture', '👌': 'ok hand sign okay perfect', '👈': 'point left finger hand',
    '👉': 'point right finger hand', '👆': 'point up finger hand', '👇': 'point down finger hand',
    '☝️': 'index point up hand', '✋': 'stop hand high five raise', '🤚': 'raised back of hand',
    '🖐️': 'hand splayed fingers spread', '🖖': 'vulcan salute hand space', '👋': 'wave hello goodbye hand',
    '🤙': 'call me hand phone sign', '💪': 'muscle flex power strong bicep', '🦾': 'robot arm power mechanical',
    '🖕': 'middle finger flip off hand', '✍️': 'write pen hand pencil', '🤝': 'handshake shake hands agreement partners',
    '👐': 'open hands hug reach', '🤲': 'palms up together request pray', '💅': 'nail polish manicure care',
    '🤳': 'selfie photo phone camera'
};

// ── Show WhatsApp-style expanded emoji sheet drawer ──
function showEmojiBottomSheet(msgId) {
    currentReactionMsgId = msgId;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'emoji-bottom-sheet-overlay';

    // Create sheet
    const sheet = document.createElement('div');
    sheet.className = 'emoji-bottom-sheet';

    // Drag Handle
    const handle = document.createElement('div');
    handle.className = 'emoji-sheet-handle';
    sheet.appendChild(handle);

    // Header (Search Bar)
    const header = document.createElement('div');
    header.className = 'emoji-sheet-header';
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'emoji-search-container';
    
    const searchIcon = document.createElement('i');
    searchIcon.className = 'fas fa-search emoji-search-icon';
    searchContainer.appendChild(searchIcon);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'emoji-search-input';
    searchInput.placeholder = 'Search';
    searchInput.autocomplete = 'off';
    searchContainer.appendChild(searchInput);

    header.appendChild(searchContainer);
    sheet.appendChild(header);

    // Content Area
    const content = document.createElement('div');
    content.className = 'emoji-sheet-content';

    // Populate Categories
    EMOJI_KEYBOARD_CATEGORIES.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'emoji-category-section';
        section.id = 'emoji-sec-' + cat.id;

        const heading = document.createElement('div');
        heading.className = 'emoji-category-title';
        heading.textContent = cat.name;
        section.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'emoji-category-grid';

        cat.emojis.forEach(em => {
            const btn = document.createElement('button');
            btn.className = 'emoji-sheet-btn';
            btn.textContent = em;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentReactionMsgId) {
                    const previousEmoji = getMyReactionOnMsg(currentReactionMsgId);
                    if (socket) socket.emit('toggle-reaction', { msgId: currentReactionMsgId, emoji: em, previousEmoji });
                }
                closeSheet();
            });
            grid.appendChild(btn);
        });

        section.appendChild(grid);
        content.appendChild(section);
    });

    sheet.appendChild(content);

    // Footer Navigation
    const footer = document.createElement('div');
    footer.className = 'emoji-sheet-footer';

    EMOJI_KEYBOARD_CATEGORIES.forEach(cat => {
        const footBtn = document.createElement('button');
        footBtn.className = 'emoji-footer-icon-btn';
        footBtn.innerHTML = `<i class="${cat.iconClass}"></i>`;
        footBtn.title = cat.name;
        footBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Scroll content area to category
            const targetSec = content.querySelector('#emoji-sec-' + cat.id);
            if (targetSec) {
                content.scrollTo({
                    top: targetSec.offsetTop - content.offsetTop,
                    behavior: 'smooth'
                });
            }
            // Toggle active footer button
            footer.querySelectorAll('.emoji-footer-icon-btn').forEach(btn => btn.classList.remove('active'));
            footBtn.classList.add('active');
        });
        footer.appendChild(footBtn);
    });

    // Default first footer button to active
    footer.firstChild.classList.add('active');
    sheet.appendChild(footer);

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // Close function
    const closeSheet = () => {
        overlay.classList.remove('active');
        sheet.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
        }, 250);
    };

    // Close on overlay backdrop tap
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSheet();
    });

    // Handle search input events
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const searchResultsId = 'emoji-sec-search-results';

        // Remove previous search section if it exists
        const prevSearchSec = content.querySelector('#' + searchResultsId);
        if (prevSearchSec) prevSearchSec.remove();

        if (!query) {
            // Show all normal categories and footer
            content.querySelectorAll('.emoji-category-section').forEach(sec => sec.style.display = 'flex');
            footer.style.display = 'flex';
        } else {
            // Hide normal categories and footer
            content.querySelectorAll('.emoji-category-section').forEach(sec => sec.style.display = 'none');
            footer.style.display = 'none';

            // Create Search Results section
            const searchSection = document.createElement('div');
            searchSection.className = 'emoji-category-section';
            searchSection.id = searchResultsId;

            const heading = document.createElement('div');
            heading.className = 'emoji-category-title';
            heading.textContent = 'Search Results';
            searchSection.appendChild(heading);

            const grid = document.createElement('div');
            grid.className = 'emoji-category-grid';

            const matched = [];
            const seen = new Set();
            EMOJI_KEYBOARD_CATEGORIES.forEach(cat => {
                cat.emojis.forEach(em => {
                    if (seen.has(em)) return;
                    const keywords = EMOJI_KEYWORDS[em] || '';
                    if (em.includes(query) || keywords.includes(query)) {
                        matched.push(em);
                        seen.add(em);
                    }
                });
            });

            if (matched.length > 0) {
                matched.forEach(em => {
                    const btn = document.createElement('button');
                    btn.className = 'emoji-sheet-btn';
                    btn.textContent = em;
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (currentReactionMsgId) {
                            const previousEmoji = getMyReactionOnMsg(currentReactionMsgId);
                            if (socket) socket.emit('toggle-reaction', { msgId: currentReactionMsgId, emoji: em, previousEmoji });
                        }
                        closeSheet();
                    });
                    grid.appendChild(btn);
                });
            } else {
                const noResults = document.createElement('div');
                noResults.className = 'emoji-no-results';
                noResults.textContent = 'No matching emojis found';
                noResults.style.color = 'var(--text-muted)';
                noResults.style.fontSize = '0.9rem';
                noResults.style.padding = '20px 0';
                searchSection.appendChild(noResults);
            }

            searchSection.appendChild(grid);
            content.appendChild(searchSection);
        }
    });

    // Trigger animations
    setTimeout(() => {
        overlay.classList.add('active');
        sheet.classList.add('active');
        searchInput.focus();
    }, 10);
}

// ── Helper: find this user's current emoji on a message ──
function getMyReactionOnMsg(msgId) {
    if (!socket || !msgReactions[msgId]) return null;
    for (const [emoji, map] of Object.entries(msgReactions[msgId])) {
        if (map.has(socket.id)) return emoji;
    }
    return null;
}

// ── Show Instagram-style reaction sheet ──
function showReactionSheet(msgId) {
    const reactions = msgReactions[msgId] || {};
    // Collect all reactors across all emojis
    const allReactors = []; // { nickname, profilePic, emoji, isMe }
    Object.entries(reactions).forEach(([emoji, map]) => {
        map.forEach((user, sid) => {
            const { nickname, profilePic } = typeof user === 'object' ? user : { nickname: user, profilePic: null };
            const isMe = socket && sid === socket.id;
            allReactors.push({ nickname: isMe ? 'You' : nickname, profilePic, emoji, isMe });
        });
    });
    if (allReactors.length === 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'reactions-sheet-overlay';

    const sheet = document.createElement('div');
    sheet.className = 'reactions-sheet';

    const handle = document.createElement('div');
    handle.className = 'reactions-sheet-handle';

    const title = document.createElement('div');
    title.className = 'reactions-sheet-title';
    title.textContent = 'Reactions';

    sheet.appendChild(handle);
    sheet.appendChild(title);

    allReactors.forEach(({ nickname, profilePic, emoji, isMe }) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'reactions-sheet-row';

        const av = document.createElement('div');
        av.className = 'reactions-sheet-avatar';
        if (profilePic) {
            const img = document.createElement('img');
            img.src = profilePic;
            img.alt = nickname;
            av.appendChild(img);
        } else {
            av.textContent = nickname.charAt(0).toUpperCase();
            av.style.background = getNicknameColor(nickname);
        }

        const nameEl = document.createElement('span');
        nameEl.className = 'reactions-sheet-name' + (isMe ? ' is-me' : '');
        nameEl.textContent = nickname;

        const emojiEl = document.createElement('span');
        emojiEl.className = 'reactions-sheet-emoji';
        emojiEl.textContent = emoji;

        rowEl.appendChild(av);
        rowEl.appendChild(nameEl);
        rowEl.appendChild(emojiEl);

        // If this is the current user's row, add a Remove button
        if (isMe) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'reactions-sheet-remove-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (socket) socket.emit('toggle-reaction', { msgId, emoji, previousEmoji: null });
                overlay.remove();
                if (messageInput) messageInput.focus();
            });
            rowEl.appendChild(removeBtn);
        }

        sheet.appendChild(rowEl);
    });

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // Close on overlay background tap
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            if (messageInput) messageInput.focus();
        }
    });
}

// ── Render reaction pills for a msgId ──
function renderReactions(msgId) {
    const row = document.getElementById('reactions-' + msgId);
    if (!row) return;
    row.innerHTML = '';
    const reactions = msgReactions[msgId] || {};
    Object.entries(reactions).forEach(([emoji, map]) => {
        if (map.size === 0) return;
        const pill = document.createElement('button');
        const isMine = socket && map.has(socket.id);
        pill.className = 'reaction-pill' + (isMine ? ' mine' : '');

        const emSpan = document.createElement('span');
        emSpan.textContent = emoji;
        const countSpan = document.createElement('span');
        countSpan.textContent = map.size;

        pill.appendChild(emSpan);
        
        // Hide count only if total reactions on this emoji is 1 and room has 2 or fewer participants
        if (map.size > 1 || currentRoomUsersCount > 2) {
            pill.appendChild(countSpan);
        }

        // Tap the pill → open the reactions sheet
        pill.addEventListener('click', (e) => {
            e.stopPropagation();
            showReactionSheet(msgId);
        });

        row.appendChild(pill);
    });
}


// ── Reply bar management ──
function setReply({ msgId, nickname, preview }) {
    replyingTo = { msgId, nickname, preview };

    // Remove existing bar if any
    if (replyBarEl) replyBarEl.remove();

    const chatInputArea = document.querySelector('.chat-input-area');
    if (!chatInputArea) return;

    replyBarEl = document.createElement('div');
    replyBarEl.className = 'reply-preview-bar';

    const inner = document.createElement('div');
    inner.className = 'reply-preview-inner';

    const nameEl = document.createElement('div');
    nameEl.className = 'reply-preview-name';
    nameEl.textContent = nickname;

    const textEl = document.createElement('div');
    textEl.className = 'reply-preview-text';
    textEl.textContent = preview;

    inner.appendChild(nameEl);
    inner.appendChild(textEl);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'reply-cancel-btn';
    cancelBtn.innerHTML = '&times;';
    cancelBtn.addEventListener('mousedown', (e) => e.preventDefault());
    cancelBtn.addEventListener('click', clearReply);

    replyBarEl.appendChild(inner);
    replyBarEl.appendChild(cancelBtn);

    chatInputArea.insertBefore(replyBarEl, chatInputArea.firstChild);
    // Call focus immediately — mobile browsers require it to be inside the
    // user gesture (tap) context to open the keyboard. The layout is protected
    // by flex-shrink:0 on .chat-input-area so the textarea stays visible.
    if (messageInput) messageInput.focus();
}

function clearReply() {
    replyingTo = null;
    if (replyBarEl) { replyBarEl.remove(); replyBarEl = null; }
    setTimeout(() => {
        if (messageInput && !messageInput.disabled) messageInput.focus();
    }, 50);
}

// ── Scroll to quoted message and flash it ──
function scrollToMessage(msgId) {
    if (!msgId) return;
    const target = messagesContainer.querySelector('[data-msg-id="' + msgId + '"]');
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.remove('flash-highlight');
    void target.offsetWidth; // force reflow to restart animation
    target.classList.add('flash-highlight');
    setTimeout(() => target.classList.remove('flash-highlight'), 1400);
}

// ── Voice Bubble Playback ──
const _voiceData   = {};   // bubbleId → audio src (base64)
const _voiceAudios = {};   // bubbleId → Audio instance


function toggleVoiceBubble(bubbleId) {
    const src = _voiceData[bubbleId];
    if (!src) return;

    let audio = _voiceAudios[bubbleId];
    const playBtnI = document.querySelector('#' + bubbleId + ' .voice-bubble-play i');
    const dur      = document.getElementById('dur-' + bubbleId);

    if (!audio) {
        audio = new Audio(src);
        _voiceAudios[bubbleId] = audio;

        audio.ontimeupdate = () => {
            const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
            updateWaveformProgress(bubbleId, pct);
            if (dur) dur.textContent = formatSeconds(Math.floor(audio.currentTime));
        };
        audio.onended = () => {
            if (playBtnI) playBtnI.className = 'fas fa-play';
            updateWaveformProgress(bubbleId, 0);
        };
    }

    if (audio.paused) {
        // Pause all others
        Object.entries(_voiceAudios).forEach(([id, a]) => {
            if (id !== bubbleId && !a.paused) {
                a.pause();
                const otherI = document.querySelector('#' + id + ' .voice-bubble-play i');
                if (otherI) otherI.className = 'fas fa-play';
            }
        });
        audio.play().catch(() => {});
        if (playBtnI) playBtnI.className = 'fas fa-pause';
    } else {
        audio.pause();
        if (playBtnI) playBtnI.className = 'fas fa-play';
    }

    // Maintain keyboard focus!
    setTimeout(() => {
        if (messageInput && !messageInput.disabled) messageInput.focus();
    }, 50);
}

function seekVoiceBubble(event, bubbleId) {
    if (!_voiceData[bubbleId]) return;
    if (!_voiceAudios[bubbleId]) toggleVoiceBubble(bubbleId);
    const audio = _voiceAudios[bubbleId];
    if (!audio || !audio.duration) return;
    
    const target = event.currentTarget || event.target;
    if (!target) return;
    const rect  = target.getBoundingClientRect();
    
    // Extract clientX from touch or mouse event
    const clientX = (event.touches && event.touches[0]) ? event.touches[0].clientX : event.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;

    // Maintain keyboard focus!
    setTimeout(() => {
        if (messageInput && !messageInput.disabled) messageInput.focus();
    }, 50);
}

function updateWaveformProgress(bubbleId, pct) {
    const container = document.getElementById('waveform-container-' + bubbleId);
    if (!container) return;
    const bars = container.querySelectorAll('.waveform-bar');
    const activeCount = Math.round((pct / 100) * bars.length);
    bars.forEach((bar, idx) => {
        if (idx < activeCount) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });
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

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality); // Full HD quality
        callback(compressedBase64);
    };
    img.onerror = (err) => {
        console.error("Image loading failed for compression:", err);
        callback(base64Str);
    };
}

/* ══════════════════════════════════════
   Profile Picture Crop Modal Engine
   ══════════════════════════════════════ */
let _cropImg = null;       // source Image object
let _cropX = 0;            // pan offset X
let _cropY = 0;            // pan offset Y
let _cropScale = 1;        // zoom level
let _cropDragging = false;
let _cropDragStartX = 0;
let _cropDragStartY = 0;
let _cropDragOriginX = 0;
let _cropDragOriginY = 0;
let _cropPinchDist = 0;
let _cropCircleR = 0;      // radius of crop circle in canvas px
let _cropCanvasW = 0;
let _cropCanvasH = 0;

function openCropModal(src) {
    const modal = document.getElementById('crop-modal');
    const canvas = document.getElementById('crop-canvas');
    const wrap = document.getElementById('crop-canvas-wrap');
    const zoomSlider = document.getElementById('crop-zoom');
    if (!modal || !canvas || !wrap) return;

    // Show modal first so that wrap has physical dimensions!
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateThemeColor();

    _cropImg = new Image();
    _cropImg.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        _cropCanvasW = wrap.clientWidth || 400;
        _cropCanvasH = wrap.clientHeight || 340;

        // Size canvas with device pixel ratio scaling for high DPI (Retina) displays
        canvas.width  = _cropCanvasW * dpr;
        canvas.height = _cropCanvasH * dpr;
        canvas.style.width  = _cropCanvasW + 'px';
        canvas.style.height = _cropCanvasH + 'px';

        _cropCircleR = Math.min(_cropCanvasW, _cropCanvasH) * 0.42;

        // Position the circle overlay div
        const overlay = document.getElementById('crop-circle-overlay');
        const cx = _cropCanvasW / 2, cy = _cropCanvasH / 2;
        overlay.style.left   = (cx - _cropCircleR) + 'px';
        overlay.style.top    = (cy - _cropCircleR) + 'px';
        overlay.style.width  = (_cropCircleR * 2) + 'px';
        overlay.style.height = (_cropCircleR * 2) + 'px';

        // Fit image to fill circle by default
        const minDim = Math.min(_cropImg.width, _cropImg.height);
        _cropScale = (_cropCircleR * 2) / minDim;
        _cropX = _cropCanvasW / 2 - (_cropImg.width  * _cropScale) / 2;
        _cropY = _cropCanvasH / 2 - (_cropImg.height * _cropScale) / 2;

        zoomSlider.min   = (_cropCircleR * 2 / Math.max(_cropImg.width, _cropImg.height)).toFixed(3);
        zoomSlider.max   = 5;
        zoomSlider.value = _cropScale;

        renderCrop();
    };
    _cropImg.src = src;
}

function renderCrop() {
    const canvas = document.getElementById('crop-canvas');
    if (!canvas || !_cropImg) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(dpr, dpr); // scale context to support high-DPI preview sharpness
    ctx.drawImage(_cropImg, _cropX, _cropY, _cropImg.width * _cropScale, _cropImg.height * _cropScale);
    ctx.restore();
}

function closeCropModal() {
    const modal = document.getElementById('crop-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
    updateThemeColor();
    _cropImg = null;
}

function applyCrop() {
    if (!_cropImg) return;
    const cx = _cropCanvasW / 2, cy = _cropCanvasH / 2;
    const r  = _cropCircleR;
    const out = 800; // Increased output resolution to 800x800 for Ultra HD avatars!

    // Map crop circle center back to image coordinates
    const srcX = (cx - r - _cropX) / _cropScale;
    const srcY = (cy - r - _cropY) / _cropScale;
    const srcS = (r * 2) / _cropScale;

    const offscreen = document.createElement('canvas');
    offscreen.width  = out;
    offscreen.height = out;
    const ctx = offscreen.getContext('2d');

    // Clip to circle
    ctx.beginPath();
    ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(_cropImg, srcX, srcY, srcS, srcS, 0, 0, out, out);

    // Export with high-quality JPEG compression (0.95 quality for ultra HD rendering)
    const result = offscreen.toDataURL('image/jpeg', 0.95);
    myProfilePic = result;
    if (avatarPreviewImg) {
        avatarPreviewImg.src = result;
        avatarPreviewImg.classList.remove('hidden');
        avatarPreviewImg.style.objectFit = 'cover';
    }
    if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
    closeCropModal();
}

// ── Crop event wiring (called once from initLightbox area) ──
function initCropModal() {
    const wrap      = document.getElementById('crop-canvas-wrap');
    const zoomSlider = document.getElementById('crop-zoom');
    const useBtn    = document.getElementById('crop-use-btn');
    const cancelBtn = document.getElementById('crop-cancel-btn');
    if (!wrap) return;

    // Confirm / Cancel
    if (useBtn)    useBtn.addEventListener('click', applyCrop);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCropModal);

    // Zoom slider
    if (zoomSlider) {
        zoomSlider.addEventListener('input', () => {
            const newScale = parseFloat(zoomSlider.value);
            // Zoom toward center of circle
            const cx = _cropCanvasW / 2, cy = _cropCanvasH / 2;
            _cropX = cx - (cx - _cropX) * (newScale / _cropScale);
            _cropY = cy - (cy - _cropY) * (newScale / _cropScale);
            _cropScale = newScale;
            clampCrop();
            renderCrop();
        });
    }

    // Mouse drag
    wrap.addEventListener('mousedown', (e) => {
        _cropDragging = true;
        _cropDragStartX = e.clientX;
        _cropDragStartY = e.clientY;
        _cropDragOriginX = _cropX;
        _cropDragOriginY = _cropY;
    });
    window.addEventListener('mousemove', (e) => {
        if (!_cropDragging) return;
        _cropX = _cropDragOriginX + (e.clientX - _cropDragStartX);
        _cropY = _cropDragOriginY + (e.clientY - _cropDragStartY);
        clampCrop();
        renderCrop();
    });
    window.addEventListener('mouseup', () => { _cropDragging = false; });

    // Touch drag
    wrap.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            _cropDragging = true;
            _cropDragStartX = e.touches[0].clientX;
            _cropDragStartY = e.touches[0].clientY;
            _cropDragOriginX = _cropX;
            _cropDragOriginY = _cropY;
        } else if (e.touches.length === 2) {
            _cropDragging = false;
            _cropPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
        e.preventDefault();
    }, { passive: false });

    wrap.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && _cropDragging) {
            _cropX = _cropDragOriginX + (e.touches[0].clientX - _cropDragStartX);
            _cropY = _cropDragOriginY + (e.touches[0].clientY - _cropDragStartY);
            clampCrop();
            renderCrop();
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = dist / _cropPinchDist;
            const newScale = Math.min(5, Math.max(parseFloat(zoomSlider.min), _cropScale * delta));
            const cx = _cropCanvasW / 2, cy = _cropCanvasH / 2;
            _cropX = cx - (cx - _cropX) * (newScale / _cropScale);
            _cropY = cy - (cy - _cropY) * (newScale / _cropScale);
            _cropScale = newScale;
            if (zoomSlider) zoomSlider.value = _cropScale;
            _cropPinchDist = dist;
            clampCrop();
            renderCrop();
        }
        e.preventDefault();
    }, { passive: false });

    wrap.addEventListener('touchend', () => { _cropDragging = false; });

    // Scroll-to-zoom on desktop
    wrap.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.08 : 0.93;
        const newScale = Math.min(5, Math.max(parseFloat(zoomSlider.min || 0.1), _cropScale * delta));
        const cx = _cropCanvasW / 2, cy = _cropCanvasH / 2;
        _cropX = cx - (cx - _cropX) * (newScale / _cropScale);
        _cropY = cy - (cy - _cropY) * (newScale / _cropScale);
        _cropScale = newScale;
        if (zoomSlider) zoomSlider.value = _cropScale;
        clampCrop();
        renderCrop();
    }, { passive: false });
}

function clampCrop() {
    // Ensure the crop circle is always fully covered by the image
    const cx = _cropCanvasW / 2, cy = _cropCanvasH / 2;
    const r  = _cropCircleR;
    const iw = _cropImg ? _cropImg.width  * _cropScale : 0;
    const ih = _cropImg ? _cropImg.height * _cropScale : 0;
    // Max allowed pan: right/bottom edge of image must reach left/top edge of circle
    const maxX = cx - r;
    const maxY = cy - r;
    // Min allowed pan: left/top edge of image must reach right/bottom edge of circle
    const minX = cx + r - iw;
    const minY = cy + r - ih;
    _cropX = Math.min(maxX, Math.max(minX, _cropX));
    _cropY = Math.min(maxY, Math.max(minY, _cropY));
}

/* ══════════════════════════════════════
   Chat Members Modal Logic
   ══════════════════════════════════════ */
function initMembersModal() {
    const btn = document.getElementById('members-btn');
    const modal = document.getElementById('members-modal');
    const closeBtn = document.getElementById('members-close-btn');

    if (btn && modal) {
        btn.addEventListener('click', () => {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            updateThemeColor();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            updateThemeColor();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
                document.body.style.overflow = '';
                updateThemeColor();
            }
        });
    }
}

function updateMembersList(usersList) {
    const listWrap = document.getElementById('members-list-wrap');
    const badge = document.getElementById('members-badge');
    if (!listWrap) return;

    // Update badge count
    if (badge) {
        badge.textContent = usersList.length;
        badge.style.display = usersList.length > 0 ? 'flex' : 'none';
    }

    listWrap.innerHTML = '';
    
    // Find the admin user to check if current socket is the admin
    const adminMember = usersList.find(u => u.isAdmin);
    const adminSocketId = adminMember ? adminMember.id : null;
    amIAdmin = (socket && socket.id === adminSocketId); // update global
    updateAdminUI(); // show/hide invite btn + share section

    usersList.forEach(u => {
        const isMe = (socket && u.id === socket.id);
        const item = document.createElement('div');
        item.className = 'member-item';

        let avatarHtml = '';
        if (u.profilePic) {
            avatarHtml = `<div class="member-avatar-wrap"><img src="${u.profilePic}"></div>`;
        } else {
            const initial = u.nickname ? u.nickname.charAt(0).toUpperCase() : '?';
            avatarHtml = `<div class="member-avatar-wrap" style="background: ${getNicknameColor(u.nickname)}">${initial}</div>`;
        }

        let badgesHtml = '';
        if (isMe) {
            badgesHtml += '<span class="member-you-badge">You</span>';
        }
        if (u.isAdmin) {
            badgesHtml += '<span class="member-admin-badge">Admin</span>';
        }

        let kickBtnHtml = '';
        if (amIAdmin && !isMe) {
            kickBtnHtml = `
                <button class="member-remove-btn" data-socket-id="${u.id}" title="Remove Member">
                    <i class="fas fa-user-minus"></i> Remove
                </button>
            `;
        }

        item.innerHTML = `
            ${avatarHtml}
            <span class="member-name">${u.nickname || 'Anonymous'}</span>
            ${badgesHtml}
            ${kickBtnHtml}
        `;

        // Wire up kick button click
        const kickBtn = item.querySelector('.member-remove-btn');
        if (kickBtn) {
            kickBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetId = kickBtn.dataset.socketId;
                if (confirm(`Are you sure you want to remove ${u.nickname} from the chat?`)) {
                    if (socket) {
                        socket.emit('kick-user', { targetSocketId: targetId });
                    }
                }
            });
        }

        listWrap.appendChild(item);
    });
}


// ── Context-Aware AI Smart Reply Generator ──
function generateAISmartReplies() {
    if (chatHistory.length === 0) {
        return [
            "Hey! 👋 How's it going?",
            "Hello! Hope you're doing great 😊",
            "Hi there! What's up?",
            "Hey! What's new with you?",
            "Hello! Good to hear from you 🙌",
            "Yo! How's your day going?",
            "Hey hey! Long time no chat 😄",
            "Heyy! How have you been?",
            "Oh hey! What's the plan today?",
            "Hi! Hope your day is going well 🌟",
            "Hello there! What brings you here? 😄",
            "Hey! Always great to hear from you 🙌"
        ];
    }

    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg.isSentByMe) {
        return [
            "Let me know when you're free! 😊",
            "Talk to you soon!",
            "Hope you're doing well! 🌟",
            "No rush, reply when you can.",
            "You there? 👀",
            "Let me know what you think!",
            "Catch you later!",
            "Just checking in 😊",
            "Have a great day!",
            "Talk to you later! 👋",
            "Whenever you get a chance 👍",
            "Let's catch up soon!"
        ];
    }

    const text = (lastMsg.message || '').toLowerCase().trim();

    // Helper: checks if text STARTS WITH or IS one of the given words (ignores extra words like "bro", "man", "dude" etc.)
    const startsWith = (pattern) => pattern.test(text);
    const has = (pattern) => pattern.test(text);

    // ── 1. Greetings ──
    // Matches: "hii", "hii bro", "hey man", "hello there", "yo", "wassup dude" etc.
    // Uses \b word boundary — NOT ^...$, so extra words after greeting are fine
    if (!text ||
        /^\s*(hi+|hey+|hello+|hlo+|yo+|sup+|wassup|wsp|greetings|good\s*morning|good\s*evening|good\s*afternoon|namaste|howdy|hola|salut|salam|valakkam|vanakkam|heyya|heyyy|hiii|ahoy)\b/.test(text) ||
        /^(hi|hey|hello|yo|sup)\s+(bro|man|dude|buddy|guys|yaar|yar|jaan|bhai|sir|sis|there|all)/.test(text)
    ) {
        return [
            "Hey! 👋 How's it going?",
            "Hello! Hope you're doing great 😊",
            "Hi there! What's up?",
            "Hey! What's new with you?",
            "Hello! Good to hear from you 🙌",
            "Yo! How's your day going?",
            "Hey hey! Long time no chat 😄",
            "Heyy! How have you been?",
            "Oh hey! What's the plan today?",
            "Hi! Hope your day is going well 🌟",
            "Hello there! What brings you here? 😄",
            "Hey! Always great to hear from you 🙌"
        ];
    }

    // ── 2. What are you doing / wyd / up to ──
    if (/\b(wyd|wdyd|wud|wut\s+doing)\b/.test(text) ||
        /what.*(r\s+u|are\s+you|u\s+)(doing|up\s+to|upto)/.test(text) ||
        /watcha\s*doing|what\s+u\s+doing|what\s+r\s+u\s+doing/.test(text) ||
        /kya\s*(kar|kr|chal|krta|krti)/.test(text) ||
        /\b(kar\s*rha|kr\s*rha|kar\s*rahi|kr\s*rahi|kar\s*rhe|kr\s*rhe|chal\s*raha|chal\s*rha)\b/.test(text)
    ) {
        return [
            "Just chilling 😌 how about you?",
            "Nothing much, just chatting. You?",
            "Reading messages, what are you up to?",
            "Getting some work done. You?",
            "Just relaxing at home 🏠",
            "Surfing the web, how about you?",
            "Working on something, you?",
            "Just watching some videos 📺 you?",
            "Listening to music 🎵 what about you?",
            "Just about to eat, hbu?",
            "Taking a break from work. You?",
            "Not much! Just hanging 😄"
        ];
    }

    // ── 3. How are you ──
    if (/how\s+(are\s+you|r\s+u|u\s+doing|have\s+you\s+been|is\s+life|is\s+everything)/.test(text) ||
        /how'?s?\s+(it\s+going|life|things|everything|\bu\b)/.test(text) ||
        /\b(you|u)\s+ok\??/.test(text) ||
        /\b(kaisa|kaise|kese)\s*(hai|ho|hain|h)?\b/.test(text) ||
        /\b(kya\s+haal|haal\s+kya)\b/.test(text) ||
        /\b(hru|hows\s+u|how'?s\s+u)\b/.test(text) ||
        /\bhow\s+are\s+(u|ya)\b/.test(text)
    ) {
        return [
            "I'm doing great, thank you! 😊 How about you?",
            "All good here! What's new with you?",
            "Pretty busy but doing well. You?",
            "Can't complain! How have you been?",
            "Doing great! What are you up to?",
            "Everything is perfect, thank you!",
            "Feeling awesome today! 🌟 You?",
            "A bit tired but managing. You?",
            "Super! How are you doing?",
            "Could be better, but still good 😊",
            "Honestly, feeling fantastic! 🎉",
            "Good thanks! Just staying busy 💪"
        ];
    }

    // ── 4. Where are you ──
    if (/\bwhere\b.*(are\s+you|r\s+u|\bu\b|ya)/.test(text) ||
        /\b(kahan|kaha\s+ho|location|reached|arrived)\b/.test(text)
    ) {
        return [
            "I'm at home right now 🏠",
            "On my way there!",
            "Just heading out, you?",
            "I'm at work/school 📚",
            "Still at the usual place.",
            "I'll let you know when I arrive!",
            "Just reached! 🎉",
            "Stuck in traffic 😩",
            "Almost there, 5 minutes!",
            "At a café right now ☕",
            "Still haven't left yet 😅",
            "Just got back home actually!"
        ];
    }

    // ── 5. When / time ──
    if (/\bwhen\b.*(are\s+you|r\s+u|\bu\b|coming|free)/.test(text) ||
        /\b(what\s+time|how\s+long|\beta\b|be\s+there|till\s+when|\bkab\b)\b/.test(text)
    ) {
        return [
            "In a few minutes!",
            "Let's do it in an hour.",
            "Whenever works best for you.",
            "I'm free after 6 PM.",
            "Let's decide tomorrow.",
            "Right now, if you're ready!",
            "Give me 10 minutes!",
            "I'll be there by evening.",
            "How about this weekend?",
            "After I finish this task!",
            "Should be there by 5 PM.",
            "Soon! Just finishing something up."
        ];
    }

    // ── 6. Free / Busy / Available ──
    if (/\b(free|busy|available|occupied|khali)\b/.test(text)) {
        return [
            "Yes, I'm free right now! 😊",
            "A bit busy, can we chat later?",
            "Yeah, what's on your mind?",
            "I'll be free in 10 minutes.",
            "Unfortunately quite busy right now.",
            "Let me check my schedule.",
            "Totally free! What's up?",
            "Half-busy, but go ahead!",
            "Just finishing up, gimme 5 mins.",
            "Free after lunch, works?",
            "Mostly free today! Let's chat.",
            "Busy till evening, sorry!"
        ];
    }

    // ── 7. Thanks / Thank you ──
    if (/\b(thanks?|thank\s+you|ty|thx|thnx|tq|cheers|shukriya|dhanyawad)\b/.test(text)) {
        return [
            "You're very welcome! 😊",
            "Anytime!",
            "No problem at all!",
            "My pleasure!",
            "Glad I could help!",
            "Don't mention it! 😊",
            "Always happy to help 🙌",
            "That's what I'm here for!",
            "Of course, any time!",
            "Happy to! Let me know if you need anything else.",
            "Sure thing! 😄",
            "It was nothing, really!"
        ];
    }

    // ── 8. Sorry / Apology ──
    if (/\b(sorry|apologi|my\s+bad|oops|excuse\s+me|forgive|maaf|pardon)\b/.test(text)) {
        return [
            "No worries! 😊",
            "It's totally fine, don't stress.",
            "All good, happens to everyone!",
            "Don't worry about it!",
            "That's okay, I understand.",
            "No problem at all!",
            "It's all good, forget it! 😊",
            "Hey, mistakes happen!",
            "No hard feelings at all 🙌",
            "You're forgiven! 😄",
            "We all slip up sometimes!",
            "It's fine, honestly!"
        ];
    }

    // ── 9. Agreement / OK / Yes ──
    // Fixed: uses \b word boundaries, NOT ^...$, so "ok bro", "yeah sure", "cool man" all match
    if (/^\s*(ok|okay|fine|sure|yes|yeah|yep|cool|awesome|great|perfect|alright|aight|bet|yup|yass|absolutely|haan|haa|ji|bilkul|okey|okies|k|kk)\b/.test(text) ||
        /\b(sounds good|noted|got it)\b/.test(text)
    ) {
        return [
            "Awesome, sounds like a plan! 🎉",
            "Great! Talk to you then.",
            "Perfect. Let's do it.",
            "Cool, works for me!",
            "Alright, noted. 👍",
            "Sounds wonderful!",
            "Brilliant! Let's go 🚀",
            "That settles it then!",
            "Love it, let's make it happen!",
            "Deal! 🤝",
            "We're on the same page then!",
            "Looking forward to it! 😄"
        ];
    }

    // ── 10. No / Disagree ──
    // Fixed: uses flexible matching, NOT ^...$
    if (/^\s*(no|nope|nah|nay|never|nahi|na)\b/.test(text) ||
        /\bnot\s+really\b/.test(text)
    ) {
        return [
            "Oh okay, no problem.",
            "Got it, maybe next time!",
            "Alright, understood.",
            "No worries at all!",
            "Sure, that's fine 😊",
            "Okay, let me know if you change your mind.",
            "Fair enough!",
            "That's okay! We'll figure it out.",
            "No pressure at all 😊",
            "Alright, respect that!",
            "Cool, no biggie!",
            "Okay, maybe another time then?"
        ];
    }

    // ── 11. Laughing ──
    if (/\b(haha|hehe|lol|lmao|lmfao|rofl|ikr|xd)\b/.test(text) ||
        text.includes('😂') || text.includes('🤣')
    ) {
        return [
            "😂 Absolutely hilarious!",
            "Haha, right?! 😄",
            "Lol, too funny!",
            "I can't stop laughing! 🤣",
            "Lmao, classic!",
            "Haha, made my day! 😂",
            "Okay that was actually hilarious 💀",
            "I'm deceased 😂🤣",
            "Stop it, I'm crying laughing 😂",
            "This is too much lmao!",
            "Haha you're killing me 💀",
            "Lol literally can't 😂"
        ];
    }

    // ── 12. Farewell / Bye ──
    if (/\b(bye|goodbye|see\s+ya|see\s+you|talk\s+later|gn|goodnight|good\s+night|ttyl|take\s+care|cya|peace\s+out|alvida|ciao|tc|byee)\b/.test(text)) {
        return [
            "Goodbye! Take care 👋",
            "Talk to you later!",
            "Good night! Sweet dreams 😴",
            "See you tomorrow!",
            "Have a great rest of your day!",
            "Bye! Let's chat soon 😊",
            "Take care! Stay safe 🙌",
            "Until next time! 👋",
            "Miss you already! 😄",
            "Bye bye! 👋😊",
            "Catch you later!",
            "Adios! Have a wonderful day 🌟"
        ];
    }

    // ── 13. Love / Affection ──
    if (/\b(love|miss\s+you|cute|sweet|beautiful|amazing|wonderful|fantastic|gorgeous|adorable)\b/.test(text) ||
        text.includes('❤') || text.includes('🥰') || text.includes('💕')
    ) {
        return [
            "Aww, that's so sweet! 🥰",
            "Thank you, that means a lot! ❤️",
            "You're amazing too! 😊",
            "That's really kind of you!",
            "Aww, I feel the same way! 💕",
            "That's so lovely to hear! 😊",
            "You always know what to say 🥹",
            "Aw stop it, you're making me blush! 😊",
            "Right back at you! ❤️",
            "That just made my day! 🌟",
            "You're too sweet! 🥰",
            "Honestly, same! 💕"
        ];
    }

    // ── 14. Food / Eating ──
    if (/\b(food|eating|lunch|dinner|breakfast|hungry|snack|restaurant|cook|meal|pizza|burger|chai|coffee|tea|khana|biryani|noodles|sushi)\b/.test(text)) {
        return [
            "Ooh, that sounds delicious! 😋",
            "I'm hungry now just thinking about it!",
            "Let's grab food sometime! 🍕",
            "Yes! What are you having?",
            "I could go for some food right now! 😄",
            "That sounds amazing, where from?",
            "Send me some! 😂",
            "Okay now I'm starving 😩",
            "Is it good? Review please! 😄",
            "Wish I was there to eat with you!",
            "Save me some! 🍕",
            "Yum! What's cooking? 👨‍🍳"
        ];
    }

    // ── 15. Help / Support ──
    if (/\b(help|assist|stuck|problem|issue|trouble|error|fix|solution|guide|suggest)\b/.test(text) ||
        /\bhow\s+(do\s+i|to)\b/.test(text)
    ) {
        return [
            "Sure! What do you need help with?",
            "I'll do my best to help! 😊",
            "Tell me more, I'll figure it out.",
            "Let's solve this together!",
            "I've got you! What's the issue?",
            "No problem, what's going on?",
            "What's the problem? Let me know.",
            "Happy to help! Explain the issue.",
            "Sure thing, walk me through it.",
            "Let me look into that for you!",
            "We'll sort it out, don't worry! 💪",
            "Explain the situation and I'll help!"
        ];
    }

    // ── 16. Plans / Meeting ──
    if (/\b(plan|meet|hang\s*out|catch\s*up|party|event|trip|outing|visit|come\s*over|wanna|shall\s+we)\b/.test(text) ||
        /\blet'?s\s+go\b/.test(text)
    ) {
        return [
            "Sounds like a plan! 🎉",
            "I'm in! When and where?",
            "Let's do it! 🙌",
            "Would love to! Count me in.",
            "Oh yes, let's make it happen!",
            "I'm totally down for that! 😄",
            "Yes! Can't wait 🎉",
            "When are we thinking?",
            "Love the idea! Let's plan it.",
            "I'll clear my schedule! 😄",
            "Definitely! What's the plan?",
            "100% in! Let's go 🚀"
        ];
    }

    // ── 17. Sad / Not feeling well ──
    if (/\b(sad|upset|depressed|crying|tired|exhausted|stressed|anxious|lonely|heartbroken|bored|rough)\b/.test(text) ||
        /\b(not\s+good|not\s+okay|bad\s+day|not\s+well|feeling\s+low)\b/.test(text)
    ) {
        return [
            "Aww, I'm sorry to hear that 😢",
            "I'm here for you! Talk to me 💙",
            "That sounds really tough. Sending hugs! 🤗",
            "You've got this, I believe in you! 💪",
            "Things will get better, I promise 🌟",
            "I'm always here if you need to talk 💙",
            "Hope you feel better soon! 🌸",
            "Take it easy, rest up 💙",
            "That's rough, I'm sorry 😞",
            "You're stronger than you think! 💪",
            "Hang in there, it gets better!",
            "Sending positive vibes your way 🌟"
        ];
    }

    // ── 18. General questions ──
    if (text.endsWith('?') ||
        /\b(why|what|when|where|who|how|can you|will you|do you|should we|did you|have you)\b/.test(text)
    ) {
        return [
            "Yes, absolutely! 😊",
            "I'm not quite sure, let me check.",
            "No, I don't think so.",
            "Definitely, count me in!",
            "I'll think about it and let you know.",
            "That's a great point, let me think...",
            "Good question! I'll get back to you.",
            "Hmm, not sure honestly 🤔",
            "Yeah, probably!",
            "Let me find out for you.",
            "I think so, but let me confirm.",
            "Most likely yes! 😊"
        ];
    }

    // ── 19. Default fallback ──
    return [
        "Sounds good to me! 😊",
        "Alright, got it! 👍",
        "Could you tell me more about that?",
        "No problem!",
        "Oh, really? Tell me more!",
        "That's interesting, go on...",
        "I see, makes sense!",
        "For sure! 😊",
        "Interesting, keep going...",
        "Okay, noted! What next?",
        "Got it, what else? 😄",
        "Makes total sense to me!"
    ];
}

// ── Biometric Face ID Auth State & Logic ──
let faceScanVideoEl   = null;
let faceScanCanvasEl  = null;
let faceScanStatusEl  = null;
let faceScanDetailEl  = null;
let faceScanStream    = null;
let faceScanActive    = false;
let faceScanTimerId   = null;   // setTimeout-based loop
let faceScanAnimationId = null; // rAF overlay draw loop

let faceScanLivenessProgress = 0;
let faceScanLivenessDisplayProgress = 0;
let faceScanLivenessVerified = false;
let faceScanIsSettings  = false;
let faceScanDemoRunning = false;
let faceScanLastFrameData = null; // Uint8Array for motion tracking

// face-api.js state
let faceModelsLoaded  = false;
let faceModelsLoading = false;
let faceNoFaceCount   = 0;          // consecutive frames without a face
let facePrevLandmarks = null;        // previous frame landmarks for liveness
let faceMotionSum     = 0;           // accumulated motion score
let faceCapturedDescriptor = null;   // Float32Array(128) for current scan

const FACE_MODEL_URL   = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const FACE_MATCH_DIST  = 0.40;   // euclidean distance threshold — strict (0.40) so different people don't match
const FACE_NO_FACE_MAX = 20;     // ~6 sec of no-face before showing warning
const FACE_LIVENESS_NEEDED = 18; // detected frames needed to complete scan

// ── Load face-api.js neural network models ──
async function loadFaceModels() {
    if (faceModelsLoaded || faceModelsLoading) return;
    faceModelsLoading = true;
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL)
        ]);
        faceModelsLoaded = true;
        console.log('[FaceID] Models loaded ✓');
    } catch (e) {
        console.warn('[FaceID] Model load failed, will use demo mode only:', e);
    }
    faceModelsLoading = false;
}

// Run neural-net face detection on a video frame → returns detection or null
async function detectFaceNN(video) {
    if (!faceModelsLoaded || !video || video.readyState < 2) return null;
    try {
        // Tiny detector for fast bounding-box (inputSize: 224 is optimized for speed)
        const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.40 });
        const det  = await faceapi
            .detectSingleFace(video, opts)
            .withFaceLandmarks(false) // Use full 68-point landmarks (false = full, true = tiny)
            .withFaceDescriptor();
        return det || null;
    } catch (e) {
        console.warn('[FaceID] Detection failed:', e);
        return null;
    }
}

// Measure movement between two sets of face landmarks (for liveness)
function landmarkMotion(prev, curr) {
    if (!prev || !curr) return 0;
    const pts  = curr.positions;
    const ppts = prev.positions;
    if (!pts || pts.length !== ppts.length) return 0;
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
        sum += Math.abs(pts[i].x - ppts[i].x) + Math.abs(pts[i].y - ppts[i].y);
    }
    return sum / pts.length;
}

// Get list of all registered users
function getRegisteredUsers() {
    try {
        const raw = localStorage.getItem('piktalk_users');
        return raw ? JSON.parse(raw) : [];
    } catch(e) {
        return [];
    }
}

// Find matching user for a descriptor
function findMatchingUser(desc) {
    if (!desc) return null;
    const users = getRegisteredUsers();
    for (const u of users) {
        if (u.descriptor) {
            const storedDesc = new Float32Array(u.descriptor);
            const dist = faceapi.euclideanDistance(storedDesc, desc);
            console.log(`[FaceID] Comparing against user "${u.nickname || 'Unknown'}". Distance: ${dist.toFixed(4)}`);
            if (dist < FACE_MATCH_DIST) {
                return u;
            }
        }
    }
    return null;
}

// Save/update a user in the database
function saveUserInDatabase(faceUserId, descriptor, nickname, profilePic) {
    const users = getRegisteredUsers();
    let idx = users.findIndex(u => u.faceUserId === faceUserId);
    
    let descriptorArray = descriptor ? Array.from(descriptor) : null;
    if (!descriptorArray && idx !== -1) {
        descriptorArray = users[idx].descriptor;
    }
    
    let userNickname = nickname !== undefined ? nickname : '';
    if (userNickname === '' && idx !== -1) {
        userNickname = users[idx].nickname;
    }

    let userProfilePic = profilePic !== undefined ? profilePic : null;
    if (userProfilePic === null && idx !== -1) {
        userProfilePic = users[idx].profilePic;
    }

    const userObj = {
        faceUserId,
        descriptor: descriptorArray,
        nickname: userNickname,
        profilePic: userProfilePic
    };

    if (idx !== -1) {
        users[idx] = userObj;
    } else {
        users.push(userObj);
    }
    localStorage.setItem('piktalk_users', JSON.stringify(users));
}

// Save 128-dim face descriptor to database
function saveFaceDescriptor(descriptor) {
    const faceUserId = localStorage.getItem('piktalk_face_userid');
    if (faceUserId) {
        saveUserInDatabase(faceUserId, descriptor);
    }
    localStorage.setItem('piktalk_face_descriptor', JSON.stringify(Array.from(descriptor)));
    localStorage.setItem('piktalk_face_signature', JSON.stringify([1]));
}

// Load saved descriptor from database
function loadFaceDescriptor() {
    const faceUserId = localStorage.getItem('piktalk_face_userid');
    if (faceUserId) {
        const users = getRegisteredUsers();
        const u = users.find(x => x.faceUserId === faceUserId);
        if (u && u.descriptor) {
            return new Float32Array(u.descriptor);
        }
    }
    const raw = localStorage.getItem('piktalk_face_descriptor');
    if (!raw) return null;
    try { return new Float32Array(JSON.parse(raw)); } catch (e) { return null; }
}

// Compare new descriptor against stored one; returns true if same person
function faceDescriptorMatch(newDesc) {
    const stored = loadFaceDescriptor();
    if (!stored) return false;
    const dist = faceapi.euclideanDistance(stored, newDesc);
    console.log('[FaceID] distance:', dist.toFixed(4));
    return dist < FACE_MATCH_DIST;
}

// Extract a normalized 32x32 grayscale array from video/canvas
function extractFaceSignature(video, width = 32, height = 32) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Crop center 60% square of video (where face is placed)
    const size = Math.min(video.videoWidth, video.videoHeight || 300) || 300;
    const sx = ((video.videoWidth || 300) - size) / 2 + size * 0.2;
    const sy = ((video.videoHeight || 300) - size) / 2 + size * 0.2;
    const sWidth = size * 0.6;
    const sHeight = size * 0.6;
    
    try {
        tempCtx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } catch(e) {
        // Fallback if drawImage fails
        tempCtx.fillStyle = '#000';
        tempCtx.fillRect(0, 0, width, height);
    }
    
    const imgData = tempCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    
    const grayscale = new Float32Array(width * height);
    let min = 255;
    let max = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
        const val = rgbToGrayscale(pixels[i], pixels[i+1], pixels[i+2]);
        grayscale[i/4] = val;
        if (val < min) min = val;
        if (val > max) max = val;
    }
    
    // Normalize pixel values to [0, 1] to reduce lighting variations
    const range = max - min || 1;
    for (let i = 0; i < grayscale.length; i++) {
        grayscale[i] = (grayscale[i] - min) / range;
    }
    
    return Array.from(grayscale);
}

// Helper: rgb to grayscale
function rgbToGrayscale(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Helper to check for frozen stream/static image and track motion/liveness
function processLivenessFrame(video) {
    const size = 64;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Grab center area
    const vSize = Math.min(video.videoWidth, video.videoHeight || 300) || 300;
    const sx = ((video.videoWidth || 300) - vSize) / 2 + vSize * 0.25;
    const sy = ((video.videoHeight || 300) - vSize) / 2 + vSize * 0.25;
    const sSize = vSize * 0.5;
    
    try {
        tempCtx.drawImage(video, sx, sy, sSize, sSize, 0, 0, size, size);
    } catch(e) {
        return { isLive: false, diff: 0 };
    }
    
    const imgData = tempCtx.getImageData(0, 0, size, size).data;
    
    const currentFrame = new Uint8Array(size * size);
    for (let i = 0; i < imgData.length; i += 4) {
        currentFrame[i/4] = rgbToGrayscale(imgData[i], imgData[i+1], imgData[i+2]);
    }
    
    let isLive = false;
    let diff = 0;
    
    if (faceScanLastFrameData) {
        let absoluteDiffSum = 0;
        for (let i = 0; i < currentFrame.length; i++) {
            absoluteDiffSum += Math.abs(currentFrame[i] - faceScanLastFrameData[i]);
        }
        // Mean absolute frame difference
        diff = absoluteDiffSum / currentFrame.length;
        
        // Motion thresholds:
        // diff === 0 -> frozen video
        // diff > 0.1 -> normal human movement
        if (diff > 12) {
            // Camera moving too much
            isLive = false;
        } else if (diff > 0.1) {
            isLive = true;
        }
    }
    
    faceScanLastFrameData = currentFrame;
    return { isLive, diff };
}

// ── rAF overlay draw loop (oval guide + smooth percentage rendering) ──
function runFaceScanOverlay() {
    if (!faceScanActive) return;
    const video  = faceScanVideoEl;
    const canvas = faceScanCanvasEl;
    const ctx    = canvas ? canvas.getContext('2d') : null;

    // Smoothly interpolate the displayed percentage
    if (faceScanLivenessDisplayProgress < faceScanLivenessProgress) {
        // Increment smoothly towards target liveness progress
        faceScanLivenessDisplayProgress += (faceScanLivenessProgress - faceScanLivenessDisplayProgress) * 0.15;
        if (faceScanLivenessDisplayProgress > 99.5 && faceScanLivenessProgress >= 100) {
            faceScanLivenessDisplayProgress = 100;
        }
    }

    if (canvas && video && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth && video.videoWidth) {
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Oval alignment guide
        const pct = faceScanLivenessDisplayProgress / 100;
        ctx.strokeStyle = `rgba(16,185,129,${0.35 + pct * 0.65})`;
        ctx.lineWidth   = 3 + pct * 2;
        ctx.beginPath();
        ctx.ellipse(
            canvas.width / 2, canvas.height / 2,
            canvas.width * 0.28, canvas.height * 0.38,
            0, 0, 2 * Math.PI
        );
        ctx.stroke();
    }

    // Update status UI text smoothly at 60fps
    if (faceScanStatusEl && faceScanActive && !faceScanLivenessVerified) {
        const displayPercent = Math.floor(faceScanLivenessDisplayProgress);
        faceScanStatusEl.className = 'face-status';
        faceScanStatusEl.innerHTML =
            `<i class="fas fa-spinner fa-spin"></i> Scanning (${displayPercent}%)`;
    }

    faceScanAnimationId = requestAnimationFrame(runFaceScanOverlay);
}

// ── Main async detection loop (runs every ~300 ms) ──
async function runFaceScanLoop() {
    if (!faceScanActive) return;
    // Guard: stop if profile setup is visible (login scan only)
    if (!faceScanIsSettings && profileSetupSection && !profileSetupSection.classList.contains('hidden')) {
        stopFaceScanFlow();
        return;
    }

    const video = faceScanVideoEl;

    // Wait for video to be ready
    if (!video || video.readyState < 2) {
        if (faceScanActive) faceScanTimerId = setTimeout(runFaceScanLoop, 80);
        return;
    }

    // Show models-loading state
    if (!faceModelsLoaded) {
        if (faceScanStatusEl) faceScanStatusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing AI Engine...';
        if (faceScanDetailEl) faceScanDetailEl.textContent = 'Downloading neural network models...';
        if (faceScanActive)   faceScanTimerId = setTimeout(runFaceScanLoop, 100);
        return;
    }

    const faceNotFoundEl = document.getElementById(faceScanIsSettings ? 'settings-face-not-found' : 'face-not-found');

    // Run neural-net detection
    const detection = await detectFaceNN(video);

    if (!faceScanActive) return; // may have been stopped while awaiting

    if (!detection) {
        faceNoFaceCount++;
        if (faceNoFaceCount >= FACE_NO_FACE_MAX) {
            // Show face-not-found UI
            stopFaceScanFlow();
            if (faceScanStatusEl) {
                faceScanStatusEl.className = 'face-status error';
                faceScanStatusEl.innerHTML = '<i class="fas fa-circle-xmark"></i> Face Not Detected';
            }
            if (faceScanDetailEl) faceScanDetailEl.textContent = '';
            if (faceNotFoundEl)   faceNotFoundEl.classList.remove('hidden');
            return;
        }
        if (faceScanStatusEl) {
            faceScanStatusEl.className = 'face-status';
            faceScanStatusEl.innerHTML = '<i class="fas fa-magnifying-glass fa-spin"></i> Align your face...';
        }
        if (faceScanDetailEl) faceScanDetailEl.textContent = 'Please look directly at camera';
        if (faceScanActive)   faceScanTimerId = setTimeout(runFaceScanLoop, 80);
        return;
    }

    // Face detected — reset no-face counter
    faceNoFaceCount = 0;
    if (faceNotFoundEl) faceNotFoundEl.classList.add('hidden');

    // Liveness: measure landmark movement between frames
    const motion = landmarkMotion(facePrevLandmarks, detection.landmarks);
    facePrevLandmarks = detection.landmarks;
    faceMotionSum += motion;

    // Progress: require motion + consecutive detections (faster scan)
    if (motion > 0.3) faceScanLivenessProgress += 15;  // blink/head movement
    else              faceScanLivenessProgress += 8; // just visible face
    faceScanLivenessProgress = Math.min(100, faceScanLivenessProgress);

    if (faceScanDetailEl) faceScanDetailEl.textContent = 'Keep face steady, blink slowly';

    // Store latest descriptor for capture
    faceCapturedDescriptor = detection.descriptor;

    // Scan complete?
    if (faceScanLivenessProgress >= 100) {
        // Force display progress to 100 immediately
        faceScanLivenessDisplayProgress = 100;
        if (faceScanStatusEl) {
            faceScanStatusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning (100%)';
        }
        faceScanLivenessVerified = true;
        _onFaceScanComplete();
        return;
    }

    if (faceScanActive) faceScanTimerId = setTimeout(runFaceScanLoop, 80);
}

// Called when liveness + face verification is complete
async function _onFaceScanComplete() {
    const descriptor = faceCapturedDescriptor;

    if (faceScanIsSettings) {
        // Settings re-registration
        if (descriptor) saveFaceDescriptor(descriptor);
        saveBiometrics(descriptor, faceScanVideoEl);
        // Also push updated descriptor to server for cross-device sync
        const faceId = localStorage.getItem('piktalk_face_userid');
        if (faceId && descriptor) {
            const nickname = localStorage.getItem('piktalk_face_nickname') || '';
            _syncFaceToServer(faceId, descriptor, nickname, null);
        }
        handleScanSuccess('Face ID registered successfully!');
        return;
    }

    // ── Step 1: Check local device database first (fast) ──
    const localMatch = findMatchingUser(descriptor);
    if (localMatch) {
        localStorage.setItem('piktalk_face_userid', localMatch.faceUserId);
        myUserId = localMatch.faceUserId;
        sessionStorage.setItem('piktalk_userId', localMatch.faceUserId);
        
        // Ensure descriptor is stored in localStorage for future updates
        if (descriptor) {
            localStorage.setItem('piktalk_face_descriptor', JSON.stringify(Array.from(descriptor)));
        }
        
        saveBiometrics(descriptor, faceScanVideoEl);

        // Sync to server so cross-device match works!
        const savedProfile = JSON.parse(localStorage.getItem(`piktalk_profile_${localMatch.faceUserId}`) || '{}');
        if (descriptor) {
            _syncFaceToServer(localMatch.faceUserId, descriptor, savedProfile.nickname || '', savedProfile.profilePic || null);
        }

        handleScanSuccess('Access Granted!');
        return;
    }

    // ── Step 2: No local match → query server for cross-device match ──
    if (faceScanStatusEl) {
        faceScanStatusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking identity across devices...';
    }

    try {
        const resp = await fetch('/api/face/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descriptor: Array.from(descriptor) })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.matched) {
                console.log('[FaceID] Cross-device match found! User:', data.faceUserId, 'dist:', data.distance);
                // Restore the user on this new device
                localStorage.setItem('piktalk_face_userid', data.faceUserId);
                myUserId = data.faceUserId;
                sessionStorage.setItem('piktalk_userId', data.faceUserId);

                // Save their profile locally so future scans on this device are instant
                if (data.nickname) localStorage.setItem('piktalk_face_nickname', data.nickname);
                
                // Save to local profile storage key for autofill lookup
                const profKey = `piktalk_profile_${data.faceUserId}`;
                localStorage.setItem(profKey, JSON.stringify({ nickname: data.nickname || '', profilePic: data.profilePic || null }));
                
                // Restore profile picture preview if available
                if (data.profilePic) {
                    myProfilePic = data.profilePic;
                    if (avatarPreviewImg) {
                        avatarPreviewImg.src = data.profilePic;
                        avatarPreviewImg.classList.remove('hidden');
                        avatarPreviewImg.style.objectFit = 'cover';
                    }
                    if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
                }

                saveUserInDatabase(data.faceUserId, descriptor, data.nickname, data.profilePic);
                if (descriptor) {
                    localStorage.setItem('piktalk_face_descriptor', JSON.stringify(Array.from(descriptor)));
                }

                saveBiometrics(descriptor, faceScanVideoEl);
                handleScanSuccess('Welcome back! (Recognized across devices)');
                return;
            }
        }
    } catch(e) {
        console.warn('[FaceID] Server match failed, continuing as new user:', e);
    }

    // ── Step 3: Truly new user — create profile ──
    const newFaceUserId = 'u-face-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('piktalk_face_userid', newFaceUserId);
    myUserId = newFaceUserId;
    sessionStorage.setItem('piktalk_userId', newFaceUserId);

    if (descriptor) {
        localStorage.setItem('piktalk_face_descriptor', JSON.stringify(Array.from(descriptor)));
        saveUserInDatabase(newFaceUserId, descriptor);
    }
    saveBiometrics(descriptor, faceScanVideoEl);
    // Push to server so this face can be recognized on any other device
    if (descriptor) _syncFaceToServer(newFaceUserId, descriptor, '', null);
    handleScanSuccess('Biometrics Registered!');
}

// Push a face descriptor + metadata to the server face registry
async function _syncFaceToServer(faceUserId, descriptor, nickname, profilePic) {
    try {
        await fetch('/api/face/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                faceUserId,
                descriptor: Array.from(descriptor),
                nickname: nickname || '',
                profilePic: profilePic || null
            })
        });
        console.log('[FaceID] Synced to server:', faceUserId);
    } catch(e) {
        console.warn('[FaceID] Server sync failed (offline?):', e);
    }
}

// Save signature and snapshot avatar thumbnail
function saveBiometrics(signature, video) {
    try {
        localStorage.setItem('piktalk_face_signature', JSON.stringify(signature));
        
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 150;
        thumbCanvas.height = 150;
        const thumbCtx = thumbCanvas.getContext('2d');
        
        const size = Math.min(video.videoWidth || 300, video.videoHeight || 300) || 300;
        const sx = ((video.videoWidth || 300) - size) / 2;
        const sy = ((video.videoHeight || 300) - size) / 2;
        
        try {
            // Translate and scale to mirror the image horizontally, matching the mirrored preview
            thumbCtx.translate(150, 0);
            thumbCtx.scale(-1, 1);
            thumbCtx.drawImage(video, sx, sy, size, size, 0, 0, 150, 150);
            // Reset transform matrix
            thumbCtx.setTransform(1, 0, 0, 1, 0, 0);
        } catch(e) {
            // Mock if drawImage fails
            thumbCtx.fillStyle = '#10b981';
            thumbCtx.fillRect(0, 0, 150, 150);
        }
        
        const avatarDataURL = thumbCanvas.toDataURL('image/jpeg', 0.85);
        myProfilePic = avatarDataURL;
        
        // Update nickname modal avatar preview
        if (avatarPreviewImg) {
            avatarPreviewImg.src = avatarDataURL;
            avatarPreviewImg.classList.remove('hidden');
            avatarPreviewImg.style.objectFit = 'cover';
        }
        if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
        
        // Update local profile pic
        const currentProfile = JSON.parse(localStorage.getItem(_profileKey()) || '{}');
        currentProfile.profilePic = avatarDataURL;
        localStorage.setItem(_profileKey(), JSON.stringify(currentProfile));
    } catch(e) {
        console.error("Error saving biometrics:", e);
    }
}

// Open camera stream and kick off scan loops
function startFaceScanFlow(isSettings = false) {
    faceScanIsSettings = isSettings;
    faceScanActive     = true;
    faceScanLivenessProgress = 0;
    faceScanLivenessDisplayProgress = 0;
    faceScanLivenessVerified = false;
    faceScanDemoRunning = false;
    faceNoFaceCount     = 0;
    facePrevLandmarks   = null;
    faceMotionSum       = 0;
    faceCapturedDescriptor = null;

    if (isSettings) {
        faceScanVideoEl  = settingsVideo;
        faceScanCanvasEl = settingsCanvas;
        faceScanStatusEl = settingsScanStatus;
        faceScanDetailEl = null;
    } else {
        faceScanVideoEl  = faceVideo;
        faceScanCanvasEl = faceCanvas;
        faceScanStatusEl = faceStatus;
        faceScanDetailEl = faceDetail;
        // Clear nickname so each person types their own name after scan
        if (nicknameInput) nicknameInput.value = '';
    }

    if (!faceScanVideoEl) return;

    const scanner = faceScanVideoEl.closest('.circular-scanner');
    if (scanner) { scanner.className = 'circular-scanner scanning'; scanner.style.borderColor = ''; }

    if (faceScanStatusEl) {
        faceScanStatusEl.className = 'face-status';
        faceScanStatusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing camera...';
    }

    // Hide face-not-found overlay
    const faceNotFoundEl = document.getElementById(faceScanIsSettings ? 'settings-face-not-found' : 'face-not-found');
    if (faceNotFoundEl) faceNotFoundEl.classList.add('hidden');

    const videoConstraints = {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 640 },
        aspectRatio: { ideal: 1.0 }
    };

    const getCamStream = () => navigator.mediaDevices.getUserMedia({ video: videoConstraints })
        .catch(() => navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }));

    getCamStream()
        .then(stream => {
            faceScanStream = stream;
            if (faceScanVideoEl) {
                faceScanVideoEl.srcObject = stream;
                faceScanVideoEl.play().then(() => {
                    if (faceScanStatusEl) {
                        faceScanStatusEl.className = 'face-status';
                        faceScanStatusEl.innerHTML = '<i class="fas fa-magnifying-glass fa-spin"></i> Looking for face...';
                    }
                    // Start overlay draw loop (rAF)
                    faceScanAnimationId = requestAnimationFrame(runFaceScanOverlay);
                    // Start async detection loop immediately (100ms)
                    faceScanTimerId = setTimeout(runFaceScanLoop, 100);
                }).catch(e => console.error('Video play failed:', e));
            }
        })
        .catch(err => {
            console.error('Webcam blocked:', err);
            if (faceScanStatusEl) {
                faceScanStatusEl.className = 'face-status error';
                faceScanStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Camera Blocked';
            }
            if (faceScanDetailEl) {
                faceScanDetailEl.textContent = 'Please allow camera permissions or click Demo Mode to proceed.';
            }
        });
}

function stopFaceScanFlow() {
    faceScanActive = false;
    if (faceScanTimerId) { clearTimeout(faceScanTimerId); faceScanTimerId = null; }
    if (faceScanAnimationId) { cancelAnimationFrame(faceScanAnimationId); faceScanAnimationId = null; }
    if (faceScanStream) {
        faceScanStream.getTracks().forEach(t => t.stop());
        faceScanStream = null;
    }
    if (faceScanVideoEl) {
        faceScanVideoEl.srcObject = null;
    }
}

// Success feedback state transition
function handleScanSuccess(statusText) {
    stopFaceScanFlow();
    
    if (faceScanStatusEl) {
        faceScanStatusEl.className = 'face-status success';
        faceScanStatusEl.innerHTML = `<i class="fas fa-circle-check"></i> ${statusText}`;
    }
    if (faceScanDetailEl) {
        faceScanDetailEl.textContent = 'Biometric signature matched.';
    }
    
    if (faceScanVideoEl) {
        const scanner = faceScanVideoEl.closest('.circular-scanner');
        if (scanner) {
            scanner.className = 'circular-scanner success';
            scanner.style.borderColor = '';
        }
    }
    
    setTimeout(() => {
        if (faceScanIsSettings) {
            if (settingsScanStatus) {
                settingsScanStatus.className = 'settings-scan-status';
                settingsScanStatus.style.color = '#10b981';
                settingsScanStatus.innerHTML = '<i class="fas fa-circle-check"></i> Face Registered!';
            }
            // Show nickname input form
            if (settingsNicknameForm) {
                const savedProfile = JSON.parse(localStorage.getItem(_profileKey()) || '{}');
                if (settingsNicknameInput) settingsNicknameInput.value = savedProfile.nickname || '';
                settingsNicknameForm.classList.remove('hidden');
                setTimeout(() => { if (settingsNicknameInput) settingsNicknameInput.focus(); }, 100);
            }
            return;
        }
        
        // Load this face's profile (name is isolated per face ID)
        const savedProfile = JSON.parse(localStorage.getItem(_profileKey()) || '{}');
        
        if (statusText === "Access Granted!" || statusText.indexOf("Welcome back") !== -1) {
            // Autofill nickname from this person's own saved profile
            if (nicknameInput) nicknameInput.value = savedProfile.nickname || '';
            
            // Restore avatar preview: use saved profile pic if available,
            // otherwise keep the freshly captured face photo currently in myProfilePic
            if (savedProfile.profilePic) {
                myProfilePic = savedProfile.profilePic;
                if (avatarPreviewImg) {
                    avatarPreviewImg.src = savedProfile.profilePic;
                    avatarPreviewImg.classList.remove('hidden');
                    avatarPreviewImg.style.objectFit = 'cover';
                }
                if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
            } else {
                // Keep the freshly captured face from saveBiometrics
                if (myProfilePic) {
                    if (avatarPreviewImg) {
                        avatarPreviewImg.src = myProfilePic;
                        avatarPreviewImg.classList.remove('hidden');
                        avatarPreviewImg.style.objectFit = 'cover';
                    }
                    if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
                } else {
                    if (avatarPreviewImg) {
                        avatarPreviewImg.src = '';
                        avatarPreviewImg.classList.add('hidden');
                    }
                    if (avatarPreviewIcon) avatarPreviewIcon.classList.remove('hidden');
                }
            }
            
            // Transition view
            if (faceScanSection) faceScanSection.classList.add('hidden');
            if (profileSetupSection) profileSetupSection.classList.remove('hidden');
        } else {
            // First time login - clear previous nickname only. Keep the freshly captured face photo!
            if (nicknameInput) nicknameInput.value = '';
            
            // Ensure the freshly captured face is shown in the preview
            if (myProfilePic) {
                if (avatarPreviewImg) {
                    avatarPreviewImg.src = myProfilePic;
                    avatarPreviewImg.classList.remove('hidden');
                    avatarPreviewImg.style.objectFit = 'cover';
                }
                if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
            } else {
                if (avatarPreviewImg) {
                    avatarPreviewImg.src = '';
                    avatarPreviewImg.classList.add('hidden');
                }
                if (avatarPreviewIcon) avatarPreviewIcon.classList.remove('hidden');
            }

            if (faceScanSection) faceScanSection.classList.add('hidden');
            if (profileSetupSection) profileSetupSection.classList.remove('hidden');
        }
    }, 1200);
}

// Failure feedback flow
function handleScanFailure(statusText) {
    stopFaceScanFlow();
    
    if (faceScanStatusEl) {
        faceScanStatusEl.className = 'face-status error';
        faceScanStatusEl.innerHTML = `<i class="fas fa-circle-xmark"></i> ${statusText}`;
    }
    if (faceScanDetailEl) {
        faceScanDetailEl.textContent = 'Face verification failed.';
    }
    
    if (faceScanVideoEl) {
        const scanner = faceScanVideoEl.closest('.circular-scanner');
        if (scanner) {
            scanner.className = 'circular-scanner error';
            scanner.style.borderColor = '';
        }
    }
    
    // Show face-not-found overlay with mismatch message (without deleting stored credentials)
    const overlayId = faceScanIsSettings ? 'settings-face-not-found' : 'face-not-found';
    const faceNotFoundEl = document.getElementById(overlayId);
    if (faceNotFoundEl) {
        const msgEl = faceNotFoundEl.querySelector('.face-not-found-msg');
        if (msgEl) {
            msgEl.innerHTML = 'Biometric mismatch.<br>Face did not match stored credentials.';
        }
        faceNotFoundEl.classList.remove('hidden');
    }
}

// Simulates Face scan for modal step
function simulateFaceScan() {
    if (faceScanDemoRunning) return;
    faceScanDemoRunning = true;
    stopFaceScanFlow();
    
    faceScanLivenessProgress = 0;
    
    const scanner = faceVideo ? faceVideo.closest('.circular-scanner') : null;
    if (scanner) {
        scanner.className = 'circular-scanner scanning';
        scanner.style.borderColor = '';
    }
    
    let interval = setInterval(() => {
        faceScanLivenessProgress += 10;
        if (faceStatus) {
            faceStatus.className = 'face-status';
            faceStatus.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Simulating Biometrics (${faceScanLivenessProgress}%)`;
        }
        if (faceDetail) {
            faceDetail.textContent = 'Demo Mode: Simulating eye blink & head orientation check...';
        }
        
        if (faceScanLivenessProgress >= 100) {
            clearInterval(interval);
            
            const users = getRegisteredUsers();
            if (users.length > 0) {
                // Prompt user to select profile simulation mode (match vs new user)
                const userListText = users.map((u, i) => `${i + 1}. ${u.nickname || 'Unnamed User'}`).join('\n');
                const simulateMatch = confirm(`Simulate matching an existing profile?\n\nRegistered profiles:\n${userListText}\n\nClick "OK" to simulate matching existing, or "Cancel" to simulate a new user (brother).`);
                
                if (simulateMatch) {
                    const u = users[0];
                    localStorage.setItem('piktalk_face_userid', u.faceUserId);
                    myUserId = u.faceUserId;
                    sessionStorage.setItem('piktalk_userId', u.faceUserId);
                    handleScanSuccess("Access Granted!");
                } else {
                    // Simulate new user (brother)
                    const newFaceUserId = 'u-face-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
                    localStorage.setItem('piktalk_face_userid', newFaceUserId);
                    myUserId = newFaceUserId;
                    sessionStorage.setItem('piktalk_userId', newFaceUserId);

                    // Register mock signature
                    const mockSignature = Array(128).fill(0).map(() => Math.random());
                    saveUserInDatabase(newFaceUserId, mockSignature, '', null);
                    
                    // Create mock colored avatar (different color for new user)
                    const mockCanvas = document.createElement('canvas');
                    mockCanvas.width = 150;
                    mockCanvas.height = 150;
                    const mockCtx = mockCanvas.getContext('2d');
                    const gradient = mockCtx.createLinearGradient(0, 0, 150, 150);
                    gradient.addColorStop(0, '#f59e0b');
                    gradient.addColorStop(1, '#ef4444');
                    mockCtx.fillStyle = gradient;
                    mockCtx.fillRect(0, 0, 150, 150);
                    
                    mockCtx.fillStyle = '#ffffff';
                    mockCtx.beginPath();
                    mockCtx.arc(75, 75, 45, 0, 2*Math.PI);
                    mockCtx.fill();
                    mockCtx.fillStyle = '#f59e0b';
                    mockCtx.beginPath();
                    mockCtx.arc(60, 65, 5, 0, 2*Math.PI);
                    mockCtx.arc(90, 65, 5, 0, 2*Math.PI);
                    mockCtx.fill();
                    mockCtx.strokeStyle = '#f59e0b';
                    mockCtx.lineWidth = 4;
                    mockCtx.beginPath();
                    mockCtx.arc(75, 75, 25, 0.1 * Math.PI, 0.9 * Math.PI);
                    mockCtx.stroke();
                    
                    const mockAvatarDataURL = mockCanvas.toDataURL();
                    myProfilePic = mockAvatarDataURL;
                    
                    if (avatarPreviewImg) {
                        avatarPreviewImg.src = mockAvatarDataURL;
                        avatarPreviewImg.classList.remove('hidden');
                        avatarPreviewImg.style.objectFit = 'cover';
                    }
                    if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
                    
                    const profile = { nickname: '', profilePic: mockAvatarDataURL };
                    localStorage.setItem(_profileKey(), JSON.stringify(profile));
                    
                    handleScanSuccess("Biometrics Registered!");
                }
            } else {
                // Generate new permanent face-based user ID
                const newFaceUserId = 'u-face-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
                localStorage.setItem('piktalk_face_userid', newFaceUserId);
                myUserId = newFaceUserId;
                sessionStorage.setItem('piktalk_userId', newFaceUserId);

                // Register mock signature
                const mockSignature = Array(128).fill(0).map(() => Math.random());
                saveUserInDatabase(newFaceUserId, mockSignature, '', null);
                
                // Create mock colored avatar
                const mockCanvas = document.createElement('canvas');
                mockCanvas.width = 150;
                mockCanvas.height = 150;
                const mockCtx = mockCanvas.getContext('2d');
                const gradient = mockCtx.createLinearGradient(0, 0, 150, 150);
                gradient.addColorStop(0, '#10b981');
                gradient.addColorStop(1, '#3b82f6');
                mockCtx.fillStyle = gradient;
                mockCtx.fillRect(0, 0, 150, 150);
                
                mockCtx.fillStyle = '#ffffff';
                mockCtx.beginPath();
                mockCtx.arc(75, 75, 45, 0, 2*Math.PI);
                mockCtx.fill();
                mockCtx.fillStyle = '#10b981';
                mockCtx.beginPath();
                mockCtx.arc(60, 65, 5, 0, 2*Math.PI);
                mockCtx.arc(90, 65, 5, 0, 2*Math.PI);
                mockCtx.fill();
                mockCtx.strokeStyle = '#10b981';
                mockCtx.lineWidth = 4;
                mockCtx.beginPath();
                mockCtx.arc(75, 75, 25, 0.1 * Math.PI, 0.9 * Math.PI);
                mockCtx.stroke();
                
                const mockAvatarDataURL = mockCanvas.toDataURL();
                myProfilePic = mockAvatarDataURL;
                
                if (avatarPreviewImg) {
                    avatarPreviewImg.src = mockAvatarDataURL;
                    avatarPreviewImg.classList.remove('hidden');
                    avatarPreviewImg.style.objectFit = 'cover';
                }
                if (avatarPreviewIcon) avatarPreviewIcon.classList.add('hidden');
                
                const profile = { nickname: '', profilePic: mockAvatarDataURL };
                localStorage.setItem(_profileKey(), JSON.stringify(profile));
                
                handleScanSuccess("Biometrics Registered!");
            }
        }
    }, 150);
}

// Simulates Face scan for Settings step
function simulateSettingsFaceScan() {
    if (faceScanDemoRunning) return;
    faceScanDemoRunning = true;
    stopFaceScanFlow();
    
    faceScanLivenessProgress = 0;
    
    const scanner = settingsVideo ? settingsVideo.closest('.circular-scanner') : null;
    if (scanner) {
        scanner.className = 'circular-scanner scanning';
        scanner.style.borderColor = '';
    }
    
    let interval = setInterval(() => {
        faceScanLivenessProgress += 10;
        if (settingsScanStatus) {
            settingsScanStatus.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Simulating Biometrics (${faceScanLivenessProgress}%)`;
        }
        
        if (faceScanLivenessProgress >= 100) {
            clearInterval(interval);
            
            const mockSignature = Array(128).fill(0).map(() => Math.random());
            localStorage.setItem('piktalk_face_descriptor', JSON.stringify(mockSignature));
            localStorage.setItem('piktalk_face_signature', JSON.stringify([1]));
            
            const mockCanvas = document.createElement('canvas');
            mockCanvas.width = 150;
            mockCanvas.height = 150;
            const mockCtx = mockCanvas.getContext('2d');
            const gradient = mockCtx.createLinearGradient(0, 0, 150, 150);
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(1, '#8b5cf6');
            mockCtx.fillStyle = gradient;
            mockCtx.fillRect(0, 0, 150, 150);
            
            mockCtx.fillStyle = '#ffffff';
            mockCtx.beginPath();
            mockCtx.arc(75, 75, 45, 0, 2*Math.PI);
            mockCtx.fill();
            mockCtx.fillStyle = '#10b981';
            mockCtx.beginPath();
            mockCtx.arc(60, 65, 5, 0, 2*Math.PI);
            mockCtx.arc(90, 65, 5, 0, 2*Math.PI);
            mockCtx.fill();
            mockCtx.strokeStyle = '#10b981';
            mockCtx.lineWidth = 4;
            mockCtx.beginPath();
            mockCtx.arc(75, 75, 25, 0.1 * Math.PI, 0.9 * Math.PI);
            mockCtx.stroke();
            
            const mockAvatarDataURL = mockCanvas.toDataURL();
            myProfilePic = mockAvatarDataURL;
            
            const currentProfile = JSON.parse(localStorage.getItem(_profileKey()) || '{}');
            currentProfile.profilePic = mockAvatarDataURL;
            localStorage.setItem(_profileKey(), JSON.stringify(currentProfile));
            
            handleScanSuccess("Face ID registered successfully!");
        }
    }, 150);
}

// Settings modal operations
function openSettings() {
    if (settingsModal) {
        settingsModal.classList.add('open');
        if (typeof _closeRoomConversation === 'function') _closeRoomConversation();
        updateSettingsUI();
        renderChatHistoryInSettings();
        _initSettingsEnhancements();
    }
}

function closeSettings() {
    if (settingsModal) {
        settingsModal.classList.remove('open');
    }
    stopFaceScanFlow();
    if (settingsScanContainer) settingsScanContainer.classList.add('hidden');
}

function updateSettingsUI() {
    const rawProfile = localStorage.getItem(_profileKey());
    let nickname = "Not Logged In";
    let profilePic = null;
    
    if (myNickname) {
        nickname = myNickname;
        profilePic = myProfilePic;
    } else if (rawProfile) {
        const profile = JSON.parse(rawProfile);
        nickname = profile.nickname || "User";
        profilePic = profile.profilePic;
    }
    
    if (settingsNickname) settingsNickname.textContent = nickname;
    
    const settingsAvatarImg = document.getElementById('settings-avatar-img');
    const settingsAvatarPlaceholder = document.getElementById('settings-avatar-placeholder');
    
    if (profilePic && settingsAvatarImg && settingsAvatarPlaceholder) {
        settingsAvatarImg.src = profilePic;
        settingsAvatarImg.classList.remove('hidden');
        settingsAvatarPlaceholder.classList.add('hidden');
    } else if (settingsAvatarImg && settingsAvatarPlaceholder) {
        settingsAvatarImg.classList.add('hidden');
        settingsAvatarPlaceholder.classList.remove('hidden');
    }
    
    // Check for real neural-net descriptor first, fall back to legacy key
    const hasFace = localStorage.getItem('piktalk_face_descriptor') || localStorage.getItem('piktalk_face_signature');
    if (hasFace) {
        if (settingsBioStatus) {
            settingsBioStatus.className = 'biometric-value status-registered';
            settingsBioStatus.innerHTML = '<i class="fas fa-circle-check"></i> Face Registered';
        }
        if (settingsRemoveFaceBtn) settingsRemoveFaceBtn.classList.remove('hidden');
    } else {
        if (settingsBioStatus) {
            settingsBioStatus.className = 'biometric-value status-unregistered';
            settingsBioStatus.innerHTML = '<i class="fas fa-circle-xmark"></i> Unregistered';
        }
        if (settingsRemoveFaceBtn) settingsRemoveFaceBtn.classList.add('hidden');
    }
}

function removeFaceCredentials() {
    if (confirm("Are you sure you want to remove your Face ID profile? This will delete your stored biometrics and nickname.")) {
        localStorage.removeItem('piktalk_face_descriptor');  // new neural-net key
        localStorage.removeItem('piktalk_face_signature');   // legacy key
        // Remove the per-face profile too
        const faceId = localStorage.getItem('piktalk_face_userid');
        if (faceId) localStorage.removeItem(`piktalk_profile_${faceId}`);
        localStorage.removeItem('piktalk_profile_guest');
        localStorage.removeItem('piktalk_face_userid');
        myNickname   = '';
        myProfilePic = '';

        if (avatarPreviewImg)  avatarPreviewImg.classList.add('hidden');
        if (avatarPreviewIcon) avatarPreviewIcon.classList.remove('hidden');
        if (nicknameInput)     nicknameInput.value = '';

        updateSettingsUI();
        alert("Face ID credentials removed successfully.");
    }
}

function startSettingsFaceRegistration() {
    if (!settingsScanContainer) return;

    // Stop any currently running scan first
    stopFaceScanFlow();

    // Re-query elements in case they weren't ready at init time
    settingsVideo  = document.getElementById('settings-video');
    settingsCanvas = document.getElementById('settings-canvas');
    settingsScanStatus = document.getElementById('settings-scan-status');

    // Show the scanner container
    settingsScanContainer.classList.remove('hidden');

    if (settingsScanStatus) {
        settingsScanStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting camera...';
    }

    // Hide and reset nickname form for fresh scan
    if (settingsNicknameForm) settingsNicknameForm.classList.add('hidden');
    if (settingsNicknameInput) settingsNicknameInput.value = '';
    if (settingsScanStatus) settingsScanStatus.style.color = '';

    // Small delay to allow the container to render before camera starts
    setTimeout(() => {
        startFaceScanFlow(true); // true = registering from Settings
    }, 150);
}

function saveSettingsNickname() {
    const newName = settingsNicknameInput ? settingsNicknameInput.value.trim() : '';
    if (!newName) {
        if (settingsNicknameInput) {
            settingsNicknameInput.focus();
            settingsNicknameInput.style.borderColor = 'var(--danger)';
            setTimeout(() => { settingsNicknameInput.style.borderColor = ''; }, 1500);
        }
        return;
    }

    // Save to localStorage profile
    const profile = JSON.parse(localStorage.getItem(_profileKey()) || '{}');
    saveProfileLocally(newName, profile.profilePic || myProfilePic);

    // Update live session nickname if user is already in chat
    myNickname = newName;

    // Hide scanner and name form, refresh settings panel
    if (settingsScanContainer) settingsScanContainer.classList.add('hidden');
    if (settingsNicknameForm) settingsNicknameForm.classList.add('hidden');

    // Show a brief success flash on the save button
    if (settingsSaveNameBtn) {
        const origHTML = settingsSaveNameBtn.innerHTML;
        settingsSaveNameBtn.innerHTML = '<i class="fas fa-circle-check"></i> Saved!';
        settingsSaveNameBtn.disabled = true;
        setTimeout(() => {
            settingsSaveNameBtn.innerHTML = origHTML;
            settingsSaveNameBtn.disabled = false;
            updateSettingsUI();
        }, 1000);
    } else {
        updateSettingsUI();
    }
}

// Pre-load AI models immediately on script execution
loadFaceModels();


// ═══════════════════════════════════════════════════════════════
// FACE ID VERIFICATION BYPASS (Phone Modal Disabled)
// ═══════════════════════════════════════════════════════════════
function getFaceUserId() {
    return localStorage.getItem('piktalk_face_userid') || null;
}

function showPhoneModal(onVerified) {
    // Phone verification is removed; immediately proceed to Face ID setup/scan
    onVerified();
}

// ═══════════════════════════════════════════════════════════════
// CHAT HISTORY PER FACE ID
// ═══════════════════════════════════════════════════════════════
const HISTORY_MAX = 200; // max messages to store per room

function _historyKey(faceUserId, roomID) {
    return `piktalk_history_${faceUserId}_${roomID}`;
}

function saveMsgToHistory(data) {
    const faceUserId = getFaceUserId();
    if (!faceUserId || !currentRoomID) return;
    // Only save text messages (skip large images/audio to save space)
    if (data.image || data.audio) return;
    try {
        const key = _historyKey(faceUserId, currentRoomID);
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const entry = {
            nickname: data.nickname || 'Anonymous',
            text: data.message || '',
            time: data.time || new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            profilePic: null, // don't store profile pics (large)
            isMine: data.id === (socket && socket.id)
        };
        existing.push(entry);
        // Keep only last HISTORY_MAX messages
        if (existing.length > HISTORY_MAX) existing.splice(0, existing.length - HISTORY_MAX);
        localStorage.setItem(key, JSON.stringify(existing));
    } catch(e) { /* storage full or blocked */ }
}

function loadAndRenderHistory(roomID) {
    const faceUserId = getFaceUserId();
    if (!faceUserId || !roomID) return;
    try {
        const key = _historyKey(faceUserId, roomID);
        const msgs = JSON.parse(localStorage.getItem(key) || '[]');
        if (!msgs.length) return;
        if (!messagesContainer) return;
        // Add a separator
        const sep = document.createElement('div');
        sep.style.cssText = 'text-align:center;color:var(--text-muted);font-size:0.75rem;padding:8px 0;opacity:0.6;';
        sep.textContent = `— ${msgs.length} messages from history —`;
        messagesContainer.appendChild(sep);
        msgs.forEach(msg => {
            const isMine = msg.isMine || (msg.nickname && myNickname && msg.nickname.trim().toLowerCase() === myNickname.trim().toLowerCase());
            const bubble = document.createElement('div');
            bubble.className = `message ${isMine ? 'sent' : 'received'} history-msg`;
            bubble.style.opacity = '0.75';
            bubble.innerHTML = `
                <div class="message-bubble">
                    ${!isMine ? `<span class="message-name">${msg.nickname}</span>` : ''}
                    <div class="message-text">${escapeHtml(msg.text)}</div>
                    <div class="message-time">${msg.time}</div>
                </div>`;
            messagesContainer.appendChild(bubble);
        });
        // Separator after history
        const sep2 = document.createElement('div');
        sep2.style.cssText = 'text-align:center;color:var(--text-muted);font-size:0.75rem;padding:8px 0;opacity:0.6;';
        sep2.textContent = '— Live messages —';
        messagesContainer.appendChild(sep2);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch(e) { /* ignore */ }
}

function getAllHistoryRooms() {
    const faceUserId = getFaceUserId();
    if (!faceUserId) return [];
    const rooms = [];
    const prefix = `piktalk_history_${faceUserId}_`;
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
            const roomID = k.replace(prefix, '');
            try {
                const msgs = JSON.parse(localStorage.getItem(k) || '[]');
                rooms.push({ roomID, count: msgs.length, last: msgs[msgs.length - 1] || null });
            } catch(e) {}
        }
    }
    return rooms.sort((a, b) => b.count - a.count);
}

function clearRoomHistory(roomID) {
    const faceUserId = getFaceUserId();
    if (!faceUserId) return;
    localStorage.removeItem(_historyKey(faceUserId, roomID));
}

function clearAllHistory() {
    const faceUserId = getFaceUserId();
    if (!faceUserId) return;
    const prefix = `piktalk_history_${faceUserId}_`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS ENHANCEMENTS: THEME TOGGLE + HISTORY
// ═══════════════════════════════════════════════════════════════
function renderChatHistoryInSettings() {
    const listEl = document.getElementById('settings-history-list');
    if (!listEl) return;
    const rooms = getAllHistoryRooms();
    if (!rooms.length) {
        listEl.innerHTML = `<div class="settings-history-empty"><i class="fas fa-message-slash"></i><p>No chat history yet</p></div>`;
        return;
    }
    listEl.innerHTML = rooms.map(r => `
        <div class="history-room-row" onclick="window._showRoomConversation('${escapeHtml(r.roomID)}')">
            <div class="history-room-icon"><i class="fas fa-comments"></i></div>
            <div class="history-room-info">
                <div class="history-room-id">${escapeHtml(r.roomID)}</div>
                <div class="history-room-meta">${r.count} messages${r.last ? ' · ' + (r.last.text || '').substring(0,30) : ''}</div>
            </div>
            <button class="history-room-clear" onclick="event.stopPropagation(); window._clearRoomHistoryFromUI('${escapeHtml(r.roomID)}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

window._clearRoomHistoryFromUI = function(roomID) {
    clearRoomHistory(roomID);
    renderChatHistoryInSettings();
};

window._showRoomConversation = function(roomID) {
    const detailEl = document.getElementById('settings-conversation-detail');
    const msgContainer = document.getElementById('settings-conv-messages');
    const roomIdEl = document.getElementById('settings-conv-room-id');
    const msgCountEl = document.getElementById('settings-conv-message-count');
    const joinBtn = document.getElementById('settings-conv-join-btn');
    const backBtn = document.getElementById('settings-conv-back-btn');
    
    if (!detailEl || !msgContainer) return;
    
    // Set headers
    if (roomIdEl) roomIdEl.textContent = `Room: ${roomID}`;
    
    // Load messages
    const faceUserId = getFaceUserId();
    let msgs = [];
    if (faceUserId) {
        try {
            const key = _historyKey(faceUserId, roomID);
            msgs = JSON.parse(localStorage.getItem(key) || '[]');
        } catch(e) {}
    }
    
    if (msgCountEl) msgCountEl.textContent = `${msgs.length} messages`;
    
    // Render messages in chat-room style
    if (msgs.length === 0) {
        msgContainer.innerHTML = `<div class="settings-history-empty"><i class="fas fa-comments-slash"></i><p>No messages stored</p></div>`;
    } else {
        msgContainer.innerHTML = msgs.map((m, i) => {
            const isMine = m.isMine || (m.nickname && myNickname && m.nickname.trim().toLowerCase() === myNickname.trim().toLowerCase());
            const side = isMine ? 'sent' : 'received';
            const nameColor = isMine ? 'var(--text-muted)' : getNicknameColor(m.nickname);
            const avatarHtml = isMine ? '' : getAvatar(m.nickname, null);
            
            const senderInfo = !isMine ? `
                <div class="message-info">
                    <span class="sender-name" style="color: ${nameColor}">${escapeHtml(m.nickname || 'Unknown')}</span>
                </div>` : '';
                
            return `
                <div class="message ${side}" style="animation: none; max-width: 82%;">
                    ${senderInfo}
                    <div class="message-content">
                        ${avatarHtml}
                        <div class="bubble-wrapper">
                            <div class="bubble">
                                <span class="bubble-text">${escapeHtml(m.text)}</span>
                                <span class="bubble-timestamp">${m.time || ''}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }
    
    // Bind join action
    if (joinBtn) {
        joinBtn.onclick = () => {
            window.location.hash = roomID;
            if (settingsModal) settingsModal.classList.remove('open');
            // Force hashchange/routing function to execute if present
            if (typeof handleRouting === 'function') handleRouting();
        };
    }
    
    // Bind back action
    if (backBtn) {
        backBtn.onclick = () => {
            _closeRoomConversation();
        };
    }
    
    // Show conversation detail panel (it absolutely overlays the entire modal)
    detailEl.classList.remove('hidden');
    
    // Scroll messages to bottom
    setTimeout(() => {
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 50);
};

function _closeRoomConversation() {
    const detailEl = document.getElementById('settings-conversation-detail');
    if (!detailEl) return;
    
    // Hide the conversation panel (settings-body content is always visible behind it)
    detailEl.classList.add('hidden');
    
    // Refresh history room list
    renderChatHistoryInSettings();
}

let _settingsEnhancementsInitialized = false;

function syncSettingsTheme() {
    const settingsThemeToggle = document.getElementById('settings-theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    const isLight = document.body.classList.contains('light-mode');
    if (settingsThemeToggle) settingsThemeToggle.checked = isLight;
    if (themeLabel) themeLabel.textContent = isLight ? 'Light Mode' : 'Dark Mode';
}

function _initSettingsEnhancements() {
    if (_settingsEnhancementsInitialized) {
        syncSettingsTheme();
        const phoneEl = document.getElementById('settings-phone');
        if (phoneEl) {
            const faceId = getFaceUserId();
            phoneEl.textContent = faceId ? faceId.substring(0, 16) + '...' : 'Not registered';
        }
        return;
    }
    _settingsEnhancementsInitialized = true;

    // Theme toggle in settings
    const settingsThemeToggle = document.getElementById('settings-theme-toggle');
    syncSettingsTheme();

    if (settingsThemeToggle) {
        settingsThemeToggle.addEventListener('change', () => {
            if (typeof toggleTheme === 'function') toggleTheme();
            setTimeout(syncSettingsTheme, 50);
        });
    }

    // Clear all history button
    const clearAllBtn = document.getElementById('settings-clear-all-history-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Clear all chat history for this Face ID?')) {
                clearAllHistory();
                renderChatHistoryInSettings();
            }
        });
    }

    // Show biometric ID in settings
    const phoneEl = document.getElementById('settings-phone');
    if (phoneEl) {
        const faceId = getFaceUserId();
        phoneEl.textContent = faceId ? faceId.substring(0, 16) + '...' : 'Not registered';
    }
}

// One-time migration of old face profile to the new database
function migrateOldFaceProfile() {
    try {
        const hasUsers = localStorage.getItem('piktalk_users');
        if (!hasUsers) {
            const oldDescRaw = localStorage.getItem('piktalk_face_descriptor');
            if (oldDescRaw) {
                const oldDesc = JSON.parse(oldDescRaw);
                const oldProfileRaw = localStorage.getItem('piktalk_profile');
                let oldNickname = '';
                let oldProfilePic = null;
                if (oldProfileRaw) {
                    const oldProfile = JSON.parse(oldProfileRaw);
                    oldNickname = oldProfile.nickname || '';
                    oldProfilePic = oldProfile.profilePic || null;
                }
                const oldFaceUserId = localStorage.getItem('piktalk_face_userid') || ('u-face-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
                
                // Save to new database
                saveUserInDatabase(oldFaceUserId, oldDesc, oldNickname, oldProfilePic);
                localStorage.setItem('piktalk_face_userid', oldFaceUserId);
                
                // Save profile under new key
                localStorage.setItem(`piktalk_profile_${oldFaceUserId}`, JSON.stringify({
                    nickname: oldNickname,
                    profilePic: oldProfilePic
                }));
                console.log('[FaceID] Migrated old face profile to new multi-user database successfully ✓');
            }
        }
    } catch(e) {
        console.warn('[FaceID] Migration failed:', e);
    }
}

// Initialize settings enhancements on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    migrateOldFaceProfile();
    _initSettingsEnhancements();
});


