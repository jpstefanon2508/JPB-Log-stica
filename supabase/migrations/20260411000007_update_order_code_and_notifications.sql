-- 1. Add order_code to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS codigo_pedido TEXT;

-- 2. Function to generate sequential order code
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
DECLARE
  count_today INTEGER;
  today_str TEXT;
BEGIN
  -- If somehow already has a code, don't overwrite
  IF NEW.codigo_pedido IS NOT NULL THEN
    RETURN NEW;
  END IF;

  today_str := to_char(now(), 'YYYYMMDD');
  
  -- Count orders created today
  SELECT COUNT(*) INTO count_today FROM public.orders WHERE to_char(created_at, 'YYYYMMDD') = today_str;
  
  -- The new code: YYYYMMDD + 4 digits
  NEW.codigo_pedido := today_str || lpad((count_today + 1)::text, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_order_code ON public.orders;
CREATE TRIGGER trigger_generate_order_code
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_code();

-- Generate code for existing orders
DO $$
DECLARE
  order_rec RECORD;
  count_today INTEGER;
  today_str TEXT;
BEGIN
  FOR order_rec IN SELECT * FROM public.orders WHERE codigo_pedido IS NULL ORDER BY created_at ASC LOOP
    today_str := to_char(order_rec.created_at, 'YYYYMMDD');
    SELECT COUNT(*) INTO count_today FROM public.orders WHERE to_char(created_at, 'YYYYMMDD') = today_str AND codigo_pedido IS NOT NULL;
    UPDATE public.orders SET codigo_pedido = today_str || lpad((count_today + 1)::text, 4, '0') WHERE id = order_rec.id;
  END LOOP;
END;
$$;

-- 3. Update Notifications
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a broadcast notification for admins/staff (user_id = NULL)
  INSERT INTO public.notifications (order_id, title, message, type)
  VALUES (
    NEW.id,
    'Novo Pedido Recebido',
    'Pedido #' || NEW.codigo_pedido || ' de ' || NEW.quantidade_kg || 'kg aguardando confirmação.',
    'NEW_ORDER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION notify_status_update()
RETURNS TRIGGER AS $$
DECLARE
  v_changer_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    
    -- Pick up the name of who changed it
    SELECT nome INTO v_changer_name FROM public.profiles WHERE id = auth.uid();
    IF v_changer_name IS NULL THEN
      v_changer_name := 'Alguém da equipe';
    END IF;

    -- Insert a notification specifically for the client (user_id = NEW.user_id)
    INSERT INTO public.notifications (user_id, order_id, title, message, type)
    VALUES (
      NEW.user_id,
      NEW.id,
      'Atualização de Pedido',
      'O pedido #' || NEW.codigo_pedido || ' (' || NEW.quantidade_kg || 'kg) mudou para: ' || NEW.status || '. (Atualizado por: ' || v_changer_name || ')',
      'STATUS_UPDATE'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
