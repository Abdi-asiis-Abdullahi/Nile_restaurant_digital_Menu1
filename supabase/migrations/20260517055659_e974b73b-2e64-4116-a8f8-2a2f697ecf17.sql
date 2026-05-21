
-- Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users view own roles" on public.user_roles
  for select using (auth.uid() = user_id);

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

create policy "Public read categories" on public.categories
  for select using (true);
create policy "Admin manage categories" on public.categories
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Menu items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  header text,
  sort_order int not null default 0,
  available boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.menu_items enable row level security;

create policy "Public read menu items" on public.menu_items
  for select using (true);
create policy "Admin manage menu items" on public.menu_items
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  table_number text not null,
  payment_method text,
  payment_screenshot_url text,
  status text not null default 'pending', -- pending, accepted, preparing, served, canceled, payment_failed, trashed
  total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;

create policy "Public insert orders" on public.orders
  for insert with check (true);
create policy "Public read orders" on public.orders
  for select using (true);
create policy "Admin update orders" on public.orders
  for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admin delete orders" on public.orders
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Order items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;

create policy "Public insert order items" on public.order_items
  for insert with check (true);
create policy "Public read order items" on public.order_items
  for select using (true);
create policy "Admin update order items" on public.order_items
  for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admin delete order items" on public.order_items
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Complaints
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  table_number text,
  ordered_item text,
  message text not null,
  payment_screenshot_url text,
  type text not null default 'custom', -- custom, quick
  status text not null default 'new',  -- new, resolved, trashed
  created_at timestamptz not null default now()
);
alter table public.complaints enable row level security;

create policy "Public insert complaints" on public.complaints
  for insert with check (true);
create policy "Public read complaints" on public.complaints
  for select using (true);
create policy "Admin update complaints" on public.complaints
  for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admin delete complaints" on public.complaints
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Realtime
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.complaints;

-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('menu-images', 'menu-images', true),
  ('payment-screenshots', 'payment-screenshots', true);

create policy "Public read menu-images" on storage.objects
  for select using (bucket_id = 'menu-images');
create policy "Admin write menu-images" on storage.objects
  for insert with check (bucket_id = 'menu-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admin update menu-images" on storage.objects
  for update using (bucket_id = 'menu-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admin delete menu-images" on storage.objects
  for delete using (bucket_id = 'menu-images' and public.has_role(auth.uid(), 'admin'));

create policy "Public read payment screenshots" on storage.objects
  for select using (bucket_id = 'payment-screenshots');
create policy "Public upload payment screenshots" on storage.objects
  for insert with check (bucket_id = 'payment-screenshots');

-- Seed categories
insert into public.categories (name, slug, sort_order) values
  ('Foods', 'foods', 1),
  ('Drinks', 'drinks', 2),
  ('Desserts', 'desserts', 3);

-- Seed menu items
with c as (select id, slug from public.categories)
insert into public.menu_items (category_id, name, description, price, sort_order) 
select (select id from c where slug='foods'), n, d, p, o from (values
  ('Tikka Fish', 'Spiced grilled fish with house tikka marinade', 12.50, 1),
  ('Roll Fish', 'Crispy rolled fish fillets, golden and tender', 11.00, 2),
  ('Olive Salad', 'Fresh greens with Kalamata olives and citrus dressing', 6.50, 3),
  ('Beautiful Bread', 'Wood-fired artisan bread, warm from the oven', 3.25, 4),
  ('Delicious Pizza', 'Hand-stretched dough, San Marzano tomato, fresh basil', 14.00, 5),
  ('Banana', 'Fresh ripe banana', 0.75, 6),
  ('Delicious Burger', 'Prime beef, aged cheddar, brioche bun', 10.50, 7),
  ('Thick Red Soup', 'Rich tomato bisque with fresh herbs', 5.75, 8)
) as v(n,d,p,o)
union all
select (select id from c where slug='drinks'), n, d, p, o from (values
  ('Strawberry Milkshake', 'Creamy milkshake with fresh strawberries', 4.50, 1),
  ('Orange Juice', 'Freshly squeezed orange juice', 3.50, 2),
  ('Furulaato', 'House special Furulaato beverage', 4.00, 3),
  ('Coffee', 'Single-origin filter coffee', 2.50, 4),
  ('Espresso', 'Double shot of premium espresso', 2.75, 5),
  ('Cappuccino', 'Espresso topped with velvet milk foam', 3.50, 6),
  ('Latte', 'Smooth espresso with steamed milk', 3.75, 7),
  ('Mocha', 'Espresso, chocolate, steamed milk', 4.25, 8)
) as v(n,d,p,o)
union all
select (select id from c where slug='desserts'), n, d, p, o from (values
  ('Chocolate Lava Cake', 'Warm chocolate cake with molten center', 6.50, 1),
  ('Vanilla Ice Cream', 'Three scoops of creamy vanilla bean', 4.00, 2),
  ('Classic Cheesecake', 'New York style with berry compote', 5.75, 3),
  ('Tiramisu', 'Italian classic with espresso and mascarpone', 6.25, 4)
) as v(n,d,p,o);
