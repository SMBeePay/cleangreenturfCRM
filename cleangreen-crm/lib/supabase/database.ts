import { createClient } from './client';
import type { Lead, Quote, Agreement, Activity, PipelineStageRecord, CurrentPipelineStage, ServiceFrequency, LeadSource, PipelineStage } from './types';

// Lead Operations
export async function createLead(data: Partial<Lead>) {
  const supabase = createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .insert([data])
    .select()
    .single();

  if (error) throw error;

  // Auto-create "new-lead" pipeline stage
  await createPipelineStage(lead.id, 'new-lead');

  // Log activity
  await createActivity(lead.id, 'note', 'Lead created', false);

  return lead;
}

export async function updateLead(id: string, data: Partial<Lead>) {
  const supabase = createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return lead;
}

export async function getLeads(filters?: { status?: string; lead_source?: string }) {
  const supabase = createClient();

  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.lead_source) {
    query = query.eq('lead_source', filters.lead_source);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Lead[];
}

export async function getLeadById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function getLeadWithDetails(id: string) {
  const supabase = createClient();

  const [lead, quotes, agreements, activities, currentStage] = await Promise.all([
    getLeadById(id),
    getQuotesByLeadId(id),
    getAgreementsByLeadId(id),
    getActivitiesByLeadId(id),
    getCurrentPipelineStage(id),
  ]);

  return {
    lead,
    quotes,
    agreements,
    activities,
    currentStage,
  };
}

// Quote Operations
export async function createQuote(data: Partial<Quote>) {
  const supabase = createClient();

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert([data])
    .select()
    .single();

  if (error) throw error;

  // Update pipeline stage to "quoted"
  if (data.lead_id) {
    await moveToPipelineStage(data.lead_id, 'quoted');
    await createActivity(data.lead_id, 'quote-sent', `Quote ${quote.quote_number} created`, false);
  }

  return quote;
}

export async function updateQuote(id: string, data: Partial<Quote>) {
  const supabase = createClient();

  const { data: quote, error } = await supabase
    .from('quotes')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return quote;
}

export async function getQuotesByLeadId(leadId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_date', { ascending: false });

  if (error) throw error;
  return data as Quote[];
}

export async function getQuoteById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Quote;
}

// Agreement Operations
export async function createAgreement(data: Partial<Agreement>) {
  const supabase = createClient();

  const { data: agreement, error } = await supabase
    .from('agreements')
    .insert([data])
    .select()
    .single();

  if (error) throw error;

  if (data.lead_id) {
    await createActivity(data.lead_id, 'agreement-sent', 'Service agreement created', false);
  }

  return agreement;
}

export async function updateAgreement(id: string, data: Partial<Agreement>) {
  const supabase = createClient();

  const { data: agreement, error } = await supabase
    .from('agreements')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // If agreement is signed, move to "won" stage
  if (data.status === 'signed' && agreement.lead_id) {
    await moveToPipelineStage(agreement.lead_id, 'won');
    await updateLead(agreement.lead_id, { status: 'customer' });
    await createActivity(agreement.lead_id, 'note', 'Agreement signed - customer won!', false);
  }

  return agreement;
}

export async function getAgreementsByLeadId(leadId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Agreement[];
}

export async function getAgreementById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Agreement;
}

// Pipeline Stage Operations
export async function createPipelineStage(leadId: string, stage: PipelineStage, notes?: string) {
  const supabase = createClient();

  // Exit current stage
  await supabase
    .from('pipeline_stages')
    .update({ exited_date: new Date().toISOString() })
    .eq('lead_id', leadId)
    .is('exited_date', null);

  // Create new stage
  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert([{
      lead_id: leadId,
      stage_name: stage,
      notes,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as PipelineStageRecord;
}

export async function moveToPipelineStage(leadId: string, stage: PipelineStage, notes?: string) {
  return createPipelineStage(leadId, stage, notes);
}

export async function getCurrentPipelineStage(leadId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('current_pipeline_stage')
    .select('*')
    .eq('lead_id', leadId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
  return data as CurrentPipelineStage | null;
}

export async function getLeadsWithCurrentStage() {
  const supabase = createClient();

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (leadsError) throw leadsError;

  const { data: stages, error: stagesError } = await supabase
    .from('current_pipeline_stage')
    .select('*');

  if (stagesError) throw stagesError;

  return leads.map(lead => ({
    ...lead,
    currentStage: stages.find(s => s.lead_id === lead.id)?.stage_name || 'new-lead',
  }));
}

// Activity Operations
export async function createActivity(leadId: string, type: Activity['type'], content?: string, automated = false) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activities')
    .insert([{
      lead_id: leadId,
      type,
      content,
      automated,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Activity;
}

export async function getActivitiesByLeadId(leadId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Activity[];
}

// Metrics and Reporting
export async function getConversionMetrics() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('conversion_metrics')
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getLeadsBySource() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leads')
    .select('lead_source')
    .not('lead_source', 'is', null);

  if (error) throw error;

  const counts: Record<string, number> = {};
  data.forEach(lead => {
    const source = lead.lead_source || 'unknown';
    counts[source] = (counts[source] || 0) + 1;
  });

  return Object.entries(counts).map(([source, count]) => ({
    source,
    count,
  }));
}

export async function getRevenueMetrics() {
  const supabase = createClient();

  const [quotes, agreements] = await Promise.all([
    supabase.from('quotes').select('final_price, status'),
    supabase.from('agreements').select('price, status'),
  ]);

  if (quotes.error) throw quotes.error;
  if (agreements.error) throw agreements.error;

  const totalQuotedValue = quotes.data
    .filter(q => q.status !== 'declined' && q.status !== 'expired')
    .reduce((sum, q) => sum + Number(q.final_price), 0);

  const wonRevenue = agreements.data
    .filter(a => a.status === 'signed')
    .reduce((sum, a) => sum + Number(a.price), 0);

  const averageDealSize = quotes.data.length > 0
    ? totalQuotedValue / quotes.data.length
    : 0;

  return {
    totalQuotedValue,
    wonRevenue,
    averageDealSize,
  };
}

// Auto-expire quotes (should be called via cron job or manually)
export async function autoExpireQuotes() {
  const supabase = createClient();

  const { error } = await supabase.rpc('auto_expire_quotes');

  if (error) throw error;
}
