INSERT INTO "roles_permisos" (
    "id",
    "rol_id",
    "permiso_id",
    "creado_en"
)
SELECT
    gen_random_uuid()::text,
    "roles"."id",
    "permisos"."id",
    CURRENT_TIMESTAMP
FROM "roles"
CROSS JOIN "permisos"
WHERE
    "roles"."nombre" = 'AUXILIAR_CONTABLE'
    AND "permisos"."codigo" = 'MARCAR_COMO_PAGADO'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
