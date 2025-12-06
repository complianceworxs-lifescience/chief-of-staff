import { Router, Request, Response } from "express";
import { abandonedCheckoutRecovery } from "../services/abandoned-checkout-recovery";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const router = Router();

router.get("/abandoned-checkout/stats", async (req: Request, res: Response) => {
  try {
    const stats = abandonedCheckoutRecovery.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error getting abandoned checkout stats:", error);
    res.status(500).json({ success: false, error: "Failed to get stats" });
  }
});

router.get("/abandoned-checkout/recent", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const abandoned = await abandonedCheckoutRecovery.getRecentAbandoned(limit);
    res.json({
      success: true,
      data: abandoned
    });
  } catch (error) {
    console.error("Error getting recent abandoned checkouts:", error);
    res.status(500).json({ success: false, error: "Failed to get abandoned checkouts" });
  }
});

const PERSONA_THRESHOLDS = {
  rising_leader: { min: 0, max: 29999 },
  validation_strategist: { min: 30000, max: 99999 },
  compliance_architect: { min: 100000, max: Infinity }
};

function determinePersona(roiValue: number): string {
  if (roiValue >= PERSONA_THRESHOLDS.compliance_architect.min) {
    return 'compliance_architect';
  } else if (roiValue >= PERSONA_THRESHOLDS.validation_strategist.min) {
    return 'validation_strategist';
  }
  return 'rising_leader';
}

const BLENDED_HOURLY_COST = 185;

function calculateComplianceROI(inputs: {
  teamSize: number;
  hoursOnCompliance: number;
  hourlyRate: number;
  auditFrequency: number;
  auditPrepHours: number;
  deviationsPerYear: number;
  deviationCost: number;
  avgValidationHoursPerWeek: number;
  avgReleaseCyclesPerYear: number;
}): {
  currentCost: number;
  potentialSavings: number;
  roiValue: number;
  timeReclaimed: number;
  annualWasteCost: number;
  breakdown: {
    laborSavings: number;
    auditEfficiency: number;
    deviationReduction: number;
  };
} {
  const annualComplianceHours = inputs.teamSize * inputs.hoursOnCompliance * 52;
  const currentLaborCost = annualComplianceHours * inputs.hourlyRate;
  
  const auditPrepCost = inputs.auditFrequency * inputs.auditPrepHours * inputs.hourlyRate * inputs.teamSize;
  
  const deviationCost = inputs.deviationsPerYear * inputs.deviationCost;
  
  const laborSavings = currentLaborCost * 0.25;
  const auditEfficiency = auditPrepCost * 0.40;
  const deviationReduction = deviationCost * 0.35;
  
  const potentialSavings = laborSavings + auditEfficiency + deviationReduction;
  const currentCost = currentLaborCost + auditPrepCost + deviationCost;
  const timeReclaimed = Math.round((laborSavings / inputs.hourlyRate) + (auditEfficiency / inputs.hourlyRate));

  const annualWasteCost = inputs.avgValidationHoursPerWeek * 52 * BLENDED_HOURLY_COST;

  return {
    currentCost: Math.round(currentCost),
    potentialSavings: Math.round(potentialSavings),
    roiValue: Math.round(potentialSavings),
    timeReclaimed,
    annualWasteCost: Math.round(annualWasteCost),
    breakdown: {
      laborSavings: Math.round(laborSavings),
      auditEfficiency: Math.round(auditEfficiency),
      deviationReduction: Math.round(deviationReduction)
    }
  };
}

router.post("/roi-calculator/calculate", async (req: Request, res: Response) => {
  try {
    const {
      teamSize = 5,
      hoursOnCompliance = 15,
      hourlyRate = 75,
      auditFrequency = 2,
      auditPrepHours = 40,
      deviationsPerYear = 10,
      deviationCost = 5000,
      avgValidationHoursPerWeek = 20,
      avgReleaseCyclesPerYear = 4
    } = req.body;

    const result = calculateComplianceROI({
      teamSize: Number(teamSize),
      hoursOnCompliance: Number(hoursOnCompliance),
      hourlyRate: Number(hourlyRate),
      auditFrequency: Number(auditFrequency),
      auditPrepHours: Number(auditPrepHours),
      deviationsPerYear: Number(deviationsPerYear),
      deviationCost: Number(deviationCost),
      avgValidationHoursPerWeek: Number(avgValidationHoursPerWeek),
      avgReleaseCyclesPerYear: Number(avgReleaseCyclesPerYear)
    });

    const persona = determinePersona(result.roiValue);

    res.json({
      success: true,
      data: {
        ...result,
        persona,
        personaLabel: persona.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        recommendation: getPersonaRecommendation(persona, result.roiValue)
      }
    });
  } catch (error) {
    console.error("Error calculating ROI:", error);
    res.status(500).json({ success: false, error: "Failed to calculate ROI" });
  }
});

function getPersonaRecommendation(persona: string, roiValue: number): string {
  switch (persona) {
    case 'compliance_architect':
      return `Your $${roiValue.toLocaleString()} ROI projection positions you for enterprise-level compliance transformation. The Compliance Architect tier includes board-ready KPI frameworks and strategic planning integration.`;
    case 'validation_strategist':
      return `Your $${roiValue.toLocaleString()} ROI projection shows significant efficiency gains. The Validation Strategist tier focuses on cycle compression and systematic process optimization.`;
    default:
      return `Your $${roiValue.toLocaleString()} ROI projection demonstrates your compliance value. The Rising Leader tier helps you build visibility and recognition with leadership.`;
  }
}

router.post("/roi-calculator/capture-lead", async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      company,
      role,
      roiValue,
      persona,
      calculatorInputs
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const leadId = `lead_${nanoid(12)}`;
    
    const annualWasteCost = req.body.annualWasteCost;
    
    const leadData = {
      id: leadId,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      company: company || '',
      role: role || '',
      roiValue: Number(roiValue) || 0,
      annualWasteCost: Number(annualWasteCost) || 0,
      persona: persona || 'rising_leader',
      calculatorInputs: calculatorInputs || {},
      capturedAt: new Date().toISOString(),
      source: 'roi_calculator',
      status: 'new'
    };

    const stateDir = './state';
    const leadsFile = `${stateDir}/roi_leads.json`;
    
    let leads: any[] = [];
    try {
      const fs = await import('fs/promises');
      try {
        await fs.access(stateDir);
      } catch {
        await fs.mkdir(stateDir, { recursive: true });
      }
      try {
        const existing = await fs.readFile(leadsFile, 'utf-8');
        leads = JSON.parse(existing);
      } catch {
        leads = [];
      }
      
      leads.push(leadData);
      await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));
    } catch (error) {
      console.error("Error saving lead to file:", error);
    }

    console.log(`📊 ROI LEAD CAPTURED: ${email} | Persona: ${persona} | ROI: $${roiValue}`);

    await triggerEmailJourney(leadData);

    res.json({
      success: true,
      data: {
        leadId,
        message: "Lead captured successfully",
        nextStep: `/membership-calculator?persona=${persona}&roi=${roiValue}`
      }
    });
  } catch (error) {
    console.error("Error capturing lead:", error);
    res.status(500).json({ success: false, error: "Failed to capture lead" });
  }
});

async function triggerEmailJourney(lead: any) {
  try {
    const { sendgrid } = await import('../services/sendgrid');
    
    if (!sendgrid.isConfigured()) {
      console.log(`⚠️ SendGrid not configured - skipping email journey for ${lead.email}`);
      return;
    }

    const roiFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(lead.roiValue);
    const annualWasteFormatted = lead.annualWasteCost 
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(lead.annualWasteCost)
      : 'Not calculated';
    
    const personaLabel = lead.persona.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Personalized ROI Report</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d4a6f 100%);border-radius:16px;padding:40px;border:1px solid rgba(59,130,246,0.3);">
      <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px 0;">
        Hi ${lead.firstName || 'there'},
      </h1>
      <p style="color:#94a3b8;font-size:16px;margin:0 0 32px 0;">
        Your personalized compliance ROI analysis is ready.
      </p>
      
      <div style="background:rgba(30,58,138,0.4);border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid rgba(59,130,246,0.4);">
        <p style="color:#94a3b8;font-size:14px;margin:0 0 8px 0;">Your Annual Savings Potential</p>
        <p style="color:#3b82f6;font-size:42px;font-weight:bold;margin:0;">${roiFormatted}</p>
      </div>
      
      <div style="background:rgba(127,29,29,0.3);border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid rgba(239,68,68,0.4);">
        <p style="color:#94a3b8;font-size:14px;margin:0 0 8px 0;">Your Annual Operational Waste</p>
        <p style="color:#ef4444;font-size:32px;font-weight:bold;margin:0;">${annualWasteFormatted}</p>
      </div>
      
      <div style="background:rgba(20,50,80,0.5);border-radius:12px;padding:24px;margin-bottom:32px;border:1px solid rgba(71,85,105,0.5);">
        <p style="color:#60a5fa;font-size:14px;font-weight:600;margin:0 0 8px 0;">Your Profile: ${personaLabel}</p>
        <p style="color:#e2e8f0;font-size:15px;margin:0;">
          Based on your compliance profile at ${lead.company || 'your organization'}, you're positioned for 
          ${lead.persona === 'compliance_architect' ? 'enterprise-level compliance transformation' : 
            lead.persona === 'validation_strategist' ? 'significant efficiency gains through process optimization' :
            'building visibility and recognition with leadership'}.
        </p>
      </div>
      
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 16px 0;">Your Board-Ready Strategy Guide</h2>
      <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Here's how to present these findings to leadership:
      </p>
      
      <ol style="color:#e2e8f0;font-size:15px;line-height:1.8;padding-left:24px;margin:0 0 32px 0;">
        <li><strong>Lead with the waste number</strong> - ${annualWasteFormatted} in operational inefficiency gets attention.</li>
        <li><strong>Show the savings potential</strong> - ${roiFormatted} annual savings makes the business case clear.</li>
        <li><strong>Quantify time reclaimed</strong> - Hours your team can redirect to strategic initiatives.</li>
        <li><strong>Connect to audit readiness</strong> - Reduced risk exposure and faster inspection prep.</li>
      </ol>
      
      <a href="https://complianceworxs.com/membership?persona=${lead.persona}&roi=${lead.roiValue}" 
         style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:600;font-size:16px;">
        Explore ComplianceWorxs Membership
      </a>
      
      <p style="color:#64748b;font-size:13px;margin:32px 0 0 0;">
        Questions? Reply to this email - we read every response.
      </p>
    </div>
    
    <p style="color:#475569;font-size:12px;text-align:center;margin:24px 0 0 0;">
      ComplianceWorxs | AI-Powered Compliance Intelligence for Life Sciences
    </p>
  </div>
</body>
</html>`;

    const result = await sendgrid.sendEmail({
      to: lead.email,
      subject: `${lead.firstName || 'Your'} ROI Report: ${roiFormatted} Annual Savings Potential`,
      html: emailHtml,
      campaignId: 'roi_calculator_lead',
      persona: lead.persona,
      segment: 'new_lead'
    });

    if (result.success) {
      console.log(`✅ SendGrid: Sent ROI report to ${lead.email} (${lead.persona})`);
    } else {
      console.error(`❌ SendGrid: Failed to send to ${lead.email}: ${result.error}`);
    }
  } catch (error) {
    console.error("Error triggering email journey:", error);
  }
}

router.get("/roi-calculator/leads", async (req: Request, res: Response) => {
  try {
    const fs = await import('fs/promises');
    const leadsFile = './state/roi_leads.json';
    
    try {
      const data = await fs.readFile(leadsFile, 'utf-8');
      const leads = JSON.parse(data);
      
      const byPersona = {
        rising_leader: leads.filter((l: any) => l.persona === 'rising_leader').length,
        validation_strategist: leads.filter((l: any) => l.persona === 'validation_strategist').length,
        compliance_architect: leads.filter((l: any) => l.persona === 'compliance_architect').length
      };

      res.json({
        success: true,
        data: {
          total: leads.length,
          byPersona,
          recent: leads.slice(-10).reverse()
        }
      });
    } catch {
      res.json({
        success: true,
        data: {
          total: 0,
          byPersona: { rising_leader: 0, validation_strategist: 0, compliance_architect: 0 },
          recent: []
        }
      });
    }
  } catch (error) {
    console.error("Error getting leads:", error);
    res.status(500).json({ success: false, error: "Failed to get leads" });
  }
});

router.post("/sendgrid/test", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const { sendgrid } = await import('../services/sendgrid');
    
    if (!sendgrid.isConfigured()) {
      return res.json({
        success: false,
        error: "SendGrid not configured",
        details: {
          apiKeySet: !!process.env.SENDGRID_API_KEY,
          fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@complianceworxs.com',
          fromName: process.env.SENDGRID_FROM_NAME || 'ComplianceWorxs'
        }
      });
    }

    const testHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:40px;background:#0f172a;font-family:system-ui,sans-serif;">
  <div style="max-width:500px;margin:0 auto;background:#1e3a5f;border-radius:12px;padding:32px;border:1px solid rgba(59,130,246,0.3);">
    <h1 style="color:#ffffff;margin:0 0 16px 0;">SendGrid Test Email</h1>
    <p style="color:#94a3b8;margin:0 0 24px 0;">
      This is a test email from ComplianceWorxs ROI Calculator.
    </p>
    <p style="color:#3b82f6;font-size:24px;font-weight:bold;margin:0;">
      Connection verified at ${new Date().toISOString()}
    </p>
  </div>
</body>
</html>`;

    const result = await sendgrid.sendEmail({
      to: email,
      subject: `ComplianceWorxs SendGrid Test - ${new Date().toLocaleTimeString()}`,
      html: testHtml,
      text: `SendGrid Test Email - Connection verified at ${new Date().toISOString()}`
    });

    console.log(`📧 SENDGRID TEST: ${result.success ? 'SUCCESS' : 'FAILED'} - ${email}`);
    
    res.json({
      success: result.success,
      sendId: result.sendId,
      error: result.error,
      config: {
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@complianceworxs.com',
        fromName: process.env.SENDGRID_FROM_NAME || 'ComplianceWorxs',
        apiKeyConfigured: !!process.env.SENDGRID_API_KEY
      }
    });
  } catch (error) {
    console.error("SendGrid test error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
