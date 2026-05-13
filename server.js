const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e7 // 10 MB
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Send network IP to help with link sharing
    socket.emit('ip-info', { ip: networkIP, port: PORT });

    socket.on('join-room', ({ roomID, nickname, profilePic }) => {
        const cleanRoomID = String(roomID).trim();
        socket.join(cleanRoomID);
        users[socket.id] = { roomID: cleanRoomID, nickname, profilePic };
        console.log(`${nickname} joined room: ${cleanRoomID}`);
        
        // Notify others in the room
        socket.to(cleanRoomID).emit('system-message', {
            message: `${nickname} has joined the chat`
        });
    });

    socket.on('send-message', (data) => {
        const user = users[socket.id];
        if (user) {
            const messageData = {
                id: socket.id,
                nickname: data.nickname || user.nickname,
                message: data.message,
                image: data.image,
                profilePic: data.profilePic || user.profilePic,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            io.to(user.roomID).emit('receive-message', messageData);
        }
    });

    socket.on('typing', (data) => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.roomID).emit('user-typing', { nickname: user.nickname });
        }
    });

    socket.on('stop-typing', (data) => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.roomID).emit('user-stop-typing');
        }
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            console.log(`${user.nickname} left room: ${user.roomID}`);
            
            // Notify others in the room
            io.to(user.roomID).emit('system-message', {
                message: `${user.nickname} has left the chat`
            });
            
            delete users[socket.id];
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 PikTalk is running!`);
    console.log(`🏠 Local: http://localhost:${PORT}`);
    console.log(`📱 Network: http://${networkIP}:${PORT}\n`);
});
