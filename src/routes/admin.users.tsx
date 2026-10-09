import { createFileRoute } from '@tanstack/react-router';
import { Users } from '@/components/propertysetu/admin';
import { metadata } from '@/lib/propertysetu';
export const Route = createFileRoute('/admin/users')({
  head: () => metadata('Admin users', 'Every PropertySetu account: contact details, roles, listings, and wallet balance.'),
  component: Users,
});
