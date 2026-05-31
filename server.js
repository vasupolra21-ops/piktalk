// PikTalk Express & Socket.IO Server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const compression = require('compression');

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
    maxAge: '1d', // Cache static assets for 1 day
    setHeaders: (res, filePath) => {
        // Do not cache HTML files to ensure users always get the latest version
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
            // Cache other assets (CSS, JS, Fonts, Images) aggressively
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
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

    socket.on('join-room', ({ roomID, nickname, profilePic }) => {
        const cleanRoomID = String(roomID).trim();
        socket.join(cleanRoomID);
        users[socket.id] = { roomID: cleanRoomID, nickname, profilePic };
        console.log(`${nickname} joined room: ${cleanRoomID}`);
        
        // Designate admin if room has no admin yet
        if (!rooms[cleanRoomID] || !rooms[cleanRoomID].adminSocketId) {
            rooms[cleanRoomID] = { adminSocketId: socket.id };
            console.log(`Admin designated for room ${cleanRoomID}: ${nickname} (${socket.id})`);
        }

        // Notify others in the room
        socket.to(cleanRoomID).emit('system-message', {
            message: `${nickname} has joined the chat`
        });

        // Send updated users list to all users in the room
        sendRoomUsers(cleanRoomID);
    });

    socket.on('send-message', (data) => {
        const user = users[socket.id];
        if (user) {
            const messageData = {
                id: socket.id,
                nickname: data.nickname || user.nickname,
                message: data.message,
                image: data.image,
                audio: data.audio,
                audioDuration: data.audioDuration,
                profilePic: data.profilePic || user.profilePic
            };
            io.to(user.roomID).emit('receive-message', messageData);
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

    socket.on('disconnect', () => {
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
                    console.log(`Admin transferred for room ${roomID} to: ${nextAdmin.nickname}`);
                    
                    io.to(roomID).emit('system-message', {
                        message: `${nextAdmin.nickname} is now the room admin`
                    });
                } else {
                    delete rooms[roomID];
                }
            }

            sendRoomUsers(roomID);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
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
