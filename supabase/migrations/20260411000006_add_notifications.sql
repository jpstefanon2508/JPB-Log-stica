-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id), -- The recipient. NULL means broadcast to admins/staff
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'NEW_ORDER', 'STATUS_UPDATE', 'SYSTEM'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;

-- Policies
DROP POLICY IF EXISTS "Users can view own or broadcast notifications" ON public.notifications;
CREATE POLICY "Users can view own or broadcast notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND perfil IN ('ADMIN', 'SUPER_ADMIN', 'FUNCIONARIO')
    ))
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND perfil IN ('ADMIN', 'SUPER_ADMIN', 'FUNCIONARIO')
    ))
  );

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- DB triggers for notifications

-- 1. Notify on NEW ORDER
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a broadcast notification for admins/staff (user_id = NULL)
  INSERT INTO public.notifications (order_id, title, message, type)
  VALUES (
    NEW.id,
    'Novo Pedido Recebido',
    'Pedido de ' || NEW.quantidade_kg || 'kg aguardando confirmação.',
    'NEW_ORDER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.orders;
CREATE TRIGGER trigger_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- 2. Notify on STATUS UPDATE
CREATE OR REPLACE FUNCTION notify_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Insert a notification specifically for the client (user_id = NEW.user_id)
    INSERT INTO public.notifications (user_id, order_id, title, message, type)
    VALUES (
      NEW.user_id,
      NEW.id,
      'Atualização de Pedido',
      'O status do seu pedido mudou para: ' || NEW.status,
      'STATUS_UPDATE'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_status_update ON public.orders;
CREATE TRIGGER trigger_notify_status_update
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_status_update();

