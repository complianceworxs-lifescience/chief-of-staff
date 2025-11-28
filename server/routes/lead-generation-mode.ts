/**
 * LEAD GENERATION MODE - PHASE 0: GENESIS API ROUTES
 */

import { Router, Request, Response } from 'express';
import { leadGenerationMode } from '../services/lead-generation-mode';

const router = Router();

/**
 * POST /api/lead-gen/activate
 * Activate PHASE 0: GENESIS Campaign
 */
router.post('/activate', (req: Request, res: Response) => {
  const campaign = leadGenerationMode.initializeGenesisCampaign();
  
  res.json({
    success: true,
    message: 'PHASE 0: GENESIS - Lead Generation Mode ACTIVATED',
    campaign
  });
});

/**
 * GET /api/lead-gen/status
 * Get campaign status
 */
router.get('/status', (req: Request, res: Response) => {
  const campaign = leadGenerationMode.getStatus();
  
  if (!campaign) {
    return res.json({
      active: false,
      message: 'No lead generation campaign active. POST /api/lead-gen/activate to start.'
    });
  }
  
  res.json({
    active: true,
    campaign
  });
});

/**
 * GET /api/lead-gen/posts
 * Get all LinkedIn posts
 */
router.get('/posts', (req: Request, res: Response) => {
  const posts = leadGenerationMode.getLinkedInPosts();
  const formatted = leadGenerationMode.getFormattedPosts();
  
  res.json({
    count: posts.length,
    posts,
    formatted
  });
});

/**
 * GET /api/lead-gen/scripts
 * Get all outreach scripts
 */
router.get('/scripts', (req: Request, res: Response) => {
  const scripts = leadGenerationMode.getOutreachScripts();
  const formatted = leadGenerationMode.getFormattedScripts();
  
  res.json({
    count: scripts.length,
    scripts,
    formatted
  });
});

/**
 * POST /api/lead-gen/post/:postId/publish
 * Mark a post as published
 */
router.post('/post/:postId/publish', (req: Request, res: Response) => {
  const { postId } = req.params;
  const post = leadGenerationMode.markPostPublished(postId);
  
  if (!post) {
    return res.status(404).json({
      error: 'POST_NOT_FOUND',
      message: `Post ${postId} not found`
    });
  }
  
  res.json({
    success: true,
    message: `Post ${postId} marked as POSTED`,
    post
  });
});

/**
 * POST /api/lead-gen/dm/sent
 * Record DM sent
 */
router.post('/dm/sent', (req: Request, res: Response) => {
  const { scriptId } = req.body;
  leadGenerationMode.recordDMSent(scriptId);
  
  res.json({
    success: true,
    message: `DM sent recorded for ${scriptId}`
  });
});

/**
 * POST /api/lead-gen/dm/reply
 * Record DM reply
 */
router.post('/dm/reply', (req: Request, res: Response) => {
  const { scriptId } = req.body;
  leadGenerationMode.recordDMReply(scriptId);
  
  res.json({
    success: true,
    message: `DM reply recorded for ${scriptId}`
  });
});

/**
 * POST /api/lead-gen/lead
 * Record new lead
 */
router.post('/lead', (req: Request, res: Response) => {
  const { qualified } = req.body;
  leadGenerationMode.recordLead(qualified === true);
  
  const campaign = leadGenerationMode.getStatus();
  
  res.json({
    success: true,
    message: qualified ? 'Qualified lead recorded' : 'Lead recorded',
    metrics: campaign?.metrics
  });
});

/**
 * GET /api/lead-gen/dashboard
 * Get full dashboard
 */
router.get('/dashboard', (req: Request, res: Response) => {
  const campaign = leadGenerationMode.getStatus();
  
  if (!campaign) {
    return res.json({
      active: false,
      message: 'No campaign active'
    });
  }
  
  const posts = leadGenerationMode.getLinkedInPosts();
  const scripts = leadGenerationMode.getOutreachScripts();
  
  res.json({
    phase: 'GENESIS',
    objective: campaign.objective,
    narrative: campaign.narrative,
    hook: campaign.hook,
    leadMagnet: campaign.leadMagnet,
    metrics: campaign.metrics,
    progress: {
      leadsGenerated: campaign.metrics.leadsGenerated,
      leadsQualified: campaign.metrics.leadsQualified,
      target: campaign.targetLeads,
      percentComplete: Math.round((campaign.metrics.leadsQualified / campaign.targetLeads) * 100)
    },
    assets: {
      posts: posts.length,
      postsPublished: posts.filter(p => p.status === 'POSTED').length,
      scripts: scripts.length,
      dmsSent: campaign.metrics.dmsSent,
      dmsReplied: campaign.metrics.dmsReplied
    }
  });
});

export default router;
