'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, getPipelineStageVariant } from '@/components/ui/Badge';
import { getLeadWithDetails, moveToPipelineStage } from '@/lib/supabase/database';
import { QuoteGenerator } from '@/components/quotes/QuoteGenerator';
import { ServiceAgreement } from '@/components/agreements/ServiceAgreement';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface LeadDetailsModalProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailsModal({ leadId, isOpen, onClose, onUpdate }: LeadDetailsModalProps) {
  const [leadData, setLeadData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'quotes' | 'agreements' | 'activity'>('details');
  const [showQuoteGenerator, setShowQuoteGenerator] = useState(false);
  const [showAgreementForm, setShowAgreementForm] = useState(false);

  useEffect(() => {
    if (isOpen && leadId) {
      loadLeadData();
    }
  }, [isOpen, leadId]);

  async function loadLeadData() {
    try {
      setIsLoading(true);
      const data = await getLeadWithDetails(leadId);
      setLeadData(data);
    } catch (error) {
      console.error('Error loading lead details:', error);
      toast.error('Failed to load lead details');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMoveStage(stage: string) {
    try {
      await moveToPipelineStage(leadId, stage as any);
      toast.success(`Moved to ${stage.replace('-', ' ')}`);
      loadLeadData();
      onUpdate();
    } catch (error) {
      console.error('Error moving stage:', error);
      toast.error('Failed to update stage');
    }
  }

  if (!leadData) {
    return null;
  }

  const { lead, quotes, agreements, activities, currentStage } = leadData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.name}
      size="xl"
    >
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Lead Info Header */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{lead.email || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-medium">{lead.phone || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Turf Size</div>
                <div className="font-medium">
                  {lead.turf_size ? `${lead.turf_size.toLocaleString()} sq ft` : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Current Stage</div>
                <div>
                  <Badge variant={getPipelineStageVariant(currentStage?.stage_name || 'new-lead')}>
                    {currentStage?.stage_name?.replace('-', ' ') || 'New Lead'}
                  </Badge>
                </div>
              </div>
            </div>
            {lead.address && (
              <div className="mt-4">
                <div className="text-sm text-gray-500">Address</div>
                <div className="font-medium">{lead.address}</div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowQuoteGenerator(true)}>
              Create Quote
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAgreementForm(true)}>
              Create Agreement
            </Button>
            <select
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => e.target.value && handleMoveStage(e.target.value)}
              value=""
            >
              <option value="">Move to Stage...</option>
              <option value="new-lead">New Lead</option>
              <option value="quoted">Quoted</option>
              <option value="follow-up-1">Follow-up 1</option>
              <option value="follow-up-2">Follow-up 2</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['details', 'quotes', 'agreements', 'activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm capitalize
                    ${activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Service Frequency</div>
                  <div className="mt-1 capitalize">{lead.service_frequency?.replace('-', ' ') || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Lead Source</div>
                  <div className="mt-1 capitalize">{lead.lead_source?.replace('-', ' ') || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Lead Date</div>
                  <div className="mt-1">{format(new Date(lead.lead_date), 'PPP')}</div>
                </div>
                {lead.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Notes</div>
                    <div className="mt-1 whitespace-pre-wrap">{lead.notes}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div>
                {showQuoteGenerator ? (
                  <QuoteGenerator
                    lead={lead}
                    onSuccess={() => {
                      setShowQuoteGenerator(false);
                      loadLeadData();
                      onUpdate();
                    }}
                    onCancel={() => setShowQuoteGenerator(false)}
                  />
                ) : quotes.length > 0 ? (
                  <div className="space-y-3">
                    {quotes.map((quote: any) => (
                      <Card key={quote.id}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{quote.quote_number}</div>
                            <div className="text-sm text-gray-500">
                              ${quote.final_price} • {format(new Date(quote.created_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <Badge variant={quote.status === 'accepted' ? 'success' : 'default'}>
                            {quote.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No quotes yet</p>
                    <Button size="sm" className="mt-4" onClick={() => setShowQuoteGenerator(true)}>
                      Create First Quote
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'agreements' && (
              <div>
                {showAgreementForm ? (
                  <ServiceAgreement
                    lead={lead}
                    onSuccess={() => {
                      setShowAgreementForm(false);
                      loadLeadData();
                      onUpdate();
                    }}
                    onCancel={() => setShowAgreementForm(false)}
                  />
                ) : agreements.length > 0 ? (
                  <div className="space-y-3">
                    {agreements.map((agreement: any) => (
                      <Card key={agreement.id}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium capitalize">{agreement.contract_type} Agreement</div>
                            <div className="text-sm text-gray-500">
                              ${agreement.price} • {agreement.signed_date ? `Signed ${format(new Date(agreement.signed_date), 'MMM d, yyyy')}` : 'Pending'}
                            </div>
                          </div>
                          <Badge variant={agreement.status === 'signed' ? 'success' : 'warning'}>
                            {agreement.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No agreements yet</p>
                    <Button size="sm" className="mt-4" onClick={() => setShowAgreementForm(true)}>
                      Create Agreement
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3">
                {activities.length > 0 ? (
                  activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize">{activity.type.replace('-', ' ')}</div>
                        {activity.content && (
                          <div className="text-sm text-gray-600 mt-1">{activity.content}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {format(new Date(activity.created_at), 'PPp')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">No activity yet</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
