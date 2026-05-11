# طلبات بيلا — Supabase Final

نسخة مربوطة بقاعدة بيانات Supabase حقيقية.

## Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://refwvdyksbovxwmmwuwk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ضع نفس المفتاح الذي أرسلته

## الروابط
- Customer UI: /
- Admin Login: /login
- Dashboard: /admin
- Success: /success
- Tracking: /track

## Admin
admin@talabatbela.com
123456

## ملاحظة
يجب إنشاء الجداول والسياسات التي أرسلتها لك سابقًا في Supabase SQL Editor قبل التجربة.


## Safe Load Fix
هذه النسخة تحتوي على Safe Loader:
إذا تأخر Supabase أو كانت الجداول/الصلاحيات غير جاهزة، الواجهة لن تظل معلقة على جاري التحميل، وستفتح ببيانات Demo مؤقتة.

لو الطلبات لا تظهر في Dashboard:
1. تأكد من تنفيذ SQL للجداول والسياسات.
2. تأكد من Environment Variables في Vercel.
3. استخدم Incognito أو عطّل إضافات Chrome، لأن بعض الأخطاء في Console تأتي من Extensions وليس من التطبيق.


## Dashboard Fixed
هذه النسخة تمنع تعليق الـ Dashboard على "جاري التحميل..." حتى لو Supabase لم يرجع بيانات.
لو ظهرت رسالة Demo Mode داخل Dashboard، شغّل SQL الخاص بالجداول والسياسات والـ Seed في Supabase.


## Repair notes
- Run SUPABASE_FULL_SETUP.sql first.
- If the customer app shows Demo mode, orders will not be accepted.
- /n and \n are normalized into line breaks in the customer UI.


## Pro UI Update
- واجهة العميل اتغيرت بالكامل لتصميم أقرب لـ Instashop/Talabat.
- البحث عن متجر أو منتج يعمل في نفس الوقت ويظهر نتائج المنتجات والمتاجر.
- CMS يحتوي الآن على Upload فعلي للوجو والبانر مع المقاسات الموصى بها.
- إدارة المتاجر والمنتجات تحتوي على Upload للصور.
- تم إصلاح ظهور /n في البانر واللوجو وتحويله إلى سطر جديد.
- المقاسات الموصى بها:
  - Logo: 512x512 PNG/WebP
  - Main Banner: 1080x520 Mobile / 1600x700 Wide
  - Store Logo: 512x512
  - Product Image: 800x800
