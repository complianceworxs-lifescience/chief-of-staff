/**
 * ====================================================
 * EDITORIAL FIREWALL MODULE
 * /utils/editorialFirewall.ts
 * ====================================================
 * 
 * Single enforcement brain for ComplianceWorxs content governance.
 * Prevents generic "why compliance programs fail" articles from
 * ever reaching WordPress.
 * 
 * Called at each stage by messageBus.ts:
 * - TOPIC_IDEA_QUEUE (CMA)
 * - BRIEF_FOR_REVIEW (CoS)
 * - DRAFT_FOR_PUBLISH_REVIEW (CoS)
 */

// Life sciences anchors (must hit >= 2)
const REQUIRED_ANCHORS = [
  "fda",
  "gxp",
  "gmp",
  "glp",
  "csv",
  "computer system validation",
  "validation",
  "qms",
  "quality management system",
  "sop",
  "sops",
  "annex 11",
  "21 cfr part 11",
  "21 cfr part 210",
  "21 cfr part 211",
  "21 cfr part 820",
  "eu mdr",
  "ivdr",
  "ich q7",
  "ich q8",
  "ich q9",
  "ich q10",
  "pq",
  "ppq",
  "deviation",
  "capa",
  "batch record",
  "manufacturing quality",
  "regulatory affairs",
  "regulatory assurance",
  "audit readiness",
  "inspection readiness"
];

// Domains we *never* allow
// NOTE: Use word boundaries or specific phrases to avoid false positives
// e.g., " aml " to avoid matching "streamlined"
const PROHIBITED_TERMS = [
  "sox ",
  " sox",
  "sarbanes-oxley",
  "doj eccp",
  "department of justice",
  "sec enforcement",
  "sec action",
  "pcaob",
  "fca sysc",
  "smcr",
  " aml ",
  " aml/",
  "/aml ",
  "a.m.l.",
  " kyc ",
  " kyc/",
  "/kyc ",
  "k.y.c.",
  " sanctions ",
  "sanctions screening",
  "ofac",
  "gdpr fine",
  " ecb ",
  "prudential regulation",
  "corporate governance",
  "bribery act",
  "anti-corruption",
  "aml/kyc",
  "aml compliance",
  "kyc compliance",
  "financial crime"
];

// Three pillars – content must hit at least one
const PILLAR_PATTERNS = [
  // Time Reclaimed
  "save time",
  "reduce rework",
  "less manual work",
  "faster validation",
  "shorter cycle time",
  "faster audit prep",
  "reduce documentation burden",
  "time savings",
  "cycle time reduction",
  "hours saved",
  // Proof of ROI
  "return on investment",
  "roi",
  "cost savings",
  "business impact",
  "value proof",
  "quantify impact",
  "reduced deviations",
  "reduced failures",
  "measurable",
  "metrics",
  // Professional Equity
  "career",
  "promotion",
  "recognition",
  "visibility",
  "trusted advisor",
  "executive visibility",
  "board confidence",
  "professional development",
  "career advancement"
];

// Personas – we just enforce valid values here
const VALID_PERSONAS = [
  "Rising Leader",
  "Validation Strategist",
  "Compliance Architect"
];

export interface TextAnalysis {
  domainAnchors: string[];
  prohibitedTerms: string[];
  pillarsDetected: string[];
}

export interface ContentMessage {
  topic: 'BLOG_ARTICLE' | 'LINKEDIN_POST' | 'EMAIL_CAMPAIGN';
  persona: string;
  title: string;
  rawIdea?: string;
  draft?: string;
  metadata: {
    domainAnchors: string[];
    prohibitedTerms: string[];
    pillars: string[];
    lifecycleStage: 'idea' | 'brief' | 'draft' | 'final' | 'brief-validated';
  };
}

export interface FirewallResult {
  passed: boolean;
  stage: 'idea' | 'brief' | 'draft';
  analysis: TextAnalysis;
  checks: {
    audienceLock: boolean;
    domainAnchors: boolean;
    prohibitedTerms: boolean;
    personaLock: boolean;
    pillars: boolean;
  };
  failedChecks: string[];
  summary: string;
}

/**
 * Basic text analysis
 */
export function analyzeText(text: string = ""): TextAnalysis {
  const lower = text.toLowerCase();

  const domainAnchors = REQUIRED_ANCHORS.filter(a =>
    lower.includes(a)
  );

  const prohibitedTerms = PROHIBITED_TERMS.filter(p =>
    lower.includes(p)
  );

  const pillarsDetected = PILLAR_PATTERNS.filter(p =>
    lower.includes(p)
  );

  return {
    domainAnchors,
    prohibitedTerms,
    pillarsDetected
  };
}

/**
 * Must clearly be life-sciences validation/compliance (≥2 anchors)
 */
export function passesAudienceLock(analysis: TextAnalysis): boolean {
  return analysis.domainAnchors.length >= 2;
}

/**
 * Same as above, explicit check for ≥2 domain anchors
 */
export function passesDomainAnchors(analysis: TextAnalysis): boolean {
  return analysis.domainAnchors.length >= 2;
}

/**
 * Any hit is an automatic block
 */
export function hitsProhibitedTerms(analysis: TextAnalysis): boolean {
  return analysis.prohibitedTerms.length > 0;
}

/**
 * Must hit at least one pillar (time, ROI, professional equity)
 */
export function passesPillars(analysis: TextAnalysis): boolean {
  return analysis.pillarsDetected.length >= 1;
}

/**
 * Persona must be one of the three valid personas
 */
export function passesPersonaLock(persona: string): boolean {
  return VALID_PERSONAS.includes(persona);
}

/**
 * Full firewall check for IDEA stage
 * Called by CMA on TOPIC_IDEA_QUEUE
 */
export function firewallCheckIdea(rawIdea: string, persona: string): FirewallResult {
  const analysis = analyzeText(rawIdea);
  
  const audienceLock = passesAudienceLock(analysis);
  const domainAnchors = passesDomainAnchors(analysis);
  const prohibitedTerms = !hitsProhibitedTerms(analysis);
  const personaLock = passesPersonaLock(persona);
  
  // Idea stage: check anchors, prohibited terms, persona (pillars checked at brief stage)
  const passed = audienceLock && domainAnchors && prohibitedTerms && personaLock;
  
  const failedChecks: string[] = [];
  if (!audienceLock) failedChecks.push('AUDIENCE_LOCK');
  if (!domainAnchors) failedChecks.push('DOMAIN_ANCHORS');
  if (!prohibitedTerms) failedChecks.push('PROHIBITED_TERMS');
  if (!personaLock) failedChecks.push('PERSONA_LOCK');

  return {
    passed,
    stage: 'idea',
    analysis,
    checks: {
      audienceLock,
      domainAnchors,
      prohibitedTerms,
      personaLock,
      pillars: false // Not checked at idea stage
    },
    failedChecks,
    summary: passed 
      ? 'IDEA PASSED - Ready for brief stage'
      : `IDEA REJECTED - Failed: ${failedChecks.join(', ')}`
  };
}

/**
 * Full firewall check for BRIEF stage
 * Called by CoS on BRIEF_FOR_REVIEW
 */
export function firewallCheckBrief(message: ContentMessage): FirewallResult {
  const content = `${message.title} ${message.rawIdea || ''}`;
  const analysis = analyzeText(content);
  
  const audienceLock = passesAudienceLock(analysis);
  const domainAnchors = passesDomainAnchors(analysis);
  const prohibitedTerms = !hitsProhibitedTerms(analysis);
  const personaLock = passesPersonaLock(message.persona);
  const pillars = passesPillars(analysis);
  
  // Brief stage: all checks including pillars
  const passed = audienceLock && domainAnchors && prohibitedTerms && personaLock && pillars;
  
  const failedChecks: string[] = [];
  if (!audienceLock) failedChecks.push('AUDIENCE_LOCK');
  if (!domainAnchors) failedChecks.push('DOMAIN_ANCHORS');
  if (!prohibitedTerms) failedChecks.push('PROHIBITED_TERMS');
  if (!personaLock) failedChecks.push('PERSONA_LOCK');
  if (!pillars) failedChecks.push('PILLARS');

  return {
    passed,
    stage: 'brief',
    analysis,
    checks: {
      audienceLock,
      domainAnchors,
      prohibitedTerms,
      personaLock,
      pillars
    },
    failedChecks,
    summary: passed 
      ? 'BRIEF APPROVED - Ready for CPA content generation'
      : `BRIEF REJECTED - Failed: ${failedChecks.join(', ')}`
  };
}

/**
 * Full firewall check for DRAFT stage
 * Called by CoS on DRAFT_FOR_PUBLISH_REVIEW
 * This is the FINAL GATE before WordPress publish
 */
export function firewallCheckDraft(draftContent: string, persona: string): FirewallResult {
  const analysis = analyzeText(draftContent);
  
  const audienceLock = passesAudienceLock(analysis);
  const domainAnchors = passesDomainAnchors(analysis);
  const prohibitedTerms = !hitsProhibitedTerms(analysis);
  const personaLock = passesPersonaLock(persona);
  const pillars = passesPillars(analysis);
  
  // Draft stage: ALL checks must pass - this is the final gate
  const passed = audienceLock && domainAnchors && prohibitedTerms && personaLock && pillars;
  
  const failedChecks: string[] = [];
  if (!audienceLock) failedChecks.push('AUDIENCE_LOCK');
  if (!domainAnchors) failedChecks.push('DOMAIN_ANCHORS');
  if (!prohibitedTerms) failedChecks.push('PROHIBITED_TERMS');
  if (!personaLock) failedChecks.push('PERSONA_LOCK');
  if (!pillars) failedChecks.push('PILLARS');

  return {
    passed,
    stage: 'draft',
    analysis,
    checks: {
      audienceLock,
      domainAnchors,
      prohibitedTerms,
      personaLock,
      pillars
    },
    failedChecks,
    summary: passed 
      ? 'DRAFT APPROVED - Ready for WordPress publish'
      : `DRAFT REJECTED - Failed: ${failedChecks.join(', ')}`
  };
}

// Export constants for external use
export const ANCHORS = REQUIRED_ANCHORS;
export const PROHIBITED = PROHIBITED_TERMS;
export const PILLARS = PILLAR_PATTERNS;
export const PERSONAS = VALID_PERSONAS;

export const editorialFirewall = {
  analyzeText,
  passesAudienceLock,
  passesDomainAnchors,
  hitsProhibitedTerms,
  passesPillars,
  passesPersonaLock,
  firewallCheckIdea,
  firewallCheckBrief,
  firewallCheckDraft,
  ANCHORS,
  PROHIBITED,
  PILLARS,
  PERSONAS
};
