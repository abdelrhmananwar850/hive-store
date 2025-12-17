## ملخص الربط الحالي

* تهيئة Supabase موجودة في `lib/supabaseClient.ts:3-6` عبر `createClient` بمفتاح وعنوان ثابتين.

* المنتجات: CRUD عبر Supabase في `services/storeService.ts:21-23, 72-77, 98-104, 112-119`.

* الإعدادات: قراءة/تحديث من جدول `site_settings` في `context/StoreContext.tsx:67-76, 208-214` مع إدراج أولي `216-226`.

* الخصومات: قراءة/إدراج/حذف في `context/StoreContext.tsx:79-88, 268-279, 281-284`.

* الطلبات: قراءة/إدراج وتقليل المخزون في `context/StoreContext.tsx:100-111, 245-253, 257-262`.

* صفحة المنتج تستخدم علم `VITE_MOCK_DATA` فقط لقراءة المنتج محلياً أو من Supabase في `pages/ProductDetails.tsx:15-29`.

* الصور لا تستخدم `supabase.storage`؛ تُخزَّن كنص (Base64) في الحقل `image`:

  * رفع الصورة في `pages/Admin.tsx:99-108`، حفظها مع المنتج `112-122`، عرضها في `pages/ProductDetails.tsx:85-89`.

## نقاط يجب الانتباه لها

* تشغيل الخادم حالياً يتم مع `VITE_MOCK_DATA="true"`؛ هذا يؤثِّر فقط على جلب منتج التفاصيل، أما بقية العمليات فهي مباشرة على Supabase.

* مفاتيح Supabase مضمّنة في الكود؛ يُفضَّل نقلها إلى متغيرات بيئة (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

* لا يوجد حذف لملفات الصور من تخزين خارجي عند حذف المنتج؛ يُحذف السجل فقط.

## خطة تحقق يدوية (End-to-End)

* إعداد التشغيل:

  * إيقاف العلم `VITE_MOCK_DATA` وجعل قيمته `false` ثم تشغيل `npm run dev`.

  * التأكد من أن الجداول موجودة: `products`, `site_settings`, `discount_codes`, `orders`.

* منتجات:

  * إضافة منتج من لوحة الإدارة مع صورة (يتحقق من `createProduct` في `services/storeService.ts:72-77`).

  * تعديل المنتج (مثلاً السعر/المخزون/الصورة) عبر `editProduct` ليتحقق من `updateProduct` في `services/storeService.ts:98-104`.

  * حذف المنتج من الجدول (يتحقق من `deleteProductMock` في `services/storeService.ts:112-119`).

* صورة المنتج:

  * رفع صورة جديدة من `Admin` والتحقق من ظهورها في صفحة التفاصيل.

  * تعديل الصورة والتحقق من تحديث عرضها.

  * حذف المنتج ثم التأكد من اختفائه؛ ملاحظة: لا حذف على تخزين خارجي لأن التخزين غير مُستخدَم.

* سيناريو "سولد أوت":

  * تعيين `stock=0` أو إضافة إلى السلة حتى نفاد المخزون، ثم التأكد من الحالات:

    * طبقة "نفذت الكمية" في `pages/ProductDetails.tsx:73-79`.

    * الزر معطل ونص "غير متوفر حالياً" `141-151`.

    * شارة "نفذت الكمية" في بطاقات الصفحة الرئيسية.

* الإعدادات:

  * تعديل اسم المتجر والألوان ورفع الشعار من `Admin`، ثم التأكد من حفظها في `site_settings` (`context/StoreContext.tsx:208-214, 216-226`).

* الخصومات:

  * إضافة كوبون وحذفه والتحقق من انعكاسهما في Supabase (`268-279, 281-284`).

* الطلبات:

  * إجراء طلب من صفحة الدفع، التأكد من إدراج السجل في `orders` (`245-253`) وتقليل المخزون (`257-262`).

## خطة تحقق آلية

* تشغيل اختبار E2E الحالي `e2e/flow.spec.ts` للتحقق من تدفّق السلة والنفاد (يعتمد على Mock للمنتج).

* إضافة اختبار جديد يتحقق من CRUD على `products` ضد Supabase مباشرةً (اختبار تكاملي مبسّط).

## توثيق الجداول المتوقعة

* `products`: حقول مثل `id`, `name`, `price`, `sale_price`, `is_best_seller`, `stock`, `description`, `image`, `category`, `sales_count`, `options`.

* `site_settings`: `id`, `store_name`, `logo_text`, `logo_url`, `primary_color`, `secondary_color`.

* `discount_codes`: `id`, `code`, `percentage`, `expiry_date`, `is_active`.

* `orders`: `id`, `items` (JSON), `total`, `discount_applied`, `created_at`, `status`, `customer` (JSON).

## تحسينات مقترحة

* نقل مفاتيح Supabase إلى متغيرات بيئة آمنة.

* استخدام `supabase.storage` لرفع الصور وإرجاع رابط عام بدلاً من تخزين Base64.

* توسيع الاختبارات لإدراج/تحديث/حذف فعلي على Supabase مع بيئة اختبار.

