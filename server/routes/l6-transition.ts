import { Router } from 'express';
import { l6Sandbox } from '../services/l6-sandbox.js';
import { l6CoSGovernance } from '../services/l6-cos-governance.js';
import { l6MicroCohortTesting } from '../services/l6-micro-cohort-testing.js';
import { l6MethodologyLock } from '../services/l6-methodology-lock.js';
import { l6ReadinessAssessment } from '../services/l6-readiness-assessment.js';
import { L6_TRANSITION_PROTOCOLS } from '../services/agent-operating-context.js';

const router = Router();

// ===== L6 READINESS ASSESSMENT ENDPOINTS =====
// L6 = Meta-autonomy (agents redesigning the business model)
// ALL FIVE critical thresholds must be met simultaneously

router.get('/readiness', (req, res) => {
  const assessment = l6ReadinessAssessment.getReadinessAssessment();
  const transitionCheck = l6ReadinessAssessment.canTransitionToL6();
  
  res.json({
    frameworkVersion: 'L6-TRANSITION-READINESS-v1.0',
    purpose: 'L6 is meta-autonomy - agents redesigning the business model itself',
    riskProfile: 'Regulatory, reputation-sensitive, audit-grade',
    transitionRule: 'ALL FIVE critical thresholds must be TRUE. NOT SOME. ALL.',
    ...assessment,
    canTransition: transitionCheck.allowed,
    blockers: transitionCheck.blockers,
    thresholds: {
      revenueStability: '≥85% target for 6 consecutive weeks',
      rpmStability: '≥92% accuracy for 30 consecutive days',
      objectionStability: 'No new categories for 30 days',
      blueprintPerformance: 'All archetypes within ±15% variance',
      systemCoherence: 'Zero incidents for 48 hours (2 ODAR cycles)'
    }
  });
});

router.get('/readiness/metrics', (req, res) => {
  const assessment = l6ReadinessAssessment.getReadinessAssessment();
  res.json({
    metrics: assessment.metrics,
    readinessScore: assessment.readinessScore,
    metricsReady: assessment.metricsReady,
    metricTotal: assessment.metricTotal,
    overallReady: assessment.overallReady
  });
});

router.get('/readiness/revenue-sprints', (req, res) => {
  const history = l6ReadinessAssessment.getRevenueSprintHistory();
  const assessment = l6ReadinessAssessment.getReadinessAssessment();
  
  res.json({
    metric: assessment.metrics.revenueStability,
    threshold: '≥85% target for 6 consecutive weeks',
    why: 'An unstable revenue system cannot support strategic redesign. L6 introduces experimentation that can temporarily reduce performance.',
    history
  });
});

router.get('/readiness/rpm-accuracy', (req, res) => {
  const history = l6ReadinessAssessment.getRPMAccuracyHistory();
  const assessment = l6ReadinessAssessment.getReadinessAssessment();
  
  res.json({
    metric: assessment.metrics.rpmStability,
    threshold: '≥92% accuracy for 30 consecutive days',
    why: 'If predictions are unstable, any L6-level redesign will destabilize the core engine. 92% ensures low variance and trustworthy forecasts.',
    history
  });
});

router.get('/readiness/objections', (req, res) => {
  const categories = l6ReadinessAssessment.getObjectionCategories();
  const assessment = l6ReadinessAssessment.getReadinessAssessment();
  
  res.json({
    metric: assessment.metrics.objectionStability,
    threshold: 'No new objection categories for 30 days',
    why: 'L6 experimentation is impossible if the system is still discovering baseline objections. You need stable, known friction before changing product or narrative.',
    categories
  });
});

router.get('/readiness/archetypes', (req, res) => {
  const performance = l6ReadinessAssessment.getArchetypePerformance();
  const assessment = l6ReadinessAssessment.getReadinessAssessment();
  
  res.json({
    metric: assessment.metrics.blueprintPerformance,
    threshold: 'CMO Archetype variance within ±15%',
    why: 'L6 requires the demand engine to be stable at scale - predictable, trust-efficient, modular, and ready to support new markets.',
    performance
  });
});

router.get('/readiness/coherence', (req, res) => {
  const unresolvedOnly = req.query.unresolved === 'true';
  const incidents = l6ReadinessAssessment.getCoherenceIncidents(unresolvedOnly);
  const assessment = l6ReadinessAssessment.getReadinessAssessment();
  
  res.json({
    metric: assessment.metrics.systemCoherence,
    threshold: 'Zero contradictions for 48 hours (2 ODAR cycles)',
    why: 'L6 redesign requires the system to behave as a single agent, not four independent units.',
    incidentTypes: [
      'strategist_misalignment',
      'cro_deviation',
      'packet_friction',
      'udl_failure',
      'wis_anomaly',
      'vqs_tension'
    ],
    incidents
  });
});

router.get('/readiness/safety-signals', (req, res) => {
  const assessment = l6ReadinessAssessment.getReadinessAssessment();
  
  res.json({
    description: 'Optional but strong predictors of L6 readiness',
    signals: assessment.safetySignals,
    requirements: {
      trustMomentum: 'Positive for 30 days (saves, re-engagement, comment quality)',
      conversionVelocity: 'Trend up + stable (tier movement, micro-offer, CTA rates)',
      vqsTension: 'No tension detected for 30 days'
    }
  });
});

router.post('/readiness/record-revenue-sprint', (req, res) => {
  const { weekNumber, startDate, endDate, targetRevenue, actualRevenue, percentageAchieved } = req.body;
  
  if (!weekNumber || !startDate || !endDate || !targetRevenue || !actualRevenue || !percentageAchieved) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  l6ReadinessAssessment.recordRevenueSprintWeek({
    weekNumber,
    startDate,
    endDate,
    targetRevenue,
    actualRevenue,
    percentageAchieved
  });
  
  res.json({ success: true, message: 'Revenue sprint recorded' });
});

router.post('/readiness/record-rpm-accuracy', (req, res) => {
  const { date, predictedRevenue, actualRevenue, accuracy } = req.body;
  
  if (!date || predictedRevenue === undefined || actualRevenue === undefined || accuracy === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  l6ReadinessAssessment.recordRPMAccuracy({
    date,
    predictedRevenue,
    actualRevenue,
    accuracy
  });
  
  res.json({ success: true, message: 'RPM accuracy recorded' });
});

router.post('/readiness/record-objection', (req, res) => {
  const { category } = req.body;
  
  if (!category) {
    return res.status(400).json({ error: 'Category required' });
  }
  
  l6ReadinessAssessment.recordObjectionCategory(category);
  res.json({ success: true, message: 'Objection category recorded' });
});

router.post('/readiness/record-coherence-incident', (req, res) => {
  const { type, description } = req.body;
  
  const validTypes = ['strategist_misalignment', 'cro_deviation', 'packet_friction', 'udl_failure', 'wis_anomaly', 'vqs_tension'];
  
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ error: 'Valid type required', validTypes });
  }
  
  if (!description) {
    return res.status(400).json({ error: 'Description required' });
  }
  
  l6ReadinessAssessment.recordCoherenceIncident({ type, description });
  res.json({ success: true, message: 'Coherence incident recorded' });
});

router.post('/readiness/resolve-coherence-incident', (req, res) => {
  const { incidentId } = req.body;
  
  if (!incidentId) {
    return res.status(400).json({ error: 'Incident ID required' });
  }
  
  const resolved = l6ReadinessAssessment.resolveCoherenceIncident(incidentId);
  
  if (resolved) {
    res.json({ success: true, message: 'Incident resolved' });
  } else {
    res.status(404).json({ error: 'Incident not found' });
  }
});

// ===== L6 STATUS ENDPOINT =====

router.get('/status', (req, res) => {
  const sandboxStatus = l6Sandbox.getStatus();
  const governanceReport = l6CoSGovernance.getExperimentReport();
  const cohortStatus = l6MicroCohortTesting.getStatus();
  const methodologyStatus = l6MethodologyLock.getStatus();
  const methodologyIntegrity = l6MethodologyLock.validateMethodologyIntegrity();
  
  // Include L6 Readiness Assessment - ALL FIVE thresholds must be TRUE
  const readinessAssessment = l6ReadinessAssessment.getReadinessAssessment();
  const transitionCheck = l6ReadinessAssessment.canTransitionToL6();

  res.json({
    version: L6_TRANSITION_PROTOCOLS.version,
    l5Dominant: true,
    l6SandboxMode: sandboxStatus.isActive,
    
    // L6 TRANSITION READINESS - The core gate
    l6Readiness: {
      overallReady: readinessAssessment.overallReady,
      readinessScore: readinessAssessment.readinessScore,
      metricsReady: `${readinessAssessment.metricsReady}/${readinessAssessment.metricTotal}`,
      canTransition: transitionCheck.allowed,
      blockers: transitionCheck.blockers,
      estimatedTimeToReady: readinessAssessment.estimatedTimeToReady,
      criticalThresholds: {
        revenueStability: {
          status: readinessAssessment.metrics.revenueStability.status,
          threshold: '≥85% for 6 consecutive weeks',
          current: readinessAssessment.metrics.revenueStability.currentValue
        },
        rpmStability: {
          status: readinessAssessment.metrics.rpmStability.status,
          threshold: '≥92% for 30 consecutive days',
          current: readinessAssessment.metrics.rpmStability.currentValue
        },
        objectionStability: {
          status: readinessAssessment.metrics.objectionStability.status,
          threshold: 'No new categories for 30 days',
          current: readinessAssessment.metrics.objectionStability.currentValue
        },
        blueprintPerformance: {
          status: readinessAssessment.metrics.blueprintPerformance.status,
          threshold: 'Within ±15% variance',
          current: readinessAssessment.metrics.blueprintPerformance.currentValue
        },
        systemCoherence: {
          status: readinessAssessment.metrics.systemCoherence.status,
          threshold: 'Zero incidents for 48 hours',
          current: readinessAssessment.metrics.systemCoherence.currentValue
        }
      },
      safetySignals: readinessAssessment.safetySignals
    },
    
    components: {
      sandbox: {
        active: sandboxStatus.isActive,
        activatedAt: sandboxStatus.activatedAt,
        experimentCounts: sandboxStatus.experimentCounts,
        canAcceptNewExperiments: sandboxStatus.canAcceptNewExperiments
      },
      governance: {
        totalDecisions: governanceReport.totalDecisions,
        totalRollbacks: governanceReport.totalRollbacks,
        experimentCaps: governanceReport.config
      },
      microCohortTesting: {
        activeCohorts: cohortStatus.activeCohorts,
        currentAudiencePercent: cohortStatus.currentAudiencePercent,
        maxAudiencePercent: cohortStatus.maxAudiencePercent,
        unresolvedFriction: cohortStatus.unresolvedFriction
      },
      methodologyLock: {
        allMethodologiesLocked: methodologyIntegrity.valid,
        pendingChanges: methodologyStatus.pendingChanges,
        appliedChanges: methodologyStatus.appliedChanges,
        protectionLevels: methodologyStatus.protectionLevels
      }
    },
    protocols: L6_TRANSITION_PROTOCOLS
  });
});

router.post('/sandbox/activate', (req, res) => {
  const result = l6Sandbox.activate();
  
  if (result.success) {
    l6MethodologyLock.activate();
  }
  
  res.json(result);
});

router.post('/sandbox/deactivate', (req, res) => {
  const result = l6Sandbox.deactivate();
  res.json(result);
});

router.get('/sandbox/status', (req, res) => {
  res.json(l6Sandbox.getStatus());
});

router.get('/sandbox/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json(l6Sandbox.getSandboxLogs(limit));
});

router.get('/sandbox/isolation-check', (req, res) => {
  res.json(l6Sandbox.checkSandboxIsolation());
});

router.get('/experiments', (req, res) => {
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  
  const experiments = l6Sandbox.getExperiments({
    status: status as any,
    type: type as any
  });
  
  res.json(experiments);
});

router.get('/experiments/:id', (req, res) => {
  const experiment = l6Sandbox.getExperiment(req.params.id);
  
  if (!experiment) {
    return res.status(404).json({ error: 'Experiment not found' });
  }
  
  res.json(experiment);
});

router.post('/experiments', (req, res) => {
  const { type, name, description, hypothesis, proposedBy, tokenBudget, maxDurationDays, microCohortSize } = req.body;
  
  if (!type || !name || !description || !hypothesis || !proposedBy) {
    return res.status(400).json({ 
      error: 'Missing required fields: type, name, description, hypothesis, proposedBy' 
    });
  }
  
  const result = l6Sandbox.proposeExperiment({
    type,
    name,
    description,
    hypothesis,
    proposedBy,
    tokenBudget,
    maxDurationDays,
    microCohortSize
  });
  
  res.json(result);
});

router.post('/experiments/:id/activate', (req, res) => {
  const result = l6Sandbox.activateExperiment(req.params.id);
  res.json(result);
});

router.post('/experiments/:id/complete', (req, res) => {
  const result = l6Sandbox.completeExperiment(req.params.id);
  res.json(result);
});

router.post('/experiments/:id/abandon', (req, res) => {
  const { reason } = req.body;
  
  if (!reason) {
    return res.status(400).json({ error: 'Reason required for abandonment' });
  }
  
  const result = l6Sandbox.abandonExperiment(req.params.id, reason);
  res.json(result);
});

router.post('/experiments/:id/output', (req, res) => {
  const { outputType, data, validated, validationNotes } = req.body;
  
  if (!outputType || !data) {
    return res.status(400).json({ error: 'Missing required fields: outputType, data' });
  }
  
  const result = l6Sandbox.addExperimentOutput(req.params.id, {
    outputType,
    data,
    validated: validated || false,
    validationNotes: validationNotes || null
  });
  
  res.json(result);
});

router.post('/experiments/:id/metrics', (req, res) => {
  const result = l6Sandbox.updateExperimentMetrics(req.params.id, req.body);
  res.json(result);
});

router.post('/governance/approve', (req, res) => {
  const { experimentId, approvedBy, notes } = req.body;
  
  if (!experimentId || !approvedBy) {
    return res.status(400).json({ error: 'Missing required fields: experimentId, approvedBy' });
  }
  
  const result = l6CoSGovernance.approveExperimentProposal(experimentId, approvedBy, notes);
  res.json(result);
});

router.post('/governance/deny', (req, res) => {
  const { experimentId, deniedBy, reason } = req.body;
  
  if (!experimentId || !deniedBy || !reason) {
    return res.status(400).json({ error: 'Missing required fields: experimentId, deniedBy, reason' });
  }
  
  const result = l6CoSGovernance.denyExperimentProposal(experimentId, deniedBy, reason);
  res.json(result);
});

router.post('/governance/check-rollback/:id', (req, res) => {
  const trigger = l6CoSGovernance.checkRollbackConditions(req.params.id);
  res.json({ 
    rollbackTriggered: trigger !== null, 
    trigger 
  });
});

router.get('/governance/evaluate-graduation/:id', (req, res) => {
  const evaluation = l6CoSGovernance.evaluateGraduation(req.params.id);
  res.json(evaluation);
});

router.post('/governance/graduate', (req, res) => {
  const { experimentId, approvedBy, notes } = req.body;
  
  if (!experimentId || !approvedBy) {
    return res.status(400).json({ error: 'Missing required fields: experimentId, approvedBy' });
  }
  
  const result = l6CoSGovernance.approveGraduation(experimentId, approvedBy, notes);
  res.json(result);
});

router.get('/governance/decisions', (req, res) => {
  const experimentId = req.query.experimentId as string | undefined;
  res.json(l6CoSGovernance.getDecisions(experimentId));
});

router.get('/governance/rollbacks', (req, res) => {
  const experimentId = req.query.experimentId as string | undefined;
  res.json(l6CoSGovernance.getRollbackTriggers(experimentId));
});

router.get('/governance/report', (req, res) => {
  res.json(l6CoSGovernance.getExperimentReport());
});

router.post('/cohorts', (req, res) => {
  const { experimentId, audiencePercent, segmentCriteria } = req.body;
  
  if (!experimentId || !audiencePercent) {
    return res.status(400).json({ error: 'Missing required fields: experimentId, audiencePercent' });
  }
  
  const result = l6MicroCohortTesting.createCohort(experimentId, audiencePercent, segmentCriteria);
  res.json(result);
});

router.get('/cohorts/:id', (req, res) => {
  const cohort = l6MicroCohortTesting.getCohort(req.params.id);
  
  if (!cohort) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  
  res.json(cohort);
});

router.get('/cohorts/experiment/:experimentId', (req, res) => {
  const cohorts = l6MicroCohortTesting.getCohortsByExperiment(req.params.experimentId);
  res.json(cohorts);
});

router.post('/cohorts/:id/metrics', (req, res) => {
  const result = l6MicroCohortTesting.updateCohortMetrics(req.params.id, req.body);
  res.json(result);
});

router.post('/cohorts/:id/pattern', (req, res) => {
  const { type, value, details } = req.body;
  
  if (!type || value === undefined) {
    return res.status(400).json({ error: 'Missing required fields: type, value' });
  }
  
  const result = l6MicroCohortTesting.recordConversionPattern(req.params.id, { type, value, details });
  res.json(result);
});

router.post('/cohorts/:id/compare', (req, res) => {
  const result = l6MicroCohortTesting.compareToControl(req.params.id);
  
  if (!result) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  
  res.json(result);
});

router.post('/cohorts/:id/pause', (req, res) => {
  const result = l6MicroCohortTesting.pauseCohort(req.params.id);
  res.json(result);
});

router.post('/cohorts/:id/complete', (req, res) => {
  const result = l6MicroCohortTesting.completeCohort(req.params.id);
  res.json(result);
});

router.get('/cohorts-status', (req, res) => {
  res.json(l6MicroCohortTesting.getStatus());
});

router.post('/friction', (req, res) => {
  const { experimentId, cohortId, frictionType, severity, description } = req.body;
  
  if (!experimentId || !cohortId || !frictionType || !severity || !description) {
    return res.status(400).json({ 
      error: 'Missing required fields: experimentId, cohortId, frictionType, severity, description' 
    });
  }
  
  const result = l6MicroCohortTesting.reportFriction(
    experimentId, cohortId, frictionType, severity, description
  );
  res.json(result);
});

router.get('/friction', (req, res) => {
  const experimentId = req.query.experimentId as string | undefined;
  res.json(l6MicroCohortTesting.getFrictionReports(experimentId));
});

router.get('/friction/unresolved', (req, res) => {
  res.json(l6MicroCohortTesting.getUnresolvedFriction());
});

router.post('/friction/:id/resolve', (req, res) => {
  const result = l6MicroCohortTesting.resolveFriction(req.params.id);
  res.json(result);
});

router.get('/methodology/locks', (req, res) => {
  res.json(l6MethodologyLock.getAllLocks());
});

router.get('/methodology/locks/:type', (req, res) => {
  const lock = l6MethodologyLock.getLock(req.params.type as any);
  
  if (!lock) {
    return res.status(404).json({ error: 'Methodology not found' });
  }
  
  res.json(lock);
});

router.post('/methodology/propose-change', (req, res) => {
  const { 
    methodologyType, changeType, proposedBy, experimentId, 
    description, currentState, proposedState, impactAssessment 
  } = req.body;
  
  if (!methodologyType || !changeType || !proposedBy || !description || !impactAssessment) {
    return res.status(400).json({ 
      error: 'Missing required fields: methodologyType, changeType, proposedBy, description, impactAssessment' 
    });
  }
  
  const result = l6MethodologyLock.proposeChange({
    methodologyType,
    changeType,
    proposedBy,
    experimentId,
    description,
    currentState,
    proposedState,
    impactAssessment
  });
  res.json(result);
});

router.get('/methodology/pending-changes', (req, res) => {
  res.json(l6MethodologyLock.getPendingChanges());
});

router.post('/methodology/review-change', (req, res) => {
  const { changeId, reviewedBy, approved, notes } = req.body;
  
  if (!changeId || !reviewedBy || approved === undefined || !notes) {
    return res.status(400).json({ 
      error: 'Missing required fields: changeId, reviewedBy, approved, notes' 
    });
  }
  
  const result = l6MethodologyLock.reviewChange(changeId, reviewedBy, approved, notes);
  res.json(result);
});

router.post('/methodology/apply-change', (req, res) => {
  const { changeId, appliedBy } = req.body;
  
  if (!changeId || !appliedBy) {
    return res.status(400).json({ error: 'Missing required fields: changeId, appliedBy' });
  }
  
  const result = l6MethodologyLock.applyChange(changeId, appliedBy);
  res.json(result);
});

router.get('/methodology/history', (req, res) => {
  const methodologyType = req.query.methodologyType as string | undefined;
  res.json(l6MethodologyLock.getChangeHistory(methodologyType as any));
});

router.get('/methodology/status', (req, res) => {
  res.json(l6MethodologyLock.getStatus());
});

router.get('/methodology/integrity', (req, res) => {
  res.json(l6MethodologyLock.validateMethodologyIntegrity());
});

export default router;
