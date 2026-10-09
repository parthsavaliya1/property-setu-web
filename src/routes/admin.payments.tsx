import { createFileRoute } from '@tanstack/react-router';
import { Payments } from '@/components/propertysetu/admin';
import { metadata } from '@/lib/propertysetu';
export const Route = createFileRoute('/admin/payments')({
  head: () => metadata('Admin payments', 'PropertySetu listing fees and wallet top-ups.'),
  component: Payments,
});
