# 06. Modelo de Base de Datos

> **Última actualización:** 18 Julio de 2026
> **Fuente de verdad del modelo:** `schema.prisma`

---

# Objetivo

Este documento presenta la visión general del modelo de datos del Sistema de Gestión de Solicitudes de Pago.

Su propósito es describir la organización general de la base de datos, los módulos funcionales que la componen y el estado actual de implementación de las entidades.

La definición oficial del modelo físico corresponde al archivo `schema.prisma`, el cual constituye la fuente de verdad del proyecto.

---

# Organización de la documentación

El modelo de datos se encuentra organizado en los siguientes documentos.

| Documento | Contenido |
|-----------|-----------|
| `06-01-database-model.md` | Descripción general del modelo de datos. |
| `06-02-database-model-er.md` | Organización de los diagramas Entidad–Relación (ER). |
| `06-03-database-model-er-overview.md` | Vista general del modelo ER. |
| `06-04-database-model-er-security.md` | Seguridad, usuarios, roles y permisos. |
| `06-05-database-model-er-organizacion.md` | Organización, proyectos, fondos y centros de costo. |
| `06-06-database-model-er-beneficiarios.md` | Proveedores y beneficiarios de pago. |
| `06-07-01-database-model-er-solicitudes-pago.md` | Núcleo de solicitudes de pago. |
| `06-07-02-database-model-er-nomina.md` | Gestión de nómina. |
| `06-07-03-database-model-er-gestion-documental.md` | Gestión documental. |
| `06-07-04-database-model-er-roadmap.md` | Evolución prevista del modelo de datos. |

---

# Tecnologías utilizadas

| Componente | Tecnología |
|------------|------------|
| Motor de base de datos | PostgreSQL |
| ORM | Prisma ORM |
| Llaves primarias | UUID |
| Migraciones | Prisma Migrate |

---

# Convenciones generales

El modelo de datos utiliza las siguientes convenciones:

- llaves primarias de tipo UUID;
- nomenclatura en español para tablas y columnas;
- relaciones mediante llaves foráneas;
- almacenamiento de fechas utilizando `DateTime`;
- auditoría mediante campos `creado_en` y `actualizado_en` cuando aplica.

---

# Organización funcional del modelo

El modelo se encuentra organizado en los siguientes módulos.

## Infraestructura

- prueba_conexion.

---

## Seguridad

- usuarios;
- roles;
- permisos;
- usuarios_roles;
- roles_permisos;
- roles_lineas_negocio.

---

## Organización

- proyectos_base;
- centros_costo;
- fondos;
- accesos_usuario_proyecto;
- secuencias_documentales.

---

## Beneficiarios

- proveedores;
- beneficiarios_pago.

---

## Solicitudes de pago

- solicitudes_pago;
- detalles_nomina_solicitud.

## Pagos y movimientos

- pagos;
- operaciones_efectivo;
- detalles_operacion_efectivo;
- movimientos_fondo.

---

## Gestión documental

- adjuntos.

---

# Estado de implementación

## Entidades implementadas

| Entidad | Estado |
|---------|--------|
| prueba_conexion | ✅ |
| usuarios | ✅ |
| roles | ✅ |
| permisos | ✅ |
| usuarios_roles | ✅ |
| roles_permisos | ✅ |
| roles_lineas_negocio | ✅ |
| proyectos_base | ✅ |
| centros_costo | ✅ |
| fondos | ✅ |
| accesos_usuario_proyecto | ✅ |
| secuencias_documentales | ✅ |
| proveedores | ✅ |
| beneficiarios_pago | ✅ |
| solicitudes_pago | ✅ |
| detalles_nomina_solicitud | ✅ |
| adjuntos | ✅ |
| pagos | ✅ |
| operaciones_efectivo | ✅ |
| detalles_operacion_efectivo | ✅ |
| movimientos_fondo | ✅ |
| anticipos | ✅ |
| prestamos_proyecto | ✅ |

---

## Funcionalidades previstas

Las siguientes capacidades forman parte de la evolución prevista del sistema y se documentan en el roadmap del modelo de datos:

- historial de estados;
- comentarios;
- detalle de impuestos y retenciones;
- programación de pagos;
- devoluciones de préstamos;
- ampliaciones del proceso OCR.

---

# Organización general del modelo

La entidad central del sistema es:

```text
solicitudes_pago
```

A partir de ella se relacionan los principales módulos del sistema:

- organización;
- beneficiarios;
- seguridad;
- gestión documental;
- nómina.

---

# Principios de diseño

El modelo fue diseñado siguiendo los siguientes principios:

- una única entidad para la cabecera de solicitudes;
- reutilización de entidades maestras;
- separación entre organización y operación;
- integridad referencial mediante Prisma;
- escalabilidad para incorporar nuevas modalidades de solicitud.

---

# Fuente de verdad

La definición oficial del modelo de datos corresponde exclusivamente al archivo:

```text
schema.prisma
```

En caso de existir diferencias entre la documentación y el esquema Prisma, prevalecerá siempre la definición implementada en `schema.prisma`.

---

# Evolución del modelo

La incorporación de nuevas entidades seguirá el siguiente proceso:

```text
Roadmap

↓

Implementación en schema.prisma

↓

Migración de base de datos

↓

Actualización de la documentación
```

Las entidades descritas en `06-07-04-database-model-er-roadmap.md` pasarán a formar parte del modelo oficial únicamente cuando sean incorporadas al esquema Prisma.
