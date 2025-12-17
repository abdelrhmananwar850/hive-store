## المطلوب من Supabase (DDL جاهز)
### 1) تعديل جدول المنتجات
```sql
alter table products add column if not exists sku text;
alter table products add column if not exists barcode text;
alter table products add column if not exists seo_title text;
alter table products add column if not exists seo_description text;

create unique index if not exists products_sku_uq on products(sku) where sku is not null;
```

### 2) جدول العلامات وربطها بالمنتجات
```sql
create table if not exists tags (
  id bigserial primary key,
  name text unique not null
);

create table if not exists product_tags (
  product_id text not null references products(id) on delete cascade,
  tag_id bigint not null references tags(id) on delete cascade,
  primary key (product_id, tag_id)
);

create index if not exists idx_product_tags_product on product_tags(product_id);
create index if not exists idx_product_tags_tag on product_tags(tag_id);
```

### 3) جدول تقييمات العملاء
```sql
create table if not exists reviews (
  id bigserial primary key,
  product_id text not null references products(id) on delete cascade,
  user_id text, -- اختياري إذا فعّلنا مصادقة العملاء
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamp default now()
);

create index if not exists idx_reviews_product on reviews(product_id);
create index if not exists idx_reviews_status on reviews(status);
create index if not exists idx_reviews_created on reviews(created_at);
```

### 4) جدول المنتجات المرتبطة
```sql
create table if not exists product_relations (
  product_id text not null references products(id) on delete cascade,
  related_id text not null references products(id) on delete cascade,
  type text not null default 'manual' check (type in ('manual','auto')),
  primary key (product_id, related_id)
);

create index if not exists idx_relations_product on product_relations(product_id);
```

### 5) (اختياري) مسارات ودّية
```sql
alter table products add column if not exists slug text;
create unique index if not exists products_slug_uq on products(slug) where slug is not null;
```

## سياسات مبسّطة (RLS) عند الحاجة
- فعّل RLS:
```sql
alter table products enable row level security;
alter table tags enable row level security;
alter table product_tags enable row level security;
alter table reviews enable row level security;
alter table product_relations enable row level security;
```
- سياسات أساسية (مثال أولي — قابلة للتخصيص لاحقًا):
  - قراءة عامة:
```sql
create policy read_all_products on products for select using (true);
create policy read_all_tags on tags for select using (true);
create policy read_approved_reviews on reviews for select using (status = 'approved');
create policy read_relations on product_relations for select using (true);
```
  - الكتابة للمشرف فقط (إن وجدت مصادقة وclaim is_admin=true):
```sql
create policy admin_write_products on products for all using (current_setting('request.jwt.claims', true)::jsonb ? 'is_admin' and (current_setting('request.jwt.claims', true)::jsonb ->> 'is_admin') = 'true') with check (current_setting('request.jwt.claims', true)::jsonb ? 'is_admin' and (current_setting('request.jwt.claims', true)::jsonb ->> 'is_admin') = 'true');
-- سياسات مماثلة لـ tags, product_tags, product_relations, reviews (approve/reject)
```
> لو بدون مصادقة الآن، نبدأ بسياسات قراءة فقط، ونؤجل سياسات الكتابة حتى نربط Auth.

## بعد الإضافة
- أحدّث واجهة الإدارة لإظهار حقول: SKU/Barcode/SEO، محرّر العلامات، منتجات مرتبطة، ولوحة مراجعة التقييمات.
- أحدّث واجهة العميل لعرض SEO والتقييمات والمرتبط.
- أضيف توليد الباركود (JsBarcode) مع زر طباعة/تنزيل.

هل تحب أبدأ بتنفيذ المخطط الآن أم تنتظر ربط الـAuth لتفعيل سياسات الكتابة للمشرف؟