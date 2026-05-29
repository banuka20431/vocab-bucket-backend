import wordTracker from "./redisClient.js";

export async function fetchWordFromCache(word) {
  if (!wordTracker.connect()) {
    console.log(`[ERROR] WordTracker is not ready!`);
    return null;
  }

  try {
    const cachedWordData = await wordTracker.getCachedMetadata(word);
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

export async function trackWord(wordMetadata) {
  try {
    await wordTracker.setOrIncrementWordCache(wordMetadata.spelling);

    const wordCount = await wordTracker.getWordCount(wordMetadata.spelling);

    const threshold = parseInt(process.env.CACHE_HIT_THRESHOLD) || 1;

    if (wordCount == threshold) {
      console.log(
        `[PROMOTING] "${wordMetadata.spelling}" hit ${wordCount} requests. Saving to cache.`,
      );
      await wordTracker.cacheWordMetadata(wordMetadata);
    }
  } catch (err) {
    console.log(`[ERROR] Init word tracking failed: ${err}`);
    return null;
  }
}
