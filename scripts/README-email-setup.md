# CEO Autonomy Checklist Email Setup

## Quick Setup Instructions

### 1. Install Python Dependencies
```bash
# No additional dependencies needed - uses built-in Python libraries
python3 scripts/send_ceo_autonomy_checklist.py
```

### 2. Configure Environment Variables
Add these to your Replit Secrets or `.env` file:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com              # Or your email provider's SMTP server
SMTP_PORT=587                         # Standard port for STARTTLS
SMTP_USER=your-email@complianceworxs.ai
SMTP_PASSWORD=your-app-password       # Use app-specific password for Gmail

# Sender Details  
SENDER_EMAIL=chief-of-staff@complianceworxs.ai
SENDER_NAME=ComplianceWorxs Chief of Staff AI

# Recipients (comma-separated)
CEO_RECIPIENTS=ceo@complianceworxs.ai,leadership@complianceworxs.ai

# Dashboard URL
DASHBOARD_URL=https://your-app.replit.app
```

### 3. Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: Google Account → Security → 2-Step Verification → App Passwords
3. Use the app password as `SMTP_PASSWORD`

### 4. Test the Script
```bash
python3 scripts/send_ceo_autonomy_checklist.py
```

### 5. Schedule Weekly Delivery
Add to your cron jobs or task scheduler:
```bash
# Send every Monday at 9 AM
0 9 * * 1 /usr/bin/python3 /path/to/scripts/send_ceo_autonomy_checklist.py
```

## Email Content
The script generates a professional HTML email containing:
- ✅ Auto-resolve rate and targets
- ✅ Mean time to resolution metrics  
- ✅ Cost reduction percentages
- ✅ Agent fleet health status
- ✅ Strategic alignment scores
- ✅ Revenue impact data
- ✅ Direct link to live dashboard

## Integration Notes
- **Safe**: Uses standard SMTP, no conflicts with existing webhook system
- **Metrics**: Placeholder data included - integrate with your API endpoints
- **Customizable**: Easily modify template and metrics as needed
- **Production-Ready**: Error handling and logging included