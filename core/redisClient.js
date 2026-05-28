import { createClient } from "redis";

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
        expiration: process.env.TTL_SEC || 600,
      });
      return true;
    }

    this.client.incr(key);

    return false;
  }

  async cacheWordMetadata(wordMetaData) {
    const key = `cache:metadata:${wordMetaData.spelling}`;
    await this.client.set(key, wordMetaData);
  }

  async getWordCount(word) {
    const key = `cache:count:${word}`;
    return parseInt(await this.client.get(key));
  }
}

export default await new WordTracker().connect();
