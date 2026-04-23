-- 1. Notify New Order (Admin & Client)
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Admin broadcast (user_id = NULL) - only sent if the order is effectively created
  INSERT INTO public.notifications (order_id, title, message, type)
  VALUES (
    NEW.id, 'Novo Pedido Recebido', 
    'Pedido #' || COALESCE(NEW.codigo_pedido, 'Pendente') || ' de ' || NEW.quantidade_kg || 'kg aguardando.', 
    'NEW_ORDER'
  );

  -- Client direct notification (Success notification)
  INSERT INTO public.notifications (user_id, order_id, title, message, type)
  VALUES (
    NEW.user_id, NEW.id, 'Pedido Concluído e em Análise', 
    'Seu pedido #' || COALESCE(NEW.codigo_pedido, 'Pendente') || ' foi recebido em nosso sistema e será avaliado.', 
    'SYSTEM'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Notify Assignment (Staff)
CREATE OR REPLACE FUNCTION notify_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, order_id, title, message, type)
    VALUES (
      NEW.assigned_to, NEW.id, 'Nova Entrega Atribuída',
      'Você foi alocado para a entrega do pedido #' || COALESCE(NEW.codigo_pedido, NEW.id::text) || ' (' || NEW.quantidade_kg || 'kg).',
      'ASSIGNMENT'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_assignment ON public.orders;
CREATE TRIGGER trigger_notify_assignment
  AFTER UPDATE OF assigned_to ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_assignment();

-- 3. Notify Status Update (Only Client)
CREATE OR REPLACE FUNCTION notify_status_update()
RETURNS TRIGGER AS $$
DECLARE
  v_changer_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Busca o nome (método seguro)
    v_changer_name := (SELECT nome FROM public.profiles WHERE id = auth.uid() LIMIT 1);
    
    IF v_changer_name IS NULL THEN 
      v_changer_name := 'Alguém da equipe'; 
    END IF;

    INSERT INTO public.notifications (user_id, order_id, title, message, type)
    VALUES (
      NEW.user_id, NEW.id, 'Atualização de Pedido',
      'O pedido #' || COALESCE(NEW.codigo_pedido, NEW.id::text) || ' (' || NEW.quantidade_kg || 'kg) mudou para: ' || NEW.status || '. (Atualizado por: ' || v_changer_name || ')', 
      'STATUS_UPDATE'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
