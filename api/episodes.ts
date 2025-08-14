// Vercel API route for episodes
import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { storage } from './_lib/storage.js';

// Import storage to fetch episodes from the database

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { type, search } = req.query;
      
      // Fetch all episodes from the database
      let episodes = await storage.getAllEpisodes();
      
      // If no episodes in database, return empty array
      if (!episodes || episodes.length === 0) {
        return res.status(200).json([]);
      }

      // Apply filters
      if (type && type !== 'all') {
        episodes = episodes.filter(episode => episode.episodeType === type);
      }

      if (search) {
        const searchTerm = search.toString().toLowerCase();
        episodes = episodes.filter(episode => 
          episode.title.toLowerCase().includes(searchTerm) ||
          (episode.description && episode.description.toLowerCase().includes(searchTerm))
        );
      }

      // Sort by publication date (newest first)
      episodes.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      return res.status(200).json(episodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      // @ts-ignore
      return res.status(500).json({ message: 'Failed to fetch episodes', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}