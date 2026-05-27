# 08. Seguridad

## Objetivo

Definir los lineamientos de seguridad para autenticación, autorización, protección de datos, almacenamiento de archivos, auditoría y despliegue.

## Principio central

Firebase Auth se utilizará para autenticación, pero la autorización será responsabilidad del backend.

Esto significa que el frontend puede iniciar sesión y obtener un token, pero el backend debe decidir qué acciones puede ejecutar cada usuario.

## Autenticación

El flujo de autenticación será:

```text
Usuario inicia sesión en Flutter
        ↓
Firebase Auth autentica
        ↓
Flutter obtiene ID Token
        ↓
Flutter envía token al backend
        ↓
Backend valida token con Firebase Admin
        ↓
Backend identifica usuario interno
```

## Autorización

El backend debe validar:

- Usuario autenticado.
- Usuario activo.
- Roles asignados.
- Permiso para la acción solicitada.
- Estado actual de la solicitud.
- Propiedad del recurso, cuando aplique.

## Reglas de autorización

- No confiar en roles enviados desde Flutter.
- No permitir cambios de estado desde endpoints genéricos.
- Usar endpoints específicos para acciones críticas.
- Validar siempre el estado actual antes de modificar.
- Validar permisos en cada endpoint.
- Registrar auditoría en operaciones sensibles.

## Protección de archivos

Los archivos deben almacenarse en Cloud Storage.

Reglas:

- Los buckets no deben ser públicos.
- El acceso debe realizarse mediante URLs firmadas.
- El backend debe generar las URLs firmadas.
- Se debe validar tipo MIME.
- Se debe limitar tamaño máximo de archivo.
- Se debe registrar quién sube cada archivo.
- Se debe almacenar metadato en base de datos.
- No se deben exponer rutas internas sin autorización.

## Tipos de archivo permitidos inicialmente

- image/jpeg
- image/png
- application/pdf

## Tamaño máximo recomendado

Para el MVP:

- Imágenes: 10 MB.
- PDFs: 20 MB.

Estos límites pueden ajustarse según operación real.

## Seguridad de base de datos

- Cloud SQL no debe exponerse públicamente sin control.
- El backend debe ser el único consumidor de la base de datos.
- Usar usuario de base de datos con permisos mínimos.
- Usar contraseñas en Secret Manager.
- Usar migraciones versionadas.
- Activar backups automáticos.
- Evitar consultas SQL dinámicas inseguras.
- Usar ORM o queries parametrizadas.

## Secretos y configuración

No guardar secretos en:

- Código fuente.
- Repositorio.
- Flutter.
- Archivos públicos.

Secretos recomendados:

- Credenciales de base de datos.
- API Key de OpenAI.
- Configuración sensible de servicios.
- Llaves privadas.

Deben almacenarse en Secret Manager o variables seguras del pipeline.

## Auditoría

Deben registrarse operaciones como:

- Crear solicitud.
- Actualizar solicitud.
- Enviar solicitud.
- Aprobar solicitud.
- Rechazar solicitud.
- Programar pago.
- Marcar como pagada.
- Subir adjunto.
- Descargar adjunto.
- Exportar Excel.
- Cambiar roles.
- Crear proveedor.
- Crear obra.

Cada registro debe contener:

- Usuario.
- Acción.
- Entidad.
- ID de entidad.
- Datos anteriores, cuando aplique.
- Datos nuevos, cuando aplique.
- IP.
- User-Agent.
- Fecha y hora.

## Validaciones críticas

El backend debe validar:

- Valor neto menor o igual al valor bruto.
- Solicitud con soporte antes de enviar.
- Solicitud con soporte antes de aprobar.
- Comentario obligatorio al rechazar.
- Rol Pagos para marcar como pagada.
- Estado previo válido antes de cada transición.
- Usuario activo.
- Existencia de proveedor y obra.

## Seguridad en Flutter

- No almacenar secretos.
- No conectar a la base de datos.
- No incluir API Keys sensibles.
- Usar almacenamiento seguro para tokens, cuando aplique.
- Renovar sesión según comportamiento de Firebase.
- Mostrar u ocultar opciones según rol, pero sin asumir seguridad en frontend.

## Seguridad en Cloud Run

- Permitir acceso solo a endpoints públicos necesarios.
- Configurar variables de entorno seguras.
- Usar service accounts con permisos mínimos.
- Limitar acceso a Cloud SQL y Cloud Storage.
- Activar logs.
- Configurar alertas de errores.

## Seguridad futura

En fases posteriores se podrá incluir:

- MFA para usuarios administrativos.
- Control por IP para administración.
- Permisos por obra.
- Límites de aprobación por monto.
- Detección de solicitudes duplicadas.
- Escaneo antivirus de archivos.
- Alertas por comportamiento anómalo.
