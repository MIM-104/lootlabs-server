require("dotenv").config();
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const API_TOKEN = process.env.API_TOKEN;
const PASTEBIN_API_KEY = process.env.PASTEBIN_API_KEY;

let currentLinks = null;
let keyExpiration = 0;

async function createWeeklyLinks() {
    try {
        const newKey = crypto.randomBytes(16).toString("hex");

        const pasteParams = new URLSearchParams();
        pasteParams.append("api_dev_key", PASTEBIN_API_KEY);
        pasteParams.append("api_option", "paste");
        pasteParams.append("api_paste_code", newKey);
        pasteParams.append("api_paste_private", "1");
        pasteParams.append("api_paste_expire_date", "1W");

        const pasteResponse = await axios.post(
            "https://pastebin.com/api/api_post.php",
            pasteParams,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const lootResponse = await axios.post(
            "https://api.lootlabs.gg/api/lootlabs/content_locker",
            {
                title: "Script Key",
                url: pasteResponse.data.replace("pastebin.com", "pastebin.com/raw"),
                tier_id: 1,
                number_of_tasks: 3,
                theme: 5,
                thumbnail: ""
            },
            { headers: { Authorization: `Bearer ${API_TOKEN}` } }
        );

        return {
            pastebin_raw: pasteResponse.data.replace("pastebin.com", "pastebin.com/raw"),
            lootlabs_url: lootResponse.data.message[0].loot_url
        };
    } catch (error) {
        console.error("Weekly link generation failed:", error.response?.data || error.message);
        throw error;
    }
}

app.post("/generate-links", async (req, res) => {
    try {
        if (!currentLinks || Date.now() > keyExpiration) {
            currentLinks = await createWeeklyLinks();
            keyExpiration = Date.now() + 604800000;
            console.log("Generated new weekly links:", currentLinks);
        }

        res.json(currentLinks);
    } catch (error) {
        res.status(500).json({
            error: "Key system unavailable",
            details: error.message
        });
    }
});

app.listen(3000, () => console.log("Weekly key server running on port 3000"));
