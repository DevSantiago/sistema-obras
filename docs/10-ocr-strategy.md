# 10. Estrategia OCR

## Alcance futuro

OCR no es obligatorio para el MVP. En fases posteriores puede apoyar la lectura de soportes.

## Usos posibles

- Extraer proveedor.
- Extraer beneficiario.
- Extraer valor bruto.
- Extraer impuestos.
- Extraer retenciones.
- Extraer valor neto.
- Extraer fecha de factura.
- Extraer número de factura.
- Extraer comprobantes de retiro.
- Extraer comprobantes de reingreso.
- Extraer cargos bancarios.
- Extraer soporte de adjudicación.

## Reglas

- OCR sugiere, no decide.
- Usuario autorizado confirma.
- No se deben crear movimientos financieros automáticamente sin validación.
- No se deben aprobar solicitudes automáticamente.
- Los datos extraídos deben quedar trazables.

## Relación con tablas

- Soportes: `adjuntos`.
- Resultados: `resultados_ocr`.
- Solicitudes: `solicitudes_pago`.
- Impuestos sugeridos: `impuestos_retenciones_solicitud`.
- Operaciones de efectivo sugeridas: `operaciones_efectivo`.
- Cargos financieros sugeridos: `cargos_financieros`.

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

El OCR solo propone datos. La confirmación corresponde a un usuario autorizado y debe quedar auditada.
