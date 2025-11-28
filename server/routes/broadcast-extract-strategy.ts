/**
 * BROADCAST & EXTRACT STRATEGY API ROUTES
 */

import { Router, Request, Response } from 'express';
import { broadcastExtractStrategy } from '../services/broadcast-extract-strategy';

const router = Router();

/**
 * POST /api/broadcast/activate
 * Activate Broadcast & Extract Campaign
 */
router.post('/activate', (req: Request, res: Response) => {
  const campaign = broadcastExtractStrategy.initializeCampaign();
  
  res.json({
    success: true,
    message: 'BROADCAST & EXTRACT STRATEGY ACTIVATED',
    campaign
  });
});

/**
 * GET /api/broadcast/status
 * Get campaign status
 */
router.get('/status', (req: Request, res: Response) => {
  const campaign = broadcastExtractStrategy.getStatus();
  
  if (!campaign) {
    return res.json({
      active: false,
      message: 'No broadcast campaign active'
    });
  }
  
  res.json({ active: true, campaign });
});

/**
 * GET /api/broadcast/email
 * Get Spear Email content
 */
router.get('/email', (req: Request, res: Response) => {
  const email = broadcastExtractStrategy.getSpearEmail();
  res.json({ email });
});

/**
 * GET /api/broadcast/groups
 * Get Trojan Horse posts
 */
router.get('/groups', (req: Request, res: Response) => {
  const posts = broadcastExtractStrategy.getTrojanHorsePosts();
  res.json({ count: posts.length, posts });
});

/**
 * POST /api/broadcast/execute
 * Start execution
 */
router.post('/execute', (req: Request, res: Response) => {
  broadcastExtractStrategy.startExecution();
  res.json({ success: true, message: 'Execution started' });
});

/**
 * POST /api/broadcast/email/sent
 * Record email blast sent
 */
router.post('/email/sent', (req: Request, res: Response) => {
  const { count } = req.body;
  broadcastExtractStrategy.recordEmailSent(count || 900);
  res.json({ success: true, message: 'Email blast recorded' });
});

/**
 * POST /api/broadcast/email/reply
 * Record email reply
 */
router.post('/email/reply', (req: Request, res: Response) => {
  broadcastExtractStrategy.recordEmailReply();
  const dashboard = broadcastExtractStrategy.getDashboard();
  res.json({ 
    success: true, 
    totalReplies: dashboard.conversions.emailReplies,
    totalLeads: dashboard.conversions.totalLeads
  });
});

/**
 * POST /api/broadcast/group/posted
 * Record group post
 */
router.post('/group/posted', (req: Request, res: Response) => {
  const { postId } = req.body;
  broadcastExtractStrategy.recordGroupPost(postId);
  res.json({ success: true });
});

/**
 * POST /api/broadcast/group/comment
 * Record group comment
 */
router.post('/group/comment', (req: Request, res: Response) => {
  const { postId } = req.body;
  broadcastExtractStrategy.recordGroupComment(postId);
  res.json({ success: true });
});

/**
 * POST /api/broadcast/group/dm
 * Record DM triggered from group
 */
router.post('/group/dm', (req: Request, res: Response) => {
  const { postId } = req.body;
  broadcastExtractStrategy.recordDMTriggered(postId);
  res.json({ success: true });
});

/**
 * POST /api/broadcast/lead
 * Record lead generated
 */
router.post('/lead', (req: Request, res: Response) => {
  broadcastExtractStrategy.recordLead();
  const dashboard = broadcastExtractStrategy.getDashboard();
  res.json({ 
    success: true, 
    totalLeads: dashboard.conversions.totalLeads 
  });
});

/**
 * GET /api/broadcast/dashboard
 * Get execution dashboard
 */
router.get('/dashboard', (req: Request, res: Response) => {
  const dashboard = broadcastExtractStrategy.getDashboard();
  res.json(dashboard);
});

export default router;
