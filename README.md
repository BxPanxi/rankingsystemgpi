# Secure Roblox Ranking System

This is an open-source, secure, and easy-to-use ranking system for your Roblox group. The backend is designed for one-click deployment on Railway.

## Features
-   **Secure:** Your bot's cookie is stored safely as an environment variable, never exposed to Roblox.
-   **Server-Side Validation:** All rank actions are validated by the server, preventing exploits.
-   **Dynamic Roles:** The in-game panel can fetch roles directly from your group.
-   **Rate Limiting:** Protects your API from spam and abuse.
-   **Open Source:** Full transparency. You can see exactly how it works.

---

## 🚀 Setup Guide

Follow these steps carefully to get your ranking system running in minutes.

### Step 1: Deploy the Web Server

1.  **Create a GitHub Account** if you don't have one.
2.  Click the button below to deploy the API server to Railway.

    [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/YOUR_REPO_NAME) 
    *(**IMPORTANT:** Replace the URL with the link to your own template repository!)*

3.  Sign up for Railway using your GitHub account. Railway will automatically create a copy of this repository for you.
4.  You will be prompted to enter **Environment Variables**. This is the most important step.

### Step 2: Configure Environment Variables

In the Railway dashboard, go to your new project and click on the **Variables** tab. Add the following:

-   `ROBLOX_COOKIE`:
    -   **[SECURITY WARNING]** Create a **new, dedicated Roblox bot account** for this. Do NOT use your main account. Give the bot account the necessary rank and permissions in your group to manage ranks.
    -   Get the `.ROBLOSECURITY` cookie for this bot account. [Link to a safe, external guide on how to get a cookie].
    -   Paste the **entire cookie string** here.

-   `GROUP_ID`:
    -   The numerical ID of your Roblox group.

-   `API_KEY`:
    -   Create a long, random, and secure password here. Use a password generator. This key will be used to connect your Roblox game to this server.
    -   Example: `p$Kq@8z!vR#tGf2bN7hY`

Railway will automatically save and redeploy your server.

### Step 3: Configure in Roblox Studio

1.  Take the Roblox model for the ranking system and place it in **`ReplicatedStorage`**.
2.  Open the `RankingSystem` folder and then the **`Configuration`** folder.
3.  Update the values:
    -   **`API_ENDPOINT`**: In Railway, go to your project's **Settings** tab. Copy the **public URL** (e.g., `https://my-ranking-app-production.up.railway.app`) and paste it here.
    -   **`API_KEY`**: Paste the **exact same secret key** you created in Railway.
    -   **`GROUP_ID`**: Your group ID.
    -   **`MINIMUM_RANK_TO_USE`**: The rank number (0-255) a user must have *or be higher than* to use the ranking panel.

4.  That's it! Publish your game and test the system.

---

### An Even More Secure Alternative: Open Cloud API

For advanced users, `noblox.js` can be configured to use Roblox's official Open Cloud API instead of a cookie. This is far more secure as it uses revocable, permission-scoped API keys. This project can be adapted to support it by changing the `noblox.setCookie` method to use an Open Cloud key.

---
## License
This project is licensed under the MIT License.