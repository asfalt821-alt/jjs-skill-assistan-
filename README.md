# JJS Skill Assistant — public website deployment

## What is included
- English is the first-launch default; later language choices are remembered.
- The character workspace starts empty. Paste a KLUv code to load a character.
- Node.js/Express backend for AI chat.
- OpenAI Responses API with hosted web search.
- API key is read only from the server environment, never from the browser HTML.
- Basic API rate limit: 20 requests per IP per 10 minutes.

## Before publishing
This is a public website with a paid AI API behind it. Anyone who can reach the public chat may use your API quota. The included rate limit is only a basic safeguard, not a complete abuse-prevention system. Ask a parent/guardian to help manage the hosting and API account, billing, and usage limits. Do not publish the site or share its URL until usage controls are configured.

## Deploy to Render using GitHub
1. Extract this ZIP.
2. Create a GitHub repository and upload the contents of this folder (not the ZIP file itself). Include `server.js`, `package.json`, `render.yaml`, `.env.example`, `README.md`, and the `public` folder.
3. In Render, choose **New > Blueprint** (or connect the repository as a **Web Service**).
4. If using Blueprint, Render reads `render.yaml`. If creating a Web Service manually, use:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
5. In the Render service's Environment settings, add `OPENAI_API_KEY` and paste your API key there. Never put it in `public/index.html`, GitHub, chat messages, or screenshots.
6. Set `OPENAI_MODEL` to `gpt-6.2-astra` if it is not already present.
7. Deploy. When the build finishes, Render provides an HTTPS address such as `https://your-service.onrender.com`.
8. Open that address. Test `/api/health`; it should show `ok: true` and `aiConfigured: true`.

## Important hosting notes
- Render free web services can go idle after 15 minutes without traffic and may take a little time to wake up on the next visit.
- API usage may cost money separately from website hosting.
- Do not commit a `.env` file. `.env.example` is safe because it contains only a placeholder.
- If you later suspect the API key was exposed, rotate it in the API dashboard immediately.

## Run locally
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## Accuracy
The assistant is designed to focus on Jujutsu Shenanigans skill builds and to search the web for current information when useful. It can still make mistakes and cannot guarantee every answer is correct.
