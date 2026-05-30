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
        const icon = '<i class="fas fa-sun"></i>';
        if (themeToggle) themeToggle.innerHTML = icon;
        if (homeThemeToggle) homeThemeToggle.innerHTML = icon;
    }

    setupEventListeners();
});

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
        if (file && file.size < 50000000) {
            const reader = new FileReader();
            reader.onload = (e) => {
                compressImage(e.target.result, 1600, 1600, 0.75, (compressedBase64) => {
                    if (socket) {
                        socket.emit('send-message', {
                            roomID: currentRoomID,
                            message: '',
                            image: compressedBase64,
                            nickname: myNickname,
                            profilePic: myProfilePic
                        });
                    } else {
                        alert("Not connected to server. Image could not be sent.");
                    }
                });
            };
            reader.readAsDataURL(file);
        } else if (file) alert('Image too large (Max 50MB)');
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
        progressWrap.addEventListener('click', (e) => seekVoiceBubble(e, bubbleId));

        const progressBar = document.createElement('div');
        progressBar.className = 'voice-bubble-bar';
        progressBar.id = 'bar-' + bubbleId;
        progressWrap.appendChild(progressBar);

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
        bubble.className = 'bubble';
        const img = document.createElement('img');
        img.src = data.image;
        img.className = 'message-image';
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
    const bar      = document.getElementById('bar-' + bubbleId);
    const dur      = document.getElementById('dur-' + bubbleId);

    if (!audio) {
        audio = new Audio(src);
        _voiceAudios[bubbleId] = audio;

        audio.ontimeupdate = () => {
            const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
            if (bar) bar.style.width = pct + '%';
            if (dur) dur.textContent = formatSeconds(Math.floor(audio.currentTime));
        };
        audio.onended = () => {
            if (playBtnI) playBtnI.className = 'fas fa-play';
            if (bar) bar.style.width = '0%';
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
