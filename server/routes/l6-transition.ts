import { Router } from 'express';
import { l6Sandbox } from '../services/l6-sandbox.js';
import { l6CoSGovernance } from '../services/l6-cos-governance.js';
import { l6MicroCohortTesting } from '../services/l6-micro-cohort-testing.js';
import { l6MethodologyLock } from '../services/l6-methodology-lock.js';
import { L6_TRANSITION_PROTOCOLS } from '../services/agent-operating-context.js';

const router = Router();

router.get('/status', (req, res) => {
  const sandboxStatus = l6Sandbox.getStatus();
  const governanceReport = l6CoSGovernance.getExperimentReport();
  const cohortStatus = l6MicroCohortTesting.getStatus();
  const methodologyStatus = l6MethodologyLock.getStatus();
  const methodologyIntegrity = l6MethodologyLock.validateMethodologyIntegrity();

  res.json({
    version: L6_TRANSITION_PROTOCOLS.version,
    l5Dominant: true,
    l6SandboxMode: sandboxStatus.isActive,
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
