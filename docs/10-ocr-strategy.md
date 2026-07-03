# 10. Estrategia OCR

## Alcance futuro

OCR no es obligatorio para el MVP. En fases posteriores puede apoyar la lectura de soportes.

El OCR no reemplaza validaciones humanas ni reglas de aprobación. Solo propone datos para acelerar captura y revisión.

## Usos posibles

- Extraer proveedor.
- Extraer beneficiario.
- Extraer tipo y número de documento.
- Extraer banco y cuenta cuando aparezcan en soportes.
- Extraer valor bruto.
- Extraer impuestos.
- Extraer retenciones.
- Extraer valor neto.
- Extraer fecha de factura.
- Extraer número de factura.
- Extraer comprobantes de retiro.
- Extraer comprobantes de reingreso.
- Extraer cargos bancarios.
- Extraer soporte de adjudicación o inicio de ejecución.

## Reglas

- OCR sugiere, no decide.
- Usuario autorizado confirma.
- No se deben crear movimientos financieros automáticamente sin validación.
- No se deben aprobar solicitudes automáticamente.
- No se deben crear beneficiarios automáticamente sin confirmación.
- No se deben modificar datos bancarios automáticamente.
- Los datos extraídos deben quedar trazables.

## Relación con tablas

- Soportes: `adjuntos`.
- Resultados: `resultados_ocr`.
- Beneficiarios: `beneficiarios_pago`.
- Proveedores: `proveedores`.
- Solicitudes: `solicitudes_pago`.
- Impuestos sugeridos: `impuestos_retenciones_solicitud`.
- Operaciones de efectivo sugeridas: `operaciones_efectivo`.
- Cargos financieros sugeridos: `cargos_financieros`.
- Movimientos definitivos: `movimientos_fondo`.

## Estados OCR

```text
NO_PROCESADO
PENDIENTE
PROCESADO
FALLIDO
```

## Validación humana obligatoria

Los resultados de OCR nunca deben crear automáticamente:

- Solicitudes aprobadas.
- Movimientos financieros.
- Cargos financieros.
- Impuestos o retenciones definitivos.
- Reingresos de sobrantes.
- Beneficiarios activos.
- Proveedores activos.
- Cambios de datos bancarios.

El OCR solo propone datos. La confirmación corresponde a un usuario autorizado y debe quedar auditada.

## Relación con módulos actuales

En la fase actual del MVP, OCR queda fuera del desarrollo activo. La prioridad es cerrar:

```text
usuarios
roles/permisos/accesos
proyectos base
centros de costo
beneficiarios
solicitudes
aprobaciones
pagos
financiero
```

Cuando el OCR se implemente, debe consumir la estructura ya validada y no introducir reglas paralelas.
