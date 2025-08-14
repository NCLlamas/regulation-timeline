// Vercel API route for episodes
import { type VercelRequest, type VercelResponse } from '@vercel/node';

// Simple test data to verify the API route works
const sampleEpisodes = [
  {
    id: "test-1",
    title: "Test Episode 1",
    description: "This is a test episode to verify the API is working",
    link: "https://example.com/test-1",
    pubDate: new Date("2024-01-15"),
    episodeType: "podcast",
    episodeNumber: "1",
    duration: null,
    enclosureUrl: null,
    isExplicit: false,
    createdAt: new Date()
  },
  {
    id: "test-2", 
    title: "Test Episode 2",
    description: "Another test episode",
    link: "https://example.com/test-2",
    pubDate: new Date("2024-01-10"),
    episodeType: "draft",
    episodeNumber: "2",
    duration: null,
    enclosureUrl: null,
    isExplicit: false,
    createdAt: new Date()
  }
];

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
      let episodes = [...sampleEpisodes];

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