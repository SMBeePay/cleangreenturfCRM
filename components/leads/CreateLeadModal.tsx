'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createLead } from '@/lib/supabase/database';
import toast from 'react-hot-toast';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    turf_size: '',
    service_frequency: '',
    lead_source: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createLead({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        turf_size: formData.turf_size ? parseInt(formData.turf_size) : undefined,
        service_frequency: formData.service_frequency as any || undefined,
        lead_source: formData.lead_source as any || undefined,
        notes: formData.notes || undefined,
        status: 'lead',
      });

      toast.success('Lead created successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        turf_size: '',
        service_frequency: '',
        lead_source: '',
        notes: '',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Lead"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Create Lead
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
          />

          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
          />
        </div>

        <Input
          label="Address"
          name="address"
          type="text"
          value={formData.address}
          onChange={handleChange}
          placeholder="123 Main St, City, State ZIP"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Turf Size (sq ft)"
            name="turf_size"
            type="number"
            value={formData.turf_size}
            onChange={handleChange}
            placeholder="500"
          />

          <Select
            label="Service Frequency"
            name="service_frequency"
            value={formData.service_frequency}
            onChange={handleChange}
            options={[
              { value: 'one-time', label: 'One-time' },
              { value: 'bi-annual', label: 'Bi-annual (5% discount)' },
              { value: 'tri-annual', label: 'Tri-annual (10% discount)' },
              { value: 'quarterly', label: 'Quarterly (15% discount)' },
            ]}
          />
        </div>

        <Select
          label="Lead Source"
          name="lead_source"
          value={formData.lead_source}
          onChange={handleChange}
          options={[
            { value: 'organic', label: 'Organic' },
            { value: 'paid-ad', label: 'Paid Ad' },
            { value: 'referral', label: 'Referral' },
            { value: 'repeat-customer', label: 'Repeat Customer' },
            { value: 'other', label: 'Other' },
          ]}
        />

        <TextArea
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes about this lead..."
          rows={3}
        />
      </form>
    </Modal>
  );
}
