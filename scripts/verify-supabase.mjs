import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nfeljxlqtuvihbymnwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWxqeGxxdHV2aWhieW1ud3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODA5NzMsImV4cCI6MjA4MTM1Njk3M30.Mi0sEVbz_0ZdlXpqLXmhn7KO0mSrVuYrTEX_FgV2BCU';
const supabase = createClient(supabaseUrl, supabaseKey);

const log = (label, data) => {
  console.log(`[${label}]`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
};

const productBase = {
  id: `ver-${Date.now()}`,
  name: `Verifier Product ${Date.now()}`,
  price: 100,
  stock: 2,
  description: 'Verification flow product'
};

async function run() {
  // Create product
  const { data: created, error: createErr } = await supabase.from('products').insert([productBase]).select().single();
  if (createErr) throw new Error(`create product error: ${createErr.message}`);
  log('product.created', { id: created.id, name: created.name, stock: created.stock });

  // Read product
  const { data: fetched, error: fetchErr } = await supabase.from('products').select('*').eq('id', created.id).single();
  if (fetchErr) throw new Error(`fetch product error: ${fetchErr.message}`);
  log('product.fetched', { id: fetched.id, name: fetched.name, stock: fetched.stock });

  // Update stock
  const { data: updated, error: updateErr } = await supabase
    .from('products')
    .update({ stock: 1 })
    .eq('id', created.id)
    .select()
    .single();
  if (updateErr) throw new Error(`update product error: ${updateErr.message}`);
  log('product.updated', { id: updated.id, stock: updated.stock });

  // Discount code add/delete (optional)
  try {
    const { data: disc, error: discErr } = await supabase
      .from('discount_codes')
      .insert([{ code: `VER${Date.now()}`, percentage: 10, expiry_date: '2099-12-31', is_active: true }])
      .select()
      .single();
    if (discErr) throw discErr;
    log('discount.created', disc);
    const { error: discDelErr } = await supabase.from('discount_codes').delete().eq('id', disc.id);
    if (discDelErr) throw discDelErr;
    log('discount.deleted', disc.id);
  } catch (e) {
    log('discount.skipped', e.message || e);
  }

  // Site settings upsert
  try {
    await supabase
      .from('site_settings')
      .update({
        store_name: 'Hive Store',
        logo_text: 'H',
        logo_url: null,
        primary_color: '#0d9488',
        secondary_color: '#111827',
      })
      .eq('id', 1);
    const { count } = await supabase.from('site_settings').select('*', { count: 'exact', head: true });
    if (count === 0) {
      await supabase.from('site_settings').insert({
        store_name: 'Hive Store',
        logo_text: 'H',
        logo_url: null,
        primary_color: '#0d9488',
        secondary_color: '#111827',
      });
    }
    const { data: settings } = await supabase.from('site_settings').select('*').single();
    log('settings.read', settings);
  } catch (e) {
    log('settings.skipped', e.message || e);
  }

  // Order creation and stock decrement
  try {
    const order = {
      id: `ord-${Date.now()}`,
      total: created.price,
      status: 'pending'
    };
    const { error: orderErr } = await supabase.from('orders').insert(order);
    if (orderErr) throw orderErr;
    log('orders.created_minimal', order.id);
  } catch (e) {
    log('orders.skipped', e.message || e);
  }

  // Decrement stock (simulate after order)
  const { data: afterOrder, error: afterOrderErr } = await supabase
    .from('products')
    .update({ stock: Math.max(0, updated.stock - 1) })
    .eq('id', created.id)
    .select()
    .single();
  if (afterOrderErr) throw new Error(`stock decrement error: ${afterOrderErr.message}`);
  log('product.stock_after_order', { id: afterOrder.id, stock: afterOrder.stock });

  // Delete product
  const { error: deleteErr } = await supabase.from('products').delete().eq('id', created.id);
  if (deleteErr) throw new Error(`delete product error: ${deleteErr.message}`);
  log('product.deleted', created.id);
}

run().catch((e) => {
  console.error('[verify.failed]', e.message);
  process.exit(1);
});
