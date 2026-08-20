# 06. Modelo Entidad–Relación (ER)

> **Última actualización:** Julio de 2026
> **Fuente de verdad:** `schema.prisma`

---

# Objetivo

Este documento presenta la organización de los diagramas Entidad–Relación (ER) del Sistema de Gestión de Solicitudes de Pago.

Debido al número de entidades implementadas en el proyecto, los diagramas se distribuyen en varios documentos especializados con el fin de facilitar su mantenimiento, comprensión y evolución.

Todos los diagramas incluidos en este capítulo se generan a partir del modelo definido en `schema.prisma`, el cual constituye la fuente oficial del modelo de datos.

---

# Organización de los diagramas

Los diagramas ER se encuentran divididos por módulos funcionales.

| Documento | Contenido |
|-----------|-----------|
| `06-database-model-er-overview.md` | Vista general del modelo completo. |
| `06-database-model-er-security.md` | Seguridad, usuarios, roles y permisos. |
| `06-database-model-er-organization.md` | Organización, proyectos, fondos y centros de costo. |
| `06-database-model-er-beneficiaries.md` | Proveedores y beneficiarios de pago. |
| `06-database-model-er-payment-requests.md` | Solicitudes de pago y entidades relacionadas. |
| `06-database-model-er-documents.md` | Gestión documental y adjuntos. |
| `06-database-model-er-traceability.md` | Comentarios e historial de estados. |
| `06-database-model-er-finance.md` | Componentes financieros implementados y previstos. |

---

# Convenciones utilizadas

Todos los diagramas siguen las siguientes convenciones.

## Cardinalidades

Las relaciones utilizan la notación Mermaid ER.

| Símbolo | Significado |
|---------|-------------|
| `||` | Exactamente uno |
| `o|` | Cero o uno |
| `|{` | Uno o muchos |
| `o{` | Cero o muchos |

---

## Llaves

En los diagramas:

- `PK` representa una llave primaria.
- `FK` representa una llave foránea.

---

## Relaciones

Las relaciones representan exclusivamente las asociaciones implementadas en el archivo `schema.prisma`.

No se incluyen relaciones conceptuales ni dependencias derivadas de reglas de negocio que no estén materializadas físicamente en el modelo.

---

# Organización funcional

El modelo se encuentra dividido en los siguientes dominios.

## Seguridad

Comprende la autenticación, autorización y asignación de permisos del sistema.

Incluye:

- usuarios;
- roles;
- permisos;
- líneas de negocio;
- accesos por proyecto.

---

## Organización

Agrupa la estructura administrativa utilizada por el sistema.

Incluye:

- proyectos base;
- centros de costo;
- fondos;
- secuencias documentales.

---

## Beneficiarios

Agrupa las entidades relacionadas con los receptores de pagos.

Incluye:

- proveedores;
- beneficiarios de pago.

---

## Solicitudes de Pago

Representa el núcleo funcional del sistema.

Incluye:

- solicitudes;
- detalles de nómina;
- impuestos y retenciones.

---

## Gestión documental

Incluye la administración de archivos asociados a las solicitudes.

Actualmente comprende:

- adjuntos.

---

## Trazabilidad

Representa el historial operativo de las solicitudes.

Incluye:

- comentarios;
- historial de estados.

---

## Componentes financieros

Representa las entidades encargadas de la administración de recursos financieros.

Actualmente el modelo implementa:

- fondos.
- anticipos;
- préstamos;
- devoluciones de préstamos;
- movimientos financieros;
- pagos y operaciones de efectivo.

---

# Fuente de verdad

Todos los diagramas de este capítulo corresponden al modelo implementado en:

```text
schema.prisma
```

En caso de existir diferencias entre un diagrama y el esquema Prisma, prevalecerá siempre la definición contenida en `schema.prisma`.

---

# Documentación relacionada

Este documento forma parte del capítulo de modelo de datos y debe consultarse junto con:

- `06-database-model.md`
- `06-database-model-logical.md`
- `06-database-model-ddl.md`
- `06-database-model-constraints.md`
- `06-database-model-indexes.md`
- `06-database-model-enums.md`
- `06-database-model-roadmap.md`
