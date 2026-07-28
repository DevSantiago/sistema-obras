INSERT INTO "permisos" (
    "id",
    "codigo",
    "nombre",
    "descripcion",
    "activo",
    "creado_en",
    "actualizado_en"
)
VALUES (
    gen_random_uuid()::text,
    'CONSULTAR_FONDOS',
    'Consultar fondos',
    'Permite consultar saldos y gasto acumulado de los fondos generales.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("codigo") DO UPDATE
SET
    "nombre" = EXCLUDED."nombre",
    "descripcion" = EXCLUDED."descripcion",
    "activo" = true,
    "actualizado_en" = CURRENT_TIMESTAMP;

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
    "roles"."nombre" IN (
        'ADMINISTRADOR',
        'DIRECTOR',
        'AUXILIAR_CONTABLE',
        'PAGOS'
    )
    AND "permisos"."codigo" = 'CONSULTAR_FONDOS'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
