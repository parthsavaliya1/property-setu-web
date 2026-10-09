import { createFileRoute } from '@tanstack/react-router';
import { Overview } from '@/components/propertysetu/admin';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/admin/')({head:()=>metadata('Admin overview','PropertySetu administration: marketplace properties, users, inquiries, revenue, and reports.'),component:Overview});
