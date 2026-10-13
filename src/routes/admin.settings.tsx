import { createFileRoute } from '@tanstack/react-router';
import { Settings } from '@/components/propertysetu/settings';
import { metadata } from '@/lib/propertysetu';

export const Route = createFileRoute('/admin/settings')({
  head: () => metadata('Admin settings', 'Set listing amounts, premium offers, and demo logins that skip SMS.'),
  component: Settings,
});
