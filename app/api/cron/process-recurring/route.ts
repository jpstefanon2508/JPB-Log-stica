import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This would ideally be hit by a scheduled cron job (e.g. Vercel Cron, Google Cloud Scheduler) 
// every hour to generate recurring orders.

export async function GET(request: Request) {
  try {
    // Basic auth check if needed (e.g. comparing a secret token in headers)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // In a real app, use a strong secret
    if (token !== 'process_recurring_orders_secret_994112') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    
    // Map to our ENUM
    const dayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDayString = dayMap[currentDayOfWeek];

    // Find all active templates
    const { data: recurringOrders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('is_recurring', true)
      // Only get templates, which we might designate by having a status of 'TEMPLATE' 
      // or by just duplicating the latest ones. For simplicity, we find all 'is_recurring=true' 
      // and generate for the NEXT applicable date.
      // A more robust system would separate 'OrderTemplates' from 'Orders'.

    if (error) throw error;

    let processedCount = 0;

    // VERY BASIC logic for generating actual orders from recurring flags
    for (const order of recurringOrders || []) {
       if (order.frequency === 'WEEKLY' && order.recurring_days?.includes(currentDayString)) {
           // Create new instance of order for TODAY
           
           // Format today as YYYY-MM-DD
           const dateStr = today.toISOString().split('T')[0];
           
           // Check if we already created an order for this template today to avoid duplicates
           const { data: existing } = await supabase
              .from('orders')
              .select('id')
              .eq('user_id', order.user_id)
              .eq('quantidade_kg', order.quantidade_kg)
              .eq('data_solicitada', dateStr)
              .eq('is_recurring', false) // Instance is not a template
              .single();

           if (!existing) {
              await supabase.from('orders').insert({
                 user_id: order.user_id,
                 quantidade_kg: order.quantidade_kg,
                 data_solicitada: dateStr,
                 time_solicitada: order.time_solicitada,
                 local_entrega: order.local_entrega,
                 observacoes: 'Gerado automaticamente da rotina: ' + (order.observacoes || ''),
                 status: 'PENDING',
                 is_recurring: false // The generated order itself is an instance
              });
              processedCount++;
           }
       }
       // Monthly/Biweekly would have similar logic comparing dates
    }

    return NextResponse.json({ 
       success: true, 
       message: `Recurring job executed. Created ${processedCount} orders.` 
    });

  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
