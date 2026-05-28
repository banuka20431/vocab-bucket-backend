import wordTracker from "./redisClient.js";

export async function fetchWordFromCache(word) {
  if (!wordTracker) {
    console.log(`[ERROR] WordTracker is not ready!`);
    return null;
  }

  try {
    const cacheKey = `cache:metadata:${word}`;
    const cachedWordData = await redisClient.get(cacheKey);
    if (cachedWordData) {
      console.log(`[CACHE HIT] Serving "${word}" directly from Redis...`);
      return JSON.parse(cachedWordData);
    }
    return null;
  } catch (err) {
    console.log(`[ERROR] fetching from cache failed: ${err}`);
    return null;
  }
}

export async function trackWord(word) {
  try {
    await wordTracker.setOrIncrementWordCache(word.spelling);

    const wordCount = await wordTracker.getWordCount(word.spelling);

    const threshold = parseInt(process.env.CACHE_HIT_THRESHOLD) || 1;

    if (wordCount >= threshold) {
      console.log(
        `[PROMOTING] "${word}" hit ${wordCount} requests. Saving to cache.`,
      );

      (await wordTracker).cacheWordMetadata(word);
    }
    } catch (err) {
    console.log(`[ERROR] Init word tracking failed: ${err}`);
    return null;
  }
}
