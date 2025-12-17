import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://nfeljxlqtuvihbymnwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWxqeGxxdHV2aWhieW1ud3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODA5NzMsImV4cCI6MjA4MTM1Njk3M30.Mi0sEVbz_0ZdlXpqLXmhn7KO0mSrVuYrTEX_FgV2BCU';
const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'سماعة بلوتوث احترافية',
    price: 299.99,
    sale_price: 249.99,
    stock: 50,
    description: 'سماعة لاسلكية بجودة صوت عالية وعزل ضوضاء ممتاز، مناسبة للألعاب والمكالمات.',
    category: 'الكترونيات',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'AUDIO-BT-001',
    barcode: '628100000001',
    seo_title: 'سماعة بلوتوث احترافية | Hive Store',
    seo_description: 'اشترِ أفضل سماعة بلوتوث بعزل ضوضاء وسعر مميز من Hive Store.',
    is_best_seller: true,
    options: [{ name: 'اللون', values: ['أسود', 'أبيض'] }]
  },
  {
    id: 'prod-002',
    name: 'ساعة ذكية رياضية',
    price: 150.00,
    stock: 20,
    description: 'تتبع نشاطك الرياضي ونبضات القلب بدقة عالية مع تصميم عصري.',
    category: 'اكسسوارات',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'WATCH-SPORT-002',
    barcode: '628100000002',
    seo_title: 'ساعة ذكية رياضية | Hive Store',
    seo_description: 'ساعة ذكية لمراقبة الصحة واللياقة البدنية بتصميم أنيق.',
    is_best_seller: false,
    options: [{ name: 'المقاس', values: ['40mm', '44mm'] }]
  },
  {
    id: 'prod-003',
    name: 'حقيبة ظهر عصرية',
    price: 120.00,
    stock: 0, // Sold Out scenario
    description: 'حقيبة ظهر مريحة وعملية تناسب اللابتوب والسفر اليومي.',
    category: 'موضة',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sku: 'BAG-MODERN-003',
    barcode: '628100000003',
    seo_title: 'حقيبة ظهر عصرية للابتوب | Hive Store',
    seo_description: 'حقيبة ظهر مميزة بتصميم عملي ومريح للاستخدام اليومي.',
    is_best_seller: false
  }
];

const SEED_DISCOUNTS = [
  {
    code: 'WELCOME2025',
    percentage: 10,
    expiry_date: '2025-12-31',
    is_active: true
  }
];

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. Clear existing test data (optional, careful in prod!)
  // For safety, we'll just upsert specific IDs
  
  // 2. Insert Products
  console.log('📦 Seeding Products...');
  for (const p of SEED_PRODUCTS) {
    const { error } = await supabase.from('products').upsert(p);
    if (error) console.error(`❌ Error seeding product ${p.name}:`, error.message);
    else console.log(`✅ Seeded product: ${p.name}`);
  }

  // 3. Insert Discounts
  console.log('🏷️ Seeding Discounts...');
  for (const d of SEED_DISCOUNTS) {
    // Check if exists by code to avoid duplicates if unique constraint missing
    const { data } = await supabase.from('discount_codes').select('id').eq('code', d.code).single();
    if (!data) {
       const { error } = await supabase.from('discount_codes').insert(d);
       if (error) console.error(`❌ Error seeding discount ${d.code}:`, error.message);
       else console.log(`✅ Seeded discount: ${d.code}`);
    } else {
       console.log(`ℹ️ Discount ${d.code} already exists.`);
    }
  }

  // 4. Settings (Ensure defaults)
  console.log('⚙️ Seeding Settings...');
  const { error: settingsError } = await supabase.from('site_settings').upsert({
      id: 1,
      store_name: 'Hive Store',
      logo_text: 'H',
      primary_color: '#0d9488',
      secondary_color: '#111827'
  });
  if (settingsError) console.error('❌ Error seeding settings:', settingsError.message);
  else console.log('✅ Settings seeded.');

  console.log('✨ Seed completed!');
}

seed();
