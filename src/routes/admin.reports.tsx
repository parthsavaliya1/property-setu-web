import { createFileRoute } from '@tanstack/react-router';
import { Reports } from '@/components/propertysetu/admin';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/admin/reports')({head:()=>metadata('Admin reports','Review and resolve property reports in the PropertySetu marketplace.'),component:Reports});
