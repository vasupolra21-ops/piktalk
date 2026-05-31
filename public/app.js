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

    // Load theme
    const savedTheme = localStorage.getItem('theme');
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
});

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
            showChat();
            if (socket) {
                socket.emit('join-room', { roomID: currentRoomID, nickname: myNickname, profilePic: myProfilePic });
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
        if (!file) return;
        if (file.size > 20000000) { alert('Image too large (Max 20MB)'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => openCropModal(ev.target.result);
        reader.readAsDataURL(file);
        profilePicInput.value = '';
    });

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
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
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Stop typing indicator immediately on send
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

        // Send raw original file as base64 — no canvas re-encoding, true Full HD quality
        const reader = new FileReader();
        reader.onload = (e) => {
            if (socket) {
                socket.emit('send-message', {
                    roomID: currentRoomID,
                    message: '',
                    image: e.target.result, // raw base64, original quality
                    nickname: myNickname,
                    profilePic: myProfilePic
                });
            } else {
                alert("Not connected to server. Image could not be sent.");
            }
        };
        reader.readAsDataURL(file); // preserves original format (JPEG/PNG/WEBP/etc.)
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
                audioDuration: recordingSeconds,
                nickname: myNickname,
                profilePic: myProfilePic
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
        if (socket) {
            socket.emit('send-message', {
                roomID: currentRoomID,
                message: text,
                nickname: myNickname,
                profilePic: myProfilePic
            });
            messageInput.value = '';
            messageInput.style.height = '38px'; // Reset textarea height
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

    const color = isSentByMe ? '#fff' : getNicknameColor(data.nickname);
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
        contentEl = bubble;

    } else {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = data.message;
        contentEl = bubble;
    }

    // Build message DOM directly (no innerHTML with user data)
    const infoDiv = document.createElement('div');
    infoDiv.className = 'message-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'user-name';
    nameSpan.style.color = color;
    nameSpan.textContent = isSentByMe ? 'You' : data.nickname;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'timestamp';
    timeSpan.textContent = timeStr;

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(timeSpan);

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

    _cropImg = new Image();
    _cropImg.onload = () => {
        // Size canvas to wrap (with sensible fallback if 0)
        _cropCanvasW = wrap.clientWidth || 400;
        _cropCanvasH = wrap.clientHeight || 340;
        canvas.width  = _cropCanvasW;
        canvas.height = _cropCanvasH;

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
    ctx.clearRect(0, 0, _cropCanvasW, _cropCanvasH);
    ctx.drawImage(_cropImg, _cropX, _cropY, _cropImg.width * _cropScale, _cropImg.height * _cropScale);
}

function closeCropModal() {
    const modal = document.getElementById('crop-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
    _cropImg = null;
}

function applyCrop() {
    if (!_cropImg) return;
    const cx = _cropCanvasW / 2, cy = _cropCanvasH / 2;
    const r  = _cropCircleR;
    const out = 400; // output size in pixels

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
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
                document.body.style.overflow = '';
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
    usersList.forEach(u => {
        const isMe = (u.nickname === myNickname && u.profilePic === myProfilePic);
        const item = document.createElement('div');
        item.className = 'member-item';

        let avatarHtml = '';
        if (u.profilePic) {
            avatarHtml = `<div class="member-avatar-wrap"><img src="${u.profilePic}"></div>`;
        } else {
            const initial = u.nickname ? u.nickname.charAt(0).toUpperCase() : '?';
            avatarHtml = `<div class="member-avatar-wrap" style="background: ${getNicknameColor(u.nickname)}">${initial}</div>`;
        }

        item.innerHTML = `
            ${avatarHtml}
            <span class="member-name">${u.nickname || 'Anonymous'}</span>
            ${isMe ? '<span class="member-you-badge">You</span>' : ''}
        `;
        listWrap.appendChild(item);
    });
}
