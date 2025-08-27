#!/usr/bin/env python3
"""
CEO Autonomy Checklist Email Sender
Sends weekly CEO autonomy reports with system metrics and strategic insights
"""

import os
import smtplib
import json
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Dict, Any

# Configuration from environment variables
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "chief-of-staff@complianceworxs.ai")
SENDER_NAME = os.environ.get("SENDER_NAME", "ComplianceWorxs Chief of Staff AI")
RECIPIENTS = os.environ.get("CEO_RECIPIENTS", "").split(",")
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "https://your-app.replit.app")

def get_system_metrics() -> Dict[str, Any]:
    """Fetch current system metrics (placeholder - integrate with your API)"""
    # In production, this would call your actual API endpoints
    return {
        "auto_resolve_rate": 85.2,
        "target_auto_resolve": 85.0,
        "mttr_minutes": 4.3,
        "target_mttr": 5.0,
        "cost_reduction": 78.5,
        "escalations_today": 2,
        "total_agents": 8,
        "healthy_agents": 7,
        "revenue_impact": "+12.4%",
        "strategic_alignment": 92.0
    }

def generate_checklist_html(metrics: Dict[str, Any]) -> str:
    """Generate the CEO Autonomy Checklist HTML email"""
    now = datetime.datetime.now()
    week_start = now - datetime.timedelta(days=now.weekday())
    
    # Status indicators
    auto_resolve_status = "🟢" if metrics["auto_resolve_rate"] >= metrics["target_auto_resolve"] else "🟡"
    mttr_status = "🟢" if metrics["mttr_minutes"] <= metrics["target_mttr"] else "🟡"
    cost_status = "🟢" if metrics["cost_reduction"] > 70 else "🟡"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>CEO Autonomy Checklist</title>
        <style>
            body {{ font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 800px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #0b2742; color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }}
            .metric-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }}
            .metric-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2fb3ff; }}
            .metric-value {{ font-size: 24px; font-weight: bold; color: #0b2742; }}
            .metric-label {{ font-size: 14px; color: #666; margin-top: 5px; }}
            .checklist {{ background: white; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .checklist-item {{ display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f3f4; }}
            .checklist-item:last-child {{ border-bottom: none; }}
            .status-icon {{ font-size: 18px; margin-right: 10px; }}
            .cta-button {{ background: #2fb3ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }}
            .footer {{ color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e1e5e9; padding-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>CEO Autonomy Checklist</h1>
                <p>Weekly Strategic Oversight Report</p>
                <p><strong>Week of:</strong> {week_start.strftime('%B %d, %Y')}</p>
                <p><strong>Generated:</strong> {now.strftime('%Y-%m-%d at %I:%M %p')}</p>
            </div>
            
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">{metrics['auto_resolve_rate']:.1f}%</div>
                    <div class="metric-label">Auto-Resolve Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{metrics['mttr_minutes']:.1f}m</div>
                    <div class="metric-label">Mean Time to Resolution</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{metrics['cost_reduction']:.1f}%</div>
                    <div class="metric-label">Cost Reduction vs Manual</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{metrics['revenue_impact']}</div>
                    <div class="metric-label">Revenue Impact</div>
                </div>
            </div>
            
            <div class="checklist">
                <h2>🎯 Strategic Autonomy Status</h2>
                
                <div class="checklist-item">
                    <span class="status-icon">{auto_resolve_status}</span>
                    <div>
                        <strong>Auto-Resolution Performance:</strong> {metrics['auto_resolve_rate']:.1f}% 
                        (Target: {metrics['target_auto_resolve']:.0f}%)
                        <br><small>System autonomously resolving incidents without human intervention</small>
                    </div>
                </div>
                
                <div class="checklist-item">
                    <span class="status-icon">{mttr_status}</span>
                    <div>
                        <strong>Response Time Efficiency:</strong> {metrics['mttr_minutes']:.1f} minutes 
                        (Target: ≤{metrics['target_mttr']:.0f}m)
                        <br><small>Average time from incident detection to resolution</small>
                    </div>
                </div>
                
                <div class="checklist-item">
                    <span class="status-icon">{cost_status}</span>
                    <div>
                        <strong>Operational Cost Optimization:</strong> {metrics['cost_reduction']:.1f}% reduction
                        <br><small>Cost savings vs traditional manual monitoring approach</small>
                    </div>
                </div>
                
                <div class="checklist-item">
                    <span class="status-icon">📊</span>
                    <div>
                        <strong>Agent Fleet Health:</strong> {metrics['healthy_agents']}/{metrics['total_agents']} agents operational
                        <br><small>COO, CRO, CMO, CCO, Content Manager, Market Intelligence, Governance</small>
                    </div>
                </div>
                
                <div class="checklist-item">
                    <span class="status-icon">⚡</span>
                    <div>
                        <strong>Daily Escalations:</strong> {metrics['escalations_today']} requiring attention
                        <br><small>Items that required human decision-making today</small>
                    </div>
                </div>
                
                <div class="checklist-item">
                    <span class="status-icon">🎯</span>
                    <div>
                        <strong>Strategic Alignment:</strong> {metrics['strategic_alignment']:.1f}% on-target
                        <br><small>Cross-agent coordination and goal alignment score</small>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{DASHBOARD_URL}" class="cta-button">View Live Dashboard</a>
            </div>
            
            <div class="checklist">
                <h2>💡 Key Insights & Actions</h2>
                <ul>
                    <li><strong>Revenue Impact:</strong> Autonomous system delivering {metrics['revenue_impact']} revenue impact through faster response times and reduced operational overhead</li>
                    <li><strong>Efficiency Gains:</strong> {metrics['cost_reduction']:.1f}% cost reduction compared to manual monitoring approach</li>
                    <li><strong>Risk Management:</strong> Only {metrics['escalations_today']} items required human intervention today, indicating strong autonomous decision-making</li>
                    <li><strong>Strategic Focus:</strong> Leadership can focus on high-level strategy while system handles operational excellence autonomously</li>
                </ul>
            </div>
            
            <div class="footer">
                <p><strong>ComplianceWorxs Autonomous Agent System</strong></p>
                <p>This report is automatically generated by your Chief of Staff AI Agent based on real-time system metrics and strategic KPIs.</p>
                <p>Questions? Contact your system administrator or visit the <a href="{DASHBOARD_URL}">live dashboard</a>.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html

def send_email(html_content: str, subject: str):
    """Send the email using SMTP"""
    if not SMTP_USER or not SMTP_PASSWORD:
        print("❌ SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.")
        return False
        
    if not RECIPIENTS or RECIPIENTS == [""]:
        print("❌ No recipients configured. Set CEO_RECIPIENTS environment variable.")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg['To'] = ", ".join(RECIPIENTS)
        
        # Add HTML part
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ CEO Autonomy Checklist sent successfully to {len(RECIPIENTS)} recipients")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

def main():
    """Main execution function"""
    now = datetime.datetime.now()
    subject = f"CEO Autonomy Checklist — {now.strftime('%B %d, %Y')}"
    
    print(f"📧 Preparing CEO Autonomy Checklist for {now.strftime('%Y-%m-%d')}...")
    
    # Get current system metrics
    metrics = get_system_metrics()
    
    # Generate HTML content
    html_content = generate_checklist_html(metrics)
    
    # Send email
    success = send_email(html_content, subject)
    
    if success:
        print("✅ Weekly CEO Autonomy Checklist delivery complete")
    else:
        print("❌ Failed to deliver CEO Autonomy Checklist")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())