# Épica 2. Autenticación, usuarios y roles

## 1. Objetivo

Permitir que el sistema tenga una base segura para identificar usuarios, administrar roles y validar permisos desde el backend.

Esta épica no se limita únicamente a crear las pantallas de login o administración. También incluye la base técnica necesaria para que el sistema pueda:

- Registrar usuarios.
- Guardar contraseñas de forma segura mediante hash.
- Activar o desactivar usuarios.
- Crear roles base del sistema.
- Asignar uno o varios roles a un usuario.
- Consultar los roles asociados a cada usuario.
- Validar permisos desde el backend antes de ejecutar acciones sensibles.
- Preparar la asociación futura entre usuarios y beneficiarios cuando aplique.

---

## 2. Alcance funcional

La Épica 2 cubre los siguientes componentes:

| Componente | Alcance |
|---|---|
| Autenticación | Inicio de sesión con correo y contraseña |
| Usuarios | Creación, edición, activación y desactivación |
| Roles | Creación de roles base y consulta de roles |
| Asignación de roles | Asociación de uno o varios roles a usuarios |
| Autorización | Validación de permisos por rol desde backend |
| Auditoría | Registro futuro de acciones sensibles |
| Beneficiarios | Preparación para asociación usuario-beneficiario cuando aplique |

---

## 3. Decisión de autenticación

Para el MVP se define autenticación con:

```txt
Correo + contraseña
```

La autenticación externa con Google o Microsoft queda fuera del alcance inicial.

Esta decisión se toma porque el sistema es de uso interno, con usuarios controlados por administración, y porque el MVP necesita priorizar una implementación clara y controlable.

La contraseña no debe almacenarse en texto plano. El sistema debe guardar únicamente un hash de la contraseña.

---

## 4. Criterios de aceptación de la épica

La épica se considera cumplida cuando:

- El usuario puede iniciar sesión con correo y contraseña.
- El sistema valida la identidad del usuario.
- El sistema bloquea usuarios inactivos.
- El sistema carga los datos básicos del usuario autenticado.
- El sistema carga los roles asociados al usuario.
- Los roles base existen en base de datos.
- El administrador puede crear y editar usuarios.
- El administrador puede activar o desactivar usuarios.
- El administrador puede asignar y retirar roles.
- El sistema restringe acciones según rol.
- Toda acción sensible valida permisos en backend.
- La estructura permite asociar beneficiarios a usuarios cuando aplique.

---

## 5. Modelo de datos base

Para iniciar esta épica se agregan las siguientes tablas:

```txt
usuarios
roles
usuarios_roles
```

### 5.1. Tabla `usuarios`

Guarda las personas que pueden acceder al sistema.

Campos principales:

| Campo | Descripción |
|---|---|
| `id` | Identificador único del usuario |
| `nombre` | Nombre del usuario |
| `correo` | Correo usado para iniciar sesión |
| `telefono` | Teléfono del usuario |
| `password_hash` | Hash de la contraseña |
| `estado` | Estado del usuario |
| `creado_en` | Fecha de creación |
| `actualizado_en` | Fecha de última actualización |

Estados esperados:

```txt
ACTIVO
INACTIVO
```

### 5.2. Tabla `roles`

Guarda los roles disponibles en el sistema.

Campos principales:

| Campo | Descripción |
|---|---|
| `id` | Identificador único del rol |
| `nombre` | Nombre técnico del rol |
| `descripcion` | Descripción funcional del rol |
| `activo` | Indica si el rol está habilitado |
| `creado_en` | Fecha de creación |
| `actualizado_en` | Fecha de última actualización |

### 5.3. Tabla `usuarios_roles`

Relaciona usuarios con roles.

Permite que un usuario tenga uno o varios roles.

Campos principales:

| Campo | Descripción |
|---|---|
| `id` | Identificador único |
| `usuario_id` | Referencia al usuario |
| `rol_id` | Referencia al rol |
| `creado_en` | Fecha de asignación |

Restricción requerida:

```txt
Un mismo usuario no puede tener el mismo rol duplicado.
```

---

## 6. Roles base del sistema

Los roles base que deben existir son:

| Rol | Propósito |
|---|---|
| `ADMINISTRADOR` | Administra usuarios, roles y configuración |
| `SOLICITANTE` | Crea y consulta sus propias solicitudes |
| `AUXILIAR_CONTABLE` | Apoya revisión o gestión contable según permisos definidos |
| `APROBADOR_1` | Realiza primera aprobación |
| `APROBADOR_2` | Realiza segunda aprobación |
| `PAGOS` | Marca solicitudes como pagadas cuando corresponda |
| `LECTURA` | Consulta información sin modificar registros |

---

## 7. Historias de usuario ajustadas

## HU-0201. Iniciar sesión

### Descripción

Como usuario, quiero iniciar sesión con correo y contraseña, para acceder al sistema de acuerdo con mis roles asignados.

### Criterios de aceptación

- El sistema permite iniciar sesión con correo y contraseña.
- El sistema busca el usuario por correo.
- El sistema valida la contraseña contra el hash almacenado.
- El sistema bloquea el inicio de sesión si el usuario está inactivo.
- El sistema carga los datos básicos del usuario.
- El sistema carga los roles asociados al usuario.
- El sistema no expone el `password_hash` en la respuesta.
- El sistema responde con error controlado cuando las credenciales son inválidas.

### Reglas de negocio

- No se deben almacenar contraseñas en texto plano.
- El correo debe ser único.
- Un usuario inactivo no puede iniciar sesión.
- La validación debe realizarse en backend.
- La respuesta de autenticación no debe revelar si falló el correo o la contraseña de forma específica.

---

## HU-0202. Gestionar usuarios

### Descripción

Como Administrador, quiero crear y editar usuarios, para controlar quién accede al sistema.

### Criterios de aceptación

- Permite crear usuario.
- Permite editar nombre, correo, teléfono y estado.
- Permite activar usuario.
- Permite desactivar usuario.
- Impide crear usuarios con correo duplicado.
- Guarda contraseña como hash.
- No permite consultar ni retornar la contraseña.
- Registra auditoría de creación, edición, activación y desactivación.

### Reglas de negocio

- Solo el rol `ADMINISTRADOR` puede gestionar usuarios.
- El correo es obligatorio.
- El nombre es obligatorio.
- La contraseña inicial es obligatoria al crear usuario local.
- El estado por defecto de un usuario nuevo es `ACTIVO`, salvo que el administrador indique lo contrario.
- La desactivación de usuarios no elimina el histórico de acciones realizadas por el usuario.

---

## HU-0203. Asignar roles

### Descripción

Como Administrador, quiero asignar roles a usuarios, para controlar permisos dentro del sistema.

### Criterios de aceptación

- Permite asignar uno o varios roles a un usuario.
- Permite retirar roles de un usuario.
- Impide asignar el mismo rol dos veces al mismo usuario.
- Permite consultar los roles actuales de un usuario.
- Impide dejar sin rol a usuarios activos si la política del sistema lo exige.
- Registra auditoría de asignación y retiro de roles.

### Reglas de negocio

- Solo el rol `ADMINISTRADOR` puede asignar o retirar roles.
- Los roles asignados deben existir y estar activos.
- Un usuario puede tener más de un rol.
- La relación usuario-rol debe ser única.
- Si un usuario queda sin roles, el sistema debe impedir su operación o exigir desactivarlo, según política definida.

---

## HU-0204. Crear rol Lectura y roles base

### Descripción

Como Administrador, quiero contar con roles base, incluyendo el rol `LECTURA`, para controlar el acceso inicial al sistema.

### Criterios de aceptación

- El rol `LECTURA` existe en base de datos.
- Los roles base existen en base de datos.
- El rol `LECTURA` puede consultar módulos autorizados.
- El rol `LECTURA` no puede crear, editar, aprobar, pagar ni eliminar.
- El rol `LECTURA` respeta accesos por centro de costo cuando aplique.
- La creación inicial de roles puede ejecutarse mediante seed o script controlado.

### Reglas de negocio

- Los roles base no deben duplicarse.
- Los roles base no deben eliminarse físicamente.
- Si se requiere deshabilitar un rol, debe usarse el campo `activo`.
- El rol `LECTURA` es exclusivamente consultivo.

---

## 8. Permisos iniciales por rol

| Acción | ADMINISTRADOR | SOLICITANTE | AUXILIAR_CONTABLE | APROBADOR_1 | APROBADOR_2 | PAGOS | LECTURA |
|---|---:|---:|---:|---:|---:|---:|---:|
| Iniciar sesión | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| Crear usuarios | Sí | No | No | No | No | No | No |
| Editar usuarios | Sí | No | No | No | No | No | No |
| Activar/desactivar usuarios | Sí | No | No | No | No | No | No |
| Asignar roles | Sí | No | No | No | No | No | No |
| Consultar módulos autorizados | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| Crear registros operativos | Sí | Según módulo | Según módulo | No | No | No | No |
| Aprobar solicitudes | No operativo | No | No | Sí | Sí | No | No |
| Marcar pagos | No operativo | No | No | No | No | Sí | No |
| Eliminar registros | Restringido | No | No | No | No | No | No |

Nota: aunque el rol `ADMINISTRADOR` puede administrar configuración, usuarios y roles, las acciones operativas críticas deben validarse según reglas específicas del módulo.

---

## 9. Validación en backend

Toda acción sensible debe validar permisos en backend.

Ejemplos de acciones sensibles:

- Crear usuario.
- Editar usuario.
- Activar o desactivar usuario.
- Asignar roles.
- Retirar roles.
- Aprobar solicitudes.
- Marcar pagos.
- Consultar información restringida.
- Asociar usuarios con beneficiarios.
- Acceder a información por centro de costo.

No basta con ocultar botones en frontend. El backend debe rechazar la acción si el usuario no tiene permiso.

---

## 10. Asociación usuario-beneficiario

Esta épica prepara la posibilidad de asociar beneficiarios a usuarios cuando aplique.

Casos posibles:

- Un usuario puede ser beneficiario de pagos.
- Un beneficiario puede tener usuario de acceso al sistema.
- Un usuario puede consultar información asociada a su propio beneficiario.
- No todos los usuarios necesariamente son beneficiarios.
- No todos los beneficiarios necesariamente tienen usuario.

Esta relación puede implementarse en una historia posterior si el flujo funcional lo requiere.

---

## 11. Auditoría

Las siguientes acciones deben quedar preparadas para auditoría:

- Creación de usuarios.
- Edición de usuarios.
- Activación de usuarios.
- Desactivación de usuarios.
- Asignación de roles.
- Retiro de roles.
- Inicio de sesión exitoso.
- Intentos fallidos de inicio de sesión, si se define como necesario.
- Bloqueo de acceso por usuario inactivo.

La auditoría puede implementarse completamente cuando se desarrolle el módulo transversal de auditoría, pero las acciones deben quedar identificadas desde esta épica.

---

## 12. Implementación técnica sugerida

### 12.1. Base de datos

Modelos requeridos inicialmente:

```txt
usuarios
roles
usuarios_roles
```

Migración inicial sugerida:

```bash
npx prisma migrate dev --name crear_usuarios_roles
```

### 12.2. Seed de roles base

Script sugerido:

```txt
prisma/seed.ts
```

Debe insertar los roles base si no existen.

Roles esperados:

```txt
ADMINISTRADOR
SOLICITANTE
AUXILIAR_CONTABLE
APROBADOR_1
APROBADOR_2
PAGOS
LECTURA
```

### 12.3. Backend

Rutas o servicios esperados:

```txt
/api/v1/auth/login
/api/v1/auth/me
/api/v1/usuarios
/api/v1/usuarios/[id]
/api/v1/usuarios/[id]/roles
/api/v1/roles
```

### 12.4. Servicios sugeridos

```txt
auth.service.ts
usuarios.service.ts
roles.service.ts
permisos.service.ts
```

### 12.5. Repositorios sugeridos

```txt
usuarios.repository.ts
roles.repository.ts
usuarios-roles.repository.ts
```

---

## 13. Orden recomendado de implementación

1. Crear modelos `usuarios`, `roles` y `usuarios_roles`.
2. Crear migración `crear_usuarios_roles`.
3. Crear seed de roles base.
4. Validar que el rol `LECTURA` exista.
5. Crear utilidades para hash y comparación de contraseña.
6. Crear endpoint de login.
7. Crear endpoint de usuario actual.
8. Crear endpoints de gestión de usuarios.
9. Crear endpoints para asignar y retirar roles.
10. Implementar validación de permisos en backend.
11. Agregar auditoría cuando el módulo transversal esté disponible.

---

## 14. Checklist de cierre de la épica

```md
## Épica 2. Autenticación, usuarios y roles

- [ ] Existen tablas `usuarios`, `roles` y `usuarios_roles`.
- [ ] Existe migración de usuarios y roles.
- [ ] Existen roles base en base de datos.
- [ ] Existe el rol `LECTURA`.
- [ ] El sistema permite iniciar sesión con correo y contraseña.
- [ ] El sistema valida contraseña mediante hash.
- [ ] El sistema bloquea usuarios inactivos.
- [ ] El sistema carga datos del usuario autenticado.
- [ ] El sistema carga roles del usuario autenticado.
- [ ] El sistema permite crear usuarios.
- [ ] El sistema permite editar usuarios.
- [ ] El sistema permite activar y desactivar usuarios.
- [ ] El sistema permite asignar roles.
- [ ] El sistema permite retirar roles.
- [ ] El sistema restringe acciones por rol desde backend.
- [ ] El sistema deja preparada la asociación usuario-beneficiario cuando aplique.
- [ ] Las acciones sensibles quedan identificadas para auditoría.
```

---

## 15. Estado actual

A la fecha de ajuste de esta épica, ya se inició la base técnica con los modelos:

```txt
usuarios
roles
usuarios_roles
```

También se avanzó en la migración correspondiente a usuarios y roles.

Pendiente continuar con:

```txt
Seed de roles base
Rol LECTURA
Login con correo y contraseña
Carga de usuario y roles
Gestión de usuarios
Asignación de roles
Validación de permisos en backend
```
