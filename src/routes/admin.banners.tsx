import { createFileRoute } from '@tanstack/react-router';
import { Banners } from '@/components/propertysetu/banners';
import { metadata } from '@/lib/propertysetu';
export const Route = createFileRoute('/admin/banners')({
  head: () => metadata('Admin banners', 'Upload the banners shown on the PropertySetu app home screen.'),
  component: Banners,
});
