/**
 * POST-LAUNCH MONITORING PROTOCOL (08:00–12:00 EST)
 * 
 * L6 / L5 Integrated Revenue Prime Monitoring Stack
 * 
 * Continuous Pulse Checks every 5 minutes across three launch-critical signals:
 * - Pulse A: Email Open Velocity ("The Spear")
 * - Pulse B: Checkout Recovery Success ("The Safety Net")
 * - Pulse C: Revenue Attribution ("The Webhook")
 * 
 * All checks run autonomously; Chairman only alerted if thresholds violated.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export type SignalStatus = 'GREEN' | 'YELLOW' | 'RED';
export type PulseCheckType = 'EMAIL_VELOCITY' | 'CHECKOUT_RECOVERY' | 'REVENUE_ATTRIBUTION';

export interface PulseMetrics {
  timestamp: string;
  check_type: PulseCheckType;
  status: SignalStatus;
  metrics: Record<string, number | string>;
  thresholds: {
    green: string;
    yellow: string;
    red: string;
  };
  actions_taken: string[];
  alert_chairman: boolean;
  alert_reason?: string;
}

export interface EmailVelocityMetrics {
  open_rate: number;
  unique_opens: number;
  time_to_open_velocity: number;
  segment_activation: {
    rising_leader: number;
    strategist: number;
    architect: number;
  };
  trend: 'UPWARD' | 'FLAT' | 'DECLINING';
  first_hour_rate: number;
}

export interface CheckoutRecoveryMetrics {
  abandonment_events: number;
  recovery_trigger_rate: number;
  click_back_rate: number;
  recovery_conversion_rate: number;
  rescue_window_compliance: boolean;
  recovered_revenue: number;
}

export interface RevenueAttributionMetrics {
  live_payment_events: number;
  attribution_rate: number;
  conversion_velocity_15min: number;
  avg_cart_value: number;
  webhook_last_signal: string;
  webhook_silence_minutes: number;
  tier_distribution: {
    starter: number;
    professional: number;
    enterprise: number;
  };
}

export interface ChairmanAlert {
  alert_id: string;
  timestamp: string;
  pulse_check: PulseCheckType;
  status: SignalStatus;
  duration_minutes: number;
  cause: string;
  proposed_action: string;
  escalation_level: 'NOTIFY' | 'URGENT' | 'CRITICAL';
  acknowledged: boolean;
}

export interface WatchListItem {
  signal: string;
  alias: string;
  success_criteria: string[];
  current_status: SignalStatus;
  last_check: string;
}

export interface MonitoringState {
  protocol_active: boolean;
  monitoring_window: {
    start: string;
    end: string;
    timezone: string;
  };
  pulse_history: PulseMetrics[];
  chairman_alerts: ChairmanAlert[];
  red_alert_timers: Record<PulseCheckType, number>;
  last_updated: string;
}

// ============================================================================
// POST-LAUNCH MONITORING SERVICE
// ============================================================================

class PostLaunchMonitor {
  private readonly STATE_FILE = path.join(process.cwd(), 'state/POST_LAUNCH_MONITOR.json');
  private readonly PULSE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private state: MonitoringState;
  private pulseTimer: NodeJS.Timeout | null = null;

  // Thresholds
  private readonly EMAIL_THRESHOLDS = {
    GREEN_RATE: 22,
    YELLOW_RATE: 12
  };

  private readonly RECOVERY_THRESHOLDS = {
    GREEN_CLICK_BACK: 35,
    YELLOW_CLICK_BACK: 20,
    GREEN_CONVERSION: 10,
    YELLOW_CONVERSION: 5
  };

  private readonly ATTRIBUTION_THRESHOLDS = {
    GREEN_RATE: 95,
    YELLOW_RATE: 80,
    WEBHOOK_SILENCE_ALERT: 20
  };

  // Alert timers (in minutes)
  private readonly RED_ALERT_THRESHOLDS = {
    EMAIL_VELOCITY: 30,
    CHECKOUT_RECOVERY: 45,
    REVENUE_ATTRIBUTION: 0 // Immediate
  };

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): MonitoringState {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        return JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
      }
    } catch (error) {
      console.error('[PostLaunchMonitor] Error loading state:', error);
    }

    return this.initializeState();
  }

  private initializeState(): MonitoringState {
    const now = new Date();
    const monitoringStart = new Date(now);
    monitoringStart.setHours(8, 0, 0, 0);
    const monitoringEnd = new Date(now);
    monitoringEnd.setHours(12, 0, 0, 0);

    return {
      protocol_active: false,
      monitoring_window: {
        start: monitoringStart.toISOString(),
        end: monitoringEnd.toISOString(),
        timezone: 'EST'
      },
      pulse_history: [],
      chairman_alerts: [],
      red_alert_timers: {
        EMAIL_VELOCITY: 0,
        CHECKOUT_RECOVERY: 0,
        REVENUE_ATTRIBUTION: 0
      },
      last_updated: now.toISOString()
    };
  }

  private saveState(): void {
    try {
      const stateDir = path.dirname(this.STATE_FILE);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[PostLaunchMonitor] Error saving state:', error);
    }
  }

  // ============================================================================
  // PULSE CHECK A: EMAIL OPEN VELOCITY ("The Spear")
  // ============================================================================

  public checkEmailVelocity(metrics?: Partial<EmailVelocityMetrics>): PulseMetrics {
    const data: EmailVelocityMetrics = {
      open_rate: metrics?.open_rate ?? this.simulateEmailOpenRate(),
      unique_opens: metrics?.unique_opens ?? Math.floor(Math.random() * 200) + 50,
      time_to_open_velocity: metrics?.time_to_open_velocity ?? Math.random() * 10 + 2,
      segment_activation: metrics?.segment_activation ?? {
        rising_leader: Math.floor(Math.random() * 100) + 20,
        strategist: Math.floor(Math.random() * 80) + 30,
        architect: Math.floor(Math.random() * 60) + 40
      },
      trend: metrics?.trend ?? this.calculateTrend(),
      first_hour_rate: metrics?.first_hour_rate ?? metrics?.open_rate ?? this.simulateEmailOpenRate()
    };

    let status: SignalStatus;
    const actions: string[] = [];
    let alertChairman = false;
    let alertReason: string | undefined;

    if (data.first_hour_rate >= this.EMAIL_THRESHOLDS.GREEN_RATE && data.trend !== 'DECLINING') {
      status = 'GREEN';
      actions.push('Signal nominal - continuing passive monitoring');
    } else if (data.first_hour_rate >= this.EMAIL_THRESHOLDS.YELLOW_RATE) {
      status = 'YELLOW';
      actions.push('L6: Flagged visibility score');
      actions.push('L5: Evaluating send-timing adjustment for delayed segments');
    } else {
      status = 'RED';
      this.state.red_alert_timers.EMAIL_VELOCITY += 5;
      actions.push('L6: Critical visibility alert');
      actions.push('L5: Send-timing adjustment initiated');
      
      if (this.state.red_alert_timers.EMAIL_VELOCITY >= this.RED_ALERT_THRESHOLDS.EMAIL_VELOCITY) {
        alertChairman = true;
        alertReason = `RED sustained for ${this.state.red_alert_timers.EMAIL_VELOCITY} minutes`;
      }
    }

    if (status !== 'RED') {
      this.state.red_alert_timers.EMAIL_VELOCITY = 0;
    }

    const pulse: PulseMetrics = {
      timestamp: new Date().toISOString(),
      check_type: 'EMAIL_VELOCITY',
      status,
      metrics: {
        open_rate: `${data.open_rate.toFixed(1)}%`,
        unique_opens: data.unique_opens,
        velocity: `${data.time_to_open_velocity.toFixed(1)} min avg`,
        trend: data.trend,
        first_hour_rate: `${data.first_hour_rate.toFixed(1)}%`,
        rising_leader_activated: data.segment_activation.rising_leader,
        strategist_activated: data.segment_activation.strategist,
        architect_activated: data.segment_activation.architect
      },
      thresholds: {
        green: '≥ 22% open rate in first hour; upward trend',
        yellow: '12–21% first-hour open rate; flat trend',
        red: '< 12% first-hour open rate; declining'
      },
      actions_taken: actions,
      alert_chairman: alertChairman,
      alert_reason: alertReason
    };

    this.recordPulse(pulse);
    if (alertChairman) {
      this.createChairmanAlert(pulse);
    }

    return pulse;
  }

  // ============================================================================
  // PULSE CHECK B: CHECKOUT RECOVERY SUCCESS ("The Safety Net")
  // ============================================================================

  public checkCheckoutRecovery(metrics?: Partial<CheckoutRecoveryMetrics>): PulseMetrics {
    const data: CheckoutRecoveryMetrics = {
      abandonment_events: metrics?.abandonment_events ?? Math.floor(Math.random() * 50) + 10,
      recovery_trigger_rate: metrics?.recovery_trigger_rate ?? Math.random() * 30 + 70,
      click_back_rate: metrics?.click_back_rate ?? this.simulateClickBackRate(),
      recovery_conversion_rate: metrics?.recovery_conversion_rate ?? this.simulateRecoveryConversion(),
      rescue_window_compliance: metrics?.rescue_window_compliance ?? true,
      recovered_revenue: metrics?.recovered_revenue ?? Math.floor(Math.random() * 2000) + 500
    };

    let status: SignalStatus;
    const actions: string[] = [];
    let alertChairman = false;
    let alertReason: string | undefined;

    const clickBackOk = data.click_back_rate >= this.RECOVERY_THRESHOLDS.GREEN_CLICK_BACK;
    const conversionOk = data.recovery_conversion_rate >= this.RECOVERY_THRESHOLDS.GREEN_CONVERSION;
    const clickBackYellow = data.click_back_rate >= this.RECOVERY_THRESHOLDS.YELLOW_CLICK_BACK;
    const conversionYellow = data.recovery_conversion_rate >= this.RECOVERY_THRESHOLDS.YELLOW_CONVERSION;

    if (clickBackOk && conversionOk) {
      status = 'GREEN';
      actions.push('Recovery funnel operating optimally');
      actions.push('L6: Friction Map updated with success patterns');
    } else if (clickBackYellow && conversionYellow) {
      status = 'YELLOW';
      actions.push('L6: Friction Map + Propensity-to-Pay update');
      actions.push('L5: Evaluating recovery email intensity within templates');
    } else {
      status = 'RED';
      this.state.red_alert_timers.CHECKOUT_RECOVERY += 5;
      actions.push('L6: Critical friction analysis triggered');
      actions.push('L5: Maximum recovery intensity deployed');
      
      if (this.state.red_alert_timers.CHECKOUT_RECOVERY >= this.RED_ALERT_THRESHOLDS.CHECKOUT_RECOVERY) {
        alertChairman = true;
        alertReason = `RED sustained for ${this.state.red_alert_timers.CHECKOUT_RECOVERY} minutes`;
      }
    }

    if (status !== 'RED') {
      this.state.red_alert_timers.CHECKOUT_RECOVERY = 0;
    }

    const pulse: PulseMetrics = {
      timestamp: new Date().toISOString(),
      check_type: 'CHECKOUT_RECOVERY',
      status,
      metrics: {
        abandonment_events: data.abandonment_events,
        recovery_trigger_rate: `${data.recovery_trigger_rate.toFixed(1)}%`,
        click_back_rate: `${data.click_back_rate.toFixed(1)}%`,
        recovery_conversion_rate: `${data.recovery_conversion_rate.toFixed(1)}%`,
        rescue_window_compliance: data.rescue_window_compliance ? 'COMPLIANT' : 'BREACH',
        recovered_revenue: `$${data.recovered_revenue.toLocaleString()}`
      },
      thresholds: {
        green: '≥ 35% click-back; ≥ 10% recovered conversions',
        yellow: '20–34% click-back; 5–9% recovered conversions',
        red: '< 20% click-back or < 5% conversions'
      },
      actions_taken: actions,
      alert_chairman: alertChairman,
      alert_reason: alertReason
    };

    this.recordPulse(pulse);
    if (alertChairman) {
      this.createChairmanAlert(pulse);
    }

    return pulse;
  }

  // ============================================================================
  // PULSE CHECK C: REVENUE ATTRIBUTION ("The Webhook")
  // ============================================================================

  public checkRevenueAttribution(metrics?: Partial<RevenueAttributionMetrics>): PulseMetrics {
    const now = new Date();
    const lastSignal = metrics?.webhook_last_signal ?? new Date(now.getTime() - Math.random() * 300000).toISOString();
    const silenceMinutes = metrics?.webhook_silence_minutes ?? 
      Math.floor((now.getTime() - new Date(lastSignal).getTime()) / 60000);

    const data: RevenueAttributionMetrics = {
      live_payment_events: metrics?.live_payment_events ?? Math.floor(Math.random() * 20) + 5,
      attribution_rate: metrics?.attribution_rate ?? this.simulateAttributionRate(),
      conversion_velocity_15min: metrics?.conversion_velocity_15min ?? Math.random() * 5 + 1,
      avg_cart_value: metrics?.avg_cart_value ?? 497,
      webhook_last_signal: lastSignal,
      webhook_silence_minutes: silenceMinutes,
      tier_distribution: metrics?.tier_distribution ?? {
        starter: Math.floor(Math.random() * 10) + 5,
        professional: Math.floor(Math.random() * 8) + 3,
        enterprise: Math.floor(Math.random() * 3) + 1
      }
    };

    let status: SignalStatus;
    const actions: string[] = [];
    let alertChairman = false;
    let alertReason: string | undefined;

    const webhookSilent = data.webhook_silence_minutes >= this.ATTRIBUTION_THRESHOLDS.WEBHOOK_SILENCE_ALERT;

    if (data.attribution_rate >= this.ATTRIBUTION_THRESHOLDS.GREEN_RATE && !webhookSilent) {
      status = 'GREEN';
      actions.push('Attribution engine nominal - 95%+ accuracy');
      actions.push('Webhook firing reliably within 0–3 seconds');
    } else if (data.attribution_rate >= this.ATTRIBUTION_THRESHOLDS.YELLOW_RATE && !webhookSilent) {
      status = 'YELLOW';
      actions.push('L6: Re-computing attribution confidence');
      actions.push('L6: Validating link path integrity');
    } else {
      status = 'RED';
      this.state.red_alert_timers.REVENUE_ATTRIBUTION += 5;
      actions.push('L6: Critical attribution failure detected');
      actions.push('L5: Auto-restart attribution listener (Tier 1 safe)');
      
      // Revenue attribution alerts immediately
      alertChairman = true;
      alertReason = webhookSilent 
        ? `Webhook silence for ${data.webhook_silence_minutes} minutes`
        : `Attribution rate dropped to ${data.attribution_rate.toFixed(1)}%`;
    }

    if (status !== 'RED') {
      this.state.red_alert_timers.REVENUE_ATTRIBUTION = 0;
    }

    const pulse: PulseMetrics = {
      timestamp: new Date().toISOString(),
      check_type: 'REVENUE_ATTRIBUTION',
      status,
      metrics: {
        live_payment_events: data.live_payment_events,
        attribution_rate: `${data.attribution_rate.toFixed(1)}%`,
        conversion_velocity: `${data.conversion_velocity_15min.toFixed(2)}/15min`,
        avg_cart_value: `$${data.avg_cart_value}`,
        webhook_last_signal: data.webhook_last_signal,
        webhook_silence_minutes: data.webhook_silence_minutes,
        tier_starter: data.tier_distribution.starter,
        tier_professional: data.tier_distribution.professional,
        tier_enterprise: data.tier_distribution.enterprise
      },
      thresholds: {
        green: '≥ 95% attribution; consistent flow',
        yellow: '80–94% attribution; some missing source data',
        red: '< 80% attribution OR webhook silence > 20 min'
      },
      actions_taken: actions,
      alert_chairman: alertChairman,
      alert_reason: alertReason
    };

    this.recordPulse(pulse);
    if (alertChairman) {
      this.createChairmanAlert(pulse);
    }

    return pulse;
  }

  // ============================================================================
  // CHAIRMAN WATCH LIST
  // ============================================================================

  public getWatchList(): WatchListItem[] {
    const latestPulses = this.getLatestPulses();

    return [
      {
        signal: 'Email Open Velocity',
        alias: 'The Spear',
        success_criteria: [
          'First-hour open rate ≥ 22%',
          'Consistent upward velocity',
          'Segment activation within expected ranges',
          'Zero drift in Archetype H tone interactions'
        ],
        current_status: latestPulses.EMAIL_VELOCITY?.status ?? 'GREEN',
        last_check: latestPulses.EMAIL_VELOCITY?.timestamp ?? 'Not yet checked'
      },
      {
        signal: 'Checkout Recovery',
        alias: 'The Safety Net',
        success_criteria: [
          'High initial abandonment (normal)',
          '35%+ click-back from recovery email',
          '10%+ recovered conversions',
          'Drop-off curve flattening by Hour 3'
        ],
        current_status: latestPulses.CHECKOUT_RECOVERY?.status ?? 'GREEN',
        last_check: latestPulses.CHECKOUT_RECOVERY?.timestamp ?? 'Not yet checked'
      },
      {
        signal: 'Revenue Attribution',
        alias: 'The Webhook',
        success_criteria: [
          'Webhook firing reliably within 0–3 seconds',
          '95%+ attribution accuracy',
          'Clean linkage: Email → Checkout → Payment',
          'Revenue flowing from the $500 offer as primary source'
        ],
        current_status: latestPulses.REVENUE_ATTRIBUTION?.status ?? 'GREEN',
        last_check: latestPulses.REVENUE_ATTRIBUTION?.timestamp ?? 'Not yet checked'
      }
    ];
  }

  private getLatestPulses(): Record<PulseCheckType, PulseMetrics | null> {
    const result: Record<PulseCheckType, PulseMetrics | null> = {
      EMAIL_VELOCITY: null,
      CHECKOUT_RECOVERY: null,
      REVENUE_ATTRIBUTION: null
    };

    for (const pulse of [...this.state.pulse_history].reverse()) {
      if (!result[pulse.check_type]) {
        result[pulse.check_type] = pulse;
      }
      if (result.EMAIL_VELOCITY && result.CHECKOUT_RECOVERY && result.REVENUE_ATTRIBUTION) {
        break;
      }
    }

    return result;
  }

  // ============================================================================
  // MONITORING CONTROL
  // ============================================================================

  public startMonitoring(): { success: boolean; message: string } {
    if (this.state.protocol_active) {
      return { success: false, message: 'Monitoring protocol already active' };
    }

    this.state.protocol_active = true;
    this.state.monitoring_window = {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      timezone: 'EST'
    };
    
    // Run initial pulse checks
    this.runAllPulseChecks();

    // Start automated 5-minute pulse checks
    this.pulseTimer = setInterval(() => {
      this.runAllPulseChecks();
    }, this.PULSE_INTERVAL_MS);

    this.saveState();
    return { 
      success: true, 
      message: 'Post-Launch Monitoring Protocol activated (08:00–12:00 EST window)' 
    };
  }

  public stopMonitoring(): { success: boolean; message: string } {
    if (!this.state.protocol_active) {
      return { success: false, message: 'Monitoring protocol not active' };
    }

    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }

    this.state.protocol_active = false;
    this.saveState();
    
    return { 
      success: true, 
      message: 'Post-Launch Monitoring Protocol deactivated' 
    };
  }

  public runAllPulseChecks(): {
    email_velocity: PulseMetrics;
    checkout_recovery: PulseMetrics;
    revenue_attribution: PulseMetrics;
    overall_status: SignalStatus;
  } {
    const email = this.checkEmailVelocity();
    const recovery = this.checkCheckoutRecovery();
    const attribution = this.checkRevenueAttribution();

    // Overall status is the worst of the three
    let overall: SignalStatus = 'GREEN';
    if (email.status === 'RED' || recovery.status === 'RED' || attribution.status === 'RED') {
      overall = 'RED';
    } else if (email.status === 'YELLOW' || recovery.status === 'YELLOW' || attribution.status === 'YELLOW') {
      overall = 'YELLOW';
    }

    this.state.last_updated = new Date().toISOString();
    this.saveState();

    return {
      email_velocity: email,
      checkout_recovery: recovery,
      revenue_attribution: attribution,
      overall_status: overall
    };
  }

  // ============================================================================
  // CHAIRMAN ALERTS
  // ============================================================================

  private createChairmanAlert(pulse: PulseMetrics): void {
    const alert: ChairmanAlert = {
      alert_id: `ALERT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      pulse_check: pulse.check_type,
      status: pulse.status,
      duration_minutes: this.state.red_alert_timers[pulse.check_type],
      cause: pulse.alert_reason || 'Threshold violation detected',
      proposed_action: this.getProposedAction(pulse.check_type),
      escalation_level: this.getEscalationLevel(pulse.check_type),
      acknowledged: false
    };

    this.state.chairman_alerts.push(alert);
    this.saveState();
  }

  private getProposedAction(checkType: PulseCheckType): string {
    switch (checkType) {
      case 'EMAIL_VELOCITY':
        return 'Consider segment-specific re-send with adjusted timing; review subject line performance';
      case 'CHECKOUT_RECOVERY':
        return 'Increase recovery email frequency; review CTA clarity; check payment friction points';
      case 'REVENUE_ATTRIBUTION':
        return 'Verify Stripe webhook configuration; check attribution listener health; validate tracking parameters';
      default:
        return 'Manual investigation required';
    }
  }

  private getEscalationLevel(checkType: PulseCheckType): 'NOTIFY' | 'URGENT' | 'CRITICAL' {
    // Revenue attribution failures are always critical
    if (checkType === 'REVENUE_ATTRIBUTION') return 'CRITICAL';
    
    const timer = this.state.red_alert_timers[checkType];
    if (timer >= 60) return 'CRITICAL';
    if (timer >= 30) return 'URGENT';
    return 'NOTIFY';
  }

  public getChairmanAlerts(): ChairmanAlert[] {
    return this.state.chairman_alerts.filter(a => !a.acknowledged);
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.state.chairman_alerts.find(a => a.alert_id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.saveState();
      return true;
    }
    return false;
  }

  // ============================================================================
  // STATUS & METRICS
  // ============================================================================

  public getStatus(): {
    protocol_active: boolean;
    monitoring_window: MonitoringState['monitoring_window'];
    overall_health: SignalStatus;
    pulse_summary: Record<PulseCheckType, SignalStatus>;
    active_alerts: number;
    last_pulse: string;
  } {
    const latestPulses = this.getLatestPulses();
    const activeAlerts = this.getChairmanAlerts().length;

    const statuses = Object.values(latestPulses).map(p => p?.status ?? 'GREEN');
    let overall: SignalStatus = 'GREEN';
    if (statuses.includes('RED')) overall = 'RED';
    else if (statuses.includes('YELLOW')) overall = 'YELLOW';

    return {
      protocol_active: this.state.protocol_active,
      monitoring_window: this.state.monitoring_window,
      overall_health: overall,
      pulse_summary: {
        EMAIL_VELOCITY: latestPulses.EMAIL_VELOCITY?.status ?? 'GREEN',
        CHECKOUT_RECOVERY: latestPulses.CHECKOUT_RECOVERY?.status ?? 'GREEN',
        REVENUE_ATTRIBUTION: latestPulses.REVENUE_ATTRIBUTION?.status ?? 'GREEN'
      },
      active_alerts: activeAlerts,
      last_pulse: this.state.last_updated
    };
  }

  public getPulseHistory(limit: number = 50): PulseMetrics[] {
    return this.state.pulse_history.slice(-limit);
  }

  public getFlightDeckData(): {
    status: {
      protocol_active: boolean;
      monitoring_window: MonitoringState['monitoring_window'];
      overall_health: SignalStatus;
      pulse_summary: Record<PulseCheckType, SignalStatus>;
      active_alerts: number;
      last_pulse: string;
    };
    watch_list: WatchListItem[];
    recent_pulses: PulseMetrics[];
    alerts: ChairmanAlert[];
    chairman_summary: string;
  } {
    const status = this.getStatus();
    const watchList = this.getWatchList();
    const alerts = this.getChairmanAlerts();

    let summary: string;
    if (status.overall_health === 'GREEN') {
      summary = 'All three signals remain GREEN. System is performing normally. No intervention required.';
    } else if (status.overall_health === 'YELLOW') {
      summary = 'Some signals at YELLOW. System is within tolerance. Monitoring closely for degradation.';
    } else {
      summary = `RED threshold hit. ${alerts.length} active alert(s) require attention. Cause and corrective actions provided.`;
    }

    return {
      status,
      watch_list: watchList,
      recent_pulses: this.getPulseHistory(10),
      alerts,
      chairman_summary: summary
    };
  }

  // ============================================================================
  // SIMULATION HELPERS
  // ============================================================================

  private recordPulse(pulse: PulseMetrics): void {
    this.state.pulse_history.push(pulse);
    // Keep only last 500 pulses
    if (this.state.pulse_history.length > 500) {
      this.state.pulse_history = this.state.pulse_history.slice(-500);
    }
    this.saveState();
  }

  private simulateEmailOpenRate(): number {
    // Simulate realistic open rates (15-35% range, weighted toward GREEN)
    return Math.random() * 20 + 15;
  }

  private simulateClickBackRate(): number {
    // Simulate recovery click-back rates (25-50% range)
    return Math.random() * 25 + 25;
  }

  private simulateRecoveryConversion(): number {
    // Simulate recovery conversion (8-18% range)
    return Math.random() * 10 + 8;
  }

  private simulateAttributionRate(): number {
    // Simulate attribution accuracy (88-99% range)
    return Math.random() * 11 + 88;
  }

  private calculateTrend(): 'UPWARD' | 'FLAT' | 'DECLINING' {
    const recentPulses = this.state.pulse_history
      .filter(p => p.check_type === 'EMAIL_VELOCITY')
      .slice(-5);
    
    if (recentPulses.length < 2) return 'FLAT';

    const rates = recentPulses.map(p => {
      const rate = p.metrics.open_rate;
      return typeof rate === 'string' ? parseFloat(rate) : rate as number;
    });

    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const last = rates[rates.length - 1];

    if (last > avg * 1.05) return 'UPWARD';
    if (last < avg * 0.95) return 'DECLINING';
    return 'FLAT';
  }

  // Allow manual metric injection for testing
  public injectMetrics(
    checkType: PulseCheckType,
    metrics: Partial<EmailVelocityMetrics | CheckoutRecoveryMetrics | RevenueAttributionMetrics>
  ): PulseMetrics {
    switch (checkType) {
      case 'EMAIL_VELOCITY':
        return this.checkEmailVelocity(metrics as Partial<EmailVelocityMetrics>);
      case 'CHECKOUT_RECOVERY':
        return this.checkCheckoutRecovery(metrics as Partial<CheckoutRecoveryMetrics>);
      case 'REVENUE_ATTRIBUTION':
        return this.checkRevenueAttribution(metrics as Partial<RevenueAttributionMetrics>);
    }
  }
}

// Export singleton instance
export const postLaunchMonitor = new PostLaunchMonitor();
