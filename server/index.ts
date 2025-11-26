import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { conflictMonitor } from "./services/conflict-monitor";
import { loadConfig } from "./config-loader";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Load configuration at startup
  const config = loadConfig();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Start autonomous conflict monitoring
    conflictMonitor.startMonitoring(14400000); // Monitor every 4 hours - optimized for 3-4 daily checks
    
    // Start governance job runner for exceptions-only mode
    const { startJobRunner } = await import('./jobRunner.js');
    startJobRunner();
    
    // Start active intervention engine
    import("./services/active-intervention").then(module => {
      module.activeInterventionEngine.start();
      log("Active intervention engine started - Taking preventive actions");
    });
    
    // Start Chief of Staff nightly dashboard cleanup scheduler
    import("./services/chief-of-staff").then(module => {
      module.chiefOfStaff.startNightlyScheduler();
      log("Chief of Staff nightly scheduler started - Dashboard cleanup at 02:15 UTC");
    });
    
    // Auto-activate Advanced Capability Pack v1.0 on startup
    Promise.all([
      import("./services/revenue-predictive-model"),
      import("./services/offer-optimization-engine"),
      import("./services/compliance-intelligence-reports")
    ]).then(([rpm, ooe, cir]) => {
      rpm.revenuePredictiveModel.activate();
      ooe.offerOptimizationEngine.activate();
      cir.complianceIntelligenceReports.activate();
      ooe.offerOptimizationEngine.generateWeeklyReport();
      log("Advanced Capability Pack v1.0 auto-activated - Revenue Model, Offer Engine, Intelligence Reports");
    }).catch(err => {
      console.error("Failed to auto-activate Advanced Capability Pack:", err);
    });
    
    // Integrate Role Cascade Directive v1.0 on startup
    import("./services/role-cascade").then(module => {
      module.roleCascade.integrate();
      log("Role Cascade v1.0 integrated - All roles remapped to active agents");
    }).catch(err => {
      console.error("Failed to integrate Role Cascade:", err);
    });

    // Start Market Intelligence 2-hour collection scheduler
    const MI_COLLECTION_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    
    const collectMarketIntelligence = async () => {
      try {
        console.log("🔍 MI: Starting scheduled market intelligence collection...");
        const response = await fetch(`http://localhost:${port}/api/mi/ingest-and-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ MI: Collected ${result.stats?.total || 0} signals, ${result.stats?.high_priority || 0} high-priority`);
        } else {
          console.error(`❌ MI: Collection failed with status ${response.status}`);
        }
      } catch (error) {
        console.error("❌ MI: Collection error:", error);
      }
    };

    // Run initial collection after 5 minutes (startup delay)
    setTimeout(collectMarketIntelligence, 5 * 60 * 1000);
    
    // Then run every 2 hours
    setInterval(collectMarketIntelligence, MI_COLLECTION_INTERVAL);
    
    log("Market Intelligence scheduler started - Collection every 2 hours");

    // Initialize COO Automation Monitoring with weekly scheduled execution
    const cooAutomationScheduler = async () => {
      try {
        const now = new Date();
        const dayOfWeek = now.getUTCDay(); // 0 = Sunday
        const hour = now.getUTCHours();
        const minute = now.getUTCMinutes();
        
        // Run weekly verification on Sundays at 11:35 UTC (06:35 ET)
        if (dayOfWeek === 0 && hour === 11 && minute >= 35 && minute < 40) {
          console.log("🔧 COO: Running scheduled weekly automation verification");
          
          const { cooAutomationMonitor } = await import('./services/coo-automation-monitor.js');
          const report = await cooAutomationMonitor.generateAutomationStatusReport();
          
          console.log(`🔧 COO Weekly Report: Health ${report.overallHealth}%, Escalations: ${report.escalations.length}`);
          
          if (report.escalations.length > 0) {
            console.log("🚨 COO: Weekly verification found critical issues requiring attention");
          }
        }
      } catch (error) {
        console.error("❌ COO: Scheduled automation verification failed:", error);
      }
    };
    
    // Check COO automation status every 5 minutes for weekly trigger
    setInterval(cooAutomationScheduler, 5 * 60 * 1000);
    
    log("🔧 COO Automation monitoring started - Weekly verification scheduled (Sundays 06:35 ET)");
    
    log("Autonomous conflict monitoring started - No HITL required");
  });
})();
