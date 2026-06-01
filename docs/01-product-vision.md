# 01. Visión del producto

## Nombre tentativo

Sistema de Gestión de Solicitudes de Pago y Fondos de Obra para Obras Civiles.

## Contexto del negocio

Actualmente, las solicitudes de pago se gestionan de forma manual. Los usuarios envían soportes mediante imágenes, fotografías o documentos que contienen información relevante como ítem, proveedor, obra, descripción, valor bruto y valor con retención. Posteriormente, una persona revisa esta información y la transcribe manualmente a Excel para realizar seguimiento y crear un registro para pagos.

Este proceso genera riesgos operativos asociados a errores de digitación, pérdida de trazabilidad, duplicidad de información, tiempos altos de revisión, dificultad para consultar estados y baja visibilidad del ciclo completo de aprobación y pago.

Adicionalmente, la empresa requiere controlar los fondos disponibles por obra. Al inicio de una obra, los recursos pueden provenir de préstamos realizados por una persona o tercero. Posteriormente, la obra puede recibir anticipos por ejecución, generar fondos propios o recibir préstamos desde otra obra. Estos movimientos deben quedar registrados y deben permitir conocer el saldo real disponible de cada obra, las deudas pendientes y los pagos realizados.

Por esta razón, el sistema no solo debe gestionar solicitudes de pago, sino también la cuenta de fondos de cada obra, sus movimientos financieros, préstamos, anticipos, devoluciones y egresos asociados a solicitudes pagadas.

## Problema a resolver

La empresa requiere reemplazar el proceso manual basado en archivos, mensajes y Excel por un sistema propio que permita centralizar, controlar y auditar las solicitudes de pago desde su creación hasta su pago final.

El sistema debe permitir que los usuarios creen solicitudes, adjunten soportes, consulten estados y reciban trazabilidad del proceso, mientras que los usuarios administrativos puedan revisar, aprobar, rechazar, programar pagos, marcar solicitudes como pagadas y exportar información para seguimiento.

Además, la empresa requiere controlar los fondos de cada obra. Actualmente, los préstamos, anticipos, devoluciones y pagos pueden manejarse de forma separada o manual, lo que dificulta conocer el saldo disponible real de cada proyecto y la deuda pendiente con personas u otras obras. El sistema debe centralizar esta información y garantizar que los pagos de solicitudes se descuenten de la cuenta de fondos de la obra correspondiente.

## Objetivo general

Diseñar e implementar una plataforma web, escalable y segura para gestionar solicitudes de pago asociadas a obras civiles y controlar los fondos de cada obra, permitiendo trazabilidad completa del proceso, control de estados, gestión documental, registro financiero por obra y reducción de trabajo manual.

## Objetivos específicos

- Centralizar la creación y consulta de solicitudes de pago.
- Permitir que los usuarios creen solicitudes desde una Aplicación Web responsiva.
- Permitir que usuarios administrativos gestionen solicitudes desde la misma Aplicación Web.
- Adjuntar soportes fotográficos o documentales a cada solicitud.
- Controlar el flujo de aprobación mediante estados definidos.
- Implementar doble aprobación mediante Aprobador 1 y Aprobador 2.
- Permitir devolución al Solicitante y devolución del Aprobador 2 al Aprobador 1.
- Programar pagos y marcar solicitudes como pagadas.
- Registrar historial de cambios y comentarios.
- Aplicar roles y permisos por tipo de usuario.
- Exportar información a Excel.
- Crear y consultar cuentas de fondos por obra.
- Registrar anticipos por ejecución de obra.
- Registrar préstamos de personas o terceros a una obra.
- Registrar préstamos entre obras.
- Registrar devoluciones de préstamos a personas o entre obras.
- Registrar movimientos financieros de ingreso y egreso por obra.
- Descontar los pagos de solicitudes desde los fondos de la obra correspondiente.
- Consultar saldos disponibles por obra.
- Consultar préstamos pendientes.
- Auditar acciones críticas del sistema.
- Preparar el sistema para incorporar OCR asistido en fases posteriores.
- Evitar conexión directa entre frontend y base de datos.
- Mantener la lógica de negocio en el backend.

## Usuarios objetivo

### Usuarios administrativos

Usuarios ubicados principalmente en oficina. Sus responsabilidades incluyen revisar solicitudes, validar soportes, aprobar o rechazar solicitudes, programar pagos, consultar estados, hacer seguimiento, administrar catálogos y exportar información.

### Usuarios solicitantes

Usuarios que crean solicitudes de pago, adjuntan soportes, envían solicitudes y consultan el estado de sus solicitudes.

### Auxiliares contables

Usuarios que pueden crear solicitudes de pago bajo el mismo flujo del Solicitante. Adicionalmente, administran fondos de obra, registran anticipos, préstamos, devoluciones, ajustes financieros y consultan movimientos financieros por obra.

### Aprobadores

Usuarios encargados de revisar y aprobar solicitudes. El flujo contempla dos niveles:

- Aprobador 1: revisa inicialmente la solicitud, aprueba primer nivel o devuelve al Solicitante.
- Aprobador 2: realiza la segunda aprobación, aprueba definitivamente o devuelve al Aprobador 1.

### Usuarios de pagos

Usuarios encargados de programar pagos y marcar solicitudes como pagadas. Al marcar una solicitud como pagada, el sistema debe registrar el egreso correspondiente en la cuenta de fondos de la obra.

## Plataforma

El producto operará como una Aplicación Web responsiva.

La decisión actual del producto es centralizar la operación en una sola aplicación web, en lugar de separar Flutter Web y Flutter Mobile. La aplicación debe ser usable tanto para usuarios administrativos como para usuarios que operen desde campo, siempre desde navegador.

## Alcance del MVP

El MVP incluirá:

- Login.
- Aplicación Web responsiva.
- Gestión básica de usuarios.
- Gestión de roles.
- Gestión de obras/proyectos.
- Gestión de proveedores.
- Crear solicitud de pago.
- Editar solicitud en borrador.
- Adjuntar soportes.
- Enviar solicitud.
- Consultar solicitudes.
- Ver detalle de solicitud.
- Cambiar estados mediante acciones controladas.
- Doble aprobación.
- Devolución al Solicitante.
- Devolución del Aprobador 2 al Aprobador 1.
- Programación de pago.
- Marcación como pagada.
- Comentarios básicos.
- Historial de cambios.
- Roles y permisos básicos.
- Exportación a Excel.
- Auditoría básica.
- Cuenta de fondos por obra.
- Consulta de saldo disponible por obra.
- Registro de anticipos de obra.
- Registro de préstamos de persona a obra.
- Registro de préstamos entre obras.
- Registro de devolución de préstamos.
- Consulta de préstamos pendientes.
- Consulta de movimientos financieros por obra.
- Egreso financiero al marcar una solicitud como pagada.

## Fuera del MVP

Quedan fuera del MVP:

- OCR automático avanzado.
- Integraciones con ERP.
- Firma digital.
- Modo offline avanzado.
- Automatizaciones complejas.
- Aprobaciones dinámicas por monto.
- Aprobaciones multinivel configurables.
- Conciliación bancaria.
- Integración directa con sistemas de facturación electrónica.
- Contabilidad completa.
- Cuentas bancarias reales.
- Intereses de préstamos.
- Amortizaciones complejas.
- Comprobantes contables automáticos.
- Aplicación móvil nativa.
- Publicación en Play Store.
- Publicación en App Store.
- Notificaciones push avanzadas.

## Flujo funcional de solicitudes de pago

El flujo principal de una solicitud será:

```text
DRAFT
    ↓
PENDING_FIRST_APPROVAL
    ↓
PENDING_SECOND_APPROVAL
    ↓
APPROVED
    ↓
SCHEDULED_FOR_PAYMENT
    ↓
PAID
```

Flujos alternos:

```text
PENDING_FIRST_APPROVAL → REJECTED → DRAFT
PENDING_SECOND_APPROVAL → RETURNED_TO_FIRST_APPROVER → PENDING_SECOND_APPROVAL
RETURNED_TO_FIRST_APPROVER → REJECTED → DRAFT
```

## Flujo funcional de fondos de obra

Cada obra tendrá una cuenta de fondos. Esta cuenta se afectará mediante movimientos financieros.

Ingresos posibles:

- Anticipo por ejecución de obra.
- Préstamo de persona o tercero a obra.
- Préstamo recibido desde otra obra.
- Devolución recibida por préstamo realizado a otra obra.
- Ajuste positivo autorizado.

Egresos posibles:

- Pago efectivo de solicitud.
- Devolución de préstamo a persona o tercero.
- Devolución de préstamo a otra obra.
- Préstamo realizado a otra obra.
- Ajuste negativo autorizado.

## Reglas funcionales principales

- Toda solicitud debe estar asociada a una obra/proyecto.
- Toda obra debe tener una cuenta de fondos.
- El Solicitante no selecciona la cuenta de fondos.
- El backend determina automáticamente la cuenta de fondos usando la obra de la solicitud.
- Los pagos de solicitudes se descuentan de la cuenta de fondos de la obra.
- Los préstamos deben quedar registrados como deuda pendiente.
- Los préstamos pueden ser de persona a obra o de obra a obra.
- La devolución de préstamo debe disminuir el saldo pendiente del préstamo.
- Una devolución no puede superar el saldo pendiente del préstamo.
- Un egreso no puede dejar saldo negativo en la obra.
- Todo ingreso, egreso, préstamo, devolución, ajuste y pago debe quedar registrado como movimiento financiero.
- Todo cambio de estado debe quedar registrado en historial.
- Toda acción crítica debe quedar auditada.
- La Aplicación Web no es fuente de verdad para cálculos financieros.
- La lógica de negocio y validación financiera debe vivir en el backend.

## Principios de producto

- La trazabilidad es obligatoria.
- Ningún cambio relevante debe quedar sin registro.
- El backend es la única fuente de reglas de negocio.
- La Aplicación Web debe ser simple, clara y responsiva.
- La experiencia de creación de solicitudes debe reducir carga operativa.
- La experiencia administrativa debe priorizar revisión, filtros y seguimiento.
- El sistema debe mostrar estados claros y entendibles para usuarios no técnicos.
- El sistema debe permitir conocer el saldo disponible de cada obra.
- El sistema debe permitir conocer las deudas pendientes por préstamos.
- El sistema debe ser extensible para futuras integraciones.
- La información debe poder exportarse para operación administrativa.
- El sistema debe reducir, no aumentar, la carga operativa.

## Métricas de éxito iniciales

- Reducción del tiempo de registro manual de solicitudes.
- Disminución de errores de transcripción.
- Porcentaje de solicitudes con soporte adjunto.
- Tiempo promedio entre creación y aprobación.
- Tiempo promedio entre aprobación y pago.
- Número de solicitudes gestionadas sin uso de Excel.
- Número de solicitudes rechazadas por falta de información.
- Tiempo promedio de revisión por Aprobador 1.
- Tiempo promedio de revisión por Aprobador 2.
- Número de solicitudes devueltas por Aprobador 2 al Aprobador 1.
- Porcentaje de solicitudes pagadas con trazabilidad completa.
- Número de obras con cuenta de fondos actualizada.
- Número de movimientos financieros registrados por obra.
- Monto de préstamos pendientes por obra.
- Monto de anticipos registrados por obra.
- Diferencia entre saldo esperado y saldo registrado.
- Uso activo por usuarios solicitantes, administrativos, auxiliares contables, aprobadores y pagos.

## Visión futura

En fases posteriores, el sistema podrá evolucionar hacia:

- OCR asistido para extracción de datos desde soportes.
- Notificaciones automáticas.
- Aprobaciones por monto.
- Reglas de aprobación configurables.
- Integración con ERP.
- Integración con facturación electrónica.
- Conciliación bancaria.
- Reportes financieros avanzados por obra.
- Gestión de intereses o condiciones financieras de préstamos.
- Comprobantes contables automáticos.
- Aplicación móvil nativa, si el negocio lo requiere.
