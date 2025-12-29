'use client';

import { useState } from 'react';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createQuote } from '@/lib/supabase/database';
import { calculatePrice, generateQuoteNumber, type ServiceFrequency } from '@/lib/supabase/types';
import toast from 'react-hot-toast';

interface QuoteGeneratorProps {
  lead: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuoteGenerator({ lead, onSuccess, onCancel }: QuoteGeneratorProps) {
  const [formData, setFormData] = useState({
    turf_size: lead.turf_size?.toString() || '',
    service_frequency: (lead.service_frequency as ServiceFrequency) || 'one-time',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pricing = formData.turf_size
    ? calculatePrice(parseInt(formData.turf_size), formData.service_frequency as ServiceFrequency)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricing) {
      toast.error('Please enter turf size');
      return;
    }

    setIsSubmitting(true);

    try {
      const quoteNumber = generateQuoteNumber();
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      await createQuote({
        lead_id: lead.id,
        quote_number: quoteNumber,
        service_type: 'artificial-turf-cleaning',
        turf_size: parseInt(formData.turf_size),
        base_price: pricing.basePrice,
        discount_percentage: pricing.discount,
        final_price: pricing.finalPrice,
        service_frequency: formData.service_frequency as ServiceFrequency,
        expiration_date: expirationDate.toISOString(),
        status: 'draft',
        notes: formData.notes || undefined,
      });

      toast.success('Quote created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold mb-4">Quote Details</h3>

        <div className="space-y-4">
          <Input
            label="Turf Size (sq ft)"
            name="turf_size"
            type="number"
            required
            value={formData.turf_size}
            onChange={(e) => setFormData({ ...formData, turf_size: e.target.value })}
            placeholder="500"
          />

          <Select
            label="Service Frequency"
            name="service_frequency"
            required
            value={formData.service_frequency}
            onChange={(e) => setFormData({ ...formData, service_frequency: e.target.value as ServiceFrequency })}
            options={[
              { value: 'one-time', label: 'One-time' },
              { value: 'bi-annual', label: 'Bi-annual (5% discount)' },
              { value: 'tri-annual', label: 'Tri-annual (10% discount)' },
              { value: 'quarterly', label: 'Quarterly (15% discount)' },
            ]}
          />

          <TextArea
            label="Additional Notes"
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any special considerations..."
            rows={3}
          />
        </div>
      </Card>

      {pricing && (
        <Card className="bg-primary/5">
          <h3 className="text-lg font-semibold mb-4">Pricing Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Price:</span>
              <span className="font-medium">${pricing.basePrice.toFixed(2)}</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount ({pricing.discount}%):</span>
                <span className="font-medium text-green-600">
                  -${(pricing.basePrice * (pricing.discount / 100)).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold">Final Price:</span>
              <span className="font-bold text-xl text-primary">${pricing.finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create Quote
        </Button>
      </div>
    </form>
  );
}
