const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // 100 MB limit for large photos
});

const PORT = process.env.PORT || 3000;

const CANONICAL_DOMAIN = 'piktalk.chat';
const OLD_DOMAIN = 'piktalk.onrender.com';

// 301 Redirect: old Render domain → new custom domain
app.use((req, res, next) => {
    const host = req.hostname;
    if (host === OLD_DOMAIN || host.endsWith('.' + OLD_DOMAIN)) {
        return res.redirect(301, `https://${CANONICAL_DOMAIN}${req.originalUrl}`);
    }
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// robots.txt - allow all crawlers, reference sitemap
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Sitemap: https://${CANONICAL_DOMAIN}/sitemap.xml
`);
});

// sitemap.xml - canonical URLs for SEO
app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${CANONICAL_DOMAIN}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

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
