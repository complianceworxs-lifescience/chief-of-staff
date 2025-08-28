# gmail_pull.py
import os, json, base64, email
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import re, math

from googleapiclient.discovery import build
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

from bs4 import BeautifulSoup
import html2text

# --- Helper functions for robust email parsing ---
def _money(s: str) -> float:
    m = re.search(r"\$?\s*([0-9][0-9,]*(?:\.\d+)?)", s)
    return float(m.group(1).replace(",", "")) if m else 0.0

def _percent(s: str) -> float:
    m = re.search(r"([+-]?\d+(?:\.\d+)?)\s*%", s)
    return float(m.group(1)) if m else 0.0

def _int(s: str) -> int:
    m = re.search(r"([0-9][0-9,]*)", s)
    return int(m.group(1).replace(",", "")) if m else 0

def _find_line(text: str, *keywords) -> str:
    """Return the first line containing all keywords (case-insensitive)."""
    for line in text.splitlines():
        L = line.strip()
        if all(k.lower() in L.lower() for k in keywords):
            return L
    return ""

def _extract_after(text: str, label: str) -> str:
    """Return substring after first occurrence of label (case-insensitive)."""
    i = text.lower().find(label.lower())
    if i == -1: return ""
    return text[i+len(label):].strip()

def _quoted(text: str) -> str:
    m = re.search(r"[\"""''']([^\"""''']{2,})[\"""''']", text)
    return (m.group(1).strip() if m else "").strip()

def _deep_fill(dst, src):
    """Fill only missing/zero/empty fields in dst from src (recursively)."""
    if isinstance(dst, dict) and isinstance(src, dict):
        for k, v in src.items():
            if k not in dst:
                dst[k] = v
            else:
                dst[k] = _deep_fill(dst[k], v)
        return dst
    if isinstance(dst, list) or isinstance(src, list):
        return dst if dst else src
    # primitives
    if dst in (None, "", 0, 0.0) and src not in (None, "", 0, 0.0):
        return src
    return dst

DATA_DIR = os.getenv("DATA_DIR", "server/data")
LABEL = os.getenv("GMAIL_LABEL", "cw/daily-reports")  # set this label in Gmail
QUERY = os.getenv("GMAIL_QUERY", f'label:"{LABEL}" newer_than:2d')

def _ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(os.path.join(DATA_DIR, "inbox"), exist_ok=True)

def _save_json(name: str, obj: Any):
    _ensure_dirs()
    with open(os.path.join(DATA_DIR, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)

def _save_inbox(msg: Dict[str, Any], suffix="raw"):
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safe_subj = "".join(c for c in msg.get("subject","") if c.isalnum() or c in (" ","-","_"))[:80].strip().replace(" ","_")
    fname = f"inbox/{ts}_{safe_subj}_{suffix}.json"
    _save_json(fname, msg)

def _gmail_service():
    mode = os.getenv("GMAIL_AUTH_MODE", "service").lower()
    if mode == "service":
        gsa_json = os.getenv("GSA_JSON")
        if not gsa_json: 
            raise RuntimeError("Missing GSA_JSON secret")
        info = json.loads(gsa_json)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/gmail.readonly"]
        )
        user = os.getenv("GMAIL_IMPERSONATE")
        if not user: 
            raise RuntimeError("Missing GMAIL_IMPERSONATE")
        creds = creds.with_subject(user)
        return build("gmail", "v1", credentials=creds, cache_discovery=False)
    elif mode == "oauth":
        cid = os.getenv("OAUTH_CLIENT_ID")
        cs = os.getenv("OAUTH_CLIENT_SECRET")
        rt = os.getenv("OAUTH_REFRESH_TOKEN")
        if not all([cid, cs, rt]): 
            raise RuntimeError("Missing OAuth secrets")
        creds = Credentials(None, refresh_token=rt, token_uri="https://oauth2.googleapis.com/token",
                            client_id=cid, client_secret=cs, scopes=["https://www.googleapis.com/auth/gmail.readonly"])
        if not creds.valid:
            creds.refresh(Request())
        return build("gmail", "v1", credentials=creds, cache_discovery=False)
    else:
        raise RuntimeError("GMAIL_AUTH_MODE must be 'service' or 'oauth'")

def _list_messages(svc, q: str, max_results=25) -> List[Dict[str, Any]]:
    res = svc.users().messages().list(userId="me", q=q, maxResults=max_results).execute()
    msgs = res.get("messages", [])
    out = []
    for m in msgs:
        out.append(svc.users().messages().get(userId="me", id=m["id"], format="full").execute())
    return out

def _parse_body(payload: Dict[str, Any]) -> Dict[str, str]:
    def walk(p):
        if "parts" in p:
            for part in p["parts"]:
                r = walk(part)
                if r: return r
        mime = p.get("mimeType","")
        body = p.get("body",{}).get("data")
        if body:
            raw = base64.urlsafe_b64decode(body.encode("utf-8"))
            if "text/html" in mime:
                soup = BeautifulSoup(raw, "html.parser")
                html = str(soup)
                text = html2text.html2text(html)
                return {"html": html, "text": text}
            elif "text/plain" in mime:
                return {"html": "", "text": raw.decode("utf-8", "ignore")}
        return None
    return walk(payload) or {"html":"", "text":""}

def _headers(msg) -> Dict[str,str]:
    h = {x["name"].lower(): x["value"] for x in msg.get("payload",{}).get("headers", [])}
    return {
        "from": h.get("from",""),
        "to": h.get("to",""),
        "subject": h.get("subject",""),
        "date": h.get("date","")
    }

# ----- mappers: adapt these 2–3 functions to your email formats ----------------

def map_ceo_to_scoreboard(text: str) -> dict:
    """
    Parse your CEO Summary into the scoreboard shape.
    Expected hints in the email (examples; order/format flexible):
      - 'Net New MRR: $298 (target $1200)'
      - 'Autonomy: 92%'
      - 'Quiz→Paid: 7.8%'
      - 'LinkedIn ER: +19%'
      - 'Email CTR: +11%'
      - 'Top theme: "OpenAI critique"' or 'Narrative: OpenAI critique'
      - 'Conversions: 4 paid'
      - 'Risk: High 2 • Medium 1 • Next deadline 4h'
    Anything not present stays at 0 and can be filled by your dashboards later.
    """
    lines = text.replace("\u2192", "->")  # normalize arrow
    out = {
        "date": datetime.now().date().isoformat(),
        "revenue": {"realized_week": 0, "target_week": 0, "upsells": 0},
        "initiatives": {"on_time_pct": 0, "risk_inverted": 0, "resource_ok_pct": 0, "dependency_clear_pct": 0},
        "alignment": {"work_tied_to_objectives_pct": 0},
        "autonomy": {"auto_resolve_pct": 0, "mttr_min": 0},
        "risk": {"score": 0, "high": 0, "medium": 0, "next_deadline_hours": 0},
        "narrative": {"topic": "", "linkedin_er_delta_pct": 0, "email_ctr_delta_pct": 0, "quiz_to_paid_delta_pct": 0, "conversions": 0}
    }

    # Net New MRR + target (used to proxy weekly pace if present)
    m = re.search(r"Net\s*New\s*MRR[:\s]+\$?\s*([0-9,]+)(?:.*?target[^$]*\$?\s*([0-9,]+))?", lines, re.I|re.S)
    if m:
        realized = float(m.group(1).replace(",", ""))
        target = float(m.group(2).replace(",", "")) if m.group(2) else 0.0
        out["revenue"]["realized_week"] = realized if realized else 0
        out["revenue"]["target_week"] = target if target else 0

    # Upsells (if mentioned explicitly)
    L = _find_line(lines, "upsell")
    if L: out["revenue"]["upsells"] = _money(L)

    # Autonomy %
    L = _find_line(lines, "autonomy")
    if L: out["autonomy"]["auto_resolve_pct"] = _percent(L)

    # MTTR minutes (e.g., 'MTTR 4.3m' or 'MTTR: 5 min')
    m = re.search(r"mttr[:\s]+([0-9]+(?:\.[0-9]+)?)\s*m", lines, re.I)
    if m: out["autonomy"]["mttr_min"] = float(m.group(1))

    # Quiz->Paid %
    L = _find_line(lines, "quiz", "paid")
    if L: out["narrative"]["quiz_to_paid_delta_pct"] = _percent(L)

    # LinkedIn ER %
    L = _find_line(lines, "linkedin", "er")
    if L: out["narrative"]["linkedin_er_delta_pct"] = _percent(L)

    # Email CTR %
    L = _find_line(lines, "email", "ctr")
    if L: out["narrative"]["email_ctr_delta_pct"] = _percent(L)

    # Conversions: 'Conversions: 4 paid' or 'paid: 4'
    L = _find_line(lines, "conversion")
    if not L: L = _find_line(lines, "paid")
    if L:
        n = _int(L)
        if n: out["narrative"]["conversions"] = n

    # Narrative topic (quoted or plain)
    L = _find_line(lines, "top theme")
    topic = _quoted(L) or _extract_after(L or lines, "Top theme:").splitlines()[0].strip()
    if not topic:
        L = _find_line(lines, "narrative:")
        topic = _extract_after(L or "", "narrative:").splitlines()[0].strip()
    if topic:
        out["narrative"]["topic"] = topic.strip(" .")

    # Risk summary (e.g., 'High 2 • Medium 1 • Next deadline 4h' or 'Risk: score 78')
    L = _find_line(lines, "high")
    if L: out["risk"]["high"] = max(out["risk"]["high"], _int(L))
    L = _find_line(lines, "medium")
    if L: out["risk"]["medium"] = max(out["risk"]["medium"], _int(L))
    L = _find_line(lines, "deadline")
    if L:
        m = re.search(r"([0-9]+)\s*h", L, re.I); 
        if m: out["risk"]["next_deadline_hours"] = int(m.group(1))
    # Optional overall risk score
    L = _find_line(lines, "risk", "score")
    if L: out["risk"]["score"] = max(out["risk"]["score"], _int(L))

    return out

def map_content_to_actions(text: str) -> Dict[str, Any]:
    """
    Parse your Content Digest into actions + (optional) meeting summary.
    Expected hints:
      - 'Top Piece: "Title..."'
      - 'Conversions: 4 paid ($596 influenced)'
      - 'Persona: VS 3x > RL' or 'Persona winners: VS'
      - 'Action: ...' lines
      - Channel lifts: 'LinkedIn ER +19%', 'Email CTR +11%'
    Output merges into actions.json & meetings.json.
    """
    lines = text
    actions = []
    meeting_summary = []

    # Top Piece
    L = _find_line(lines, "top piece")
    if L:
        title = _quoted(L) or _extract_after(L, "Top Piece:").strip()
        if title:
            actions.append({
                "title": f"Amplify Top Piece: {title}",
                "owner": "CMO",
                "eta_days": 2,
                "reason": "Top-performing piece in Content Digest"
            })
            meeting_summary.append(f"Top piece: {title}")

    # Conversions from content
    L = _find_line(lines, "conversion")
    if not L: L = _find_line(lines, "paid")
    paid = _int(L) if L else 0
    if paid:
        meeting_summary.append(f"Paid from content: {paid}")

    # Influenced revenue
    rev_line = _find_line(lines, "influenced")
    influenced = _money(rev_line) if rev_line else 0.0
    if influenced:
        meeting_summary.append(f"Influenced revenue: ${int(influenced)}")

    # Persona winners (VS, RL, Architect)
    persona_line = _find_line(lines, "persona")
    if persona_line:
        # Prefer VS if mentioned with advantage
        if re.search(r"\bVS\b", persona_line, re.I):
            actions.append({
                "title": "Prioritize VS persona content for 72h",
                "owner": "Content",
                "eta_days": 3,
                "reason": "Persona signal favors VS in Content Digest"
            })
            meeting_summary.append("Persona winner: VS")
        if re.search(r"Architect", persona_line, re.I) and not re.search(r"paid\s*[:=]\s*[1-9]", lines, re.I):
            actions.append({
                "title": "Draft Architect brief (fast-track)",
                "owner": "Content",
                "eta_days": 3,
                "reason": "Architect lagging; fast-track brief to close gap"
            })
            meeting_summary.append("Architect gap detected")

    # Explicit "Action:" lines → convert to tasks
    for m in re.finditer(r"(?im)^\s*Action[:\-]\s*(.+)$", lines):
        txt = m.group(1).strip().rstrip(".")
        actions.append({
            "title": txt[:100],
            "owner": "CMO",
            "eta_days": 2,
            "reason": "Action captured from Content Digest"
        })

    # Channel lifts → quick directives
    L = _find_line(lines, "linkedin", "er")
    if L and _percent(L) >= 10:
        actions.append({
            "title": "Double LinkedIn cadence for 72h (winning theme)",
            "owner": "CMO",
            "eta_days": 3,
            "reason": f"LinkedIn ER lift {_percent(L)}% in digest"
        })
        meeting_summary.append(f"LinkedIn ER {int(_percent(L))}%")

    L = _find_line(lines, "email", "ctr")
    if L and _percent(L) >= 8:
        actions.append({
            "title": "Extend winning email subject to VS segment",
            "owner": "CMO",
            "eta_days": 2,
            "reason": f"Email CTR lift {_percent(L)}% in digest"
        })
        meeting_summary.append(f"Email CTR {int(_percent(L))}%")

    # Build a compact meeting snapshot (if we have at least one signal)
    meetings = []
    if meeting_summary:
        meetings.append({
            "title": "Content Digest",
            "date": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "summary": meeting_summary[:3],
            "actions": []  # we keep tactical items in actions.json; leave meeting actions empty
        })

    return {"actions": actions, "meetings": meetings}

def map_operational_to_insights(text: str) -> Dict[str, Any]:
    """Map operational emails to insights and decisions."""
    insights = []
    decisions = []
    
    import re
    
    # Extract operational bottlenecks
    bottleneck = re.search(r'Bottleneck[:\s](.+?)[\r\n]', text, re.I)
    if bottleneck:
        insights.append({
            "type": "operational_risk",
            "insight": f"Process bottleneck identified: {bottleneck.group(1).strip()}",
            "confidence": 0.8,
            "source": "operational_email",
            "timestamp": datetime.now().isoformat()
        })
        
        decisions.append({
            "decision": f"Resolve bottleneck: {bottleneck.group(1).strip()}",
            "impact": "high",
            "owner": "COO",
            "due": (datetime.now() + timedelta(days=3)).date().isoformat(),
            "rationale": "Critical operational efficiency issue"
        })
    
    return {"insights": insights, "decisions": decisions}

# ----- main entry --------------------------------------------------------------

def pull_and_write():
    """Main function to pull emails and update data files."""
    print("📧 Starting Gmail pull process...")
    
    try:
        svc = _gmail_service()
        print("✅ Gmail service authenticated successfully")
    except Exception as e:
        print(f"❌ Gmail authentication failed: {e}")
        return
    
    try:
        msgs = _list_messages(svc, QUERY, max_results=30)
        print(f"📥 Retrieved {len(msgs)} messages")
        
        if not msgs:
            print("ℹ️  No new messages found")
            return

        ceo_scoreboard = None
        collected_actions = []
        collected_meetings = []
        collected_insights = []
        collected_decisions = []

        for m in msgs:
            hdr = _headers(m)
            body = _parse_body(m.get("payload",{}))
            record = {
                "headers": hdr, 
                "snippet": m.get("snippet",""), 
                "body_text": body["text"][:5000]
            }
            _save_inbox({**record, "id": m.get("id")}, suffix="msg")

            subj = hdr["subject"].lower()
            from_addr = hdr["from"].lower()
            
            # CEO Summary emails
            if any(term in subj for term in ["ceo oversight", "ceo summary", "executive summary"]):
                print(f"🎯 Processing CEO summary: {hdr['subject']}")
                ceo_scoreboard = map_ceo_to_scoreboard(body["text"])
            
            # Content Digest emails
            if any(term in subj for term in ["content digest", "content report", "marketing summary"]):
                print(f"📝 Processing content digest: {hdr['subject']}")
                mapped = map_content_to_actions(body["text"])
                collected_actions += mapped.get("actions", [])
                collected_meetings += mapped.get("meetings", [])
            
            # Operational emails
            if any(term in subj for term in ["operations", "workflow", "process", "bottleneck"]):
                print(f"⚙️  Processing operational email: {hdr['subject']}")
                mapped = map_operational_to_insights(body["text"])
                collected_insights += mapped.get("insights", [])
                collected_decisions += mapped.get("decisions", [])

        # Write aggregated data files with smart merging
        if ceo_scoreboard:
            # Merge with existing scoreboard using _deep_fill (non-destructive)
            path = os.path.join(DATA_DIR, "scoreboard.json")
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        existing = json.load(f)
                except:
                    existing = {}
            else:
                existing = {}
            merged = _deep_fill(existing, ceo_scoreboard)
            _save_json("scoreboard.json", merged)
            print("💾 Updated scoreboard.json from CEO summary (non-destructive merge)")
        
        if collected_actions:
            # Merge with deduplication by title
            path = os.path.join(DATA_DIR, "actions.json")
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f: 
                        existing = json.load(f)
                except:
                    existing = []
            else:
                existing = []
            
            # Dedupe by title
            titles = {a.get("title","") for a in existing}
            new_count = 0
            for a in collected_actions:
                if a.get("title") not in titles:
                    existing.append(a)
                    titles.add(a.get("title"))
                    new_count += 1
            
            _save_json("actions.json", existing)
            print(f"💾 Added {new_count} new actions to actions.json (deduped)")
        
        if collected_meetings:
            path = os.path.join(DATA_DIR, "meetings.json")
            existing_meetings = []
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f: 
                        existing_meetings = json.load(f)
                except:
                    existing_meetings = []
            
            _save_json("meetings.json", existing_meetings + collected_meetings)
            print(f"💾 Added {len(collected_meetings)} meetings to meetings.json")
        
        if collected_insights:
            path = os.path.join(DATA_DIR, "insights.json")
            existing_insights = []
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f: 
                        existing_insights = json.load(f)
                except:
                    existing_insights = []
            
            _save_json("insights.json", existing_insights + collected_insights)
            print(f"💾 Added {len(collected_insights)} insights to insights.json")
        
        if collected_decisions:
            path = os.path.join(DATA_DIR, "decisions.json")
            existing_decisions = []
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f: 
                        existing_decisions = json.load(f)
                except:
                    existing_decisions = []
            
            _save_json("decisions.json", existing_decisions + collected_decisions)
            print(f"💾 Added {len(collected_decisions)} decisions to decisions.json")
        
        print("✅ Gmail pull process completed successfully")
        
    except Exception as e:
        print(f"❌ Gmail pull failed: {e}")
        raise

if __name__ == "__main__":
    pull_and_write()