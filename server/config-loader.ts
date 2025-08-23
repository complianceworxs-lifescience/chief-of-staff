import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppConfig {
  version: string;
  app: {
    name: string;
    mode: string;
  };
  security: {
    webhook_token: string;
    admin_token: string;
    allowed_origins: string[];
  };
  endpoints: {
    events: { path: string; method: string };
    health: { path: string; method: string };
  };
  reconciliation: {
    agent_truth_wins: boolean;
    max_switches_per_7d: number;
    hard_override_kinds: string[];
    cold_start_intent: string;
    dropoff_tag_after_days: number;
  };
  scheduler: {
    daily_scoring_sweep_utc: string;
    dashboard_review_utc: string;
  };
  dashboards: {
    clarity_rubric: {
      rubric_version: string;
      owner_agent: string;
      review_cadence: { frequency: string; time_utc: string };
      thresholds: {
        min_overall_score: number;
        min_category_score: number;
        deprecation_days_no_click: number;
        auto_fix_max_diff_lines: number;
        require_HITL_if_over: number;
      };
      actions: {
        auto_hide_rules: Array<{ if: string; then: string }>;
        auto_merge_rules: Array<{ if: string; then: string }>;
        auto_promote_rules: Array<{ if: string; then: string }>;
        fix_order: string[];
      };
    };
  };
  intent_model: {
    intents: string[];
    stages: string[];
  };
}

let config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (config) return config;
  
  const configPath = path.join(__dirname, '../config/app.config.json');
  
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData) as AppConfig;
    console.log(`✅ Config loaded: ${config.app.name} v${config.version} (${config.app.mode})`);
    return config;
  } catch (error) {
    console.error('❌ Failed to load config:', error);
    throw new Error(`Config file not found at ${configPath}`);
  }
}

export function getConfig(): AppConfig {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return config;
}