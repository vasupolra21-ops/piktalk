// PikTalk Express & Socket.IO Server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const compression = require('compression');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // 100 MB limit for large photos
});

const PORT = process.env.PORT || 3000;

// Enable gzip compression for faster load times
app.use(compression());

// Health check endpoint for keep-alive and monitoring
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Serve static files with robust caching headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '7d',   // Cache CSS/JS/images for 7 days (versioned via ?v=N)
    etag: true,     // ETags allow 304 Not Modified on repeat visits
    lastModified: true,
    setHeaders: (res, filePath) => {
        // HTML: never cache — always serve the latest version
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
            // Versioned assets (CSS, JS, images, fonts) — cache immutably for 7 days
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
    }
}));

// Route for homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for chat rooms - serve the same index.html
app.get('/chat/:roomID', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store users and their rooms
const users = {};
const rooms = {}; // roomID -> { adminSocketId }
let networkIP = '0.0.0.0';

function updateNetworkIP() {
    const interfaces = os.networkInterfaces();
    let preferredIP = null;
    
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                // Prioritize common local network ranges
                if (alias.address.startsWith('192.168.') || 
                    alias.address.startsWith('10.') || 
                    alias.address.startsWith('172.')) {
                    networkIP = alias.address;
                    return networkIP;
                }
                preferredIP = alias.address;
            }
        }
    }
    networkIP = preferredIP || '0.0.0.0';
    return networkIP;
}

// Initial IP detection
updateNetworkIP();

function sendRoomUsers(roomID) {
    const roomUsers = Object.entries(users)
        .filter(([id, u]) => u.roomID === roomID)
        .map(([id, u]) => ({
            id: id,
            nickname: u.nickname,
            profilePic: u.profilePic,
            isAdmin: rooms[roomID] && rooms[roomID].adminSocketId === id
        }));
    io.to(roomID).emit('room-users', roomUsers);
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Send network IP to help with link sharing
    socket.emit('ip-info', { ip: networkIP, port: PORT });

    socket.on('join-room', async ({ roomID, nickname, profilePic, userId, password }) => {
        const cleanRoomID = String(roomID).trim();
        
        // If room already exists, check password
        if (rooms[cleanRoomID] && rooms[cleanRoomID].password) {
            if (rooms[cleanRoomID].password !== password) {
                socket.emit('join-failed', { reason: 'invalid-password' });
                return;
            }
        }

        socket.join(cleanRoomID);
        users[socket.id] = { roomID: cleanRoomID, nickname, profilePic, userId: userId || null };
        console.log(`${nickname} joined room: ${cleanRoomID}`);

        // Designate admin if room has no admin yet
        if (!rooms[cleanRoomID]) {
            rooms[cleanRoomID] = { adminSocketId: socket.id, password: password || null };
            await db.saveRoom(cleanRoomID, socket.id, password || null, userId || null, nickname || null);
            console.log(`Admin designated for room ${cleanRoomID}: ${nickname} (${socket.id}) with password set: ${!!password}`);
        } else if (!rooms[cleanRoomID].adminSocketId) {
            rooms[cleanRoomID].adminSocketId = socket.id;
            await db.saveRoom(cleanRoomID, socket.id, rooms[cleanRoomID].password || null, userId || null, nickname || null);
            console.log(`Admin designated for room ${cleanRoomID}: ${nickname} (${socket.id})`);
        }

        // Save profile with roomId and admin status now that we know the admin
        if (userId) {
            const isAdmin = rooms[cleanRoomID] && rooms[cleanRoomID].adminSocketId === socket.id;
            await db.saveProfile(userId, nickname, profilePic, cleanRoomID, isAdmin);
        }

        // Notify others in the room
        socket.to(cleanRoomID).emit('system-message', {
            message: `${nickname} has joined the chat`
        });

        // Send updated users list to all users in the room
        sendRoomUsers(cleanRoomID);

        // Tell the admin directly that they are the admin (with password)
        if (rooms[cleanRoomID] && rooms[cleanRoomID].adminSocketId === socket.id) {
            socket.emit('you-are-admin', { password: rooms[cleanRoomID].password || null });
        }
    });

    socket.on('check-room-id-available', ({ roomID }) => {
        const cleanRoomID = String(roomID).trim();
        const exists = rooms[cleanRoomID] !== undefined;
        socket.emit('room-id-available-checked', { roomID: cleanRoomID, available: !exists });
    });

    socket.on('check-room', ({ roomID }) => {
        const cleanRoomID = String(roomID).trim();
        const room = rooms[cleanRoomID];
        if (room) {
            const hasPassword = !!room.password;
            socket.emit('room-checked', { roomID: cleanRoomID, exists: true, hasPassword });
        } else {
            socket.emit('room-checked', { roomID: cleanRoomID, exists: false });
        }
    });

    socket.on('verify-password', ({ roomID, password }) => {
        const cleanRoomID = String(roomID).trim();
        const room = rooms[cleanRoomID];
        if (room) {
            const hasPassword = !!room.password;
            if (!hasPassword) {
                socket.emit('password-verified', { roomID: cleanRoomID, success: true });
            } else {
                const success = room.password === password;
                socket.emit('password-verified', { roomID: cleanRoomID, success });
            }
        } else {
            socket.emit('password-verified', { roomID: cleanRoomID, success: false, reason: 'room-not-found' });
        }
    });

    socket.on('get-profile', async ({ userId }) => {
        if (!userId) return;
        const profile = await db.getProfile(userId);
        socket.emit('profile-data', profile || null);
    });

    socket.on('save-profile', async ({ userId, nickname, profilePic, roomId, isAdmin }) => {
        if (!userId || !nickname) return;
        const saved = await db.saveProfile(userId, nickname, profilePic, roomId || null, isAdmin !== undefined ? isAdmin : null);
        socket.emit('profile-saved', saved);
    });

    socket.on('send-message', (data) => {
        const user = users[socket.id];
        if (user) {
            const messageData = {
                msgId: uuidv4(),
                id: socket.id,
                nickname: data.nickname || user.nickname,
                message: data.message,
                image: data.image,
                audio: data.audio,
                audioDuration: data.audioDuration,
                profilePic: data.profilePic || user.profilePic,
                replyTo: data.replyTo || null
            };
            io.to(user.roomID).emit('receive-message', messageData);
        }
    });

    // Real-time emoji reactions — relay to whole room
    socket.on('toggle-reaction', ({ msgId, emoji, previousEmoji }) => {
        const user = users[socket.id];
        if (user && msgId && emoji) {
            io.to(user.roomID).emit('reaction-toggled', {
                msgId,
                emoji,
                socketId: socket.id,
                nickname: user.nickname,
                profilePic: user.profilePic || null,
                previousEmoji: previousEmoji || null
            });
        }
    });

    socket.on('typing', (data) => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.roomID).emit('user-typing', { nickname: user.nickname, profilePic: user.profilePic });
        }
    });

    socket.on('stop-typing', (data) => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.roomID).emit('user-stop-typing');
        }
    });

    socket.on('voice-recording-start', (data) => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.roomID).emit('user-voice-recording', { nickname: user.nickname, profilePic: user.profilePic });
        }
    });

    socket.on('voice-recording-stop', () => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.roomID).emit('user-voice-stop-recording');
        }
    });

    socket.on('kick-user', ({ targetSocketId }) => {
        const user = users[socket.id];
        if (user) {
            const roomID = user.roomID;
            // Verify if the sender is actually the admin of the room
            if (rooms[roomID] && rooms[roomID].adminSocketId === socket.id) {
                const targetUser = users[targetSocketId];
                if (targetUser && targetUser.roomID === roomID) {
                    console.log(`Admin ${user.nickname} removed ${targetUser.nickname} from room ${roomID}`);
                    
                    // Notify the room
                    io.to(roomID).emit('system-message', {
                        message: `${targetUser.nickname} was removed from the chat by the admin`
                    });

                    // Emit kicked event to the target user
                    io.to(targetSocketId).emit('kicked');

                    // Force target socket to leave the socket.io room
                    const targetSocket = io.sockets.sockets.get(targetSocketId);
                    if (targetSocket) {
                        targetSocket.leave(roomID);
                    }

                    // Remove target user from our users registry
                    delete users[targetSocketId];

                    // Broadcast the updated users list
                    sendRoomUsers(roomID);
                }
            }
        }
    });

    socket.on('disconnect', async () => {
        const user = users[socket.id];
        if (user) {
            console.log(`${user.nickname} left room: ${user.roomID}`);
            const roomID = user.roomID;
            
            // Notify others in the room
            io.to(roomID).emit('system-message', {
                message: `${user.nickname} has left the chat`
            });
            
            delete users[socket.id];

            // If the disconnected user was the admin, transfer the admin role!
            if (rooms[roomID] && rooms[roomID].adminSocketId === socket.id) {
                const remainingSockets = Object.keys(users).filter(id => users[id].roomID === roomID);
                if (remainingSockets.length > 0) {
                    rooms[roomID].adminSocketId = remainingSockets[0];
                    const nextAdmin = users[remainingSockets[0]];
                    await db.saveRoom(roomID, remainingSockets[0], rooms[roomID].password || null, nextAdmin.userId || null, nextAdmin.nickname || null);
                    console.log(`Admin transferred for room ${roomID} to: ${nextAdmin.nickname}`);
                    
                    io.to(roomID).emit('system-message', {
                        message: `${nextAdmin.nickname} is now the room admin`
                    });

                    // Tell the new admin directly
                    io.to(remainingSockets[0]).emit('you-are-admin', { password: rooms[roomID].password || null });
                } else {
                    delete rooms[roomID];
                    await db.deleteRoom(roomID);
                }
            }

            sendRoomUsers(roomID);
        }
    });
});

async function initializeRooms() {
    try {
        const dbRooms = await db.getRooms();
        if (dbRooms && Array.isArray(dbRooms)) {
            dbRooms.forEach(room => {
                rooms[room.roomID] = {
                    adminSocketId: null, // Reset socket ID on start/restart
                    password: room.password || null
                };
            });
            console.log(`📂 Loaded ${dbRooms.length} rooms from database.`);
        }
    } catch (err) {
        console.error("Error initializing rooms from database:", err.message);
    }
}

server.listen(PORT, '0.0.0.0', async () => {
    await initializeRooms();
    console.log(`\n🚀 PikTalk is running!`);
    console.log(`🏠 Local: http://localhost:${PORT}`);
    console.log(`📱 Network: http://${networkIP}:${PORT}\n`);
    
    // Set up self-ping keep-alive to prevent Render free-tier from sleeping
    const pingUrl = process.env.RENDER_EXTERNAL_URL || 'https://piktalk.onrender.com';
    if (pingUrl) {
        console.log(`[Keep-Alive] Initializing self-ping interval for: ${pingUrl}/ping`);
        
        // Initial ping after 30 seconds
        setTimeout(() => {
            sendKeepAlivePing(pingUrl);
        }, 30000);
        
        // Periodic ping every 5 minutes (Render sleep threshold is 15 minutes)
        setInterval(() => {
            sendKeepAlivePing(pingUrl);
        }, 5 * 60 * 1000);
    }
});

function sendKeepAlivePing(url) {
    const pingEndpoint = `${url.replace(/\/$/, '')}/ping`;
    const client = pingEndpoint.startsWith('https') ? require('https') : require('http');
    
    client.get(pingEndpoint, (res) => {
        console.log(`[Keep-Alive] Self-ping status: ${res.statusCode} (${pingEndpoint})`);
    }).on('error', (err) => {
        console.error(`[Keep-Alive] Self-ping failed for ${pingEndpoint}:`, err.message);
    });
}
