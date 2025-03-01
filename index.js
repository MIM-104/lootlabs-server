require("dotenv").config();
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const API_TOKEN = process.env.API_TOKEN;
const PASTEBIN_API_KEY = process.env.PASTEBIN_API_KEY;

function generateRandomKey(length) {
    return crypto.randomBytes(length).toString("hex");
}

async function createPastebinPaste(content) {
    try {
        const pasteResponse = await axios.post("https://pastebin.com/api/api_post.php", null, {
            params: {
                api_dev_key: PASTEBIN_API_KEY,
                api_option: "paste",
                api_paste_code: content,
                api_paste_private: 1,
                api_paste_expire_date: "1W"
            }
        });

        return pasteResponse.data;
    } catch (error) {
        console.error("Error creating Pastebin paste:", error.message);
        return null;
    }
}

app.post("/generate-link", async (req, res) => {
    try {
        const { title, tier_id, number_of_tasks, theme, thumbnail } = req.body;

        const customKey = generateRandomKey(16);

        const pastebinUrl = await createPastebinPaste(customKey);

        if (!pastebinUrl) {
            return res.status(500).json({ error: "Failed to create Pastebin link" });
        }

        const lootLabsResponse = await axios.post(
            "https://api.lootlabs.gg/api/lootlabs/content_locker",
            {
                title: title.substring(0, 30),
                url: pastebinUrl,
                tier_id,
                number_of_tasks: Math.max(1, Math.min(number_of_tasks, 5)),
                theme,
                thumbnail
            },
            {
                headers: {
                    Authorization: `Bearer ${API_TOKEN}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                }
            }
        );

        res.json({
            pastebin_url: pastebinUrl,
            lootlabs_url: lootLabsResponse.data.message[0].loot_url
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate links", details: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));