// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { OpenAI } = require('openai');
const path = require('path');
const chrono = require('chrono-node');

const app = express();
const port = 3000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

// In-memory conversation history (per session, basic demo only)
let chatHistory = [
    {
        role: "system",
        content: "You're a friendly chatbot that gives weather updates and what to wear. Use emojis sometimes, but do not include any newlines or markdown. Give some info about the location mentioned, for example attractions or possible extreme weather. Show the wind speed only in miles per hour and kilometres per hour."
    }
];

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        // Ask OpenAI to extract a location name only
        const locationExtraction = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Extract the name of a city, town, or village mentioned in the user message. If none, return 'none'. Only return the place name, nothing else." },
                { role: "user", content: userMessage }
            ]
        });

        const town = locationExtraction.choices[0].message.content.trim();

        // If no location found, just continue as normal chatbot
        if (!town || town.toLowerCase() === 'none') {
            chatHistory.push({ role: "user", content: userMessage });

            const chatCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: chatHistory
            });

            const reply = chatCompletion.choices[0].message.content;
            chatHistory.push({ role: "assistant", content: reply });

            return res.json({ reply });
        }

        // Use chrono to parse the date from the user message
        const parsedDate = chrono.parseDate(userMessage);
        const date = parsedDate ? parsedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Geocode town name to coordinates using OpenCage API
        const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: {
                q: town,
                key: process.env.OPENCAGE_API_KEY
            }
        });

        if (!geoRes.data.results || geoRes.data.results.length === 0) {
            throw new Error('No geocoding results found.');
        }

        const result = geoRes.data.results[0];
        const lat = parseFloat(result.geometry.lat).toFixed(4);
        const lon = parseFloat(result.geometry.lng).toFixed(4);

        // Use only parameters available in Meteomatics free basic tier
        const weatherUrl = `https://api.meteomatics.com/${date}T12:00:00Z/t_2m:C,precip_1h:mm,wind_speed_10m:ms/${lat},${lon}/json`;
        const response = await axios.get(weatherUrl, {
            auth: {
                username: process.env.METEOMATICS_USERNAME,
                password: process.env.METEOMATICS_PASSWORD
            }
        });

        const temp = response.data.data.find(d => d.parameter === "t_2m:C")?.coordinates[0].dates[0].value;
        const precip = response.data.data.find(d => d.parameter === "precip_1h:mm")?.coordinates[0].dates[0].value;
        const windMs = response.data.data.find(d => d.parameter === "wind_speed_10m:ms")?.coordinates[0].dates[0].value;

        const windMph = (windMs * 2.23694).toFixed(1);
        const windKph = (windMs * 3.6).toFixed(1);

        chatHistory.push({ role: "user", content: userMessage });
        chatHistory.push({
            role: "user",
            content: `Weather: temperature is ${temp}°C, precipitation is ${precip}mm, wind speed is ${windMph} mph (${windKph} km/h). What should I wear?`
        });

        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: chatHistory
        });

        const advice = chatCompletion.choices[0].message.content;
        chatHistory.push({ role: "assistant", content: advice });

        res.json({ reply: advice });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Failed to fetch weather or generate response.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
