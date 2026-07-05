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

// ── Date & Time Helper (IST Timezone) ──
function getISTDateTime() {
    const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    try {
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(new Date());
        let day = '', month = '', year = '', hour = '', minute = '', second = '', dayPeriod = '';
        parts.forEach(p => {
            if (p.type === 'day') day = p.value;
            if (p.type === 'month') month = p.value;
            if (p.type === 'year') year = p.value;
            if (p.type === 'hour') hour = p.value;
            if (p.type === 'minute') minute = p.value;
            if (p.type === 'second') second = p.value;
            if (p.type === 'dayPeriod') dayPeriod = p.value.toUpperCase();
        });
        
        hour = hour.padStart(2, '0');
        day = day.padStart(2, '0');
        
        return `${day} ${month} ${year}, ${hour}:${minute}:${second} ${dayPeriod}`;
    } catch (err) {
        // Fallback to basic ISO conversion if Intl fails
        return new Date().toISOString();
    }
}

function writeJSON(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
    } catch (e) {
        console.error("Error writing to JSON database:", e);
    }
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
        const dateTime = getISTDateTime();
        const isAdminVal = isAdmin === true ? 'yes' : isAdmin === false ? 'no' : null;

        if (useMongo && mongoDb) {
            try {
                const profile = { userId, nickname, profilePic, dateTime };
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
        const entry = { nickname, profilePic, dateTime };
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
            dateTime:       val.dateTime      || null
        }));
    },

    saveRoom: async (roomID, adminSocketId, password, adminUserId = null, adminNickname = null) => {
        const dateTime = getISTDateTime();

        if (useMongo && mongoDb) {
            try {
                const room = { roomID, adminSocketId, adminUserId, adminNickname, password, dateTime };
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
        data.rooms[roomID] = { adminSocketId, adminUserId, adminNickname, password, dateTime };
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
    },

    saveFace: async (faceUserId, descriptor, nickname, profilePic) => {
        const dateTime = getISTDateTime();
        if (useMongo && mongoDb) {
            try {
                const face = { faceUserId, descriptor, nickname, profilePic, dateTime };
                await mongoDb.collection('faces').updateOne(
                    { faceUserId },
                    { $set: face },
                    { upsert: true }
                );
                return face;
            } catch (err) {
                console.error("MongoDB saveFace error:", err.message);
            }
        }
        // Fallback to JSON
        const data = readJSON();
        if (!data.faces) data.faces = {};
        data.faces[faceUserId] = { descriptor, nickname, profilePic, dateTime };
        writeJSON(data);
        return data.faces[faceUserId];
    },

    getFaces: async () => {
        if (useMongo && mongoDb) {
            try {
                const list = await mongoDb.collection('faces').find({}).toArray();
                return list;
            } catch (err) {
                console.error("MongoDB getFaces error:", err.message);
            }
        }
        // Fallback to JSON
        const data = readJSON();
        if (!data.faces) data.faces = {};
        return Object.entries(data.faces).map(([faceUserId, val]) => ({
            faceUserId,
            descriptor: val.descriptor,
            nickname: val.nickname,
            profilePic: val.profilePic,
            dateTime: val.dateTime
        }));
    }
};

module.exports = db;
