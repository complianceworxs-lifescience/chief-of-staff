/**
 * ====================================================
 * BLOG PUBLISH PIPELINE ROUTES
 * ====================================================
 * 
 * API routes for managing the Blog Cadence Scheduler and
 * the Blog Publish Pipeline (RUN_BLOG_PUBLISH_PIPELINE).
 */

import { Router, Request, Response } from 'express';
import { blogPublishPipeline, ContentBrief } from '../services/blog-publish-pipeline.js';
import { blogCadenceScheduler } from '../services/blog-cadence-scheduler.js';
import { wordpressPublisher } from '../services/wordpress-publisher.js';

const router = Router();

router.get('/status', async (_req: Request, res: Response) => {
  const schedulerStatus = blogCadenceScheduler.getStatus();
  const wordpressConnected = wordpressPublisher.isConfigured();

  res.json({
    scheduler: schedulerStatus,
    wordpress: {
      configured: wordpressConnected,
      message: wordpressConnected 
        ? 'WordPress is configured and ready for publishing'
        : 'WordPress credentials not configured. Set WORDPRESS_SITE_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD'
    },
    pipeline: {
      name: 'RUN_BLOG_PUBLISH_PIPELINE',
      description: 'Publishes approved content briefs to WordPress on schedule'
    }
  });
});

router.post('/trigger', async (_req: Request, res: Response) => {
  try {
    console.log('📤 Manual blog publish pipeline trigger requested');
    const result = await blogPublishPipeline.runBlogPublishPipeline();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/scheduler/enable', async (_req: Request, res: Response) => {
  blogCadenceScheduler.enable();
  res.json({ 
    success: true, 
    message: 'Blog cadence scheduler enabled',
    status: blogCadenceScheduler.getStatus()
  });
});

router.post('/scheduler/disable', async (_req: Request, res: Response) => {
  blogCadenceScheduler.disable();
  res.json({ 
    success: true, 
    message: 'Blog cadence scheduler disabled',
    status: blogCadenceScheduler.getStatus()
  });
});

router.get('/briefs', async (_req: Request, res: Response) => {
  const briefs = await blogPublishPipeline.getContentBriefs();
  const available = briefs.filter(b => !b.used && b.approvedBy);
  const pending = briefs.filter(b => !b.used && !b.approvedBy);
  const used = briefs.filter(b => b.used);

  res.json({
    total: briefs.length,
    available: available.length,
    pending: pending.length,
    used: used.length,
    briefs: {
      available,
      pending,
      used
    }
  });
});

router.post('/briefs', async (req: Request, res: Response) => {
  try {
    const { title, targetPersona, painPoints, coreMessage, valueProposition, proofPoints, channel, revenueScore, authorityScore } = req.body;

    if (!title || !targetPersona || !coreMessage) {
      return res.status(400).json({ error: 'Missing required fields: title, targetPersona, coreMessage' });
    }

    const brief = await blogPublishPipeline.addContentBrief({
      title,
      targetPersona,
      painPoints: painPoints || [],
      coreMessage,
      valueProposition: valueProposition || '',
      proofPoints: proofPoints || [],
      channel: channel || 'blog',
      revenueScore: revenueScore || 50,
      authorityScore: authorityScore || 50,
      approvedBy: '',
      approvedAt: ''
    });

    res.json({ success: true, brief });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/briefs/:briefId/approve', async (req: Request, res: Response) => {
  try {
    const { briefId } = req.params;
    const { approver } = req.body;

    if (!approver) {
      return res.status(400).json({ error: 'Missing approver field' });
    }

    const brief = await blogPublishPipeline.approveBrief(briefId, approver);
    
    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    res.json({ success: true, brief });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/briefs/next', async (_req: Request, res: Response) => {
  const brief = await blogPublishPipeline.getHighestScoringBrief();
  
  if (!brief) {
    return res.json({ 
      available: false, 
      message: 'No approved briefs available for publishing' 
    });
  }

  const validation = blogPublishPipeline.validateBriefGovernance(brief);
  
  res.json({
    available: true,
    brief,
    validation,
    ready: validation.valid,
    message: validation.valid 
      ? 'Brief is ready for publishing'
      : 'Brief needs adjustments before publishing'
  });
});

router.get('/governance-logs', async (_req: Request, res: Response) => {
  const logs = blogPublishPipeline.getGovernanceLogs();
  res.json({
    total: logs.length,
    logs: logs.slice(0, 50)
  });
});

router.get('/decision-lineage', async (_req: Request, res: Response) => {
  const decisions = blogPublishPipeline.getDecisionLineage();
  res.json({
    total: decisions.length,
    decisions: decisions.slice(0, 50)
  });
});

router.get('/wordpress/test', async (_req: Request, res: Response) => {
  const result = await wordpressPublisher.testConnection();
  res.json(result);
});

router.get('/wordpress/categories', async (_req: Request, res: Response) => {
  const categories = await wordpressPublisher.getCategories();
  res.json({ categories });
});

router.get('/wordpress/tags', async (_req: Request, res: Response) => {
  const tags = await wordpressPublisher.getTags();
  res.json({ tags });
});

router.get('/scheduler-config', async (_req: Request, res: Response) => {
  const config = blogPublishPipeline.getSchedulerConfig();
  res.json(config || { error: 'Scheduler config not found in L7 directive' });
});

export default router;
