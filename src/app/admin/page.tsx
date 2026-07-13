import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboard } from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: settings } = await supabase
    .from('settings')
    .select('sales_paused')
    .eq('id', true)
    .single();

  return (
    <AdminDashboard
      initialReservations={reservations ?? []}
      userEmail={user.email ?? ''}
      initialSalesPaused={settings?.sales_paused ?? false}
    />
  );
}
