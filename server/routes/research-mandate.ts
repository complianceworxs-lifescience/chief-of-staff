import { Router, Request, Response } from 'express';
import { researchMandate } from '../services/research-mandate';

const router = Router();

router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await researchMandate.getStatus();
    res.json({
      success: true,
      data: {
        version: status.version,
        overallStatus: status.overallStatus,
        lastExecution: status.lastExecution,
        questions: status.questions.map(q => ({
          id: q.id,
          title: q.title,
          status: q.status,
          confidence: q.confidence,
          lastUpdated: q.lastUpdated
        })),
        completedCount: status.questions.filter(q => q.status === 'completed').length,
        totalQuestions: status.questions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get status'
    });
  }
});

router.get('/questions', async (req: Request, res: Response) => {
  try {
    const status = await researchMandate.getStatus();
    res.json({
      success: true,
      data: status.questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get questions'
    });
  }
});

router.get('/questions/:questionId', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const status = await researchMandate.getStatus();
    const question = status.questions.find(q => q.id === questionId);
    
    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }
    
    res.json({
      success: true,
      data: {
        ...question,
        findings: question.findings ? JSON.parse(question.findings) : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get question'
    });
  }
});

router.post('/execute/:questionId', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    console.log(`🔬 RESEARCH MANDATE: Manual execution requested for ${questionId}`);
    
    const result = await researchMandate.executeResearchQuestion(questionId);
    
    res.json({
      success: true,
      data: {
        id: result.id,
        title: result.title,
        status: result.status,
        confidence: result.confidence,
        findings: result.findings ? JSON.parse(result.findings) : null,
        lastUpdated: result.lastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to execute research question'
    });
  }
});

router.post('/execute-all', async (req: Request, res: Response) => {
  try {
    console.log('🔬 RESEARCH MANDATE: Full execution initiated');
    
    res.json({
      success: true,
      message: 'Research mandate execution started',
      status: 'in_progress'
    });

    researchMandate.executeAllQuestions()
      .then(state => {
        console.log(`🔬 RESEARCH MANDATE: Completed with status ${state.overallStatus}`);
      })
      .catch(error => {
        console.error('🔬 RESEARCH MANDATE: Execution failed:', error);
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start research mandate'
    });
  }
});

router.get('/insights', async (req: Request, res: Response) => {
  try {
    const insights = await researchMandate.getSynthesizedInsights();
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get insights'
    });
  }
});

router.get('/executive-report', async (req: Request, res: Response) => {
  try {
    const report = await researchMandate.generateExecutiveReport();
    res.json({
      success: true,
      data: {
        report,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate report'
    });
  }
});

router.get('/execution-log', async (req: Request, res: Response) => {
  try {
    const status = await researchMandate.getStatus();
    res.json({
      success: true,
      data: status.executionLog.slice(-20)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get execution log'
    });
  }
});

export default router;
