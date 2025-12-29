'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, getPipelineStageVariant } from '@/components/ui/Badge';
import { getLeadsWithCurrentStage, getConversionMetrics, getLeadsBySource } from '@/lib/supabase/database';
import type { Lead } from '@/lib/supabase/types';
import { CreateLeadModal } from '@/components/leads/CreateLeadModal';
import { LeadDetailsModal } from '@/components/leads/LeadDetailsModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type LeadWithStage = Lead & { currentStage: string };

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadWithStage[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadWithStage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [sourceData, setSourceData] = useState<any[]>([]);

  // Filters
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, stageFilter, sourceFilter, searchTerm]);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      const [leadsData, metricsData, sourceStatsData] = await Promise.all([
        getLeadsWithCurrentStage(),
        getConversionMetrics(),
        getLeadsBySource(),
      ]);

      setLeads(leadsData);
      setMetrics(metricsData);
      setSourceData(sourceStatsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  function filterLeads() {
    let filtered = [...leads];

    if (stageFilter !== 'all') {
      filtered = filtered.filter(lead => lead.currentStage === stageFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.lead_source === sourceFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.phone?.includes(search) ||
        lead.address?.toLowerCase().includes(search)
      );
    }

    setFilteredLeads(filtered);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'new-lead': 'New Lead',
      'quoted': 'Quoted',
      'follow-up-1': 'Follow-up 1',
      'follow-up-2': 'Follow-up 2',
      'won': 'Won',
      'lost': 'Lost',
    };
    return labels[stage] || stage;
  };

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Clean Green Turf CRM</h1>
              <p className="text-accent mt-1">Manage your leads and grow your business</p>
            </div>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Lead
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="text-sm font-medium text-gray-600">Total Leads</div>
              <div className="text-3xl font-bold text-primary mt-2">{metrics.total_leads || 0}</div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-600">Quoted</div>
              <div className="text-3xl font-bold text-primary mt-2">{metrics.quoted_leads || 0}</div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-600">Won</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{metrics.won_leads || 0}</div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-600">Conversion Rate</div>
              <div className="text-3xl font-bold text-primary mt-2">
                {metrics.quote_to_close_rate || 0}%
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Stage</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              >
                <option value="all">All Stages</option>
                <option value="new-lead">New Lead</option>
                <option value="quoted">Quoted</option>
                <option value="follow-up-1">Follow-up 1</option>
                <option value="follow-up-2">Follow-up 2</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">All Sources</option>
                <option value="organic">Organic</option>
                <option value="paid-ad">Paid Ad</option>
                <option value="referral">Referral</option>
                <option value="repeat-customer">Repeat Customer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Leads List */}
        <Card padding={false}>
          <div className="p-6">
            <CardHeader
              title="Leads"
              subtitle={`${filteredLeads.length} ${filteredLeads.length === 1 ? 'lead' : 'leads'}`}
            />
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-4 text-lg font-medium">No leads found</p>
              <p className="mt-2">Try adjusting your filters or create a new lead</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turf Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.email || '-'}</div>
                        <div className="text-sm text-gray-500">{lead.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lead.turf_size ? `${lead.turf_size.toLocaleString()} sq ft` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {lead.lead_source?.replace('-', ' ') || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getPipelineStageVariant(lead.currentStage)}>
                          {getStageLabel(lead.currentStage)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(lead.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLead(lead.id)}
                          className="text-primary hover:text-primary-dark"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Modals */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadDashboardData();
        }}
      />

      {selectedLead && (
        <LeadDetailsModal
          leadId={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={loadDashboardData}
        />
      )}
    </div>
  );
}
