import { createFileRoute } from '@tanstack/react-router';
import { Properties } from '@/components/propertysetu/admin';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/admin/properties')({head:()=>metadata('Admin properties','Review and manage PropertySetu property publication, verification, and featured listings.'),component:Properties});
