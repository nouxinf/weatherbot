# WeatherBot

WeatherBot is my submission for the Codédex June 2025 Challenge! It's an AI chatbot that lets you decide what to wear based on the weather in a place🌦️

## Tech Stack

- **Node.js** – for the site's backend 💽
- **Express** – as the webserver 🌐
- **OpenAI** – using GPT-3.5 Turbo for AI features 🤖
- **Meteomatics** – for weather data 🌦️
- **OpenCage** – for converting place names to coordinates 🗺️
- **nes.css** - for the retro UI look 🕹️
- **SerenityOS Emoji** for the pixel art style emoji font

## Deployment

1. First, clone the repo
```bash
git clone https://github.com/nouxinf/weatherbot.git
```
2. Change into the directory and install dependencies
```bash
cd weatherbot
npm i
```
3. Create a file named `.env` and format it like this:
```
OPENAI_API_KEY=...
METEOMATICS_USERNAME=...
METEOMATICS_PASSWORD=...
OPENCAGE_API_KEY=...
```
4. Run the express server
```bash
node index.js
```
5. Go to `localhost:3000` in your browser and try it out!

