import { type User, type InsertUser, type Episode, type InsertEpisode } from "../../shared/schema.js";
// Explicitly define the InsertUser type structure for typescript validation
type UserInput = {
  username: string;
  password: string;
};
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Episode methods
  getAllEpisodes(): Promise<Episode[]>;
  getEpisodesByType(episodeType: string): Promise<Episode[]>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  upsertEpisode(episode: InsertEpisode): Promise<Episode>;
  searchEpisodes(query: string): Promise<Episode[]>;
  clearAllEpisodes(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private episodes: Map<string, Episode>;

  constructor() {
    this.users = new Map();
    this.episodes = new Map();
    // No sample data initialization
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<User> {
    // Use any type to bypass type checking since InsertUser is giving problems
    // This is a temporary workaround
    const id = randomUUID();
    const user: User = {
      id: id,
      username: insertUser.username,
      password: insertUser.password
    };
    this.users.set(id, user);
    return user;
  }

  async getAllEpisodes(): Promise<Episode[]> {
    // Simply return all episodes, sorted by date (newest first)
    return Array.from(this.episodes.values()).sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
  }

  async getEpisodesByType(episodeType: string): Promise<Episode[]> {
    return Array.from(this.episodes.values())
      .filter(episode => episode.episodeType === episodeType)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const id = randomUUID();
    const episode: Episode = {
      id,
      link: insertEpisode.link,
      title: insertEpisode.title,
      description: insertEpisode.description ?? null,
      pubDate: insertEpisode.pubDate,
      episodeType: insertEpisode.episodeType,
      episodeNumber: insertEpisode.episodeNumber ?? null,
      duration: insertEpisode.duration ?? null,
      enclosureUrl: insertEpisode.enclosureUrl ?? null,
      isExplicit: insertEpisode.isExplicit ?? null,
      createdAt: new Date()
    };
    this.episodes.set(id, episode);
    return episode;
  }

  async upsertEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    // Find existing episode by title
    const existingEpisode = Array.from(this.episodes.values()).find(
      ep => ep.title === insertEpisode.title && ep.episodeType === insertEpisode.episodeType
    );

    if (existingEpisode) {
      // Update existing episode
      const updatedEpisode: Episode = {
        ...existingEpisode,
        link: insertEpisode.link,
        title: insertEpisode.title,
        description: insertEpisode.description ?? existingEpisode.description,
        pubDate: insertEpisode.pubDate,
        episodeType: insertEpisode.episodeType,
        episodeNumber: insertEpisode.episodeNumber ?? existingEpisode.episodeNumber,
        duration: insertEpisode.duration ?? existingEpisode.duration,
        enclosureUrl: insertEpisode.enclosureUrl ?? existingEpisode.enclosureUrl,
        isExplicit: insertEpisode.isExplicit ?? existingEpisode.isExplicit,
      };
      this.episodes.set(existingEpisode.id, updatedEpisode);
      return updatedEpisode;
    } else {
      // Create new episode
      return this.createEpisode(insertEpisode);
    }
  }

  async searchEpisodes(query: string): Promise<Episode[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.episodes.values())
      .filter(episode => 
        episode.title.toLowerCase().includes(searchTerm) ||
        (episode.description && episode.description.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  }
  
  async clearAllEpisodes(): Promise<void> {
    this.episodes.clear();
  }
}

export const storage = new MemStorage();
