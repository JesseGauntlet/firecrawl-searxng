import axios from "axios";
import { SearchResult } from "../../src/lib/entities";
import { logger } from "../../src/lib/logger";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

export async function searxSearch(
  q: string,
  options: {
    tbs?: string;
    filter?: string;
    lang?: string;
    country?: string;
    location?: string;
    num_results: number;
    page?: number;
  },
): Promise<SearchResult[]> {
  try {
    if (!process.env.SEARXNG_URL) {
      throw new Error("SEARXNG_URL environment variable is not set");
    }

    const params = {
      q: q,
      format: "json",
      language: options.lang || "en",
      time_range: options.tbs,
      pageno: options.page || 1,
      categories: "general",
      engines: "google,bing,duckduckgo",
      results: options.num_results
    };

    const headers = {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
      "Referer": process.env.SEARXNG_URL,
      "X-Requested-With": "XMLHttpRequest"
    };

    const response = await axios.get(process.env.SEARXNG_URL + "/search", {
      params,
      headers,
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status === 200, // Only accept 200 status
    });

    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results.map((result: any) => ({
        url: result.url,
        title: result.title,
        description: result.content || result.description || ""
      }));
    }

    throw new Error("Invalid response format from SearxNG");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        throw new Error("Access forbidden by SearxNG. Check authentication settings.");
      } else {
        throw new Error(`SearxNG search failed: ${error.message}`);
      }
    } else {
      throw new Error(`Unexpected error in SearxNG search: ${error}`);
    }
  }
} 