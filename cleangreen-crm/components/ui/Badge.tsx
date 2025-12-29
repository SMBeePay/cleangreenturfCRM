import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// Helper function to get badge variant for pipeline stages
export function getPipelineStageVariant(stage: string): BadgeProps['variant'] {
  const variants: Record<string, BadgeProps['variant']> = {
    'new-lead': 'info',
    'quoted': 'warning',
    'follow-up-1': 'warning',
    'follow-up-2': 'danger',
    'won': 'success',
    'lost': 'danger',
  };

  return variants[stage] || 'default';
}

// Helper function to get badge variant for quote status
export function getQuoteStatusVariant(status: string): BadgeProps['variant'] {
  const variants: Record<string, BadgeProps['variant']> = {
    'draft': 'default',
    'sent': 'info',
    'viewed': 'warning',
    'accepted': 'success',
    'declined': 'danger',
    'expired': 'danger',
  };

  return variants[status] || 'default';
}
