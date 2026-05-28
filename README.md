# Vocab Bucket - Backend Proxy API

## 1. Introduction

### Overview
This repository contains the Node.js/Express backend proxy for the **Vocab Bucket** Chrome Extension. 

Its primary purpose is to securely handle requests to the Merriam-Webster Learner's Dictionary API. By routing requests through this server, the extension's client-side code remains lightweight, and sensitive API keys are kept strictly out of the browser environment.

### Tech Stack
* **Node.js & Express:** Core server architecture and routing.
* **CORS:** Middleware configured to strictly accept requests only from the verified Vocab Bucket extension origins.
* **Dotenv:** Environment variable management for API keys and port configurations.
* **Redis:** Optional caching layer used to store promoted word metadata and hit counts.
* **ES6 Modules:** Modern JavaScript syntax (`import`/`export`) for clean, maintainable code.

---

## 2. Project Structure

## 5. Caching (Redis)

This project optionally uses Redis as a lightweight caching layer to reduce external API calls and improve response times for frequently requested words. Caching is implemented as a promotion-based cache: words are tracked with a hit counter and only promoted to the metadata cache when they exceed a configurable threshold.

- **Promotion flow:** Each `POST /metadata` request increments a per-word counter. When that counter >= `CACHE_HIT_THRESHOLD`, the cleaned metadata for that word is stored in Redis under `cache:metadata:<word>`.
- **Stored data:** Cached metadata is the same `meta` object returned on a fresh fetch (serialized JSON). Counters are stored under `cache:count:<word>`.
- **TTL:** Counters and cached metadata use configurable TTLs so stale entries expire automatically.

Environment variables controlling cache behavior (examples in `.env`):

```env
REDIS_URL=redis://127.0.0.1:6379
CACHE_TTL_SEC=2592000            # TTL for per-word hit counters (seconds)
CACHE_HIT_THRESHOLD=1            # Promote to cache after this many hits
```

To use Redis locally you can run it with Docker:

```bash
docker run -p 6379:6379 -d redis:7-alpine
```

Install the Redis client dependency (if not already present):

```bash
npm install redis
```

Notes:
- The server code expects `REDIS_URL` to point to your Redis instance. If Redis is not available, the server should fall back to live fetches (implementation dependent).
- TTL and threshold defaults are set to reasonable values, but adjust them to fit your traffic and storage preferences.

```text
vocab-bucket-backend/
├── core/              # Core helpers: Extractor, cache handler, redis tracker
│   ├── Extractor.js
│   ├── CacheHandler.js
│   └── WordTracker.js
├── server.js          # Express application entry point and route definitions
├── package.json       # Project dependencies and npm scripts
├── .env.example       # Template for required environment variables
└── README.md          # Project documentation

```

---

## 3. API Reference

### `POST /metadata`

Fetches, cleans, and formats dictionary data for a requested word.

#### Successful Request

**Request Body (JSON):**

```json
{
  "word": "simplify"
}

```

**Successful Response (200 OK):**

```json
{
  "meta": "{\"spelling\":\"simplify\",\"pronunciation\":\"/ˈsɪmpləˌfaɪ/\",\"category\":\"verb\",\"definition\":{\"full\":\"to make (something) easier to do or understand\",\"short\":\"to make (something) easier to do or understand\"},\"usage\":[\"He tried to simplify the instructions.\"],\"audioURL\":\"[https://media.merriam-webster.com/audio/prons/en/us/mp3/s/simpli01.mp3](https://media.merriam-webster.com/audio/prons/en/us/mp3/s/simpli01.mp3)\",\"timestamp\":\"2026-05-23T14:35:00.000Z\"}"
}

```

#### Error Responses

**Missing Word Payload (500 Internal Server Error):**

```json
"invalid request"

```

**External API Failure / Word Not Found (Console Error Logged):**

> *Note: Currently, external fetch failures log to the server console and terminate the request without returning a JSON error to the client. This will be updated in future versions.*

---

## 4. Architecture: The Extractor Class

To keep the Express routes clean, all data parsing is encapsulated within the `Extractor.js` utility class. The Merriam-Webster API returns deeply nested and heavily tagged JSON (e.g., `{bc}`, `{it}`). The `Extractor` strips these proprietary tags and standardizes the output into a single, predictable `meta` object that the Chrome Extension can immediately render.

---

## 5. Local Setup & Configuration

### Prerequisites

* Node.js (v18+ recommended)
* A Merriam-Webster Learner's Dictionary API Key

### Installation

1. **Clone the repository:**

```bash
   git clone [https://github.com/banuka20431/vocab-bucket-backend.git](https://github.com/banuka20431/vocab-bucket-backend.git)
   cd vocab-bucket-backend

```

2. **Install dependencies:**

```bash
   npm install

```

3. **Environment Setup:**
Create a `.env` file in the root directory and populate it with the following keys:

```env
   API_KEY=your_merriam_webster_api_key_here
   API_URL=[https://www.dictionaryapi.com/api/v3/references/learners/json](https://www.dictionaryapi.com/api/v3/references/learners/json)
   PORT=3000
   API_AUDIO_URL=[https://media.merriam-webster.com/audio/prons/en/us/mp3/](https://media.merriam-webster.com/audio/prons/en/us/mp3/)
   EXTENSION_ORIGIN=chrome-extension://<your_production_extension_id>
   LOCAL_EXTENSION_ORIGIN=chrome-extension://<your_local_testing_extension_id>

```

4. **Run the Server:**

```bash
   # For development with auto-reloading (nodemon)
   npm run dev

   # For production
   npm start

```

The server will start listening on the port defined in your `.env` file.

---

## 6. Deployment Guidelines

1. Ensure your `EXTENSION_ORIGIN` matches the exact ID generated by the Chrome Web Store once your frontend extension is published.

---

## 7. License

This project is licensed under the MIT License.
