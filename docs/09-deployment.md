# 09. Despliegue

## Ambientes

```text
desarrollo
staging
produccion
```

También puede existir un ambiente local de desarrollo por máquina.

## Variables de entorno

- Conexión a base de datos.
- Configuración de autenticación.
- Secreto JWT o equivalente de sesión.
- Bucket o ruta de archivos.
- Parámetros de correo si aplica.
- Configuración OCR futura.

## Migraciones

Las migraciones deben crear o evolucionar primero la base común y luego los módulos funcionales:

1. Usuarios, roles, permisos y líneas de negocio por rol.
2. Proyectos base.
3. Centros de costo operativos.
4. Fondos generales por proyecto base.
5. Accesos por proyecto y línea.
6. Restricciones `CHECK` base.
7. Proveedores y beneficiarios.
8. Secuencias.
9. Solicitudes.
10. Adjuntos.
11. Impuestos y retenciones.
12. Operaciones de efectivo.
13. Cargos financieros.
14. Movimientos financieros.
15. Auditoría y reportes.

Reglas:

- No modificar migraciones ya aplicadas.
- Toda corrección posterior debe hacerse con una migración nueva.
- No usar `prisma migrate reset` en ambientes con datos que se deban conservar.
- Después de cambios de Prisma se debe ejecutar `npx prisma generate`.
- Si Next mantiene cliente anterior en cache, limpiar `.next` y reiniciar servidor.

## Seed

El seed debe garantizar:

- Roles vigentes.
- Permisos vigentes.
- Relación roles-permisos.
- Relación roles-líneas de negocio.
- Usuario administrador inicial.
- Inactivación de roles obsoletos como `LECTURA`, salvo decisión posterior.

## Pruebas mínimas

### Autenticación y usuarios

- Login.
- Consulta de sesión.
- Creación de usuario.
- Asignación de rol único.
- Asignación de accesos por proyecto y línea.
- Validar que `SOLICITANTE` no pueda recibir `INTERVENTORIA`.
- Activar e inactivar usuario.

### Proyectos base y centros de costo

- Crear proyecto solo `OBRA`.
- Crear proyecto solo `INTERVENTORIA`.
- Crear proyecto con ambas líneas.
- Crear fondo general.
- Pasar `PRO-OBRA` a `OBRA`.
- Pasar `PRO-INT` a `INT`.
- Finalizar `OBRA` o `INT`.
- Validar autorización con `CREAR_PROYECTOS`.

### Beneficiarios

- Crear beneficiario tipo `TRABAJADOR`.
- Crear beneficiario tipo `PROVEEDOR` con proveedor nuevo.
- Listar beneficiarios.
- Consultar beneficiario por ID.
- Validar duplicado por tipo y número de documento.
- Validar que datos bancarios obligatorios sean requeridos.

### Solicitudes

- Crear solicitud.
- Enviar.
- Aprobar nivel 1.
- Aprobar nivel 2.
- Verificar estado `PROGRAMADA_PAGO`.
- Marcar como `PAGADA`.

### Movimientos

- Registrar ingreso.
- Registrar egreso.
- Verificar saldo anterior y nuevo.
- Impedir saldo negativo.

### Efectivo

- Pago exacto.
- Pago con retiro superior.
- Sobrante pendiente.
- Reingreso de sobrante.
- Verificar que no pasa por aprobación.

### Impuestos

- Registrar IVA.
- Registrar retención.
- Validar valor neto.
- Verificar que no crea aprobación independiente.

### Cargos financieros

- Registrar GMF.
- Registrar comisión.
- Verificar egreso.

## Comandos mínimos de validación

```bash
npm run lint
npm run test:run
```

Cuando existan rutas nuevas, validar además con `curl` o cliente HTTP.

## Respaldo

- Backups automáticos de base de datos.
- Versionamiento de adjuntos.
- Exportación periódica de auditoría.
- Respaldo antes de migraciones en staging y producción.

## Validación de integridad documental antes de despliegue

Antes de pasar a desarrollo, staging o producción, se debe verificar que:

- El modelo de datos no contenga tablas reemplazadas por decisiones vigentes.
- Los nombres de tablas y campos estén en español.
- Los endpoints usen la misma nomenclatura del modelo.
- Los flujos coincidan con los estados documentados.
- El backlog cubra las decisiones funcionales vigentes.
- Los permisos documentados coincidan con el seed.
- Las restricciones críticas estén en base de datos y no solo en el service.
