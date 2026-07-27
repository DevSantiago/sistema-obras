# CONTEXT.md

# Contexto del proyecto

Este documento explica el contexto funcional y las decisiones arquitectónicas del proyecto.

No reemplaza la documentación técnica.

La documentación ubicada en la raíz del proyecto continúa siendo la fuente oficial de verdad.

Este documento únicamente explica el porqué de muchas decisiones para evitar que un agente proponga cambios que rompan el diseño del sistema.

---

# Objetivo del sistema

El sistema administra el ciclo completo de una solicitud de pago dentro de empresas de ingeniería, interventoría y construcción.

No es un ERP.

No es un software contable.

No pretende reemplazar sistemas financieros.

Su responsabilidad consiste en controlar el flujo documental y financiero previo al pago y registrar posteriormente los movimientos que afectan el fondo del proyecto.

---

# Filosofía del sistema

Toda operación financiera nace desde una solicitud.

Las solicitudes son el eje central del sistema.

Los módulos posteriores (pagos, movimientos, préstamos, efectivo, impuestos, cargos financieros, auditoría, etc.) existen únicamente para complementar el ciclo de vida de una solicitud o registrar impactos financieros derivados de ella.

---

# Proyecto Base

El concepto más importante del sistema es el Proyecto Base.

Un Proyecto Base representa un contrato o proyecto principal.

El Proyecto Base posee:

- un fondo general;
- uno o varios centros de costo.

Nunca existen fondos independientes por centro de costo.

Siempre existe un único fondo por Proyecto Base.

---

# Fondo General

El dinero pertenece al Proyecto Base.

Los centros de costo únicamente indican dónde se ejecutó el gasto.

Nunca administran dinero independiente.

Cuando una solicitud se paga:

- el dinero sale del fondo general;
- el movimiento queda imputado al centro de costo correspondiente.

---

# Centros de costo

Los centros representan unidades operativas.

Actualmente existen cuatro variantes:

- PRO-OBRA
- OBRA
- PRO-INT
- INT

No representan proyectos distintos.

Representan fases distintas dentro de una línea de negocio.

---

# Líneas de negocio

Existen únicamente dos líneas:

- OBRA
- INTERVENTORIA

Cada línea posee dos fases:

OBRA

- PRO-OBRA
- OBRA

INTERVENTORIA

- PRO-INT
- INT

---

# Estados de las solicitudes

Las solicitudes siguen una máquina de estados estricta.

Nunca modificar el flujo sin actualizar toda la documentación.

Los cambios de estado siempre deben ser realizados desde el backend.

Nunca confiar en estados enviados por el frontend.

---

# Número de solicitud

El UUID identifica internamente la solicitud.

El número oficial de solicitud identifica el documento.

No son el mismo concepto.

El número oficial únicamente se genera cuando el solicitante envía la solicitud a aprobación.

Los borradores no poseen número oficial.

---

# UUID

Todas las relaciones internas utilizan UUID.

Los consecutivos visibles existen únicamente para usuarios.

Nunca utilizar el consecutivo como llave técnica.

---

# Reserva presupuestal

La aprobación reserva presupuesto.

No descuenta dinero.

El dinero únicamente se descuenta cuando la solicitud es marcada como pagada.

---

# Pagos

El módulo Pagos no aprueba solicitudes.

El módulo Pagos únicamente ejecuta solicitudes previamente aprobadas.

No existe programación de pagos.

Las solicitudes llegan al módulo en estado:

PROGRAMADA_PAGO

Después del pago pasan a:

PAGADA

---

# Movimientos financieros

Todo movimiento financiero debe ser trazable.

Nunca modificar un saldo directamente.

Todo cambio de saldo debe producir un movimiento financiero.

Los movimientos constituyen el historial financiero oficial.

---

# Transacciones

Toda operación que afecte dinero debe ejecutarse dentro de una transacción de base de datos.

Nunca actualizar saldos fuera de una transacción.

---

# Auditoría

La auditoría registra lo ocurrido.

Nunca reemplaza el estado actual.

Nunca debe utilizarse como fuente principal de datos.

---

# Adjuntos

Los adjuntos representan evidencia documental.

Los archivos físicos podrán almacenarse posteriormente en un bucket.

La base de datos únicamente conserva metadatos y referencias.

Nunca depender del almacenamiento local como diseño definitivo.

---

# Backend primero

El proyecto se desarrolla por módulos completos.

Cada módulo sigue este orden:

1. Backend.
2. Pruebas técnicas.
3. Frontend.
4. Integración.
5. Validación funcional.
6. Documentación.

No comenzar un nuevo módulo sin cerrar el anterior.

---

# Consistencia

La consistencia del proyecto es más importante que la optimización.

Si existe un patrón implementado en otro módulo, reutilizarlo.

No introducir nuevos estilos de implementación si ya existe uno equivalente.

---

# Decisiones de arquitectura

Las decisiones importantes ya fueron tomadas.

No proponer cambios de arquitectura durante el desarrollo de historias de usuario.

Si una mejora requiere modificar la arquitectura:

- documentarla;
- no implementarla sin autorización.

---

# Fuente de verdad

Cuando exista conflicto entre documentos:

1. Documentación funcional.
2. Modelo de datos.
3. Contratos API.
4. Código existente.

Nunca asumir comportamientos no documentados.

Si una regla de negocio no está clara, detener el desarrollo y solicitar aclaración en lugar de inferir un comportamiento.

---

# Cómo tomar decisiones

Cuando existan varias implementaciones técnicamente válidas:

1. Elegir la que reutilice más código existente.
2. Elegir la que modifique menos archivos.
3. Elegir la que mantenga el mismo patrón utilizado en módulos anteriores.
4. Evitar introducir nuevas abstracciones.
5. Evitar crear nuevas dependencias.
6. Priorizar la simplicidad y la consistencia sobre la elegancia.

Si existe incertidumbre sobre una regla de negocio, no asumir una respuesta. Detener la implementación y solicitar aclaración.