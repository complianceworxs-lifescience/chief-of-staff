// Type declarations for Market Intelligence modules

export interface MiConfig {
  empty?: boolean;
  keywords?: string[];
  feeds?: { url: string; name?: string }[];
}

export interface RawSignal {
  title: string;
  link: string;
  source: string;
  pubDate?: string;
  description?: string;
}

export interface ScoredSignal extends RawSignal {
  score: number;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  owner?: string;
}

export interface MiStats {
  total: number;
  high_priority: number;
  by_category?: Record<string, number>;
}

export function loadConfig(): Promise<MiConfig | null>;
export function saveConfig(config: MiConfig): Promise<MiConfig>;
export function collectFromFeeds(feeds: { url: string; name?: string }[]): Promise<RawSignal[]>;

export class MiScorer {
  static score(raw: RawSignal[], cfg: MiConfig): ScoredSignal[];
}

export class MiStore {
  static upsert(signals: ScoredSignal[]): Promise<void>;
  static stats(): Promise<MiStats>;
  static listActive(): Promise<ScoredSignal[]>;
}

export function ensureStores(): Promise<void>;
