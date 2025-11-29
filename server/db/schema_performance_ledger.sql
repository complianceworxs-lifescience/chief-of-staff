CREATE TABLE IF NOT EXISTS performance_ledger (
    -- ID & Segmentation
    send_id TEXT PRIMARY KEY,       -- UUID for the specific email sent
    campaign_id TEXT NOT NULL,
    variant_id TEXT,
    persona TEXT NOT NULL,          -- e.g. "Validation Strategist"
    segment TEXT,

    -- The Hypothesis (Optimization Levers)
    problem_angle TEXT,             -- Enum: 'Cost', 'Speed', 'Risk', 'Recognition'
    metric_focus TEXT,              -- Enum: 'Time', 'Money', 'Percentage'
    tone_style TEXT,                -- Enum: 'Provocative', 'Clinical', 'Empathetic'
    cta_type TEXT,                  -- Enum: 'Soft Ask', 'Hard Audit'

    -- Compliance & Safety (Immutable Constraints)
    doctrine_score NUMERIC,         -- 0-100 score from Validator
    validator_pass BOOLEAN DEFAULT FALSE,
    vqs_band TEXT,                  -- Read-Only: '14-28%', '$18k-$72k', '15-35%'
    forbidden_flag BOOLEAN DEFAULT FALSE,

    -- Content Fingerprints
    subject_line TEXT,
    subject_hash TEXT,              -- For fatigue tracking
    body_hash TEXT,

    -- Outcomes (Updated via Webhook)
    opens INT DEFAULT 0,
    clicks INT DEFAULT 0,
    replies INT DEFAULT 0,
    positive_replies INT DEFAULT 0,
    booked_calls INT DEFAULT 0,
    pipeline_value_est NUMERIC DEFAULT 0.0,
    revenue_attrib_est NUMERIC DEFAULT 0.0,

    -- Metadata
    batch_id TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_ledger_campaign ON performance_ledger(campaign_id);
CREATE INDEX IF NOT EXISTS idx_performance_ledger_persona ON performance_ledger(persona);
CREATE INDEX IF NOT EXISTS idx_performance_ledger_sent_at ON performance_ledger(sent_at);
CREATE INDEX IF NOT EXISTS idx_performance_ledger_problem_angle ON performance_ledger(problem_angle);
