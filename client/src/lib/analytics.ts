// Google Analytics 4 Integration for External Self-Learning Verification
// This enables real external system tracking to prove learning behavior changes

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
  
  console.log('🔍 GA4 Analytics initialized for self-learning verification');
};

// Track A/B test events - THIS IS THE KEY FOR EXTERNAL VERIFICATION
export const trackLearningEvent = (
  eventName: string,
  strategy: string,
  outcome: 'success' | 'failure',
  confidence: number,
  agent: string
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  // Send event to GA4 - This creates VERIFIABLE external data
  window.gtag('event', eventName, {
    event_category: 'ai_learning',
    event_label: strategy,
    custom_parameter_1: outcome,
    custom_parameter_2: confidence,
    custom_parameter_3: agent,
    value: confidence
  });
  
  console.log(`📊 GA4 Event Tracked: ${agent} → ${strategy} → ${outcome} (${confidence}% confidence)`);
};

// Track strategy recommendations - Shows learning system behavior changes
export const trackStrategySelection = (
  agent: string,
  selectedStrategy: string,
  expectedImpact: number,
  alternatives: string[]
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'strategy_selection', {
    event_category: 'ai_strategy',
    event_label: selectedStrategy,
    custom_parameter_1: agent,
    custom_parameter_2: expectedImpact,
    custom_parameter_3: alternatives.join(','),
    value: expectedImpact
  });
  
  console.log(`🎯 GA4 Strategy Selection: ${agent} chose ${selectedStrategy} (${expectedImpact}% impact)`);
};

// Track traffic allocation changes - Proves A/B test shifting
export const trackTrafficAllocation = (
  testName: string,
  variantA: string,
  variantB: string,
  allocationA: number,
  allocationB: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'traffic_allocation', {
    event_category: 'ab_testing',
    event_label: testName,
    custom_parameter_1: `${variantA}:${allocationA}%`,
    custom_parameter_2: `${variantB}:${allocationB}%`,
    value: Math.abs(allocationA - allocationB) // Difference shows learning
  });
  
  console.log(`🔀 GA4 Traffic Shift: ${testName} → A:${allocationA}% B:${allocationB}%`);
};

// Standard page view tracking
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Generic event tracking
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};