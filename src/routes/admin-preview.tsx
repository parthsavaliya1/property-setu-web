import { createFileRoute } from '@tanstack/react-router';
import { AdminPreview } from '@/components/propertysetu/admin-preview';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/admin-preview')({head:()=>({...metadata('Admin layout preview','A read-only preview of PropertySetu admin overview, properties, and reports, with no private data.'),meta:[...metadata('Admin layout preview','A read-only preview of PropertySetu admin overview, properties, and reports, with no private data.').meta,{name:'robots',content:'noindex'}]}),component:AdminPreview});
