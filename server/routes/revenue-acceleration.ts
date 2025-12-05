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

function calculateComplianceROI(inputs: {
  teamSize: number;
  hoursOnCompliance: number;
  hourlyRate: number;
  auditFrequency: number;
  auditPrepHours: number;
  deviationsPerYear: number;
  deviationCost: number;
}): {
  currentCost: number;
  potentialSavings: number;
  roiValue: number;
  timeReclaimed: number;
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

  return {
    currentCost: Math.round(currentCost),
    potentialSavings: Math.round(potentialSavings),
    roiValue: Math.round(potentialSavings),
    timeReclaimed,
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
      deviationCost = 5000
    } = req.body;

    const result = calculateComplianceROI({
      teamSize: Number(teamSize),
      hoursOnCompliance: Number(hoursOnCompliance),
      hourlyRate: Number(hourlyRate),
      auditFrequency: Number(auditFrequency),
      auditPrepHours: Number(auditPrepHours),
      deviationsPerYear: Number(deviationsPerYear),
      deviationCost: Number(deviationCost)
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
    
    const leadData = {
      id: leadId,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      company: company || '',
      role: role || '',
      roiValue: Number(roiValue) || 0,
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
    const mailchimpApiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';

    if (!mailchimpApiKey || !audienceId) {
      console.log(`⚠️ Mailchimp not configured - skipping email journey for ${lead.email}`);
      return;
    }

    const response = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailchimpApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: lead.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: lead.firstName,
          LNAME: lead.lastName,
          COMPANY: lead.company,
          ROLE: lead.role,
          ROI_VAL: lead.roiValue.toString(),
          PERSONA: lead.persona
        },
        tags: [`roi_calculator`, lead.persona, 'new_lead']
      })
    });

    if (response.ok) {
      console.log(`✅ Mailchimp: Added ${lead.email} to ${lead.persona} journey`);
    } else {
      const errorText = await response.text();
      if (errorText.includes('Member Exists')) {
        console.log(`ℹ️ Mailchimp: ${lead.email} already exists - updating tags`);
      } else {
        console.error(`❌ Mailchimp error: ${errorText}`);
      }
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

export default router;
