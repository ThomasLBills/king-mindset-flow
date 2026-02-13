
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Stripe customers
CREATE TABLE public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Plans
CREATE TABLE public.plans (
  plan_key TEXT PRIMARY KEY,
  stripe_price_id TEXT NOT NULL,
  name TEXT NOT NULL,
  interval TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Entitlements
CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  entitlement_type TEXT NOT NULL DEFAULT 'course_app_access',
  active BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'stripe',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entitlement_type)
);
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Webhook events (idempotency)
CREATE TABLE public.webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer: get_entitlement (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_active_entitlement(_user_id UUID, _type TEXT DEFAULT 'course_app_access')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = _user_id AND entitlement_type = _type AND active = true
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS POLICIES

-- profiles: user reads/updates own
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- stripe_customers: user reads own
CREATE POLICY "Users read own stripe customer" ON public.stripe_customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all stripe customers" ON public.stripe_customers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- plans: public read
CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT USING (true);

-- subscriptions: user reads own
CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- payments: user reads own
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all payments" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- entitlements: user reads own
CREATE POLICY "Users read own entitlements" ON public.entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all entitlements" ON public.entitlements FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- webhook_events: admin only
CREATE POLICY "Admin reads webhook events" ON public.webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: user reads own, admin reads all
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin inserts roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND auth.uid() != user_id);

-- Seed plans (placeholder price IDs - update with real ones)
INSERT INTO public.plans (plan_key, stripe_price_id, name, interval, amount, currency)
VALUES 
  ('monthly', 'price_monthly_placeholder', 'Course + App Access — Monthly', 'month', 2900, 'usd'),
  ('annual', 'price_annual_placeholder', 'Course + App Access — Annual', 'year', 24900, 'usd');
