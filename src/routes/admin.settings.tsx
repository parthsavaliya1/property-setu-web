import { createFileRoute } from '@tanstack/react-router';
import { Settings } from '@/components/propertysetu/settings';
import { metadata } from '@/lib/propertysetu';

export const Route = createFileRoute('/admin/settings')({
  head: () => metadata('Admin settings', 'Choose a colour theme, listing amounts, premium offers, and demo logins that skip SMS.'),
  component: Settings,
});
