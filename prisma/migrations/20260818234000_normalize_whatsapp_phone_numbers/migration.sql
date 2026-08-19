UPDATE notificaciones_whatsapp
SET telefono_destinatario = CASE
  WHEN regexp_replace(telefono_destinatario, '[^0-9]', '', 'g') LIKE '57%'
    THEN regexp_replace(telefono_destinatario, '[^0-9]', '', 'g')
  ELSE '57' || regexp_replace(telefono_destinatario, '[^0-9]', '', 'g')
END
WHERE telefono_destinatario IS NOT NULL
  AND regexp_replace(telefono_destinatario, '[^0-9]', '', 'g') <> '';
