import fs from "fs/promises";
import path from "path";

const DATA_DIR = "./data";
const STORE_FILE = path.join(DATA_DIR, "mi.store.json");

export async function ensureStores() {
  try { 
    await fs.mkdir(DATA_DIR, { recursive: true }); 
  } catch (e) {
    // Directory already exists
  }
  
  try { 
    await fs.access(STORE_FILE); 
  } catch { 
    await fs.writeFile(STORE_FILE, JSON.stringify({ items: [], last_run_at: null }, null, 2)); 
  }
}

async function readJson(file) {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt || "{}");
  } catch (e) {
    return { items: [], last_run_at: null };
  }
}

async function writeJson(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2));
}

export const MiStore = {
  async listActive() {
    await ensureStores();
    const db = await readJson(STORE_FILE);
    return db.items || [];
  },

  async upsert(items) {
    await ensureStores();
    const db = await readJson(STORE_FILE);
    const byKey = new Map((db.items || []).map(i => [i.url || i.id, i]));
    
    // Upsert new items
    for (const it of items) {
      byKey.set(it.url || it.id, it);
    }
    
    const merged = Array.from(byKey.values());
    console.log(`Stored ${merged.length} total signals (${items.length} new)`);
    
    await writeJson(STORE_FILE, { 
      items: merged, 
      last_run_at: new Date().toISOString() 
    });
  },

  async stats() {
    await ensureStores();
    const db = await readJson(STORE_FILE);
    const items = db.items || [];
    
    // Load config to get priority threshold
    let priorityThreshold = 0.6;
    try {
      const configPath = path.join(DATA_DIR, "mi.config.json");
      const configText = await fs.readFile(configPath, "utf8");
      const config = JSON.parse(configText);
      priorityThreshold = config.priority_threshold || 0.6;
    } catch (e) {
      // Use default
    }
    
    const high = items.filter(i => (i.priority ?? 0) >= priorityThreshold).length;
    const owners = new Set(items.map(i => i.assigned_to).filter(Boolean)).size;
    const processedToday = items.filter(i => {
      if (!i.published_at) return false;
      const publishedDate = new Date(i.published_at);
      const today = new Date();
      return publishedDate.toDateString() === today.toDateString();
    }).length;

    return {
      total: items.length,
      high_priority: high,
      processed_today: processedToday,
      assignments: owners,
      last_run_at: db.last_run_at
    };
  }
};