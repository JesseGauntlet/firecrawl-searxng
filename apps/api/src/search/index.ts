import { logger } from "../../src/lib/logger";
import { SearchResult } from "../../src/lib/entities";
import { googleSearch } from "./googlesearch";
import { fireEngineMap } from "./fireEngine";
import { searchapi_search } from "./searchapi";
import { serper_search } from "./serper";
import { searxSearch } from "./searx";

export async function search({
  query,
  advanced = false,
  num_results = 5,
  tbs = undefined,
  filter = undefined,
  lang = "en",
  country = "us",
  location = undefined,
  proxy = undefined,
  sleep_interval = 0,
  timeout = 5000,
}: {
  query: string;
  advanced?: boolean;
  num_results?: number;
  tbs?: string;
  filter?: string;
  lang?: string;
  country?: string;
  location?: string;
  proxy?: string;
  sleep_interval?: number;
  timeout?: number;
}): Promise<SearchResult[]> {
  try {
    // Add detailed environment logging
    logger.debug("Full environment check:", {
      SEARXNG_URL: process.env.SEARXNG_URL || 'not set',
      SERPER_API_KEY: process.env.SERPER_API_KEY ? "set" : "not set",
      SEARCHAPI_API_KEY: process.env.SEARCHAPI_API_KEY ? "set" : "not set",
      NODE_ENV: process.env.NODE_ENV,
      query,
      num_results
    });

    if (!process.env.SEARXNG_URL) {
      logger.error("SEARXNG_URL is not set!");
      throw new Error("SEARXNG_URL environment variable is required");
    }

    logger.info("Using SearxNG for search", { url: process.env.SEARXNG_URL });
    try {
      const results = await searxSearch(query, {
        num_results,
        tbs,
        filter,
        lang,
        country,
        location,
      });
      
      logger.debug("SearxNG search completed", { 
        resultsCount: results.length,
        firstResult: results[0]?.title || 'no results'
      });
      
      return results;
    } catch (error) {
      logger.error("SearxNG search failed:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query
      });
      throw error; // Don't fall back to other search engines if SearxNG is configured
    }

    // This code should never be reached when SEARXNG_URL is set
    if (process.env.SERPER_API_KEY) {
      logger.info("Using Serper for search");
      return await serper_search(query, {
        num_results,
        tbs,
        filter,
        lang,
        country,
        location,
      });
    }

    if (process.env.SEARCHAPI_API_KEY) {
      logger.info("Using SearchAPI for search");
      return await searchapi_search(query, {
        num_results,
        tbs,
        filter,
        lang,
        country,
        location,
      });
    }

    logger.info("Using Google Search as fallback");
    return await googleSearch(
      query,
      advanced,
      num_results,
      tbs,
      filter,
      lang,
      country,
      proxy,
      sleep_interval,
      timeout,
    );
  } catch (error) {
    logger.error(`Error in search function:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      query
    });
    throw error;
  }
}
