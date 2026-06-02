// Initialize Socket.io with error handling (polling first for instant connection, then upgrade)
let socket;
try {
    socket = io({
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 5
    });
} catch (e) {
    console.error("Socket.io initialization failed:", e);
}

// DOM Elements
let homeView, chatView, createRoomBtn, nicknameModal, nicknameInput, joinChatBtn, roomDisplayId, onlineStatus, messagesContainer, messageInput, sendBtn, inviteBtn, shareSection, roomLinkInput, copyBtn, leaveBtn, msgSound, emojiBtn, themeToggle, homeThemeToggle, attachBtn, imgInput, joinRoomInput, joinRoomBtn, emojiPicker, profilePicInput, avatarPreviewContainer, avatarPreviewImg, avatarPreviewIcon;
let micBtn, voiceRecordingBar, cancelRecordingBtn, recordingTimerEl, audioPreviewBar, discardAudioBtn, playPreviewBtn, audioProgressBar, audioPreviewDuration, sendAudioBtn;

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
}

// State
let currentRoomID = null;
let myNickname = null;
let myProfilePic = null;
let serverIP = null;
let serverPort = null;

// Persistent user identity — stored in sessionStorage (isolated per browser tab/window)
function getOrCreateUserId() {
    try {
        let uid = sessionStorage.getItem('piktalk_userId');
        if (!uid || uid === 'null' || uid === 'undefined') {
            uid = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem('piktalk_userId', uid);
        }
        return uid;
    } catch(e) {
        // Fallback if sessionStorage is blocked
        return 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }
}
let myUserId = getOrCreateUserId();

// Load this tab's saved profile directly from sessionStorage (no server needed).
// This is isolated per tab: opening a new tab to test will start with a fresh, empty profile.
function loadSavedProfile() {
    try {
        const raw = sessionStorage.getItem('piktalk_profile');
        if (!raw) return;
        const profile = JSON.parse(raw);
        if (!profile) return;
        // Always clear nickname input so user types a fresh name each time
        if (nicknameInput) nicknameInput.value = '';
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
    } catch(e) {
        console.warn('Could not load saved profile from sessionStorage:', e);
    }
}

// Save this user's profile locally so it is remembered on THIS tab session.
function saveProfileLocally(nickname, profilePic) {
    try {
        sessionStorage.setItem('piktalk_profile', JSON.stringify({ nickname, profilePic: profilePic || null }));
    } catch(e) {
        console.warn('Could not save profile to sessionStorage:', e);
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
        showNicknameModal();
    } else {
        showHome();
    }

    // Populate Emoji Categories
    if (emojiPicker) {
        renderEmojiPicker();
    }

    // Load theme (default to light if not set)
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const icon = '<i class="fas fa-moon"></i>';
        if (themeToggle) themeToggle.innerHTML = icon;
        if (homeThemeToggle) homeThemeToggle.innerHTML = icon;
    } else {
        const icon = '<i class="fas fa-sun"></i>';
        if (themeToggle) themeToggle.innerHTML = icon;
        if (homeThemeToggle) homeThemeToggle.innerHTML = icon;
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
// - Messages scroll up, and the input sits right above the keyboard (like WhatsApp)
function initViewportHandler() {
    if (!window.visualViewport) return;

    function applyViewportHeight() {
        const vh = window.visualViewport.height;
        document.documentElement.style.setProperty('--viewport-height', vh + 'px');

        // Force reset any window/body scroll shifts
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        // Chat: scroll to bottom so latest message is visible above keyboard
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    window.visualViewport.addEventListener('resize', applyViewportHeight);

    // Prevent iOS Safari from scrolling the whole page up (causing the white gap)
    window.visualViewport.addEventListener('scroll', () => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    });

    // Also reset on any window scroll
    window.addEventListener('scroll', () => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }, { passive: false });

    // Reset layout viewport position when message input receives focus/blur
    if (messageInput) {
        messageInput.addEventListener('focus', () => {
            document.body.classList.add('keyboard-active');
            setTimeout(applyViewportHeight, 50);
            setTimeout(applyViewportHeight, 150);
        });

        messageInput.addEventListener('blur', () => {
            document.body.classList.remove('keyboard-active');
            setTimeout(applyViewportHeight, 50);
            setTimeout(applyViewportHeight, 150);
        });
    }

    // Set initial value
    applyViewportHeight();
}

// ── Modal Keyboard Handler ──
// When nickname input is focused on mobile, hides the avatar setup to save space
// and slides the modal card UP just enough so both the input AND Join button are visible.
function initModalKeyboardHandler() {
    const nicknameInput = document.getElementById('nickname-input');
    const modal = document.getElementById('nickname-modal');
    if (!nicknameInput || !modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    nicknameInput.addEventListener('focus', () => {
        modal.classList.add('keyboard-active');
        // Wait for the keyboard to fully open before measuring
        setTimeout(() => {
            const vvHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const cardRect = modalContent.getBoundingClientRect();
            const cardBottom = cardRect.bottom;
            // How many px the card overflows below the visible area
            const overflow = cardBottom - vvHeight + 16; // +16px breathing room
            if (overflow > 0) {
                modalContent.style.transition = 'transform 0.28s ease';
                modalContent.style.transform = `translateY(-${overflow}px)`;
            }
        }, 320);
    });

    nicknameInput.addEventListener('blur', () => {
        modal.classList.remove('keyboard-active');
        // Slide back to original centered position
        modalContent.style.transition = 'transform 0.28s ease';
        modalContent.style.transform = 'translateY(0)';
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

    // Home view input
    if (joinRoomInput) {
        joinRoomInput.disabled = !isHomeActive || isModalActive;
        joinRoomInput.setAttribute('tabindex', (isHomeActive && !isModalActive) ? '0' : '-1');
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
    const cropModal = document.getElementById('crop-modal');
    const isCropActive = cropModal && cropModal.classList.contains('open');
    const membersModal = document.getElementById('members-modal');
    const isMembersActive = membersModal && membersModal.classList.contains('open');
    
    const isAnyModalActive = isNicknameActive || isCropActive || isMembersActive;

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
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                if (messageInput) {
                    messageInput.value += emoji;
                    messageInput.focus();
                    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
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
            // Save profile locally so this device/browser remembers it next time
            saveProfileLocally(myNickname, myProfilePic);
            showChat();
            if (socket) {
                // Pass userId so server can also save the profile to MongoDB Atlas
                socket.emit('join-room', {
                    roomID: currentRoomID,
                    nickname: myNickname,
                    profilePic: myProfilePic,
                    userId: myUserId
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
        if (shareSection) shareSection.classList.toggle('hidden');
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

            // Emit typing event
            if (socket && currentRoomID && myNickname) {
                socket.emit('typing', { nickname: myNickname });
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    socket.emit('stop-typing');
                }, 2000);
            }
        });

        messageInput.addEventListener('keydown', (e) => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                clearTimeout(typingTimeout);
                if (socket) socket.emit('stop-typing');
                sendMessage();
            }
        });
    }

    if (attachBtn) attachBtn.addEventListener('click', () => imgInput.click());
    if (imgInput) imgInput.addEventListener('change', () => {
        const file = imgInput.files[0];
        if (!file) return;
        if (file.size > 50000000) { alert('Image too large (Max 50MB)'); return; }

        if (file.type === 'image/gif') {
            // Send raw GIF to preserve animation
            const reader = new FileReader();
            reader.onload = (e) => {
                if (socket) {
                    socket.emit('send-message', {
                        roomID: currentRoomID,
                        message: '',
                        image: e.target.result
                    });
                } else {
                    alert("Not connected to server. Image could not be sent.");
                }
            };
            reader.readAsDataURL(file);
        } else {
            // Compress other images (JPEG, PNG, WEBP, etc.) before sending
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const maxW = 1200;
                    const maxH = 1200;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxW || height > maxH) {
                        if (width > height) {
                            height = Math.round((height * maxW) / width);
                            width = maxW;
                        } else {
                            width = Math.round((width * maxH) / height);
                            height = maxH;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    if (socket) {
                        socket.emit('send-message', {
                            roomID: currentRoomID,
                            message: '',
                            image: compressedBase64
                        });
                    } else {
                        alert("Not connected to server. Image could not be sent.");
                    }
                };
                img.onerror = () => {
                    // Fallback to sending original base64 if drawing to canvas fails
                    if (socket) {
                        socket.emit('send-message', {
                            roomID: currentRoomID,
                            message: '',
                            image: e.target.result
                        });
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        imgInput.value = ''; // reset so same file can be re-sent
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

    if (cancelRecordingBtn) cancelRecordingBtn.addEventListener('click', cancelRecording);
    if (discardAudioBtn)    discardAudioBtn.addEventListener('click',   discardPreview);
    if (playPreviewBtn)     playPreviewBtn.addEventListener('click',    togglePreviewPlayback);
    if (sendAudioBtn)       sendAudioBtn.addEventListener('click',      sendVoiceMessage);
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
}

function discardPreview() {
    if (previewAudio) { previewAudio.pause(); previewAudio = null; }
    previewPlaying = false;
    audioPreviewBar.classList.add('hidden');
    audioProgressBar.style.width = '0%';
    recordedAudioBlob = null;
}

function sendVoiceMessage() {
    if (!recordedAudioBlob) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (socket) {
            socket.emit('voice-recording-stop'); // clear indicator before send
            socket.emit('send-message', {
                roomID: currentRoomID,
                message: '',
                audio: e.target.result,
                audioDuration: recordingSeconds
            });
            discardPreview();
        } else {
            alert("Not connected to server. Voice message could not be sent.");
        }
    };
    reader.readAsDataURL(recordedAudioBlob);
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    const icon = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    if (themeToggle) themeToggle.innerHTML = icon;
    if (homeThemeToggle) homeThemeToggle.innerHTML = icon;
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeColor();
}

function showHome() {
    [homeView, chatView, nicknameModal].forEach(v => { if (v) v.classList.remove('active'); });
    if (homeView) homeView.classList.add('active');
    updateInputsState();
    updateThemeColor();
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
    updateInputsState();
    updateThemeColor();
}

function showNicknameModal() {
    if (nicknameModal) nicknameModal.classList.add('active');
    // Load profile directly from THIS browser's localStorage.
    // This is fully isolated per browser app — different browsers on the same
    // device will never see each other's nickname or profile picture.
    loadSavedProfile();
    updateInputsState();
    updateThemeColor();
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentRoomID) {
        if (socket) {
            socket.emit('send-message', {
                roomID: currentRoomID,
                message: text
            });
            messageInput.value = '';
            messageInput.style.height = '38px'; // Reset textarea height
            // Re-focus the input to keep the keyboard open on mobile
            // Use a short timeout so the DOM can settle before refocusing
            setTimeout(() => {
                if (messageInput && !messageInput.disabled) {
                    messageInput.focus();
                }
            }, 0);
        } else {
            alert("Not connected to server. Message could not be sent.");
        }
    }
}

// Socket Events
if (socket) {
    socket.on('receive-message', (data) => {
        hideTyping(); // hide typing bubble when message arrives
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
        updateMembersList(usersList);
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

function appendMessage(data, isSentByMe) {
    if (!messagesContainer) return;
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    if (isSentByMe) msgDiv.classList.add('sent');

    const color = isSentByMe ? 'var(--text-muted)' : getNicknameColor(data.nickname);
    const avatar = isSentByMe ? '' : getAvatar(data.nickname, data.profilePic);
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    let contentEl;

    if (data.audio) {
        // Store src in map — never embed base64 in HTML attribute
        const bubbleId = 'vb-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
        _voiceData[bubbleId] = data.audio;
        const durLabel = data.audioDuration ? formatSeconds(data.audioDuration) : '0:00';

        const bubble = document.createElement('div');
        bubble.className = 'voice-bubble';
        bubble.id = bubbleId;

        const playBtn = document.createElement('button');
        playBtn.className = 'voice-bubble-play';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.addEventListener('click', () => toggleVoiceBubble(bubbleId));

        const progressWrap = document.createElement('div');
        progressWrap.className = 'voice-bubble-progress';
        progressWrap.id = 'waveform-container-' + bubbleId;
        progressWrap.addEventListener('click', (e) => seekVoiceBubble(e, bubbleId));

        const barCount = 28;
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'waveform-bar';
            
            // Seed a consistent height based on bubbleId + index
            let hash = 0;
            const str = bubbleId + i;
            for (let j = 0; j < str.length; j++) {
                hash = str.charCodeAt(j) + ((hash << 5) - hash);
            }
            const heightPercent = 15 + (Math.abs(hash) % 76); // 15% to 90%
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
        const timeText = document.createTextNode(timeStr);
        timeSpan.appendChild(timeText);

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
        const timeText = document.createTextNode(timeStr);
        timeSpan.appendChild(timeText);

        bubble.appendChild(timeSpan);

        contentEl = bubble;

    } else {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        const textSpan = document.createElement('span');
        textSpan.className = 'bubble-text';
        textSpan.textContent = data.message;
        bubble.appendChild(textSpan);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'bubble-timestamp';
        const timeText = document.createTextNode(timeStr);
        timeSpan.appendChild(timeText);

        bubble.appendChild(timeSpan);

        contentEl = bubble;
    }

    // Build message DOM directly (no innerHTML with user data)
    const infoDiv = document.createElement('div');
    infoDiv.className = 'message-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'sender-name';
    if (!isSentByMe) {
        nameSpan.style.color = color;
    }
    nameSpan.textContent = isSentByMe ? 'You' : data.nickname;

    infoDiv.appendChild(nameSpan);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    if (avatar) contentDiv.innerHTML = avatar; // avatar is safe HTML we generate
    contentDiv.appendChild(contentEl);

    msgDiv.appendChild(infoDiv);
    msgDiv.appendChild(contentDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
}

function seekVoiceBubble(event, bubbleId) {
    if (!_voiceData[bubbleId]) return;
    if (!_voiceAudios[bubbleId]) toggleVoiceBubble(bubbleId);
    const audio = _voiceAudios[bubbleId];
    if (!audio || !audio.duration) return;
    const rect  = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
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
    const amIAdmin = (socket && socket.id === adminSocketId);

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
