# gmail_pull.py
import os, json, base64, email
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

from googleapiclient.discovery import build
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

from bs4 import BeautifulSoup
import html2text

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

def map_ceo_to_scoreboard(text: str) -> Optional[Dict[str, Any]]:
    """Heuristic mapper for CEO summary → scoreboard.json. Customize as needed."""
    # Defaults - Life Sciences focused metrics
    out = {
        "date": datetime.now().date().isoformat(),
        "revenue": {"realized_week": 0, "target_week": 0, "upsells": 0},
        "initiatives": {"on_time_pct": 0, "risk_inverted": 0, "resource_ok_pct": 0, "dependency_clear_pct": 0},
        "alignment": {"work_tied_to_objectives_pct": 0},
        "autonomy": {"auto_resolve_pct": 0, "mttr_min": 0},
        "risk": {"score": 0, "high": 0, "medium": 0, "next_deadline_hours": 0},
        "narrative": {
            "topic": "Life Sciences Operations Update", 
            "linkedin_er_delta_pct": 0, 
            "email_ctr_delta_pct": 0, 
            "quiz_to_paid_delta_pct": 0, 
            "conversions": 0
        }
    }
    
    import re
    
    # Revenue patterns
    m = re.search(r"Net New MRR[:\s]\$?([\d,]+)", text, re.I)
    if m:
        out["revenue"]["upsells"] = float(m.group(1).replace(",",""))
    
    m = re.search(r"Weekly Revenue[:\s]\$?([\d,]+)", text, re.I)
    if m:
        out["revenue"]["realized_week"] = float(m.group(1).replace(",",""))
        
    # Autonomy patterns
    m = re.search(r"Autonomy[:\s]([\d\.]+)%", text, re.I)
    if m: 
        out["autonomy"]["auto_resolve_pct"] = float(m.group(1))
    
    m = re.search(r"MTTR[:\s]([\d\.]+)", text, re.I)
    if m: 
        out["autonomy"]["mttr_min"] = float(m.group(1))
        
    # Life Sciences specific patterns
    m = re.search(r"Regulatory[:\s]([\d\.]+)", text, re.I)
    if m: 
        out["risk"]["high"] = int(float(m.group(1)))
        
    m = re.search(r"Client Conversion[:\s]([\d\.]+)%", text, re.I)
    if m: 
        out["narrative"]["quiz_to_paid_delta_pct"] = float(m.group(1))
        
    return out

def map_content_to_actions(text: str) -> Dict[str, Any]:
    """Heuristic mapper for Content Digest → actions/meetings."""
    actions = []
    meetings = []
    
    import re
    
    # Extract top performing content
    top = re.search(r'Top Piece[:\s]"?\"?(.+?)\"?[\r\n]', text)
    if top:
        actions.append({
            "title": f"Amplify: {top.group(1).strip()}",
            "owner": "CMO",
            "eta_days": 2,
            "reason": "Top-performing piece in Content Digest"
        })
    
    # Extract content gaps
    gap = re.search(r'Content Gap[:\s](.+?)[\r\n]', text, re.I)
    if gap:
        actions.append({
            "title": f"Create content: {gap.group(1).strip()}",
            "owner": "Content Manager",
            "eta_days": 5,
            "reason": "Identified content gap from digest"
        })
    
    # Extract regulatory updates
    reg = re.search(r'Regulatory Update[:\s](.+?)[\r\n]', text, re.I)
    if reg:
        actions.append({
            "title": f"Review regulatory change: {reg.group(1).strip()}",
            "owner": "CCO",
            "eta_days": 3,
            "reason": "Regulatory update requiring review"
        })
        
        meetings.append({
            "title": "Regulatory Impact Review",
            "date": (datetime.now() + timedelta(days=1)).date().isoformat(),
            "attendees": ["CCO", "CoS"],
            "agenda": f"Assess impact of: {reg.group(1).strip()}"
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

        # Write aggregated data files
        if ceo_scoreboard:
            _save_json("scoreboard.json", ceo_scoreboard)
            print("💾 Updated scoreboard.json from CEO summary")
        
        if collected_actions:
            # Merge with existing actions
            path = os.path.join(DATA_DIR, "actions.json")
            existing_actions = []
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f: 
                        existing_actions = json.load(f)
                except:
                    existing_actions = []
            
            _save_json("actions.json", existing_actions + collected_actions)
            print(f"💾 Added {len(collected_actions)} actions to actions.json")
        
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