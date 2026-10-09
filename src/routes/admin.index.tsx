import { createFileRoute } from '@tanstack/react-router';
import { Overview } from '@/components/propertysetu/admin';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/admin/')({head:()=>metadata('Admin dashboard','PropertySetu administration: marketplace users, payments, properties, and reports.'),component:Overview});
