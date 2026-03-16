import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoice_number,
      client_name,
      client_email,
      client_address,
      client_phone,
      due_date,
      subtotal,
      tax_rate,
      tax_amount,
      total,
      notes,
      items
    } = body;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        invoice_number,
        client_name,
        client_email,
        client_address,
        client_phone,
        due_date,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        notes,
        status: 'draft'
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    // Create invoice items
    if (items && items.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          items.map((item: any) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }))
        );

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}