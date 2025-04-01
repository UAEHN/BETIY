# بيتي - تطبيق للتواصل المباشر

<div dir="rtl">

## نظرة عامة 🌟

تطبيق بيتي هو منصة للتواصل المباشر تتيح للمستخدمين التواصل مع العائلة والأصدقاء بطريقة سهلة وآمنة. المشروع مبني باستخدام Next.js وSupabase.

## المميزات 🚀

- تسجيل الدخول وإنشاء حساب جديد
- البحث عن المستخدمين باستخدام الاسم الظاهر
- إدارة قائمة جهات الاتصال
- محادثات مباشرة
- عرض وإدارة المنتجات في المحادثات
- واجهة مستخدم متوافقة مع الأجهزة المحمولة

## التقنيات المستخدمة 💻

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Backend**: Supabase (قاعدة بيانات PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS, Shadcn UI

## متطلبات التثبيت ⚙️

1. Node.js (الإصدار 16 أو أحدث)
2. npm أو yarn
3. حساب Supabase

## خطوات التثبيت 🔧

1. انسخ المستودع:
   ```bash
   git clone https://github.com/UAEHN/BETIY.git
   cd BETIY
   ```

2. قم بتثبيت الاعتمادات:
   ```bash
   npm install
   # أو
   yarn install
   ```

3. أنشئ ملف `.env.local` وأضف متغيرات البيئة المطلوبة:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. قم بتشغيل خادم التطوير:
   ```bash
   npm run dev
   # أو
   yarn dev
   ```

5. افتح المتصفح على العنوان `http://localhost:3000`

## استخدام التطبيق 📱

1. قم بإنشاء حساب جديد أو تسجيل الدخول.
2. اذهب إلى صفحة البحث عن مستخدمين للعثور على أصدقائك وعائلتك باستخدام الاسم الظاهر.
3. أضف المستخدمين إلى قائمة جهات الاتصال الخاصة بك.
4. ابدأ المحادثات وتبادل الرسائل والمنتجات.

## المساهمة 👥

نرحب بجميع المساهمات! إذا كنت ترغب في المساهمة، يرجى:

1. عمل Fork للمشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing_feature`)
3. القيام بـ Commit للتغييرات (`git commit -m 'إضافة ميزة رائعة'`)
4. دفع الفرع (`git push origin feature/amazing_feature`)
5. فتح طلب Pull Request

## الترخيص 📄

هذا المشروع مُرخص بموجب رخصة MIT.

</div>
