import { createFileRoute } from '@tanstack/react-router';
import { AdminPreview } from '@/components/propertysetu/admin-preview';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/admin-preview')({head:()=>metadata('Admin layout preview','A read-only preview of the PropertySetu admin layout.','/admin-preview',{noindex:true}),component:AdminPreview});
