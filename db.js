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

// ── Exported Database API ──
const db = {
    getProfile: async (userId) => {
        if (useMongo && mongoDb) {
            try {
                const profile = await mongoDb.collection('profiles').findOne({ userId });
                if (profile && profile.updatedAt instanceof Date) {
                    profile.updatedAt = profile.updatedAt.toISOString();
                }
                return profile;
            } catch (err) {
                console.error("MongoDB getProfile error:", err.message);
            }
        }
        
        // Fallback to JSON
        const data = readJSON();
        return data.profiles[userId] || null;
    },

    saveProfile: async (userId, nickname, profilePic) => {
        const updatedAtStr = new Date().toISOString();
        const updatedAtDate = new Date();

        if (useMongo && mongoDb) {
            try {
                const profile = { userId, nickname, profilePic, updatedAt: updatedAtDate };
                await mongoDb.collection('profiles').updateOne(
                    { userId },
                    { $set: profile },
                    { upsert: true }
                );
                return { ...profile, updatedAt: updatedAtStr };
            } catch (err) {
                console.error("MongoDB saveProfile error:", err.message);
            }
        }

        // Fallback to JSON
        const data = readJSON();
        data.profiles[userId] = {
            nickname,
            profilePic,
            updatedAt: updatedAtStr
        };
        writeJSON(data);
        return data.profiles[userId];
    },

    getRooms: async () => {
        if (useMongo && mongoDb) {
            try {
                const list = await mongoDb.collection('rooms').find({}).toArray();
                list.forEach(room => {
                    if (room.updatedAt instanceof Date) {
                        room.updatedAt = room.updatedAt.toISOString();
                    }
                });
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
            adminSocketId: val.adminSocketId,
            adminUserId: val.adminUserId || null,
            adminNickname: val.adminNickname || null,
            password: val.password
        }));
    },

    saveRoom: async (roomID, adminSocketId, password, adminUserId = null, adminNickname = null) => {
        const updatedAtStr = new Date().toISOString();
        const updatedAtDate = new Date();

        if (useMongo && mongoDb) {
            try {
                const room = { roomID, adminSocketId, adminUserId, adminNickname, password, updatedAt: updatedAtDate };
                await mongoDb.collection('rooms').updateOne(
                    { roomID },
                    { $set: room },
                    { upsert: true }
                );
                return { ...room, updatedAt: updatedAtStr };
            } catch (err) {
                console.error("MongoDB saveRoom error:", err.message);
            }
        }

        // Fallback to JSON
        const data = readJSON();
        if (!data.rooms) data.rooms = {};
        data.rooms[roomID] = {
            adminSocketId,
            adminUserId,
            adminNickname,
            password,
            updatedAt: updatedAtStr
        };
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
