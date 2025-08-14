import { type User, type InsertUser, type Episode, type InsertEpisode } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private episodes: Map<string, Episode>;

  constructor() {
    this.users = new Map();
    this.episodes = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllEpisodes(): Promise<Episode[]> {
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
      ...insertEpisode, 
      id,
      duration: insertEpisode.duration || null,
      episodeNumber: insertEpisode.episodeNumber || null,
      enclosureUrl: insertEpisode.enclosureUrl || null,
      description: insertEpisode.description || null,
      isExplicit: insertEpisode.isExplicit || false,
      createdAt: new Date()
    };
    this.episodes.set(id, episode);
    return episode;
  }

  async upsertEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    // Check if episode already exists by link
    const existingEpisode = Array.from(this.episodes.values()).find(
      ep => ep.link === insertEpisode.link
    );
    
    if (existingEpisode) {
      const updatedEpisode = { ...existingEpisode, ...insertEpisode };
      this.episodes.set(existingEpisode.id, updatedEpisode);
      return updatedEpisode;
    } else {
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
}

export const storage = new MemStorage();
