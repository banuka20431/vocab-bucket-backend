import { createClient } from "redis";

import dotenv from "dotenv";

dotenv.config();
class WordTracker {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    });

    this.client.on("error", (err) => console.error("Redis Client Error", err));
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("Connected to Redis");
    }
    return this;
  }

  async setOrIncrementWordCache(word) {
    const key = `cache:count:${word}`;
    if ((await this.client.exists(key)) != 1) {
      await this.client.set(key, "1", {
        EX: parseInt(process.env.CACHE_TRACKED_WORD_TTL_SEC) || 2592000,
      });
    } else {
      await this.client.incr(key);
    }
  }

  async cacheWordMetadata(wordMetaData) {
    const key = `cache:metadata:${wordMetaData.spelling}`;
    await this.client.set(key, JSON.stringify(wordMetaData), {
      EX: parseInt(process.env.CACHE_METADATA_TTL_SEC) || 2592000,
    });
  }

  async getWordCount(word) {
    const key = `cache:count:${word}`;
    return parseInt(await this.client.get(key));
  }
}

export default await new WordTracker().connect();
