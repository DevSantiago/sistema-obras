# Flujo de ramas y ambientes para el desarrollo del proyecto

Aunque el proyecto esté apenas comenzando y todo esté local, conviene separar desde el inicio los ambientes y las ramas de trabajo.

Es importante diferenciar dos conceptos:

1. **Ramas Git**: controlan las versiones del código.
2. **Ambientes**: lugares donde corre la aplicación con configuración propia, como local, desarrollo, staging y producción.

---

## 1. Ambientes recomendados

Para este proyecto, se recomienda manejar los siguientes ambientes:

| Ambiente | Uso | Rama asociada |
|---|---|---|
| Local | Desarrollo en la máquina del desarrollador | `feature/*` o `dev` |
| Dev | Integración temprana de funcionalidades | `dev` |
| Staging / Stg | Simulación previa a producción | `stg` |
| Producción / Prod | Versión estable usada por usuarios reales | `main` |

La lógica general sería:

```text
feature/login
        ↓
dev
        ↓
stg
        ↓
main
```

---

## 2. Estructura de ramas

Actualmente el repositorio solo tiene la rama:

```bash
main
```

Se recomienda crear estas ramas base:

```bash
main
dev
stg
```

### Rama `main`

La rama `main` representa producción.

Debe contener únicamente código estable, probado y listo para desplegar.

No se recomienda trabajar directamente sobre `main`.

### Rama `dev`

La rama `dev` representa el ambiente de desarrollo integrado.

Aquí se integran las funcionalidades que se van construyendo.

Ejemplos de ramas que se integrarían a `dev`:

```text
feature/auth-login
feature/payment-requests
feature/providers-crud
```

### Rama `stg`

La rama `stg` representa staging o preproducción.

A esta rama solo debería pasar código previamente validado desde `dev`.

Sirve para probar el sistema en condiciones similares a producción: flujo completo, roles, permisos, base de datos, variables de entorno, seguridad y validaciones funcionales.

### Ramas `feature/*`

Las ramas `feature/*` son ramas temporales para cada funcionalidad.

Ejemplos:

```bash
feature/auth
feature/user-roles
feature/payment-request-crud
feature/attachments
feature/status-history
feature/providers
feature/projects
```

Cuando una funcionalidad se termina, se integra primero a `dev`.

---

## 3. Crear las ramas iniciales

Desde la rama actual `main`, ejecutar:

```bash
git checkout main
git pull origin main
```

Crear la rama `dev`:

```bash
git checkout -b dev
git push -u origin dev
```

Crear la rama `stg`:

```bash
git checkout main
git checkout -b stg
git push -u origin stg
```

Volver a `dev` para trabajar:

```bash
git checkout dev
```

---

## 4. Flujo diario de trabajo

No se recomienda trabajar directamente sobre `dev` cuando se trata de una funcionalidad concreta. Lo mejor es crear ramas pequeñas por funcionalidad.

Ejemplo para autenticación:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/auth
```

Luego se trabaja normalmente y se hacen commits:

```bash
git add .
git commit -m "Implement auth login and session validation"
```

Después se sube la rama:

```bash
git push -u origin feature/auth
```

Cuando la funcionalidad esté lista, se integra a `dev`:

```bash
git checkout dev
git pull origin dev
git merge feature/auth
git push origin dev
```

Cuando `dev` esté estable, se integra a `stg`:

```bash
git checkout stg
git pull origin stg
git merge dev
git push origin stg
```

Cuando `stg` esté validado, se integra a `main`:

```bash
git checkout main
git pull origin main
git merge stg
git push origin main
```

---

## 5. Variables de entorno por ambiente

Además de las ramas, se debe separar la configuración de cada ambiente.

En Next.js normalmente se manejan archivos como:

```text
.env.local
.env.development
.env.staging
.env.production
```

Sin embargo, no se deben subir archivos `.env` reales al repositorio si contienen secretos.

Lo correcto es subir un archivo de ejemplo:

```text
.env.example
```

Ejemplo de `.env.example`:

```env
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

En el archivo `.gitignore` se deberían incluir los archivos reales de entorno:

```gitignore
.env
.env.local
.env.development
.env.staging
.env.production
```

Cada ambiente debe tener su propia configuración y sus propias credenciales.

---

## 6. Bases de datos por ambiente

No se recomienda usar la misma base de datos para todos los ambientes.

La separación recomendada sería:

| Ambiente | Base de datos |
|---|---|
| Local | Base local o Supabase local |
| Dev | Base de datos de desarrollo |
| Stg | Base de datos de staging |
| Prod | Base de datos de producción |

Ejemplo conceptual:

```text
sistema_obras_local
sistema_obras_dev
sistema_obras_stg
sistema_obras_prod
```

Esto permite probar migraciones, datos falsos, errores y cambios sin afectar producción.

---

## 7. Flujo completo recomendado

```text
Desarrollar funcionalidad
        ↓
feature/payment-request-crud
        ↓
Merge a dev
        ↓
Despliegue a ambiente DEV
        ↓
Pruebas funcionales
        ↓
Merge a stg
        ↓
Despliegue a STAGING
        ↓
Validación completa
        ↓
Merge a main
        ↓
Despliegue a PRODUCCIÓN
```

---

## 8. Qué hacer en este momento del proyecto

Como el desarrollo apenas está comenzando, se recomienda crear las ramas base y empezar el trabajo desde una rama `feature/*`.

Comandos sugeridos:

```bash
git checkout main
git checkout -b dev
git push -u origin dev

git checkout main
git checkout -b stg
git push -u origin stg

git checkout dev
git checkout -b feature/auth-base
```

A partir de ahí, el desarrollo inicial puede continuar sobre:

```text
feature/auth-base
```

Cuando la autenticación esté terminada, se integra a `dev`.

---

## 9. Regla práctica para el proyecto

La regla general recomendada es:

```text
main = producción
stg = preproducción / validación
dev = integración de desarrollo
feature/* = trabajo diario
```

El flujo sano del proyecto sería:

```text
feature/*
→ dev
→ stg
→ main
```

Con esta estructura se mantiene una separación clara entre desarrollo, validación y producción, sin volver pesado el flujo de trabajo desde el inicio.
