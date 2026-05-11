-- Run this in Supabase SQL Editor if the app opens but data is empty.

insert into public.categories (id, name, type, icon, sort_order, is_active)
values
('all', 'الكل', 'all', '🔥', 1, true),
('available', 'متاح الآن', 'available', '✅', 2, true),
('night', 'طلبات ليلية', 'night', '🌙', 3, true),
('super', 'سوبر ماركت', 'super', '🛒', 4, true),
('pharma', 'صيدليات', 'pharma', '💊', 5, true),
('food', 'مطاعم', 'food', '🍔', 6, true),
('fresh', 'خضار وفاكهة', 'fresh', '🥦', 7, true)
on conflict (id) do update set
name=excluded.name, type=excluded.type, icon=excluded.icon, sort_order=excluded.sort_order, is_active=true;

insert into public.zones (name, fee, eta, is_active)
values
('داخل بيلا', 20, '30–45 دقيقة', true),
('قرية قريبة', 35, '45–60 دقيقة', true),
('قرية بعيدة', 50, '60–90 دقيقة', true);

insert into public.app_settings (key, value)
values
('content', '{
  "siteName":"طلبات بيلا",
  "location":"بيلا، كفر الشيخ",
  "logoText":"طلبات\\nبيلا",
  "logoImage":"",
  "supportPhone":"201000000000",
  "bannerTitle":"اطلب كل\\nاحتياجاتك",
  "bannerSubtitle":"توصيل محلي سريع من المتاجر القريبة",
  "bannerSmall":"متاح الآن داخل بيلا",
  "bannerButton":"ابدأ الطلب",
  "bannerIcon":"🛵",
  "bannerImage":"",
  "primaryColor":"#ff5a1f",
  "secondaryColor":"#ff7a2d",
  "minimumOrder":100
}'::jsonb)
on conflict (key) do update set value=excluded.value;

-- Add sample stores/products from the dashboard after this, or ask me for a full seed script.
