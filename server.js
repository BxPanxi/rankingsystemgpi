// server.js
require('dotenv').config();
const express = require('express');
const noblox = require('noblox.js-premium');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// --- Security Middleware ---

// Rate Limiting: Protects against spam/brute-force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// API Key Authentication Middleware
const authenticateKey = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const key = authHeader && authHeader.split(' ')[1]; // Bearer <KEY>

    if (!key || key !== process.env.API_KEY) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API Key.' });
    }
    next();
};


// --- Main Logic ---

async function startApp() {
    try {
        // Login the bot account
        await noblox.setCookie(process.env.ROBLOX_COOKIE);
        const currentUser = await noblox.getCurrentUser();
        console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`);
    } catch (err) {
        console.error("Fatal Error: Could not log in with the provided cookie.", err);
        process.exit(1); // Exit if login fails
    }

    // --- API Endpoints ---

    // Health check endpoint
    app.get('/', (req, res) => {
        res.status(200).send('Ranking Service is running.');
    });

    // Endpoint to get all group roles (for the in-game UI dropdown)
    app.get('/getroles', authenticateKey, async (req, res) => {
        try {
            const roles = await noblox.getRoles(Number(process.env.GROUP_ID));
            res.status(200).json({ success: true, roles: roles });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'An error occurred while fetching roles.' });
        }
    });

    // The main ranking endpoint
    app.post('/rank', authenticateKey, async (req, res) => {
        const { targetId, rankId, executorId } = req.body;

        if (!targetId || !rankId) {
            return res.status(400).json({ success: false, message: 'Missing targetId or rankId in request body.' });
        }

        try {
            // Server-side validation is CRITICAL
            const groupId = Number(process.env.GROUP_ID);
            const botRank = await noblox.getRankInGroup(groupId, (await noblox.getCurrentUser()).UserID);
            const targetRankInfo = await noblox.getRole(groupId, Number(rankId));

            if (targetRankInfo.rank >= botRank) {
                return res.status(403).json({ success: false, message: "Bot cannot set a rank equal to or higher than its own." });
            }

            // Perform the action
            await noblox.setRank(groupId, Number(targetId), Number(rankId));
            console.log(`User ${executorId || 'N/A'} ranked ${targetId} to rank ${rankId}`);
            
            res.status(200).json({ success: true, message: `Successfully set rank for user ${targetId}.` });
        } catch (err) {
            console.error(err);
            // Provide a more user-friendly error message
            let errorMessage = 'An internal server error occurred.';
            if (err.message.includes("is not in group")) {
                errorMessage = "Target user is not in the group.";
            } else if (err.message.includes("permission")) {
                errorMessage = "The bot does not have permission to perform this action.";
            }
            res.status(500).json({ success: false, message: errorMessage });
        }
    });

    // Start the server
    const listener = app.listen(process.env.PORT || 3000, () => {
        console.log('Your app is listening on port ' + listener.address().port);
    });
}

startApp();