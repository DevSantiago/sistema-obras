# Épica 1 – Configuración base del proyecto

## 1. Objetivo general

Durante esta etapa se configuró la base técnica inicial del proyecto `sistema-obras`, con el fin de dejar listo el entorno mínimo para continuar el desarrollo del sistema.

La Épica 1 se enfocó en tres historias de usuario:

| Historia | Nombre | Estado |
|---|---|---|
| HU-0101 | Crear estructura base del proyecto | Cerrada |
| HU-0102 | Configurar conexión a base de datos | Cerrada |
| HU-0103 | Configurar estándar de migraciones | Cerrada |

---

# HU-0101. Crear estructura base del proyecto

## Objetivo

Crear la estructura inicial del proyecto para permitir el desarrollo ordenado del sistema.

## Actividades realizadas

Se creó y organizó el proyecto con Next.js y TypeScript. La estructura base quedó orientada a separar el código fuente, la documentación, la configuración de base de datos y los archivos públicos.

Estructura general esperada:

```txt
sistema-obras/
├── docs/
├── prisma/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── generated/
│   ├── lib/
│   └── modules/
├── package.json
├── tsconfig.json
├── next.config.ts
├── prisma.config.ts
└── .env
```

## Decisiones técnicas aplicadas

Se decidió usar Next.js como framework full-stack, de manera que el frontend y el backend interno convivan dentro del mismo proyecto.

También se decidió trabajar con carpeta `src`, para mantener el código fuente organizado.

Se revisó el alias `@/` para que apunte a `src`, permitiendo imports como:

```ts
import { prisma } from "@/lib/prisma";
```

---

# HU-0102. Configurar conexión a base de datos

## Objetivo

Configurar la conexión entre Next.js y PostgreSQL usando Prisma.

La conexión quedó organizada así:

```txt
Next.js API Route
↓
src/lib/prisma.ts
↓
Prisma Client
↓
Prisma adapter PostgreSQL
↓
DATABASE_URL
↓
PostgreSQL
```

## Criterios de aceptación

```md
- Usa variables de entorno.
- Permite ejecutar migraciones.
- Permite probar conexión local.
- Maneja errores de conexión.
```

## Variables de entorno

Se usó la variable `DATABASE_URL` para almacenar la cadena de conexión a PostgreSQL.

Ejemplo:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/sistema_obras"
```

Esta variable permite no dejar credenciales escritas directamente en el código.

## Configuración de Prisma

Se trabajó con Prisma 7.8.0. Por eso, la URL de conexión no quedó dentro de `schema.prisma`, sino dentro de `prisma.config.ts`.

El archivo `prisma.config.ts` quedó como responsable de indicar:

- Dónde está el schema.
- Dónde se guardan las migraciones.
- Desde dónde se lee la URL de conexión.

Estructura general usada:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

## Archivo `schema.prisma`

El archivo `prisma/schema.prisma` quedó con el datasource y un modelo inicial de prueba:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model prueba_conexion {
  id         String   @id @default(uuid())
  mensaje   String
  creado_en DateTime @default(now())
}
```

Este archivo define el modelo de datos y le indica a Prisma que se usará PostgreSQL.

## Generación de Prisma Client

Se ejecutó:

```bash
npx prisma generate
```

Con esto se generó Prisma Client en:

```txt
src/generated/prisma
```

Esa carpeta contiene código generado automáticamente por Prisma para consultar la base de datos desde TypeScript.

## Archivo `src/lib/prisma.ts`

Se creó una instancia reutilizable de Prisma en:

```txt
src/lib/prisma.ts
```

Este archivo centraliza la conexión con la base de datos para evitar crear conexiones en diferentes partes del sistema.

La conexión usa:

- `PrismaClient`.
- `@prisma/adapter-pg`.
- `pg`.
- `DATABASE_URL`.

Estructura general:

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## Endpoint de prueba local

Se creó un endpoint de salud para validar la conexión local con PostgreSQL.

Ruta:

```txt
src/app/api/v1/health/db/route.ts
```

URL:

```txt
http://localhost:3000/api/v1/health/db
```

Este endpoint ejecuta una consulta simple:

```sql
SELECT 1
```

Si la conexión funciona, responde:

```json
{
  "ok": true,
  "message": "Conexión a PostgreSQL correcta"
}
```

Si la conexión falla, responde con un error controlado.

## Manejo de errores

El endpoint usa `try/catch`, lo que permite manejar errores de conexión sin que la aplicación falle sin control.

Estructura general:

```ts
try {
  await prisma.$queryRaw`SELECT 1`;

  return Response.json({
    ok: true,
    message: "Conexión a PostgreSQL correcta",
  });
} catch (error) {
  return Response.json(
    {
      ok: false,
      message: "No fue posible conectar con PostgreSQL",
    },
    { status: 500 }
  );
}
```

## Resultado de HU-0102

```md
## HU-0102. Configurar conexión a base de datos

- [x] Usa variables de entorno.
- [x] Permite ejecutar migraciones.
- [x] Permite probar conexión local.
- [x] Maneja errores de conexión.
```

---

# HU-0103. Configurar estándar de migraciones

## Objetivo

Configurar el manejo de migraciones para controlar los cambios de estructura de la base de datos.

Una migración es un archivo que guarda un cambio en la base de datos, por ejemplo:

- Crear una tabla.
- Agregar una columna.
- Crear una llave primaria.
- Crear una llave foránea.
- Crear un índice.
- Modificar una restricción.

## Comando ejecutado

Se ejecutó:

```bash
npx prisma migrate dev --name crear_prueba_conexion
```

Este comando hizo lo siguiente:

1. Leyó `prisma/schema.prisma`.
2. Comparó el modelo definido con el estado actual de PostgreSQL.
3. Creó una carpeta de migración dentro de `prisma/migrations`.
4. Ejecutó el SQL generado contra la base de datos local.

## Carpeta de migraciones creada

Prisma creó la carpeta:

```txt
prisma/migrations/
```

Y dentro creó una carpeta específica para la migración:

```txt
prisma/migrations/
└── 20260611123456_crear_prueba_conexion/
    └── migration.sql
```

El número inicial corresponde a una marca de fecha y hora. El nombre final corresponde al nombre indicado en el comando: `crear_prueba_conexion`.

## Archivo `migration.sql`

El archivo `migration.sql` contiene el SQL real ejecutado en PostgreSQL.

En este caso, la migración creó la tabla `prueba_conexion` y su llave primaria.

Ejemplo esperado:

```sql
CREATE TABLE "prueba_conexion" (
  "id" TEXT NOT NULL,
  "mensaje" TEXT NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "prueba_conexion_pkey" PRIMARY KEY ("id")
);
```

La presencia de la constraint confirma que la migración incluyó una restricción básica de integridad.

## Validación del estado de migraciones

Se ejecutó:

```bash
npx prisma migrate status
```

El resultado fue:

```txt
1 migration found in prisma/migrations

Database schema is up to date!
```

Esto significa que:

- Prisma encontró una migración registrada.
- La migración ya fue aplicada en PostgreSQL.
- La base de datos está sincronizada con las migraciones.
- No hay cambios pendientes por aplicar.

## Resultado de HU-0103

```md
## HU-0103. Configurar estándar de migraciones

- [x] Existe carpeta `prisma/migrations`.
- [x] Se creó una migración inicial.
- [x] La migración genera archivo `migration.sql`.
- [x] La migración incluye restricción de llave primaria.
- [x] La migración puede ejecutarse en ambiente local.
- [x] Prisma reconoce la migración.
- [x] La base de datos está sincronizada con las migraciones.
```

---

# Revisión de `.gitignore`

## Estado revisado

Se revisó el archivo `.gitignore` y se confirmó que no está ignorando carpetas críticas como:

```txt
src
prisma
docs
package.json
README.md
```

Esto es correcto, porque esas carpetas y archivos deben quedar versionados en Git.

## Ajuste recomendado

Se identificó que la línea:

```gitignore
.env*
```

ignora todos los archivos que empiezan por `.env`, incluyendo `.env.example`.

Se recomendó reemplazarla por:

```gitignore
# env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# example env file should be committed
!.env.example
```

El archivo `.env` no debe versionarse porque contiene credenciales reales.

El archivo `.env.example` sí debe versionarse porque sirve como plantilla para otros entornos.

## Carpeta generada por Prisma

La línea:

```gitignore
/src/generated/prisma
```

se consideró correcta, porque esa carpeta se genera automáticamente con:

```bash
npx prisma generate
```

Lo que sí debe versionarse es:

```txt
prisma/schema.prisma
prisma/migrations
prisma.config.ts
package.json
package-lock.json
```

---

# Estado final de la Épica 1

## Checklist general

```md
## Épica 1. Configuración base del proyecto

- [x] HU-0101. Crear estructura base del proyecto.
- [x] HU-0102. Configurar conexión a base de datos.
- [x] HU-0103. Configurar estándar de migraciones.
```

## Resultado

La Épica 1 queda cerrada a nivel técnico inicial.

El proyecto ya cuenta con:

- Estructura base de Next.js.
- Configuración de TypeScript.
- Uso de variables de entorno.
- Conexión local a PostgreSQL.
- Prisma configurado.
- Prisma Client generado.
- Endpoint de prueba de conexión.
- Manejo de errores de conexión.
- Migración inicial creada.
- Carpeta `prisma/migrations`.
- Archivo `migration.sql`.
- Base de datos sincronizada con las migraciones.
- Revisión básica de `.gitignore`.

---

# Comandos principales usados

```bash
npx prisma generate
npx prisma migrate dev --name crear_prueba_conexion
npx prisma migrate status
npm run dev
```

---

# Concepto clave

La conexión y las migraciones quedaron organizadas bajo esta lógica:

```txt
.env
→ guarda DATABASE_URL

prisma.config.ts
→ le dice a Prisma dónde está el schema, dónde guardar migraciones y cómo leer la conexión

prisma/schema.prisma
→ define el modelo de datos

npx prisma generate
→ genera Prisma Client

src/lib/prisma.ts
→ crea una conexión reutilizable

route.ts
→ prueba la conexión desde Next.js

npx prisma migrate dev
→ crea y aplica migraciones

prisma/migrations
→ guarda el historial de cambios de la base de datos
```
