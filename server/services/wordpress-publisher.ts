/**
 * ====================================================
 * WORDPRESS PUBLISHER SERVICE
 * ====================================================
 * 
 * Publishes blog content to WordPress via REST API.
 * Uses Application Password authentication (WordPress 5.6+).
 * 
 * Required environment variables:
 * - WORDPRESS_SITE_URL: WordPress site URL (e.g., https://complianceworxs.com)
 * - WORDPRESS_USERNAME: WordPress admin username
 * - WORDPRESS_APP_PASSWORD: Application password from WordPress
 */

import { nanoid } from 'nanoid';

export interface WordPressPost {
  title: string;
  content: string;
  status: 'publish' | 'draft' | 'future' | 'private';
  excerpt?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  meta?: Record<string, any>;
  date?: string;
  date_gmt?: string;
}

export interface WordPressPublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
  timestamp: string;
  rawResponse?: any;
}

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  appPassword: string;
}

class WordPressPublisherService {
  private config: WordPressConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    const siteUrl = process.env.WORDPRESS_SITE_URL;
    const username = process.env.WORDPRESS_USERNAME;
    const appPassword = process.env.WORDPRESS_APP_PASSWORD;

    if (siteUrl && username && appPassword) {
      this.config = {
        siteUrl: siteUrl.replace(/\/$/, ''),
        username,
        appPassword
      };
      console.log('✅ WordPress Publisher: Configuration loaded');
    } else {
      console.log('⚠️ WordPress Publisher: Missing configuration - publishing disabled');
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  getApiUrl(): string {
    if (!this.config) throw new Error('WordPress not configured');
    return `${this.config.siteUrl}/wp-json/wp/v2`;
  }

  private getAuthHeader(): string {
    if (!this.config) throw new Error('WordPress not configured');
    const credentials = Buffer.from(`${this.config.username}:${this.config.appPassword}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async publishPost(post: WordPressPost): Promise<WordPressPublishResult> {
    const timestamp = new Date().toISOString();

    if (!this.config) {
      return {
        success: false,
        error: 'WordPress not configured. Set WORDPRESS_SITE_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD',
        timestamp
      };
    }

    try {
      const response = await fetch(`${this.getApiUrl()}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(post)
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ WordPress: Published post "${post.title}" (ID: ${data.id})`);
        return {
          success: true,
          postId: data.id,
          postUrl: data.link,
          timestamp,
          rawResponse: data
        };
      } else {
        console.error(`❌ WordPress: Failed to publish - ${data.message || 'Unknown error'}`);
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          timestamp,
          rawResponse: data
        };
      }
    } catch (error: any) {
      console.error('❌ WordPress: Network error -', error.message);
      return {
        success: false,
        error: `Network error: ${error.message}`,
        timestamp
      };
    }
  }

  async updatePost(postId: number, updates: Partial<WordPressPost>): Promise<WordPressPublishResult> {
    const timestamp = new Date().toISOString();

    if (!this.config) {
      return {
        success: false,
        error: 'WordPress not configured',
        timestamp
      };
    }

    try {
      const response = await fetch(`${this.getApiUrl()}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          postId: data.id,
          postUrl: data.link,
          timestamp,
          rawResponse: data
        };
      } else {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
          timestamp,
          rawResponse: data
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Network error: ${error.message}`,
        timestamp
      };
    }
  }

  async getCategories(): Promise<{ id: number; name: string; slug: string }[]> {
    if (!this.config) return [];

    try {
      const response = await fetch(`${this.getApiUrl()}/categories`, {
        headers: { 'Authorization': this.getAuthHeader() }
      });
      return response.ok ? await response.json() : [];
    } catch {
      return [];
    }
  }

  async getTags(): Promise<{ id: number; name: string; slug: string }[]> {
    if (!this.config) return [];

    try {
      const response = await fetch(`${this.getApiUrl()}/tags`, {
        headers: { 'Authorization': this.getAuthHeader() }
      });
      return response.ok ? await response.json() : [];
    } catch {
      return [];
    }
  }

  async testConnection(): Promise<{ connected: boolean; site?: string; error?: string }> {
    if (!this.config) {
      return { connected: false, error: 'WordPress not configured' };
    }

    try {
      const response = await fetch(`${this.config.siteUrl}/wp-json/`, {
        headers: { 'Authorization': this.getAuthHeader() }
      });

      if (response.ok) {
        const data = await response.json();
        return { connected: true, site: data.name || this.config.siteUrl };
      } else {
        return { connected: false, error: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      return { connected: false, error: error.message };
    }
  }
}

export const wordpressPublisher = new WordPressPublisherService();
