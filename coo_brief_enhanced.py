from brief_utils import run_brief, now_est_str

FALLBACK = f"""
## COO Operational Intelligence — {now_est_str()}

### Ops Health (KPIs)
System Uptime: 99.8% (target: 99.5%+)
MTTR: 4.3min (target: <5min)
Auto-resolve Rate: 87% (target: 85%+)
Agent Autonomy Rate: 92% (HITL escalations: 3/day)

### Efficiency & Costs
API Token Usage: $47/day (budget: $75/day)
Cost per Brief: $2.30 (target: <$3.00)
Automation Jobs: 247 completed, 3 failed (98.8% success)
Revenue per $ Ops Spend: $12.40 (target: >$10.00)

### Risks & Escalations
Queue Backlog: 2 items (normal: <5)
Rate Limit Exposure: Low (67% of daily quota used)
HITL Queue: 1 pending (CRO approval needed)
Critical Dependencies: All operational

### Backlog / Queue Status
Morning Briefs: ✅ All delivered on-time
Agent Communications: 12 pending, 3 high-priority
Strategic Actions: 4 active, 2 due within 24h
Content Pipeline: 3 pieces in review queue

### Revenue Impact Tracking
Brief Delivery Impact: 0 missed → $0 revenue loss
System Downtime Cost: 12min total → Est. $240 impact
Automation Savings: $1,840/week vs manual process
Agent Efficiency Gain: +34% throughput vs baseline
""".strip()

SYSTEM_MSG = (
    "You are the ComplianceWorxs COO analyst focused on operational excellence that drives revenue growth. "
    "Apply ODAR methodology. Always connect operational metrics to revenue impact - explain how ops issues affect "
    "deal flow, conversion rates, and customer retention. Track automation efficiency, cost control, and agent autonomy. "
    "Use escalation thresholds: Auto-resolve <85% = CTO escalation, MTTR >5min = immediate attention, "
    ">5 HITL escalations/day = CoS review. Focus on revenue-generating operations and cost optimization. "
    "Assign clear owners (COO/CTO/CMO/CRO/CoS) with specific ETAs. Use action-oriented bullets only."
)

USER_PREFIX = (
    "Analyze this COO Operations Intelligence and produce 'ChatGPT Operational Commentary & Revenue Recommendations' to PREPEND. Structure:\n"
    "• Operational Observations (2-4 bullets, revenue impact focus)\n"
    "• Cost & Efficiency Alignment (2-3 bullets, ROI on ops spend)\n"
    "• Risk Assessment & Escalations (2-3 bullets, escalation thresholds)\n"
    "• Revenue-Critical Actions (4-6 bullets, Owner + ETA + revenue impact)\n"
    "• ODAR Execution Plan (3 lines max, ops→revenue connection)\n\n"
    "Connect every operational metric to business impact. Example: 'MTTR increase of 2min = potential $120/day revenue loss from delayed briefs'"
)

if __name__ == "__main__":
    run_brief(
        url_env="AGENT_COO_URL",
        file_fallback="coo_brief_enhanced.txt",
        fallback_skeleton=FALLBACK,
        openai_api_key_env="OPENAI_API_KEY",
        model="gpt-4o-mini",
        system_msg=SYSTEM_MSG,
        user_prefix=USER_PREFIX,
        subject_prefix="COO Ops Intelligence",
        to_env="TO_EMAILS_COO",
    )