import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEpisodeSchema } from "@shared/schema";
import { z } from "zod";

// Content categorization utility
function categorizeEpisode(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  // Podcast Episode: ends with brackets and a number like [60]
  if (/\[\d+\]$/.test(title)) {
    return 'podcast';
  }
  
  // Check for specific content types
  if (lowerTitle.includes('draft')) {
    return 'draft';
  }
  if (lowerTitle.includes('watchalong')) {
    return 'watchalong';
  }
  if (lowerTitle.includes('sausage talk')) {
    return 'sausage-talk';
  }
  if (lowerTitle.includes('blindside')) {
    return 'blindside';
  }
  
  // Default to supplemental content
  return 'bonus';
}

// RSS parsing utility
async function parseRSSFeed(url: string): Promise<z.infer<typeof insertEpisodeSchema>[]> {
  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    
    // Simple XML parsing for RSS
    const items = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    
    if (itemMatches) {
      for (const item of itemMatches) {
        // Extract data from XML
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                     item.match(/<title>(.*?)<\/title>/)?.[1] || '';
        
        // Try CDATA first, then plain text, handling multiline content
        const descriptionCDATA = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1];
        const descriptionPlain = item.match(/<description>([\s\S]*?)<\/description>/)?.[1];
        const description = descriptionCDATA || descriptionPlain || '';
        
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        
        const episodeType = item.match(/<itunes:episodeType>(.*?)<\/itunes:episodeType>/)?.[1] || 'full';
        const itunesEpisodeNumber = item.match(/<itunes:episode>(.*?)<\/itunes:episode>/)?.[1] || '';
        const isExplicit = item.match(/<itunes:explicit>(.*?)<\/itunes:explicit>/)?.[1] === 'true';
        
        const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]*)"[^>]*length="([^"]*)"[^>]*type="([^"]*)"[^>]*>/);
        const enclosureUrl = enclosureMatch?.[1] || '';
        
        if (title && link && pubDate) {
          const cleanTitle = title.trim();
          
          // Extract episode number from title ending with [##] format
          let episodeNumber = itunesEpisodeNumber;
          if (!episodeNumber || episodeNumber === '') {
            // Check for title format ending with [##]
            const titleNumberMatch = cleanTitle.match(/\[(\d+)\]\s*$/); // Match [##] at the end of the title
            if (titleNumberMatch && titleNumberMatch[1]) {
              episodeNumber = titleNumberMatch[1];
            }
          }
          
          items.push({
            title: cleanTitle,
            description: description.trim(),
            link: link.trim(),
            pubDate: new Date(pubDate),
            episodeType: categorizeEpisode(cleanTitle),
            episodeNumber: episodeNumber || null,
            duration: null, // Could extract from description if needed
            enclosureUrl: enclosureUrl || null,
            isExplicit: isExplicit
          });
        }
      }
    }
    
    // Validate episodes against schema
    const validatedEpisodes = items.map((episode) => {
      try {
        return insertEpisodeSchema.parse(episode);
      } catch (error) {
        console.error('Episode validation failed:', error, 'Episode data:', episode);
        return null;
      }
    }).filter((episode): episode is z.infer<typeof insertEpisodeSchema> => episode !== null);
    
    return validatedEpisodes;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw new Error('Failed to parse RSS feed');
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Fetch and refresh episodes from RSS feeds
  app.post("/api/episodes/refresh", async (req, res) => {
    try {
      const feeds = [
        {
          url: "https://www.patreon.com/rss/TheRegulationPod?auth=FI4Px3rfsiZuB02TVN2KJGWBq5dyDX1W&show=868416",
          source: "patreon"
        },
        {
          url: "https://feeds.megaphone.fm/fface",
          source: "megaphone"
        }
      ];
      
      let allEpisodes: z.infer<typeof insertEpisodeSchema>[] = [];
      let feedResults: string[] = [];
      
      for (const feed of feeds) {
        try {
          console.log(`Fetching from ${feed.source}: ${feed.url}`);
          const episodes = await parseRSSFeed(feed.url);
          allEpisodes = allEpisodes.concat(episodes);
          feedResults.push(`${episodes.length} from ${feed.source}`);
        } catch (feedError) {
          console.error(`Error fetching from ${feed.source}:`, feedError);
          feedResults.push(`${feed.source} failed`);
        }
      }
      
      // Remove duplicates based on title only
      const uniqueEpisodes = allEpisodes.reduce((acc, episode) => {
        const key = episode.title.trim().toLowerCase();
        if (!acc.has(key)) {
          acc.set(key, episode);
        }
        return acc;
      }, new Map());
      
      const episodesToSave = Array.from(uniqueEpisodes.values());
      
      // Upsert episodes to storage
      const savedEpisodes = [];
      for (const episode of episodesToSave) {
        const saved = await storage.upsertEpisode(episode);
        savedEpisodes.push(saved);
      }
      
      res.json({ 
        message: `Successfully refreshed ${savedEpisodes.length} episodes (${feedResults.join(', ')})`,
        episodes: savedEpisodes 
      });
    } catch (error) {
      console.error('Error refreshing episodes:', error);
      res.status(500).json({ 
        message: "Failed to refresh episodes from RSS feeds",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all episodes - with optional refresh parameter
  app.get("/api/episodes", async (req, res) => {
    try {
      const { type, search, refresh } = req.query;
      
      // Refresh episodes from RSS feeds if the refresh parameter is true
      if (refresh === 'true') {
        try {
          const feeds = [
            {
              url: "https://www.patreon.com/rss/TheRegulationPod?auth=FI4Px3rfsiZuB02TVN2KJGWBq5dyDX1W&show=868416",
              source: "patreon"
            },
            {
              url: "https://feeds.megaphone.fm/fface",
              source: "megaphone"
            }
          ];
          
          let allEpisodes: z.infer<typeof insertEpisodeSchema>[] = [];
          let feedResults: string[] = [];
          
          for (const feed of feeds) {
            try {
              console.log(`Fetching from ${feed.source}: ${feed.url}`);
              const episodes = await parseRSSFeed(feed.url);
              allEpisodes = allEpisodes.concat(episodes);
              feedResults.push(`${episodes.length} from ${feed.source}`);
            } catch (feedError) {
              console.error(`Error fetching from ${feed.source}:`, feedError);
              feedResults.push(`${feed.source} failed`);
            }
          }
          
          // Remove duplicates based on title only
          const uniqueEpisodes = allEpisodes.reduce((acc, episode) => {
            const key = episode.title.trim().toLowerCase();
            if (!acc.has(key)) {
              acc.set(key, episode);
            }
            return acc;
          }, new Map());
          
          const episodesToSave = Array.from(uniqueEpisodes.values());
          
          // Upsert episodes to storage
          for (const episode of episodesToSave) {
            await storage.upsertEpisode(episode);
          }
          
          console.log(`Successfully refreshed episodes: ${feedResults.join(', ')}`);
        } catch (refreshError) {
          console.error('Error during refresh:', refreshError);
          // Continue with normal episode fetching even if refresh fails
        }
      }
      
      // Normal episode fetching logic
      let episodes;
      if (search && typeof search === 'string') {
        episodes = await storage.searchEpisodes(search);
      } else if (type && typeof type === 'string' && type !== 'all') {
        episodes = await storage.getEpisodesByType(type);
      } else {
        episodes = await storage.getAllEpisodes();
      }
      
      res.json(episodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      res.status(500).json({ message: "Failed to fetch episodes" });
    }
  });


  // Search episodes
  // app.get("/api/episodes/search", async (req, res) => {
  //   try {
  //     const { q } = req.query;
  //     if (!q || typeof q !== 'string') {
  //       return res.status(400).json({ message: "Search query is required" });
  //     }
      
  //     const episodes = await storage.searchEpisodes(q);
  //     res.json(episodes);
  //   } catch (error) {
  //     console.error('Error searching episodes:', error);
  //     res.status(500).json({ message: "Failed to search episodes" });
  //   }
  // });

  const httpServer = createServer(app);
  return httpServer;
}
