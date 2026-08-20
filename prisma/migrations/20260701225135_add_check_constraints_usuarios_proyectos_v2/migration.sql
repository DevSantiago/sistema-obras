ALTER TABLE usuarios
ADD CONSTRAINT restriccion_estado_usuario
CHECK (estado IN ('ACTIVO', 'INACTIVO'));

ALTER TABLE proyectos_base
ADD CONSTRAINT restriccion_estado_proyecto_base
CHECK (estado_proyecto IN (
    'EN_LICITACION',
    'EN_EJECUCION',
    'FINALIZADO'
));

ALTER TABLE centros_costo
ADD CONSTRAINT restriccion_linea_negocio_centro_costo
CHECK (linea_negocio IN ('OBRA', 'INTERVENTORIA'));

ALTER TABLE centros_costo
ADD CONSTRAINT restriccion_fase_centro_costo
CHECK (fase_centro_costo IN ('LICITACION', 'EJECUCION'));

ALTER TABLE centros_costo
ADD CONSTRAINT restriccion_estado_centro_costo
CHECK (estado_centro_costo IN (
    'EN_LICITACION',
    'EN_EJECUCION',
    'FINALIZADO'
));

ALTER TABLE accesos_usuario_proyecto
ADD CONSTRAINT restriccion_linea_negocio_acceso
CHECK (linea_negocio IN ('OBRA', 'INTERVENTORIA'));

ALTER TABLE roles_lineas_negocio
ADD CONSTRAINT restriccion_linea_negocio_rol
CHECK (linea_negocio IN ('OBRA', 'INTERVENTORIA'));