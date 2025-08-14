// Vercel API route for refreshing episodes from RSS feeds
import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage.js';
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
    console.log(`Starting to fetch RSS feed: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`HTTP error fetching ${url}: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const xmlText = await response.text();
    console.log(`Fetched ${xmlText.length} characters from ${url}`);
    
    // Simple XML parsing for RSS
    const items = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    
    if (itemMatches) {
      console.log(`Found ${itemMatches.length} items in ${url}`);
      for (const item of itemMatches) {
        try {
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
            const pubDate = new Date(pubDateStr);
            if (isNaN(pubDate.getTime())) {
              console.warn(`Invalid date for episode "${title}": ${pubDateStr}`);
              continue;
            }
            
            items.push({
              title: title.trim(),
              description: description.trim() || null,
              link: link.trim(),
              pubDate,
              episodeType: categorizeEpisode(title),
              episodeNumber: episodeNumber?.toString() || null,
              duration: duration.trim() || null,
              enclosureUrl: null, // Not extracted from RSS currently
              isExplicit: isExplicit || false
            });
          } else {
            console.warn(`Skipping item with missing required fields: title="${title}", link="${link}", pubDate="${pubDateStr}"`);
          }
        } catch (itemError) {
          console.error(`Error parsing individual item:`, itemError);
          continue;
        }
      }
    } else {
      console.warn(`No items found in RSS feed: ${url}`);
    }
    
    console.log(`Successfully parsed ${items.length} items from ${url}`);
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
      console.log("Starting episode refresh process");
      
      // RSS feed URLs
      const patreonUrl = "https://www.patreon.com/rss/TheRegulationPod?auth=FI4Px3rfsiZuB02TVN2KJGWBq5dyDX1W&show=868416";
      const megaphoneUrl = "https://feeds.megaphone.fm/fface";

      console.log("Fetching from patreon:", patreonUrl);
      const patreonEpisodes = await parseRSSFeed(patreonUrl);
      console.log(`Patreon episodes fetched: ${patreonEpisodes.length}`);

      console.log("Fetching from megaphone:", megaphoneUrl);
      const megaphoneEpisodes = await parseRSSFeed(megaphoneUrl);
      console.log(`Megaphone episodes fetched: ${megaphoneEpisodes.length}`);

      // Combine and deduplicate episodes using title-only matching
      const allEpisodes = [...patreonEpisodes, ...megaphoneEpisodes];
      console.log(`Total episodes before deduplication: ${allEpisodes.length}`);
      
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

      console.log(`Unique episodes after deduplication: ${uniqueEpisodes.length}`);

      // Clear existing episodes and add new ones
      console.log("Clearing existing episodes");
      await storage.clearAllEpisodes();
      
      const savedEpisodes = [];
      console.log("Starting to save episodes");
      
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

      console.log(`Successfully saved ${savedEpisodes.length} episodes`);

      return res.status(200).json({
        message: `Successfully refreshed ${savedEpisodes.length} episodes`,
        episodes: savedEpisodes
      });
    } catch (error) {
      console.error('Error refreshing episodes:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return res.status(500).json({ 
        message: 'Failed to refresh episodes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}