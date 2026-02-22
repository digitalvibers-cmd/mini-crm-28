-- Migracija za ERP nadogradnju 28 CRM sistema
-- Dodavanje tabela za Cenovnike, Dobavljače, Isporuku i Finansije

-- 1. Cena i Važenje Paketa (Price Lists)
CREATE TABLE IF NOT EXISTS public.price_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- Ime cenovnika ili paketa (npr. Zima 2026, Akcija Leto, itd.)
    program_name TEXT NOT NULL, -- A, B, C, Keto
    size TEXT NOT NULL, -- BIG, SMALL
    price DECIMAL(10, 2) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Alter orders to optionally link to a price list
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS price_list_id UUID REFERENCES public.price_lists(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'woo'; -- woo, manual, b2b

-- 2. Zone isporuke (Delivery Zones)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- Zvezdara, Novi Beograd, itd.
    delivery_price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Povezivanje klijenata / adresa sa zonama
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS current_delivery_zone_id UUID REFERENCES public.delivery_zones(id);

-- 3. Dobavljači (Suppliers) i Nabavka
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES public.suppliers(id),
    status TEXT DEFAULT 'draft', -- draft, ordered, received
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id),
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Finansije (Finances - Prihodi i Rashodi)
CREATE TABLE IF NOT EXISTS public.finances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'income' (prihod) ili 'expense' (rashod)
    category TEXT NOT NULL, -- fiksni, varijabilni
    amount DECIMAL(10, 2) NOT NULL,
    reference_id UUID, -- moze biti order_id za prihod ili purchase_order_id za rashod nabavke
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Turn on row level security for all new tables
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;

-- Temporary full manual access policies for authenticated users
CREATE POLICY "Enable read access for all users" ON public.price_lists FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.price_lists FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.delivery_zones FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.purchase_orders FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.purchase_order_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.finances FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.finances FOR ALL USING (auth.role() = 'authenticated');
