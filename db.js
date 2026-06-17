// db.js - Pluggable Database Layer for PikTalk
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize local JSON file if not exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ profiles: {} }, null, 4));
}

let useMongo = false;
let mongoClient = null;
let mongoDb = null;

const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    try {
        const { MongoClient } = require('mongodb');
        mongoClient = new MongoClient(MONGODB_URI);
        mongoClient.connect()
            .then(client => {
                mongoDb = client.db();
                useMongo = true;
                console.log("🌐 Connected successfully to MongoDB Atlas database!");
            })
            .catch(err => {
                console.error("❌ MongoDB connection failed. Falling back to local JSON database:", err.message);
            });
    } catch (e) {
        console.warn("⚠️ MongoDB driver package not loaded. Falling back to local JSON database.");
    }
}

// ── Local JSON Helper Functions ──
function readJSON() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error reading JSON database, resetting:", e);
        return { profiles: {} };
    }
}

function writeJSON(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
    } catch (e) {
        console.error("Error writing to JSON database:", e);
    }
}

// ── Date / Time Helpers ──
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getNowDate() {
    const now = new Date();
    const dd   = String(now.getDate()).padStart(2, '0');
    const mon  = MONTHS[now.getMonth()];
    const yyyy = now.getFullYear();
    return `${dd} ${mon} ${yyyy}`;          // e.g. "17 Jun 2026"
}

function getNowTime() {
    const now  = new Date();
    let   hrs  = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12 || 12;
    return `${String(hrs).padStart(2, '0')}:${mins}:${secs} ${ampm}`; // e.g. "08:48:07 PM"
}

// ── Exported Database API ──
const db = {
    getProfile: async (userId) => {
        if (useMongo && mongoDb) {
            try {
                const profile = await mongoDb.collection('profiles').findOne({ userId });
                return profile || null;
            } catch (err) {
                console.error("MongoDB getProfile error:", err.message);
            }
        }

        // Fallback to JSON
        const data = readJSON();
        return data.profiles[userId] || null;
    },

    saveProfile: async (userId, nickname, profilePic, roomId = null, isAdmin = null) => {
        const date = getNowDate();
        const time = getNowTime();
        const isAdminVal = isAdmin === true ? 'yes' : isAdmin === false ? 'no' : null;

        if (useMongo && mongoDb) {
            try {
                const profile = { userId, nickname, profilePic, date, time };
                if (roomId !== null)     profile.roomId  = roomId;
                if (isAdminVal !== null) profile.isAdmin = isAdminVal;
                await mongoDb.collection('profiles').updateOne(
                    { userId },
                    { $set: profile },
                    { upsert: true }
                );
                return profile;
            } catch (err) {
                console.error("MongoDB saveProfile error:", err.message);
            }
        }

        // Fallback to JSON
        const data = readJSON();
        const entry = { nickname, profilePic, date, time };
        if (roomId !== null)     entry.roomId  = roomId;
        if (isAdminVal !== null) entry.isAdmin = isAdminVal;
        data.profiles[userId] = entry;
        writeJSON(data);
        return data.profiles[userId];
    },

    getRooms: async () => {
        if (useMongo && mongoDb) {
            try {
                const list = await mongoDb.collection('rooms').find({}).toArray();
                return list;
            } catch (err) {
                console.error("MongoDB getRooms error:", err.message);
            }
        }

        // Fallback to JSON
        const data = readJSON();
        if (!data.rooms) data.rooms = {};
        return Object.entries(data.rooms).map(([roomID, val]) => ({
            roomID,
            adminSocketId:  val.adminSocketId,
            adminUserId:    val.adminUserId   || null,
            adminNickname:  val.adminNickname || null,
            password:       val.password,
            date:           val.date || null,
            time:           val.time || null
        }));
    },

    saveRoom: async (roomID, adminSocketId, password, adminUserId = null, adminNickname = null) => {
        const date = getNowDate();
        const time = getNowTime();

        if (useMongo && mongoDb) {
            try {
                const room = { roomID, adminSocketId, adminUserId, adminNickname, password, date, time };
                await mongoDb.collection('rooms').updateOne(
                    { roomID },
                    { $set: room },
                    { upsert: true }
                );
                return room;
            } catch (err) {
                console.error("MongoDB saveRoom error:", err.message);
            }
        }

        // Fallback to JSON
        const data = readJSON();
        if (!data.rooms) data.rooms = {};
        data.rooms[roomID] = { adminSocketId, adminUserId, adminNickname, password, date, time };
        writeJSON(data);
        return data.rooms[roomID];
    },

    deleteRoom: async (roomID) => {
        if (useMongo && mongoDb) {
            try {
                await mongoDb.collection('rooms').deleteOne({ roomID });
                return true;
            } catch (err) {
                console.error("MongoDB deleteRoom error:", err.message);
            }
        }

        // Fallback to JSON
        const data = readJSON();
        if (data.rooms && data.rooms[roomID]) {
            delete data.rooms[roomID];
            writeJSON(data);
        }
        return true;
    }
};

module.exports = db;
