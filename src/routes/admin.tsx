import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '@/components/propertysetu/admin';
import { metadata } from '@/lib/propertysetu';
export const Route=createFileRoute('/admin')({ssr:false,head:()=>metadata('Admin','PropertySetu administration.','/admin',{noindex:true}),component:Layout});
function Layout(){return <AdminLayout><Outlet/></AdminLayout>;}
