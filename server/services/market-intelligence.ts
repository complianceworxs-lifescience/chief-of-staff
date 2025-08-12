import { storage } from "../storage";
import { type MarketSignal, type InsertMarketSignal } from "@shared/schema";

interface WebScrapingResult {
  title: string;
  url: string;
  content: string;
  publishDate?: Date;
  source: string;
}

interface SignalDetectionResult {
  significance: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'near-term' | 'long-term';
  category: 'regulatory' | 'competitive' | 'market' | 'technology';
  summary: string;
  actionItems: string[];
}

export class MarketIntelligenceAgent {

  // Web Scraping & API Integration Module
  async scrapeRegulatoryUpdates(): Promise<WebScrapingResult[]> {
    // Simulate regulatory website scraping
    const mockRegulatoryData: WebScrapingResult[] = [
      {
        title: "FDA Issues Draft Guidance on Digital Health Technologies",
        url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/digital-health-technologies",
        content: "The FDA has released new draft guidance for digital health technologies, emphasizing software as medical devices (SaMD) validation requirements for AI/ML-based diagnostic tools.",
        publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        source: "FDA"
      },
      {
        title: "EMA Updates Guidelines for AI in Drug Discovery",
        url: "https://www.ema.europa.eu/en/news/artificial-intelligence-drug-discovery",
        content: "European Medicines Agency publishes updated guidelines for artificial intelligence applications in pharmaceutical research and development.",
        publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        source: "EMA"
      }
    ];
    return mockRegulatoryData;
  }

  async monitorCompetitorActivity(): Promise<WebScrapingResult[]> {
    // Simulate competitor monitoring
    const mockCompetitorData: WebScrapingResult[] = [
      {
        title: "Competitor Launches AI-Powered Compliance Automation Platform",
        url: "https://competitor.com/press-release/ai-compliance-launch",
        content: "Major competitor announces comprehensive AI-powered compliance automation solution targeting financial services and healthcare sectors.",
        publishDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        source: "Competitor Press Release"
      },
      {
        title: "RegTech Startup Raises $50M Series B for Risk Intelligence",
        url: "https://techcrunch.com/regtech-funding-round",
        content: "Emerging RegTech company secures significant funding to expand AI-driven risk intelligence capabilities across multiple industries.",
        publishDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        source: "TechCrunch"
      }
    ];
    return mockCompetitorData;
  }

  async fetchFinancialNewsSignals(): Promise<WebScrapingResult[]> {
    // Simulate financial news API integration
    const mockFinancialData: WebScrapingResult[] = [
      {
        title: "Financial Institutions Increase Spending on Compliance Technology by 40%",
        url: "https://reuters.com/business/finance/compliance-tech-spending",
        content: "Major financial institutions are dramatically increasing their compliance technology budgets as regulatory complexity grows across global markets.",
        publishDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
        source: "Reuters"
      }
    ];
    return mockFinancialData;
  }

  // NLP Summarization Engine
  async summarizeDocument(content: string): Promise<string> {
    // Simulate advanced NLP summarization
    const words = content.split(' ');
    if (words.length <= 50) return content;
    
    // Extract key sentences (simplified NLP simulation)
    const sentences = content.split('. ');
    const keySentences = sentences.slice(0, Math.min(3, sentences.length));
    return keySentences.join('. ') + (sentences.length > 3 ? '...' : '');
  }

  async extractKeyInsights(content: string): Promise<string[]> {
    // Simulate insight extraction
    const insights = [];
    
    if (content.toLowerCase().includes('fda') || content.toLowerCase().includes('regulatory')) {
      insights.push('Regulatory impact on compliance requirements');
    }
    if (content.toLowerCase().includes('ai') || content.toLowerCase().includes('artificial intelligence')) {
      insights.push('AI technology advancement affecting competitive landscape');
    }
    if (content.toLowerCase().includes('funding') || content.toLowerCase().includes('investment')) {
      insights.push('Market funding activity indicating growth opportunities');
    }
    if (content.toLowerCase().includes('compliance') || content.toLowerCase().includes('regtech')) {
      insights.push('Direct competitive threat to ComplianceWorxs offerings');
    }
    
    return insights;
  }

  // Signal Detection & Alerting
  async analyzeSignificance(data: WebScrapingResult): Promise<SignalDetectionResult> {
    const content = data.content.toLowerCase();
    let significance: 'high' | 'medium' | 'low' = 'low';
    let urgency: 'immediate' | 'near-term' | 'long-term' = 'long-term';
    let category: 'regulatory' | 'competitive' | 'market' | 'technology' = 'market';

    // Determine significance
    if (content.includes('fda') || content.includes('ema') || content.includes('guidance')) {
      significance = 'high';
      category = 'regulatory';
      urgency = 'immediate';
    } else if (content.includes('competitor') || content.includes('launch') || content.includes('funding')) {
      significance = 'medium';
      category = 'competitive';
      urgency = 'near-term';
    } else if (content.includes('ai') || content.includes('technology')) {
      significance = 'medium';
      category = 'technology';
      urgency = 'near-term';
    }

    const summary = await this.summarizeDocument(data.content);
    const actionItems = await this.generateActionItems(data, significance);

    return {
      significance,
      urgency,
      category,
      summary,
      actionItems
    };
  }

  async generateActionItems(data: WebScrapingResult, significance: string): Promise<string[]> {
    const actions = [];
    
    if (significance === 'high') {
      actions.push('Alert Chief of Staff immediately for strategic assessment');
      actions.push('Schedule emergency compliance review with COO Agent');
    } else if (significance === 'medium') {
      actions.push('Add to weekly strategic review agenda');
      actions.push('Research competitive implications');
    } else {
      actions.push('Monitor for future developments');
      actions.push('Add to quarterly market analysis');
    }
    
    return actions;
  }

  // Main intelligence gathering workflow
  async gatherMarketIntelligence(): Promise<MarketSignal[]> {
    const signals: InsertMarketSignal[] = [];
    
    try {
      // Gather data from all sources
      const [regulatoryData, competitorData, financialData] = await Promise.all([
        this.scrapeRegulatoryUpdates(),
        this.monitorCompetitorActivity(),
        this.fetchFinancialNewsSignals()
      ]);

      const allData = [...regulatoryData, ...competitorData, ...financialData];

      // Process each data point
      for (const data of allData) {
        const analysis = await this.analyzeSignificance(data);
        const insights = await this.extractKeyInsights(data.content);
        
        const signal: InsertMarketSignal = {
          title: data.title,
          source: data.source,
          sourceUrl: data.url,
          summary: analysis.summary,
          impact: analysis.significance,
          urgency: analysis.urgency,
          category: analysis.category,
          rawData: {
            originalContent: data.content,
            publishDate: data.publishDate,
            insights: insights,
            actionItems: analysis.actionItems
          },
          tags: this.extractTags(data.content),
          analysisNotes: `Automated analysis: ${analysis.significance} impact ${analysis.category} signal`,
          assignedAgent: this.determineAssignedAgent(analysis.category)
        };

        signals.push(signal);
      }

      // Store signals in database
      const savedSignals: MarketSignal[] = [];
      for (const signal of signals) {
        const saved = await storage.createMarketSignal(signal);
        savedSignals.push(saved);
      }

      // Update agent status
      await storage.updateAgent('market-intelligence', {
        status: 'healthy',
        lastActive: new Date(),
        lastReport: `Processed ${savedSignals.length} market signals`,
        successRate: 92,
        strategicAlignment: 88
      });

      return savedSignals;

    } catch (error) {
      console.error('Market intelligence gathering failed:', error);
      
      // Update agent with error status
      await storage.updateAgent('market-intelligence', {
        status: 'error',
        lastActive: new Date(),
        lastReport: 'Failed to gather market intelligence',
        successRate: 85,
        strategicAlignment: 82
      });
      
      throw error;
    }
  }

  private extractTags(content: string): string[] {
    const tags = [];
    const lowercaseContent = content.toLowerCase();
    
    if (lowercaseContent.includes('fda')) tags.push('FDA');
    if (lowercaseContent.includes('ema')) tags.push('EMA');
    if (lowercaseContent.includes('ai') || lowercaseContent.includes('artificial intelligence')) tags.push('AI');
    if (lowercaseContent.includes('compliance')) tags.push('Compliance');
    if (lowercaseContent.includes('regtech')) tags.push('RegTech');
    if (lowercaseContent.includes('funding') || lowercaseContent.includes('investment')) tags.push('Funding');
    if (lowercaseContent.includes('competitor')) tags.push('Competitive');
    
    return tags;
  }

  private determineAssignedAgent(category: string): string {
    switch (category) {
      case 'regulatory':
        return 'coo'; // COO handles compliance and regulatory issues
      case 'competitive':
        return 'cro'; // CRO handles competitive response
      case 'market':
        return 'cmo'; // CMO handles market positioning
      case 'technology':
        return 'ceo'; // CEO handles strategic technology decisions
      default:
        return 'chief-of-staff';
    }
  }

  // Helper methods for the Chief of Staff to access processed intelligence
  async getHighPrioritySignals(): Promise<MarketSignal[]> {
    return await storage.getMarketSignalsByImpact('high');
  }

  async getSignalsByCategory(category: string): Promise<MarketSignal[]> {
    return await storage.getMarketSignalsByCategory(category);
  }

  async markSignalProcessed(signalId: string, actionNotes: string): Promise<void> {
    await storage.updateMarketSignal(signalId, {
      processedAt: new Date(),
      actionTaken: true,
      analysisNotes: actionNotes
    });
  }
}

export const marketIntelligenceAgent = new MarketIntelligenceAgent();