// Vercel API route for refreshing episodes from RSS feeds
import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage.js';
import { insertEpisodeSchema } from '../../shared/schema.js';

// Storage instance is imported directly

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
async function parseRSSFeed(url: string) {
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
        const pubDateStr = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        const duration = item.match(/<itunes:duration>(.*?)<\/itunes:duration>/)?.[1] || '';
        const isExplicit = item.includes('<itunes:explicit>true</itunes:explicit>');
        
        // Extract episode number if available
        const episodeNumberMatch = item.match(/<itunes:episode>(\d+)<\/itunes:episode>/);
        const episodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[1]) : undefined;
        
        if (title && link && pubDateStr) {
          items.push({
            title: title.trim(),
            description: description.trim(),
            link: link.trim(),
            pubDate: new Date(pubDateStr),
            duration: duration.trim(),
            episodeNumber,
            isExplicit,
            episodeType: categorizeEpisode(title)
          });
        }
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // RSS feed URLs
      const patreonUrl = "https://www.patreon.com/rss/TheRegulationPod?auth=FI4Px3rfsiZuB02TVN2KJGWBq5dyDX1W&show=868416";
      const megaphoneUrl = "https://feeds.megaphone.fm/fface";

      console.log("Fetching from patreon:", patreonUrl);
      const patreonEpisodes = await parseRSSFeed(patreonUrl);

      console.log("Fetching from megaphone:", megaphoneUrl);
      const megaphoneEpisodes = await parseRSSFeed(megaphoneUrl);

      // Combine and deduplicate episodes using title-only matching
      const allEpisodes = [...patreonEpisodes, ...megaphoneEpisodes];
      const uniqueEpisodes = allEpisodes.reduce((acc, episode) => {
        // Use title-only matching for better deduplication across feeds
        const normalizedTitle = episode.title.toLowerCase().trim();
        const existingEpisode = acc.find(e => e.title.toLowerCase().trim() === normalizedTitle);
        
        if (!existingEpisode) {
          acc.push(episode);
        } else if (episode.description && episode.description.length > existingEpisode.description?.length) {
          // Replace with version that has better description
          const index = acc.indexOf(existingEpisode);
          acc[index] = episode;
        }
        
        return acc;
      }, [] as any[]);

      // Clear existing episodes and add new ones
      await storage.clearAllEpisodes();
      
      const savedEpisodes = [];
      for (const episodeData of uniqueEpisodes) {
        try {
          const validatedData = insertEpisodeSchema.parse(episodeData);
          const savedEpisode = await storage.createEpisode(validatedData);
          savedEpisodes.push(savedEpisode);
        } catch (validationError) {
          console.error('Episode validation failed:', validationError, episodeData);
          continue;
        }
      }

      return res.status(200).json({
        message: `Successfully refreshed ${savedEpisodes.length} episodes`,
        episodes: savedEpisodes
      });
    } catch (error) {
      console.error('Error refreshing episodes:', error);
      return res.status(500).json({ message: 'Failed to refresh episodes' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}