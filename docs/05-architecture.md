# 05. Arquitectura

> Última actualización funcional: 4 de septiembre de 2026.

Este documento describe la arquitectura de software utilizada para el Sistema de Gestión de Solicitudes de Pago.

Su objetivo es definir la organización general del sistema, los componentes principales, los principios arquitectónicos y las decisiones técnicas adoptadas durante el desarrollo.

Las reglas funcionales y de negocio se documentan en los demás documentos del proyecto.

---

# 1. Arquitectura general

El sistema se desarrolla como una aplicación web de arquitectura multicapa, compuesta por un cliente web, una API backend, una base de datos relacional y un servicio de almacenamiento de archivos.

La lógica de negocio reside exclusivamente en el backend, mientras que el frontend actúa como consumidor de los servicios expuestos por la API.

La arquitectura general puede representarse de la siguiente forma:

```text
Frontend Web

↓

API REST

↓

Servicios de Aplicación

↓

Repositorios

↓

PostgreSQL

+

Almacenamiento de archivos
```

---

# 2. Stack tecnológico

Las tecnologías utilizadas durante el desarrollo del MVP son:

```text
Next.js (App Router)

Progressive Web App (manifiesto y service worker)

TypeScript

Prisma ORM

PostgreSQL

Vitest

Amazon S3
```

La arquitectura ha sido diseñada para permitir la incorporación de nuevos componentes sin afectar la estructura general del sistema.

---

# 3. Arquitectura por capas

El sistema implementa una arquitectura por capas con separación clara de responsabilidades.

```text
Frontend

↓

API (Routes)

↓

Application Services

↓

Repositories

↓

Database
```

Cada capa posee una responsabilidad específica y únicamente puede interactuar con las capas inmediatamente inferiores.

La comunicación directa entre el frontend y la base de datos no está permitida.

El frontend publica un manifiesto web y registra un service worker para permitir
la instalación del sistema en iPhone, Android y navegadores compatibles. La
primera fase no intercepta ni almacena solicitudes en caché, por lo que conserva
el comportamiento en línea y evita servir información operativa desactualizada.
Esta base se reutilizará para las suscripciones Web Push de la Épica 20.
El módulo `push` registra y revoca las suscripciones por usuario, dispositivo y
ambiente mediante el patrón `route → service → repository`. Los endpoints y
claves de cada suscripción permanecen en backend; la interfaz solo recibe el
estado del dispositivo actual y la cantidad de dispositivos activos.

---

# 4. Organización del proyecto

Cada módulo funcional sigue una estructura homogénea.

```text
src/

├── app/
│   └── api/
│
├── modules/
│   ├── usuarios/
│   ├── proyectos/
│   ├── beneficiarios/
│   ├── solicitudes-pago/
│   └── ...
│
├── lib/
│
├── prisma/
│
└── types/
```

El backend de bandeja y registro de pagos forma parte del módulo
`solicitudes-pago`, manteniendo el patrón `route → service → repository`. La
interfaz se encuentra en `src/components/pagos`.

El módulo `storage` abstrae la persistencia física de documentos mediante el
contrato `StorageProvider`. En desarrollo utiliza el proveedor local; staging y
producción utilizan Amazon S3 con buckets y credenciales IAM independientes.
Los demás módulos consumen exclusivamente `storageService`, por lo que no
conocen el proveedor físico ni exponen directamente los objetos de los buckets.

El módulo `whatsapp` encapsula la configuración y validación de webhooks de
WhatsApp Business Platform. La ruta pública entrega el cuerpo crudo y la firma
al servicio, que valida el token de alta y `X-Hub-Signature-256` antes de aceptar
eventos. Desde HU-1903 el módulo también crea registros en
`notificaciones_whatsapp` dentro de la misma transacción Prisma que modifica la
solicitud. El envío, los reintentos y la actualización de estados se mantienen
separados para que una indisponibilidad de Meta no revierta el flujo funcional.
Desde HU-1904 un endpoint interno protegido dispara lotes pequeños; el servicio
construye y envía las plantillas, mientras el repositorio reclama cada registro
de forma atómica y conserva intentos, errores y confirmaciones de Meta.
Desde HU-1905 el webhook convierte cada estado o mensaje recibido en un evento
persistente con clave idempotente. El repositorio correlaciona los estados por
`wamid`, conserva teléfono y `BSUID` cuando están disponibles y actualiza la
notificación sin permitir regresiones desde `ENTREGADA` o `LEIDA`.

El historial de cada solicitud se compone en el servicio de
`solicitudes-pago`. Reutiliza las fuentes operativas existentes para creación,
aprobaciones, devoluciones, anulaciones, adjuntos y pagos, y las complementa
con `eventos_auditoria_solicitud_pago` para conservar ediciones y reenvíos que
no tienen una entidad operativa propia. Las escrituras de auditoría se realizan
en la misma transacción que la operación funcional.

El módulo `fondos` concentra la consulta financiera y el registro común de
movimientos. Los servicios de otros módulos reutilizan su operación de
repositorio dentro de la transacción funcional en curso. De esta forma, la
actualización de `fondos.saldo_actual` y la creación de
`movimientos_fondo` son atómicas, sin abrir transacciones independientes.

El mismo módulo expone las consultas de fondos y movimientos mediante rutas
independientes bajo `/api/v1/fondos`. La autorización y el alcance de
visibilidad se resuelven en la capa de servicio, mientras que los filtros por
proyecto, centro, línea, fase, dirección y tipo se aplican en el repositorio.

Los módulos `anticipos` y `prestamos` mantienen el patrón
`route → service → repository` y reutilizan el registrador transaccional del
módulo `fondos`. Los préstamos entre proyectos generan el egreso del fondo
origen y el ingreso del fondo destino dentro de una única transacción
serializable.

El módulo `operaciones-efectivo` expone la consulta operativa de los retiros
ya registrados por `solicitudes-pago`. Mantiene el patrón
`route → service → repository`, calcula el seguimiento a partir de la
operación y sus movimientos y no genera nuevas afectaciones financieras
durante la consulta. La misma consulta admite filtrar únicamente los retiros
con reingreso pendiente; la exportación CSV se construye en el frontend con
los resultados ya autorizados y filtrados por el servicio.

Los ajustes y anulaciones se registran en
`correcciones_operacion_efectivo`. El repositorio calcula las compensaciones y
reutiliza el registrador transaccional de `fondos`, de modo que auditoría,
movimiento, estado y saldo se confirman o revierten conjuntamente.

Cada módulo implementa, como mínimo:

- rutas de la API;
- servicios de aplicación;
- repositorios;
- definiciones de tipos;
- pruebas unitarias.

---

# 5. Componentes principales

La arquitectura del sistema se organiza en componentes funcionales independientes que encapsulan la lógica de negocio de cada dominio.

Los principales componentes del MVP son:

- Autenticación.
- Usuarios.
- Roles y permisos.
- Proyectos base.
- Centros de costo.
- Beneficiarios.
- Solicitudes de pago.
- Aprobaciones.
- Pagos.
- Gestión financiera.
- Operaciones de efectivo.
- Anticipos.
- Préstamos.
- Auditoría.
- Almacenamiento de archivos.

Cada componente implementa sus propias reglas de negocio y expone únicamente las operaciones necesarias para interactuar con el resto del sistema.

---

# 6. Comunicación entre componentes

Los componentes del sistema no interactúan directamente con la base de datos de otros módulos.

La comunicación entre módulos debe realizarse a través de los servicios de aplicación correspondientes.

Por ejemplo:

```text
Solicitud de Pago

↓

Servicio de Solicitudes

↓

Servicio Financiero

↓

Servicio de Auditoría
```

Este enfoque permite mantener un bajo acoplamiento entre los módulos y facilita la evolución del sistema.

---

# 7. Principios arquitectónicos

El desarrollo del sistema sigue los siguientes principios:

- Separación de responsabilidades.
- Bajo acoplamiento entre módulos.
- Alta cohesión dentro de cada componente.
- Reutilización de servicios comunes.
- Validación centralizada de reglas de negocio.
- Persistencia desacoplada mediante repositorios.
- Operaciones críticas ejecutadas de forma transaccional.
- Auditoría automática de las operaciones relevantes.

Estos principios buscan facilitar el mantenimiento, la escalabilidad y la evolución del sistema a medida que se incorporen nuevos módulos.

---

# 8. Patrones de diseño

La solución adopta una combinación de patrones de arquitectura y diseño ampliamente utilizados en aplicaciones empresariales.

## Arquitectura en capas (Layered Architecture)

Organiza el sistema en capas independientes, separando la presentación, la lógica de negocio y la persistencia.

## Repository Pattern

Aísla el acceso a los datos de la lógica de negocio, permitiendo cambiar la tecnología de persistencia con un impacto mínimo sobre el resto del sistema.

## Service Layer Pattern

Centraliza las reglas de negocio dentro de servicios de aplicación, evitando que estas queden distribuidas entre los controladores o los repositorios.

## Dependency Injection

Los servicios reciben sus dependencias mediante inyección, favoreciendo el desacoplamiento, la reutilización y las pruebas unitarias.

## Transaction Script

Las operaciones críticas que afectan varias entidades (como aprobaciones, pagos o movimientos financieros) se ejecutan dentro de una única transacción para garantizar la consistencia de la información.

---

# 9. Gestión de transacciones

Las operaciones que involucren la modificación de múltiples entidades deberán ejecutarse dentro de una única transacción de base de datos.

Entre ellas se encuentran:

- creación de solicitudes de pago;
- aprobación de solicitudes;
- registro de pagos;
- generación de movimientos financieros;
- creación de beneficiarios asociada a otros procesos;
- operaciones de préstamos;
- operaciones de efectivo.

Si alguna operación falla, la transacción completa deberá revertirse para preservar la consistencia de la información.

---

# 10. Seguridad arquitectónica

La seguridad constituye una responsabilidad transversal de toda la arquitectura.

Como principios generales:

- El frontend nunca accede directamente a la base de datos.
- Toda petición debe pasar por la API.
- La autenticación se realiza antes de ejecutar cualquier operación protegida.
- La autorización se valida en la capa de servicios.
- Todas las operaciones sensibles generan registros de auditoría.
- Los datos enviados por el cliente siempre deberán validarse en el backend.

---

# 11. Estrategia de pruebas

Cada componente deberá contar con una estrategia de pruebas que garantice la calidad del software antes de su despliegue.

Como mínimo deberán implementarse:

- pruebas unitarias para los servicios de aplicación;
- pruebas de integración para los endpoints de la API;
- validación funcional desde la interfaz de usuario;
- validaciones estáticas mediante herramientas de análisis de código.

Las pruebas deberán ejecutarse de manera periódica durante el desarrollo y antes de cada liberación.

---

# 12. Escalabilidad

La arquitectura ha sido diseñada para permitir la incorporación de nuevos módulos sin afectar significativamente los componentes existentes.

Las principales estrategias adoptadas son:

- modularización por dominios de negocio;
- separación entre lógica de negocio y persistencia;
- reutilización de servicios comunes;
- incorporación de nuevos permisos sin modificar la estructura de roles;
- posibilidad de integrar nuevos servicios externos mediante adaptadores.

Este enfoque facilita el crecimiento progresivo del sistema y reduce el impacto de futuras ampliaciones funcionales.

---

# 13. Consideraciones finales

La arquitectura del Sistema de Gestión de Solicitudes de Pago busca mantener una separación clara entre la lógica de negocio, la infraestructura y la persistencia de la información.

Todas las decisiones de diseño privilegian:

- mantenibilidad;
- escalabilidad;
- seguridad;
- trazabilidad;
- reutilización del código;
- facilidad para realizar pruebas.

La implementación de nuevos módulos deberá respetar los principios arquitectónicos definidos en este documento para garantizar la consistencia del proyecto a lo largo de su evolución.
