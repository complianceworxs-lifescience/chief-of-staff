import { Router, Request, Response } from "express";
import { intelligenceToContent } from "../services/intelligence-to-content";

const router = Router();

router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = intelligenceToContent.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error getting intelligence-to-content stats:", error);
    res.status(500).json({ success: false, error: "Failed to get stats" });
  }
});

router.get("/briefs", async (req: Request, res: Response) => {
  try {
    const briefs = intelligenceToContent.getBriefBuffer();
    res.json({
      success: true,
      data: briefs
    });
  } catch (error) {
    console.error("Error getting briefs:", error);
    res.status(500).json({ success: false, error: "Failed to get briefs" });
  }
});

router.get("/briefs/pending", async (req: Request, res: Response) => {
  try {
    const briefs = intelligenceToContent.getPendingBriefs();
    res.json({
      success: true,
      data: briefs
    });
  } catch (error) {
    console.error("Error getting pending briefs:", error);
    res.status(500).json({ success: false, error: "Failed to get pending briefs" });
  }
});

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const newBriefs = await intelligenceToContent.generateBriefsFromIntelligence();
    res.json({
      success: true,
      data: {
        generated: newBriefs.length,
        briefs: newBriefs
      }
    });
  } catch (error) {
    console.error("Error generating briefs:", error);
    res.status(500).json({ success: false, error: "Failed to generate briefs" });
  }
});

router.post("/briefs/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await intelligenceToContent.approveBrief(id);
    
    if (success) {
      res.json({ success: true, message: "Brief approved" });
    } else {
      res.status(404).json({ success: false, error: "Brief not found" });
    }
  } catch (error) {
    console.error("Error approving brief:", error);
    res.status(500).json({ success: false, error: "Failed to approve brief" });
  }
});

router.post("/briefs/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await intelligenceToContent.rejectBrief(id);
    
    if (success) {
      res.json({ success: true, message: "Brief rejected" });
    } else {
      res.status(404).json({ success: false, error: "Brief not found" });
    }
  } catch (error) {
    console.error("Error rejecting brief:", error);
    res.status(500).json({ success: false, error: "Failed to reject brief" });
  }
});

router.get("/next-approved", async (req: Request, res: Response) => {
  try {
    const brief = intelligenceToContent.getNextApprovedBrief();
    res.json({
      success: true,
      data: brief
    });
  } catch (error) {
    console.error("Error getting next approved brief:", error);
    res.status(500).json({ success: false, error: "Failed to get next approved brief" });
  }
});

router.post("/briefs/:id/published", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await intelligenceToContent.markAsPublished(id);
    
    if (success) {
      res.json({ success: true, message: "Brief marked as published" });
    } else {
      res.status(404).json({ success: false, error: "Brief not found" });
    }
  } catch (error) {
    console.error("Error marking brief as published:", error);
    res.status(500).json({ success: false, error: "Failed to mark brief as published" });
  }
});

export default router;
