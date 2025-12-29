import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

/**
 * Webhook endpoint for Make.com to create leads
 * POST /api/webhooks/lead
 *
 * Expected payload:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "phone": "(555) 123-4567",
 *   "address": "123 Main St, City, State ZIP",
 *   "turf_size": 500,
 *   "service_frequency": "one-time",
 *   "lead_source": "website-form",
 *   "notes": "Customer inquired about pricing"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([{
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        turf_size: body.turf_size || null,
        service_frequency: body.service_frequency || null,
        lead_source: body.lead_source || 'other',
        notes: body.notes || null,
        status: 'lead',
      }])
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Create initial pipeline stage
    const { error: stageError } = await supabase
      .from('pipeline_stages')
      .insert([{
        lead_id: lead.id,
        stage_name: 'new-lead',
      }]);

    if (stageError) {
      console.error('Error creating pipeline stage:', stageError);
    }

    // Log activity
    const { error: activityError } = await supabase
      .from('activities')
      .insert([{
        lead_id: lead.id,
        type: 'note',
        content: 'Lead created via webhook',
        automated: true,
      }]);

    if (activityError) {
      console.error('Error creating activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      message: 'Lead created successfully',
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
