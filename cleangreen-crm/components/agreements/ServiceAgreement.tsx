'use client';

import { useState, useRef } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createAgreement, updateAgreement } from '@/lib/supabase/database';
import { calculatePrice, type ServiceFrequency } from '@/lib/supabase/types';
import SignatureCanvas from 'signature_pad';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

interface ServiceAgreementProps {
  lead: any;
  quote?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ServiceAgreement({ lead, quote, onSuccess, onCancel }: ServiceAgreementProps) {
  const [formData, setFormData] = useState({
    contract_type: (quote?.service_frequency || lead.service_frequency || 'bi-annual') as ServiceFrequency,
    turf_size: quote?.turf_size || lead.turf_size || 0,
    start_date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && !signaturePad) {
      const pad = new SignatureCanvas(canvasRef.current);
      setSignaturePad(pad);
    }
  }, [canvasRef.current]);

  const pricing = formData.turf_size
    ? calculatePrice(formData.turf_size, formData.contract_type)
    : null;

  const handleClearSignature = () => {
    signaturePad?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signaturePad || signaturePad.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    if (!pricing) {
      toast.error('Invalid pricing data');
      return;
    }

    setIsSubmitting(true);

    try {
      const signatureData = signaturePad.toDataURL();
      const endDate = new Date(formData.start_date);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const agreement = await createAgreement({
        lead_id: lead.id,
        quote_id: quote?.id,
        contract_type: formData.contract_type,
        start_date: formData.start_date,
        end_date: endDate.toISOString().split('T')[0],
        price: pricing.finalPrice,
        discount_percentage: pricing.discount,
        signature_data: signatureData,
        status: 'signed',
        signed_date: new Date().toISOString(),
      });

      // Mark agreement as signed
      await updateAgreement(agreement.id, { status: 'signed' });

      toast.success('Service agreement signed successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast.error('Failed to create agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold mb-4">Agreement Details</h3>

        <div className="space-y-4">
          <Select
            label="Contract Type"
            name="contract_type"
            required
            value={formData.contract_type}
            onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as ServiceFrequency })}
            options={[
              { value: 'bi-annual', label: 'Bi-annual (5% discount - 2x per year)' },
              { value: 'tri-annual', label: 'Tri-annual (10% discount - 3x per year)' },
              { value: 'quarterly', label: 'Quarterly (15% discount - 4x per year)' },
            ]}
          />

          <Input
            label="Start Date"
            name="start_date"
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />

          <Input
            label="Turf Size (sq ft)"
            name="turf_size"
            type="number"
            required
            value={formData.turf_size}
            onChange={(e) => setFormData({ ...formData, turf_size: parseInt(e.target.value) })}
          />
        </div>
      </Card>

      {pricing && (
        <Card className="bg-primary/5">
          <h3 className="text-lg font-semibold mb-4">Pricing</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Price (per service):</span>
              <span className="font-medium">${pricing.basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contract Discount:</span>
              <span className="font-medium text-green-600">{pricing.discount}%</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold">Price per Service:</span>
              <span className="font-bold text-xl text-primary">${pricing.finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
        <div className="text-sm text-gray-600 space-y-2 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded">
          <p><strong>Services Provided:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Deep cleaning and sanitization of artificial turf</li>
            <li>Removal of pet waste, odors, and bacteria</li>
            <li>Weed treatment and prevention</li>
            <li>Turf grooming and infill redistribution</li>
          </ul>

          <p className="mt-4"><strong>Contract Term:</strong></p>
          <p>This Agreement begins on the Start Date and continues for one (1) year. Services will be scheduled flexibly based on Customer preference, including concentrated scheduling during peak usage seasons.</p>

          <p className="mt-4"><strong>Payment Terms:</strong></p>
          <p>Payment is due upon completion of each service. Accepted payment methods: Credit/Debit Card. Customer will receive an invoice after each service. Pricing is locked for the duration of this Agreement.</p>

          <p className="mt-4"><strong>Cancellation & Rescheduling:</strong></p>
          <p>Either party may cancel this Agreement with 30 days written notice. Individual service appointments may be rescheduled with at least 48 hours notice at no charge. Cancellations with less than 48 hours notice may be subject to a cancellation fee equal to 50% of the scheduled service price.</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Signature</h3>
        <p className="text-sm text-gray-600 mb-4">
          By signing below, you agree to the terms and conditions of this service agreement.
        </p>

        <div className="border-2 border-gray-300 rounded-lg mb-4">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            className="w-full"
            style={{ touchAction: 'none' }}
          />
        </div>

        <Button type="button" size="sm" variant="outline" onClick={handleClearSignature}>
          Clear Signature
        </Button>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Customer Name</div>
            <div className="font-medium">{lead.name}</div>
          </div>
          <div>
            <div className="text-gray-500">Date</div>
            <div className="font-medium">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Sign Agreement
        </Button>
      </div>
    </form>
  );
}
