// --- Imports ---
require('dotenv').config();
const express = require('express');
const noblox = require('noblox.js');
const rateLimit = require('express-rate-limit');

// --- Basic Setup ---
const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
app.use(express.json()); // Middleware to parse JSON request bodies

// --- Security Middleware ---

// 1. Rate Limiting: Protects against brute-force and spam attacks.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// 2. API Key Authentication: Ensures only your game can use the API.
const authenticateKey = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const key = authHeader && authHeader.split(' ')[1]; // Expects "Bearer YOUR_API_KEY"

    if (!key || key !== process.env.API_KEY) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API Key.' });
    }
    next();
};

// --- Main Application Logic ---

async function startApp() {
    // Validate that all required environment variables are set
    if (!process.env.ROBLOX_COOKIE || !process.env.GROUP_ID || !process.env.API_KEY) {
        console.error("FATAL ERROR: Missing one or more required environment variables (ROBLOX_COOKIE, GROUP_ID, API_KEY).");
        process.exit(1);
    }
    
    // You MUST call setCookie() before using any authenticated methods [marked by 🔐]
    // Replace the parameter in setCookie() with your .ROBLOSECURITY cookie.
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE) 
    console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`)

    // Do everything else, calling functions and the like.
    const groupInfo = await noblox.getGroup(process.env.GROUP_ID)
    console.log(groupInfo)

    // --- API Endpoints ---

    // Health Check Endpoint: Confirms the server is running.
    app.get('/', (req, res) => {
        res.status(200).json({ status: 'ok', message: 'Ranking API is running.' });
    });

    // Get Roles Endpoint: Fetches all group roles to populate the in-game UI.
    app.get('/getroles', authenticateKey, async (req, res) => {
        try {
            const roles = await noblox.getRoles(Number(process.env.GROUP_ID));
            res.status(200).json({ success: true, roles: roles });
        } catch (err) {
            console.error("Error fetching roles:", err.message);
            res.status(500).json({ success: false, message: 'An error occurred while fetching group roles.' });
        }
    });

    // Rank User Endpoint: The main endpoint for changing a user's rank.
    app.post('/rank', authenticateKey, async (req, res) => {
        const { targetId, rankId, executorId } = req.body;

        if (!targetId || !rankId) {
            return res.status(400).json({ success: false, message: 'Bad Request: Missing targetId or rankId.' });
        }

        const groupId = Number(process.env.GROUP_ID);
        const targetUserId = Number(targetId);
        const targetRankId = Number(rankId);

        try {
            // CRITICAL SERVER-SIDE VALIDATION
            const botUserId = (await noblox.getCurrentUser()).UserID;
            const botRank = await noblox.getRankInGroup(groupId, botUserId);
            const targetRole = await noblox.getRole(groupId, targetRankId);

            if (targetRole.rank >= botRank) {
                return res.status(403).json({ success: false, message: "Forbidden: The bot cannot set a rank equal to or higher than its own." });
            }
            if (targetRole.rank === 0) {
                 return res.status(400).json({ success: false, message: "Bad Request: Cannot rank users to the Guest role." });
            }

            // Perform the action
            await noblox.setRank(groupId, targetUserId, targetRankId);
            console.log(`SUCCESS: Executor ${executorId || 'N/A'} ranked user ${targetUserId} to role ${targetRankId} (${targetRole.name}).`);
            
            res.status(200).json({ success: true, message: `Successfully ranked user ${targetUserId} to ${targetRole.name}.` });
        } catch (err) {
            console.error("Error in /rank endpoint:", err.message);
            // Provide user-friendly error messages
            let errorMessage = 'An internal server error occurred.';
            if (err.message.includes("is not in group")) {
                errorMessage = "Target user is not in the group.";
            } else if (err.message.includes("permission to change this user's rank")) {
                errorMessage = "The bot does not have permission to change this user's rank. Ensure the target user is not a group owner.";
            }
            res.status(500).json({ success: false, message: errorMessage });
        }
    });

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

startApp();