import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '@/components/propertysetu/admin';
export const Route=createFileRoute('/admin')({component:Layout});
function Layout(){return <AdminLayout><Outlet/></AdminLayout>;}
