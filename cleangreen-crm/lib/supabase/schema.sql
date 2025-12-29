-- Clean Green Turf CRM Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads/Customers Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  turf_size INTEGER, -- in square feet
  service_frequency VARCHAR(50), -- one-time, bi-annual, tri-annual, quarterly
  lead_source VARCHAR(100), -- organic, paid-ad, referral, repeat-customer
  lead_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'lead', -- lead, customer, inactive
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  service_type VARCHAR(100), -- artificial-turf-cleaning
  turf_size INTEGER,
  base_price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  final_price DECIMAL(10, 2) NOT NULL,
  service_frequency VARCHAR(50), -- one-time, bi-annual, tri-annual, quarterly
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiration_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, accepted, declined, expired
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Agreements Table
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  contract_type VARCHAR(50) NOT NULL, -- bi-annual, tri-annual, quarterly
  start_date DATE,
  end_date DATE,
  price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER,
  signed_date TIMESTAMP WITH TIME ZONE,
  signature_data TEXT, -- base64 signature image
  pdf_url TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, signed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline Stages Table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  stage_name VARCHAR(50) NOT NULL, -- new-lead, quoted, follow-up-1, follow-up-2, won, lost
  entered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities/Communication Log Table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- email, call, sms, note, quote-sent, agreement-sent
  content TEXT,
  automated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lost Reasons Table (for tracking why deals are lost)
CREATE TABLE IF NOT EXISTS lost_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  reason VARCHAR(100), -- price, no-response, competitor, timing, other
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_agreements_lead_id ON agreements(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_lead_id ON pipeline_stages(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreements_updated_at BEFORE UPDATE ON agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-expire quotes after 30 days
CREATE OR REPLACE FUNCTION auto_expire_quotes()
RETURNS void AS $$
BEGIN
  UPDATE quotes
  SET status = 'expired'
  WHERE expiration_date < NOW()
    AND status IN ('sent', 'viewed')
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- View for current pipeline stage per lead
CREATE OR REPLACE VIEW current_pipeline_stage AS
SELECT DISTINCT ON (lead_id)
  lead_id,
  stage_name,
  entered_date
FROM pipeline_stages
WHERE exited_date IS NULL
ORDER BY lead_id, entered_date DESC;

-- View for lead conversion metrics
CREATE OR REPLACE VIEW conversion_metrics AS
SELECT
  COUNT(*) FILTER (WHERE stage_name = 'new-lead') as total_leads,
  COUNT(*) FILTER (WHERE stage_name = 'quoted') as quoted_leads,
  COUNT(*) FILTER (WHERE stage_name = 'won') as won_leads,
  COUNT(*) FILTER (WHERE stage_name = 'lost') as lost_leads,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE stage_name = 'won') /
    NULLIF(COUNT(*) FILTER (WHERE stage_name = 'quoted'), 0),
    2
  ) as quote_to_close_rate
FROM current_pipeline_stage;
