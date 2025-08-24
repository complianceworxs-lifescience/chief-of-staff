import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

// ----- Data store (flat files) -----
const DATA = path.join(process.cwd(), "data");
const F = (n: string) => path.join(DATA, n);
if (!fs.existsSync(DATA)) fs.mkdirSync(DATA);

const FILES = {
  exps: F("experiments.json"),
  ledger: F("attribution_ledger.json"),
  playbook: F("playbook.md"),
  alerts: F("alerts.json")
};

for (const [k, v] of Object.entries(FILES)) {
  if (!fs.existsSync(v)) {
    fs.writeFileSync(v, k === "playbook" ? "# ComplianceWorxs Growth Playbook\n\n" : "[]");
  }
}

// ----- Utils -----
const readJSON = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJSON = (f: string, x: any) => fs.writeFileSync(f, JSON.stringify(x, null, 2));
const nowISO = () => new Date().toISOString();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "cw-chief-of-staff-2025";

function requireAdmin(req: any, res: any, next: any) {
  if (!ADMIN_TOKEN) return res.status(500).json({ error: "ADMIN_TOKEN not set" });
  if ((req.headers.authorization || "") !== `Bearer ${ADMIN_TOKEN}`) return res.status(403).json({ error: "Forbidden" });
  next();
}

// Thompson-sampling helpers
function ensurePosteriors(exp: any) {
  exp.post = exp.post || {};
  for (const key of Object.keys(exp.variants)) {
    if (!exp.post[key]) exp.post[key] = { alpha: 1, beta: 1, revenue: 0, purchases: 0, clicks: 0, sessions: 0 };
  }
  return exp;
}

function sampleVariant(exp: any) {
  ensurePosteriors(exp);
  let best = null, bestScore = -1;
  for (const [k, p] of Object.entries(exp.post) as [string, any][]) {
    // simple beta mean + tiny revenue tie-breaker
    const score = p.alpha / (p.alpha + p.beta) + (p.revenue || 0) * 1e-9;
    if (score > bestScore) { best = k; bestScore = score; }
  }
  return best || Object.keys(exp.variants)[0];
}

// Simple drift detection (3h vs 24h baseline over ledger)
function computeDrift() {
  const ledger = readJSON(FILES.ledger);
  const now = Date.now();
  const h3 = now - 3 * 3600 * 1000;
  const h24 = now - 24 * 3600 * 1000;

  const byExpVar: any = {};
  for (const row of ledger) {
    const t = Date.parse(row.ts);
    const key = `${row.exp}::${row.variant}`;
    byExpVar[key] ||= { recent: { sessions:0,purchases:0 }, base: { sessions:0,purchases:0 } };
    // sessions are counted via /assign; infer from clicks/purchases as activity
    if (t >= h24) byExpVar[key].base[row.event==="purchase"?"purchases":"sessions"] += 1;
    if (t >= h3)  byExpVar[key].recent[row.event==="purchase"?"purchases":"sessions"] += 1;
  }

  const alerts = [];
  for (const [key, v] of Object.entries(byExpVar) as [string, any][]) {
    const rRate = v.recent.sessions ? v.recent.purchases / v.recent.sessions : 0;
    const bRate = v.base.sessions ? v.base.purchases / v.base.sessions : 0;
    if (bRate > 0 && rRate < bRate * 0.8) { // >20% down vs baseline
      const [exp, variant] = key.split("::");
      alerts.push({ ts: nowISO(), exp, variant, msg: "Purchase rate drift >20% below 24h baseline" });
    }
  }
  writeJSON(FILES.alerts, alerts);
}

// Run drift detection every 10 minutes
setInterval(computeDrift, 10 * 60 * 1000);

// ----- Routes -----

// Define or update an experiment
router.post("/define", requireAdmin, (req, res) => {
  const exps = readJSON(FILES.exps);
  const incoming = req.body || {};
  if (!incoming.id || !incoming.variants || Object.keys(incoming.variants).length < 2)
    return res.status(400).json({ error: "id and >=2 variants required" });

  incoming.created_at ||= nowISO();
  const i = exps.findIndex((e: any) => e.id === incoming.id);
  if (i >= 0) exps[i] = { ...exps[i], ...incoming };
  else exps.push(incoming);
  writeJSON(FILES.exps, exps);
  res.json({ ok: true, experiment: incoming });
});

// Assign a variant (called from page snippet)
router.get("/assign", (req, res) => {
  const { exp: id, sid } = req.query;
  const exps = readJSON(FILES.exps);
  const exp = exps.find((e: any) => e.id === id);
  if (!exp) return res.status(404).json({ error: "experiment not found" });

  ensurePosteriors(exp);
  const variant = sampleVariant(exp);
  exp.post[variant].sessions += 1;

  // persist session increment
  writeJSON(FILES.exps, exps.map((e: any) => e.id === id ? exp : e));

  res.json({ variant, payload: exp.variants[variant] });
});

// Log events (view, click, checkout_start, purchase)
router.post("/event", (req, res) => {
  const { exp: id, var: variant, event, value = 0, currency = "USD", session_id, path: pagePath } = req.body || {};
  const exps = readJSON(FILES.exps);
  const exp = exps.find((e: any) => e.id === id);
  if (!exp) return res.status(404).json({ error: "experiment not found" });
  ensurePosteriors(exp);

  const p = exp.post[variant];
  if (!p) return res.status(400).json({ error: "invalid variant" });

  if (event === "click") p.clicks += 1;
  if (event === "purchase") { p.purchases += 1; p.revenue += Number(value || 0); p.alpha += 1; }
  if (event === "checkout_start") { p.beta += 0.2; } // gentle pressure

  // ledger append
  const ledger = readJSON(FILES.ledger);
  ledger.push({ ts: nowISO(), exp: id, variant, event, value, currency, session_id, path: pagePath || "" });
  writeJSON(FILES.ledger, ledger);

  // persist posteriors
  writeJSON(FILES.exps, exps.map((e: any) => e.id === id ? exp : e));

  res.json({ ok: true, post: p });
});

// Report per experiment (summary for CoS)
router.get("/report", requireAdmin, (req, res) => {
  const { exp: id } = req.query;
  const exps = readJSON(FILES.exps);
  const exp = exps.find((e: any) => e.id === id);
  if (!exp) return res.status(404).json({ error: "experiment not found" });

  const post = exp.post || {};
  const summary = Object.fromEntries(Object.entries(post).map(([k, v]: [string, any]) => [
    k,
    {
      sessions: v.sessions,
      clicks: v.clicks,
      purchases: v.purchases,
      revenue: v.revenue,
      purchase_rate: v.sessions ? (v.purchases / v.sessions) : 0,
      ctr: v.sessions ? (v.clicks / v.sessions) : 0
    }
  ]));

  res.json({ id: exp.id, page: exp.page_slug, hypothesis: exp.hypothesis, summary });
});

// List experiments
router.get("/overview", requireAdmin, (_req, res) => {
  const exps = readJSON(FILES.exps);
  res.json(exps.map((e: any) => ({ id: e.id, page: e.page_slug, created_at: e.created_at, variants: Object.keys(e.variants) })));
});

// Promote winner -> playbook append
router.post("/promote", requireAdmin, (req, res) => {
  const { exp: id, winner } = req.body || {};
  const exps = readJSON(FILES.exps);
  const exp = exps.find((e: any) => e.id === id);
  if (!exp) return res.status(404).json({ error: "experiment not found" });
  if (!exp.post || !exp.post[winner]) return res.status(400).json({ error: "invalid winner" });

  const w = exp.post[winner];
  const line =
`## ${id}
- Page: /${exp.page_slug}
- Winner: **${winner} – ${exp.variants[winner]?.label || ""}**
- Revenue: $${(w.revenue||0).toFixed(2)} | Purchases: ${w.purchases} | CTR: ${(w.clicks/(w.sessions||1)*100).toFixed(1)}%
- Hypothesis: ${exp.hypothesis || ""}
- Next: iterate on message/placement that drove uplift.
\n`;
  fs.appendFileSync(FILES.playbook, line);
  res.json({ ok: true, appended_to_playbook: true });
});

// Alerts view
router.get("/alerts", requireAdmin, (_req, res) => {
  res.json(readJSON(FILES.alerts));
});

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "experiment-os", timestamp: nowISO() });
});

// Minimal UI for CoS
router.get("/", (_req, res) => {
  res.type("html").send(`
<!doctype html><meta charset="utf-8"><title>CW Experiment OS</title>
<style>
  body{font-family:system-ui,Inter,Arial;margin:24px;max-width:900px}
  input,button,textarea{font:inherit}
  .row{border:1px solid #ddd;padding:12px;border-radius:10px;margin:10px 0}
</style>
<h1>ComplianceWorxs Experiment OS</h1>
<p>Paste <b>ADMIN_TOKEN</b>, then use the buttons. (CoS runs this.)</p>
<input id="tok" placeholder="ADMIN_TOKEN" style="width:320px"> <button onclick="load()">Load</button>
<div class="row">
  <h3>Define Experiment</h3>
  <textarea id="exjson" rows="10" style="width:100%" placeholder='{"id":"exp_2025_08_pricing_cta","page_slug":"membership-pricing","hypothesis":"Benefit-led CTA increases revenue","variants":{"A":{"label":"Original","cta_text":"View Memberships","href":"/membership-pricing"},"B":{"label":"Benefit","cta_text":"Get AI Compliance Clarity","href":"https://buy.stripe.com/9B69ATekF8gv9mJ1QJd3i00"}},"run_until":{"min_sessions":300,"min_days":5}}'></textarea>
  <button onclick="defineExp()">Create/Update</button> <span id="msg1"></span>
</div>
<div class="row">
  <h3>Overview</h3>
  <button onclick="overview()">Refresh</button>
  <pre id="ov"></pre>
</div>
<div class="row">
  <h3>Report & Promote</h3>
  <input id="expid" placeholder="exp id">
  <button onclick="report()">Report</button>
  <input id="winner" placeholder="winner key (A/B)">
  <button onclick="promote()">Promote → Playbook</button>
  <pre id="rep"></pre>
</div>
<div class="row">
  <h3>Alerts (drift)</h3>
  <button onclick="alerts()">Refresh</button>
  <pre id="al"></pre>
</div>
<script>
let T="";
function load(){T=document.getElementById('tok').value;}
async function defineExp(){
  const r = await fetch('/experiments/define',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+T},body:document.getElementById('exjson').value});
  document.getElementById('msg1').textContent = (await r.json()).ok?'Saved':'Error';
}
async function overview(){
  const r = await fetch('/experiments/overview',{headers:{'Authorization':'Bearer '+T}}); document.getElementById('ov').textContent = JSON.stringify(await r.json(),null,2);
}
async function report(){
  const id=document.getElementById('expid').value; const r=await fetch('/experiments/report?exp='+encodeURIComponent(id),{headers:{'Authorization':'Bearer '+T}}); document.getElementById('rep').textContent=JSON.stringify(await r.json(),null,2);
}
async function promote(){
  const id=document.getElementById('expid').value, w=document.getElementById('winner').value;
  const r=await fetch('/experiments/promote',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+T},body:JSON.stringify({exp:id,winner:w})});
  alert(JSON.stringify(await r.json(),null,2));
}
async function alerts(){
  const r=await fetch('/experiments/alerts',{headers:{'Authorization':'Bearer '+T}}); document.getElementById('al').textContent = JSON.stringify(await r.json(),null,2);
}
</script>
  `);
});

export default router;