import Extractor from "./Extractor.js";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();
const app = express();

app.use(express.json());

const allowedOrigins = [
  process.env.EXTENSION_ORIGIN,
  process.env.LOCAL_EXTENSION_ORIGIN,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST"],
};

app.use(cors(corsOptions));

app.listen(process.env.PORT, () => {
  console.log("Server listening successfully!");
});

app.post("/metadata", async (req, res) => {
  const incomingData = req.body;

  if (!incomingData) {
    res.status(500).json("invalid request");
    return;
  }

  console.log(`Incoming data: `, incomingData);

  const url = `${process.env.API_URL}/${incomingData.word}?key=${process.env.API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Metadata fetch failed with status: ${res.status}`);
    return false;
  }

  const data = await response.json();

  if (Array.isArray(data) && data.length == 0) {
    console.error(`Metadata fetch failed!`);
  }

  console.log(`Response json`, data);

  const extractor = new Extractor(data[0]);
  const wordMetaData = extractor.getMetaData();

  console.log(`extracted metadata:\n`, wordMetaData);

  res.json({
    meta: JSON.stringify(wordMetaData),
  });
});
