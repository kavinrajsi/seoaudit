import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE(request: Request, { params }: any) {
  const { id } = params;
  const { error } = await supabase.from('seoaudit').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: any) {
  const { id } = params;
  const { view_option } = await request.json();
  const { data, error } = await supabase
    .from('seoaudit')
    .update({ view_option })
    .eq('id', id)
    .single();
  if (error) {
    console.error('Supabase update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}
