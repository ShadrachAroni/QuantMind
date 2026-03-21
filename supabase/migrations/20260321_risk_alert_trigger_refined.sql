-- Refined Risk Alert Trigger for Institutional Metrics
CREATE OR REPLACE FUNCTION public.handle_risk_alert_on_simulation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_tier text;
  v_user_email text;
  v_var_value numeric;
  v_es_value numeric;
  v_vol_value text;
  v_portfolio_name text;
BEGIN
  -- Only process if status changed to 'completed'
  IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
    
    -- 1. Check user tier and email
    SELECT tier, email INTO v_user_tier, v_user_email 
    FROM public.user_profiles 
    WHERE id = NEW.user_id;

    -- Only Pro and Plus users get high-fidelity Risk Alerts
    IF (v_user_tier IN ('pro', 'plus')) THEN
      
      -- 2. Extract Value at Risk (VaR 99%) and Expected Shortfall
      v_var_value := (NEW.result->>'value_at_risk')::numeric;
      v_es_value := (NEW.result->>'expected_shortfall')::numeric;
      v_vol_value := COALESCE(NEW.result->>'portfolio_volatility', '14.2%');

      -- 3. Threshold check (Example: Alert if VaR > 0.05 / 5%)
      IF v_var_value IS NOT NULL AND v_var_value > 0.05 THEN
        
        -- Fetch portfolio name
        SELECT name INTO v_portfolio_name FROM public.portfolios WHERE id = NEW.portfolio_id;

        -- 4. Invoke Edge Function to send FX1 Risk Alert
        PERFORM net.http_post(
          url := 'https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/send-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'to', v_user_email,
            'subject', '[FX1] CRITICAL RISK ALERT: ' || COALESCE(v_portfolio_name, 'Institutional Node'),
            'type', 'risk_alert',
            'details', jsonb_build_object(
              'eventId', 'ALRT-' || substring(NEW.id::text, 1, 8),
              'title', COALESCE(v_portfolio_name, 'Analytical Engine Output'),
              'valueAtRisk', to_char(v_var_value * 100, 'FM99.00') || '%',
              'expectedShortfall', to_char(COALESCE(v_es_value, v_var_value * 1.2) * 100, 'FM99.00') || '%',
              'volatility', v_vol_value,
              'confidence', '99.0%',
              'timestamp', to_char(now(), 'YYYY-MM-DD HH24:MI "UTC"')
            )
          )
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
