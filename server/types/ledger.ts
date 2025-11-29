export type PersonaType = 'Rising Leader' | 'Validation Strategist' | 'Compliance Architect';
export type ProblemAngle = 'Cost' | 'Speed' | 'Risk' | 'Recognition';
export type MetricFocus = 'Time' | 'Money' | 'Percentage';
export type ToneStyle = 'Provocative' | 'Clinical' | 'Empathetic';
export type CtaType = 'Soft Ask' | 'Hard Audit';
export type VQSBand = '14-28%' | '$18k-$72k' | '15-35%';

export interface PerformanceLedgerHypothesis {
  angle: ProblemAngle;
  metric: MetricFocus;
  tone: ToneStyle;
  cta: CtaType;
}

export interface PerformanceLedgerCompliance {
  doctrineScore: number;
  vqsBand: VQSBand;
  validatorPass: boolean;
}

export interface PerformanceLedgerContent {
  subject: string;
  subjectHash: string;
  bodyHash?: string;
}

export interface PerformanceLedgerOutcomes {
  opens: number;
  clicks: number;
  replies: number;
  positiveReplies: number;
  bookedCalls: number;
  pipelineValueEst: number;
  revenueEst: number;
}

export interface PerformanceLedgerEntry {
  sendId: string;
  campaignId: string;
  variantId?: string;
  persona: PersonaType;
  segment?: string;

  hypothesis: PerformanceLedgerHypothesis;
  compliance: PerformanceLedgerCompliance;
  content: PerformanceLedgerContent;
  outcomes: PerformanceLedgerOutcomes;

  batchId?: string;
  sentAt: Date;
  updatedAt: Date;
}

export interface PerformanceLedgerInsert {
  sendId: string;
  campaignId: string;
  variantId?: string;
  persona: PersonaType;
  segment?: string;
  problemAngle: ProblemAngle;
  metricFocus: MetricFocus;
  toneStyle: ToneStyle;
  ctaType: CtaType;
  doctrineScore: number;
  validatorPass: boolean;
  vqsBand: VQSBand;
  forbiddenFlag?: boolean;
  subjectLine: string;
  subjectHash: string;
  bodyHash?: string;
  batchId?: string;
}

export interface PerformanceLedgerUpdate {
  opens?: number;
  clicks?: number;
  replies?: number;
  positiveReplies?: number;
  bookedCalls?: number;
  pipelineValueEst?: number;
  revenueAttribEst?: number;
}

export function mapDbToEntry(row: any): PerformanceLedgerEntry {
  return {
    sendId: row.send_id,
    campaignId: row.campaign_id,
    variantId: row.variant_id,
    persona: row.persona as PersonaType,
    segment: row.segment,
    hypothesis: {
      angle: row.problem_angle as ProblemAngle,
      metric: row.metric_focus as MetricFocus,
      tone: row.tone_style as ToneStyle,
      cta: row.cta_type as CtaType,
    },
    compliance: {
      doctrineScore: Number(row.doctrine_score),
      vqsBand: row.vqs_band as VQSBand,
      validatorPass: row.validator_pass,
    },
    content: {
      subject: row.subject_line,
      subjectHash: row.subject_hash,
      bodyHash: row.body_hash,
    },
    outcomes: {
      opens: row.opens,
      clicks: row.clicks,
      replies: row.replies,
      positiveReplies: row.positive_replies,
      bookedCalls: row.booked_calls,
      pipelineValueEst: Number(row.pipeline_value_est),
      revenueEst: Number(row.revenue_attrib_est),
    },
    batchId: row.batch_id,
    sentAt: new Date(row.sent_at),
    updatedAt: new Date(row.updated_at),
  };
}
