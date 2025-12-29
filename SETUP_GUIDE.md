# Clean Green Turf CRM - Setup Guide

## Overview

This is your custom CRM system built specifically for Clean Green Turf. It includes:
- Lead management and tracking
- Quote generation with automated pricing
- E-signature service agreements
- Pipeline visualization
- Metrics and reporting
- Webhook endpoints for Make.com integration

## Prerequisites

You already have:
- ✅ Node.js and npm installed
- ✅ Supabase account (https://cdskpmjwbcrrazgwndgg.supabase.co)
- ✅ Environment variables configured (.env.local)

## Step 1: Set Up the Database

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/cdskpmjwbcrrazgwndgg

2. Navigate to **SQL Editor** in the left sidebar

3. Create a new query and paste the contents of `lib/supabase/schema.sql`

4. Click **Run** to execute the SQL script

This will create all necessary tables:
- `leads` - Customer and lead information
- `quotes` - Quote records with pricing
- `agreements` - Service agreements with signatures
- `pipeline_stages` - Pipeline tracking
- `activities` - Activity log
- `lost_reasons` - Tracking for lost deals

## Step 2: Configure Supabase Storage (for PDFs)

1. In Supabase dashboard, go to **Storage**

2. Create a new bucket called `pdfs`

3. Set the bucket to **Public** (or configure appropriate policies)

This will be used to store generated quote and agreement PDFs.

## Step 3: Run the Development Server

```bash
cd cleangreen-crm
npm run dev
```

The app will be available at: http://localhost:3000

It will automatically redirect to the dashboard at: http://localhost:3000/dashboard

## Step 4: Set Up Make.com Webhooks

Your CRM has a webhook endpoint to receive leads from Make.com scenarios.

**Webhook URL:** `https://your-domain.com/api/webhooks/lead`

**Method:** POST

**Expected Payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "address": "123 Main St, City, State ZIP",
  "turf_size": 500,
  "service_frequency": "one-time",
  "lead_source": "website-form",
  "notes": "Customer inquired about pricing"
}
```

**Required Fields:**
- `name` (string) - Customer name

**Optional Fields:**
- `email` (string)
- `phone` (string)
- `address` (string)
- `turf_size` (number) - in square feet
- `service_frequency` (string) - one-time, bi-annual, tri-annual, quarterly
- `lead_source` (string) - organic, paid-ad, referral, repeat-customer, other
- `notes` (string)

### Make.com Integration Examples:

1. **Website Form → CRM**
   - Trigger: Hostinger form submission
   - Action: HTTP POST to webhook endpoint

2. **Google Voice → CRM**
   - Trigger: New voicemail/text
   - Action: HTTP POST to webhook endpoint

3. **Gmail → CRM**
   - Trigger: New email matching filter
   - Action: HTTP POST to webhook endpoint (parse email content)

## Step 5: Using the CRM

### Creating a Lead

1. Click **"New Lead"** button in the dashboard header
2. Fill in customer information
3. Click **"Create Lead"**

The lead will automatically be assigned to the "New Lead" pipeline stage.

### Generating a Quote

1. Click on any lead in the dashboard
2. Click **"Create Quote"** button
3. Enter turf size and select service frequency
4. Review the auto-calculated pricing
5. Click **"Create Quote"**

**Pricing Tiers (automatically applied):**
- Under 500 sq ft: $379
- Around 1,000 sq ft: $499
- Around 1,500 sq ft: $599

**Frequency Discounts:**
- One-time: 0% discount
- Bi-annual: 5% discount
- Tri-annual: 10% discount
- Quarterly: 15% discount

### Creating a Service Agreement

1. Open a lead detail modal
2. Click **"Create Agreement"** button
3. Select contract type and start date
4. Review terms and conditions
5. Sign using mouse or touch
6. Click **"Sign Agreement"**

The lead will automatically move to "Won" stage and status will update to "Customer".

### Pipeline Management

Leads move through these stages:
1. **New Lead** - Initial contact
2. **Quoted** - Quote sent (auto-assigned when quote created)
3. **Follow-Up 1** - Manual move after first follow-up
4. **Follow-Up 2** - Manual move after second follow-up
5. **Won** - Customer acquired (auto-assigned when agreement signed)
6. **Lost** - Deal lost

To manually move a lead between stages:
- Open lead details modal
- Use the "Move to Stage..." dropdown
- Select desired stage

### Dashboard Metrics

The dashboard shows:
- **Total Leads** - All leads in system
- **Quoted** - Leads with at least one quote
- **Won** - Customers with signed agreements
- **Conversion Rate** - Quote-to-close percentage

### Filtering Leads

Use the filter cards to:
- Search by name, email, phone, or address
- Filter by pipeline stage
- Filter by lead source

## Step 6: Deploy to Production

### Option A: Vercel (Recommended)

1. Push your code to GitHub

2. Go to https://vercel.com

3. Click **"New Project"** and import your GitHub repository

4. Configure environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. Click **Deploy**

Your CRM will be live at: `https://your-project.vercel.app`

### Option B: Other Hosting

You can also deploy to:
- **Netlify** - Similar to Vercel
- **Railway** - Simple deployment
- **DigitalOcean App Platform** - More control

## Features Included (Phase 1)

✅ Lead centralization and management
✅ Quote generator with PDF export capability
✅ E-signature service agreements
✅ Pipeline tracking and stage management
✅ Basic metrics and reporting
✅ Lead source tracking
✅ Activity logging
✅ Webhook endpoint for Make.com

## Features NOT Included (Future Phases)

❌ Automated follow-up emails (Phase 2)
❌ Quote status tracking (sent/viewed) (Phase 2)
❌ SMS capabilities via Twilio (Phase 2)
❌ Google Calendar integration (Phase 3)
❌ Customer portal (Phase 3)
❌ CSV import for historical data (Can be added)
❌ PDF generation and email sending (Can be added)

## Minimal Automations Included

- ✅ Auto-assign "New Lead" stage when lead created
- ✅ Auto-assign "Quoted" stage when quote sent
- ✅ Auto-assign "Won" stage when agreement signed
- ✅ Auto-update lead status to "Customer" when agreement signed
- ✅ Activity logging for major events

## Troubleshooting

### "Failed to load dashboard data"
- Check that you've run the SQL schema in Supabase
- Verify environment variables are correct
- Check Supabase project is active

### Webhook not working
- Verify the webhook URL is correct
- Check Make.com scenario is active
- Look at Network tab in browser dev tools for errors
- Check Supabase logs for database errors

### Signature pad not working
- Make sure you're using a modern browser
- Try clearing signature and redrawing
- Check console for JavaScript errors

## Monthly Operating Costs

Current setup costs:
- **Supabase Free Tier**: $0/month (up to 500MB database, 50K monthly users)
- **Vercel Free Tier**: $0/month (unlimited personal projects)
- **Make.com**: $9-29/month (depending on operations needed)

**Total: $9-29/month** ✅ (Well under your $50/month goal!)

## Next Steps

1. ✅ Set up database using SQL schema
2. ✅ Run dev server and test the CRM
3. ⏩ Configure Make.com webhooks for automated lead capture
4. ⏩ Deploy to Vercel for production use
5. ⏩ Add logo to public directory
6. ⏩ Optionally add PDF generation library
7. ⏩ Optionally add CSV import feature

## Support

For issues or questions:
1. Check the console for error messages
2. Review Supabase logs
3. Check Make.com scenario execution logs
4. Review this setup guide

## Brand Colors Reference

Your CRM uses these Clean Green Turf brand colors:
- **Primary**: #2d616c (Dark Teal)
- **Primary Dark**: #0e4752 (Darker Teal)
- **Accent**: #b6ddbe (Light Green)
- **Neutral**: #f3f3f4 (Light Gray)

These are configured in `app/globals.css` and used throughout the UI.
