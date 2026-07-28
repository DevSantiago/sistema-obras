INSERT INTO "permisos" (
  "id", "codigo", "nombre", "descripcion", "activo", "creado_en", "actualizado_en"
)
VALUES (
  gen_random_uuid(),
  'REGISTRAR_PRESTAMOS',
  'Registrar préstamos',
  'Permite registrar préstamos que ingresan al fondo general de un proyecto.',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT ("codigo") DO UPDATE SET
  "nombre" = EXCLUDED."nombre",
  "descripcion" = EXCLUDED."descripcion",
  "activo" = TRUE,
  "actualizado_en" = NOW();

INSERT INTO "roles_permisos" ("id", "rol_id", "permiso_id", "creado_en")
SELECT gen_random_uuid(), r."id", p."id", NOW()
FROM "roles" r
CROSS JOIN "permisos" p
WHERE r."nombre" IN ('ADMINISTRADOR', 'AUXILIAR_CONTABLE')
  AND p."codigo" = 'REGISTRAR_PRESTAMOS'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
