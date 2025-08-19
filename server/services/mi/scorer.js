export const MiScorer = {
  score(raw, cfg) {
    const kw = new Set((cfg.keywords || []).map(s => s.toLowerCase()));
    const th = cfg.priority_threshold ?? 0.6;
    const boosts = cfg.boosts || {};

    console.log(`Scoring ${raw.length} signals with ${kw.size} keywords`);

    return raw.map(r => {
      const text = `${r.title} ${r.snippet ?? ""}`.toLowerCase();
      
      // Base priority by signal type
      let priority =
        r.kind === "regulatory" ? 0.55 :
        r.kind === "competitive" ? 0.45 :
        r.kind === "market" ? 0.4 : 0.35;

      // Keyword matching boost
      let keywordMatches = 0;
      for (const k of kw) {
        if (text.includes(k)) { 
          keywordMatches++;
          priority += 0.05; 
        }
      }

      // Severity terms boost (e.g., "warning letter" gets higher priority)
      if (boosts.severity_terms) {
        for (const [term, boost] of Object.entries(boosts.severity_terms)) {
          if (text.includes(term.toLowerCase())) {
            priority += Number(boost);
          }
        }
      }

      // Domain-specific boosting (e.g., fda.gov gets higher priority)
      if (r.source && boosts.domains) {
        for (const [domain, boost] of Object.entries(boosts.domains)) {
          if (r.source.includes(domain)) {
            priority += Number(boost);
          }
        }
      }

      // Cap at 1.0
      priority = Math.min(1.0, priority);
      
      const category = r.kind || "market";
      const assigned_to = (cfg.auto_assign || {})[category] || "COO";
      const high_priority = priority >= th;

      return { 
        ...r, 
        category, 
        priority, 
        assigned_to, 
        high_priority,
        keyword_matches: keywordMatches,
        impact: priority >= 0.8 ? 'high' : priority >= 0.6 ? 'medium' : 'low',
        urgency: high_priority ? 'immediate' : priority >= 0.5 ? 'near-term' : 'long-term'
      };
    });
  }
};