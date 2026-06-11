# 09. Despliegue

## Ambientes

```text
desarrollo
pruebas
produccion
```

## Variables de entorno

- Conexión a base de datos.
- Configuración de autenticación.
- Bucket de archivos.
- Parámetros de correo si aplica.
- Configuración OCR futura.

## Migraciones

Las migraciones deben crear primero:

1. Usuarios y roles.
2. Centros de costo.
3. Variantes.
4. Fondos.
5. Beneficiarios.
6. Solicitudes.
7. Impuestos y retenciones.
8. Operaciones de efectivo.
9. Cargos financieros.
10. Movimientos financieros.
11. Adjuntos, auditoría y reportes.

## Pruebas mínimas

### Solicitudes

- Crear solicitud.
- Enviar.
- Aprobar nivel 1.
- Aprobar nivel 2.
- Verificar estado `PROGRAMADA_PAGO`.
- Marcar como `PAGADA`.

### Centro de costo

- Crear en `EN_PROPUESTA`.
- Marcar como `ADJUDICADO`.
- Crear directamente como `ADJUDICADO`.
- Iniciar ejecución.
- Verificar saldo único.

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

## Respaldo

- Backups automáticos de base de datos.
- Versionamiento de adjuntos.
- Exportación periódica de auditoría.

## Validación de integridad documental antes de despliegue

Antes de pasar a desarrollo, se debe verificar que:

- El modelo de datos no contenga tablas reemplazadas por decisiones vigentes.
- Los nombres de tablas y campos estén en español.
- Los endpoints usen la misma nomenclatura del modelo.
- Los flujos coincidan con los estados documentados.
- El backlog cubra las decisiones funcionales vigentes.
