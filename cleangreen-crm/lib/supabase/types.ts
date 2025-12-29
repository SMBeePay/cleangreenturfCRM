// Database Types for Clean Green Turf CRM

export type LeadStatus = 'lead' | 'customer' | 'inactive';
export type ServiceFrequency = 'one-time' | 'bi-annual' | 'tri-annual' | 'quarterly';
export type LeadSource = 'organic' | 'paid-ad' | 'referral' | 'repeat-customer' | 'other';
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
export type AgreementStatus = 'pending' | 'signed' | 'cancelled';
export type PipelineStage = 'new-lead' | 'quoted' | 'follow-up-1' | 'follow-up-2' | 'won' | 'lost';
export type ActivityType = 'email' | 'call' | 'sms' | 'note' | 'quote-sent' | 'agreement-sent';
export type LostReason = 'price' | 'no-response' | 'competitor' | 'timing' | 'other';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  turf_size?: number;
  service_frequency?: ServiceFrequency;
  lead_source?: LeadSource;
  lead_date: string;
  status: LeadStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  lead_id: string;
  quote_number: string;
  service_type?: string;
  turf_size?: number;
  base_price: number;
  discount_percentage: number;
  final_price: number;
  service_frequency?: ServiceFrequency;
  created_date: string;
  expiration_date?: string;
  status: QuoteStatus;
  pdf_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Agreement {
  id: string;
  lead_id: string;
  quote_id?: string;
  contract_type: ServiceFrequency;
  start_date?: string;
  end_date?: string;
  price: number;
  discount_percentage?: number;
  signed_date?: string;
  signature_data?: string;
  pdf_url?: string;
  status: AgreementStatus;
  created_at: string;
  updated_at: string;
}

export interface PipelineStageRecord {
  id: string;
  lead_id: string;
  stage_name: PipelineStage;
  entered_date: string;
  exited_date?: string;
  notes?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: ActivityType;
  content?: string;
  automated: boolean;
  created_at: string;
}

export interface LostReasonRecord {
  id: string;
  lead_id: string;
  reason?: LostReason;
  notes?: string;
  created_at: string;
}

export interface CurrentPipelineStage {
  lead_id: string;
  stage_name: PipelineStage;
  entered_date: string;
}

export interface ConversionMetrics {
  total_leads: number;
  quoted_leads: number;
  won_leads: number;
  lost_leads: number;
  quote_to_close_rate: number;
}

// Pricing Tiers
export const PRICING_TIERS = [
  { min: 0, max: 500, price: 379, label: 'Under 500 sq ft' },
  { min: 501, max: 1000, price: 499, label: 'Around 1,000 sq ft' },
  { min: 1001, max: 1500, price: 599, label: 'Around 1,500 sq ft' },
] as const;

// Service Frequency Discounts
export const FREQUENCY_DISCOUNTS: Record<ServiceFrequency, number> = {
  'one-time': 0,
  'bi-annual': 5,
  'tri-annual': 10,
  'quarterly': 15,
};

// Helper function to calculate pricing
export function calculatePrice(turfSize: number, frequency: ServiceFrequency): { basePrice: number; discount: number; finalPrice: number } {
  const tier = PRICING_TIERS.find(t => turfSize >= t.min && turfSize <= t.max) || PRICING_TIERS[PRICING_TIERS.length - 1];
  const basePrice = tier.price;
  const discount = FREQUENCY_DISCOUNTS[frequency] || 0;
  const finalPrice = basePrice * (1 - discount / 100);

  return {
    basePrice,
    discount,
    finalPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimals
  };
}

// Helper function to generate quote number
export function generateQuoteNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CGT-${year}${month}-${random}`;
}
