import dotenv from "dotenv";

import express from "express";
import cors from "cors";

import Extractor from "./core/metadataExtractor.js";
import { fetchWordFromCache, trackWord } from "./core/CacheHandler.js";


dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins = [
  process.env.EXTENSION_ORIGIN,
  process.env.LOCAL_EXTENSION_ORIGIN,
];

const api_url = "https://www.dictionaryapi.com/api/v3/references/learners/json";

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.startsWith("chrome-extension://")
    ) {
      callback(null, true);
    } else {
      callback(new Error("[ERROR] Not allowed by CORS"));
    }
  },
  methods: ["POST"],
};

app.use(cors(corsOptions));


app.post("/metadata", async (req, res) => {
  // Extract and validate the request body
  const incomingData = req?.body;

  if (incomingData == undefined) {
    return res
      .status(500)
      .json("[ERROR] Invalid request: unresolvable request!");
  }

  console.log(`[INFO] Incoming data: `, incomingData);

  const requestedWord = incomingData?.word;

  if (requestedWord == undefined || typeof requestedWord != "string") {
    return res.status(500).json("[ERROR] Invalid request: invalid word!");
  }

  // Check cache and return cached metadata if present
  const cachedMetadata = await fetchWordFromCache(requestedWord);

  if (cachedMetadata != null) {
    return res.json({ meta: JSON.stringify(cachedMetadata) });
  }

  // On cache miss: fetch word metadata from external API and validate response

  console.log(`[CACHE MISS] Fetching "${requestedWord}"  metadata from API...`);

  const url = `${process.env.API_URL || api_url}/${incomingData.word}?key=${process.env.API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errmsg = `[ERROR] Metadata fetch failed with status: ${response.status}`;
    console.error(errmsg);
    return res.status(500).json(errmsg);
  }

  const data = await response?.json();

  if (data == null || (Array.isArray(data) && data?.length == 0)) {
    const errmsg = "[ERROR] Invalid fetch: no data were fetched";
    console.log(errmsg);
    return res.status(500).json(errmsg);
  }

  console.log(`[INFO] Response json`, data);

  // Extract required metadata from the API response

  const extractor = new Extractor(data[0]);
  const wordMetaData = extractor.getMetaData();

  console.log(`[INFO] Extracted metadata:\n`, wordMetaData);

  await trackWord(wordMetaData);

  res.json({
    meta: JSON.stringify(wordMetaData),
  });
});


app.listen(process.env.PORT, () => {
  console.log("[SUCCESS] Server listening...");
});