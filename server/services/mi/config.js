import fs from "fs/promises";
import path from "path";

const DATA_DIR = "./data";
const CONFIG_FILE = path.join(DATA_DIR, "mi.config.json");

async function ensureDataDir() {
  try { 
    await fs.mkdir(DATA_DIR, { recursive: true }); 
  } catch (e) {
    // Directory already exists
  }
}

async function readJson(file) {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt || "{}");
  } catch (e) {
    return null;
  }
}

async function writeJson(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2));
}

export async function loadConfig() {
  await ensureDataDir();
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    // Create default config if none exists
    await fs.writeFile(CONFIG_FILE, JSON.stringify({ empty: true }, null, 2));
  }
  
  const cfg = await readJson(CONFIG_FILE);
  if (!cfg || !cfg.feeds || cfg.feeds.length === 0) return { empty: true };
  return cfg;
}

export async function saveConfig(cfg) {
  await ensureDataDir();
  
  // normalize minimal shape
  const normalized = {
    version: cfg.version || "1.0",
    priority_threshold: cfg.priority_threshold ?? 0.6,
    keywords: cfg.keywords || [],
    auto_assign: cfg.auto_assign || { regulatory: "CCO", competitive: "CRO", market: "CEO", technology: "COO" },
    feeds: cfg.feeds || []
  };
  
  await writeJson(CONFIG_FILE, normalized);
  return normalized;
}