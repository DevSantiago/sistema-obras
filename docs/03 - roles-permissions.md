# 03. Roles y permisos

## Objetivo

Definir los roles iniciales del sistema y las acciones permitidas para cada tipo de usuario, garantizando control de acceso, segregación de responsabilidades y trazabilidad operativa.

## Roles iniciales

### Administrador

Usuario con permisos amplios sobre la configuración y operación del sistema. Puede gestionar usuarios, roles, catálogos, solicitudes y consultar auditoría.

### Solicitante

Usuario que crea solicitudes de pago, adjunta soportes, envía solicitudes y consulta el estado de sus propias solicitudes.

### Revisor

Usuario encargado de revisar solicitudes enviadas, validar soportes y decidir si la solicitud puede continuar o debe ser rechazada.

### Aprobador

Usuario encargado de aprobar solicitudes que ya fueron revisadas o de rechazarlas cuando no cumplen con las condiciones requeridas.

### Pagos

Usuario encargado de programar y marcar solicitudes como pagadas.

## Matriz de permisos

| Acción | Administrador | Solicitante | Revisor | Aprobador | Pagos |
|---|---:|---:|---:|---:|---:|
| Iniciar sesión | Sí | Sí | Sí | Sí | Sí |
| Ver perfil propio | Sí | Sí | Sí | Sí | Sí |
| Crear solicitud | Sí | Sí | Sí | Sí | Sí |
| Editar solicitud en borrador propia | Sí | Sí | Sí | Sí | Sí |
| Ver solicitudes propias | Sí | Sí | Sí | Sí | Sí |
| Ver todas las solicitudes | Sí | No | Sí | Sí | Sí |
| Adjuntar soporte en borrador | Sí | Sí | Sí | Sí | Sí |
| Enviar solicitud | Sí | Sí | Sí | Sí | Sí |
| Tomar solicitud en revisión | Sí | No | Sí | No | No |
| Aprobar solicitud | Sí | No | No | Sí | No |
| Rechazar solicitud | Sí | No | Sí | Sí | No |
| Programar pago | Sí | No | No | No | Sí |
| Marcar como pagada | Sí | No | No | No | Sí |
| Agregar comentarios | Sí | Sí | Sí | Sí | Sí |
| Exportar solicitudes | Sí | No | Sí | Sí | Sí |
| Gestionar obras | Sí | No | No | No | No |
| Gestionar proveedores | Sí | No | No | No | Opcional |
| Gestionar usuarios | Sí | No | No | No | No |
| Consultar auditoría | Sí | No | No | No | No |

## Reglas generales de autorización

- El backend debe validar todos los permisos.
- El frontend solo debe ocultar o mostrar opciones para mejorar la experiencia de usuario.
- Ningún permiso crítico debe depender únicamente del frontend.
- Los roles enviados desde el frontend no deben ser confiables.
- Los roles válidos deben consultarse desde la base de datos.
- Un usuario puede tener más de un rol.
- Las acciones deben evaluarse contra el estado actual de la solicitud.

## Ejemplos de reglas por estado

### Estado Borrador

Permitido:

- Editar solicitud.
- Adjuntar soportes.
- Eliminar soportes, si no han sido enviados.
- Enviar solicitud.

No permitido:

- Aprobar.
- Programar pago.
- Marcar como pagada.

### Estado Enviada

Permitido:

- Consultar.
- Tomar en revisión.
- Agregar comentarios.

No permitido:

- Editar datos económicos.
- Marcar como pagada.
- Programar pago.

### Estado En revisión

Permitido:

- Aprobar.
- Rechazar.
- Agregar comentarios.

No permitido:

- Editar datos principales.
- Marcar como pagada.

### Estado Aprobada

Permitido:

- Programar pago.
- Consultar.
- Exportar.

No permitido:

- Editar valores.
- Adjuntar soportes sin control especial.
- Rechazar directamente sin proceso definido.

### Estado Programada para pago

Permitido:

- Marcar como pagada.
- Consultar.
- Exportar.

No permitido:

- Editar datos principales.
- Aprobar nuevamente.

### Estado Pagada

Permitido:

- Consultar.
- Exportar.
- Ver historial.

No permitido:

- Cambiar datos económicos.
- Cambiar estado sin proceso administrativo futuro.
- Eliminar solicitud.

## Consideraciones futuras

En fases posteriores se podrá incorporar:

- Permisos por obra.
- Permisos por centro de costo.
- Aprobaciones multinivel.
- Límite de aprobación por monto.
- Delegación temporal de aprobaciones.
- Restricciones por empresa, sede o contrato.