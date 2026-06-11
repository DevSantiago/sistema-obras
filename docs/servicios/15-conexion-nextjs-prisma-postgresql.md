# 15. Conexión entre Next.js, Prisma y PostgreSQL

## Objetivo

Este documento explica, a nivel general, cómo interactúan los archivos principales del proyecto para permitir que la aplicación desarrollada en Next.js se conecte con una base de datos PostgreSQL mediante Prisma.

La finalidad de esta configuración es cumplir la historia de usuario HU-0102 de la Épica 1, relacionada con la conexión del backend con PostgreSQL para persistir información.

## Visión general de la conexión

La conexión entre la aplicación y la base de datos funciona como una cadena de responsabilidades:

```text
Navegador
↓
Route Handler de Next.js
↓
src/lib/prisma.ts
↓
Prisma Client generado
↓
Adapter de PostgreSQL
↓
DATABASE_URL
↓
PostgreSQL
```

En términos simples, Next.js recibe una petición, usa una instancia de Prisma configurada en el proyecto, Prisma lee la URL de conexión y finalmente ejecuta consultas contra PostgreSQL.

## Archivos principales involucrados

Los archivos principales para la conexión son:

```text
.env
prisma.config.ts
prisma/schema.prisma
src/generated/prisma/
src/lib/prisma.ts
src/app/api/v1/health/db/route.ts
tsconfig.json
```

Cada uno cumple una función diferente dentro del proceso.

## Archivo `.env`

El archivo `.env` contiene variables de entorno del proyecto. Para la conexión a base de datos, la variable principal es:

```env
DATABASE_URL="postgresql://postgres:CONTRASENA@localhost:5432/sistema_obras"
```

Esta URL contiene la información necesaria para conectarse a PostgreSQL:

```text
postgresql://     Motor de base de datos
postgres          Usuario de PostgreSQL
CONTRASENA        Contraseña del usuario
localhost         Servidor local
5432              Puerto estándar de PostgreSQL
sistema_obras     Nombre de la base de datos
```

El archivo `.env` no debe subirse al repositorio, porque puede contener datos sensibles como contraseñas, secretos de autenticación y credenciales de servicios externos.

## Archivo `.env.example`

El archivo `.env.example` sirve como plantilla para otros desarrolladores. Debe contener las mismas variables requeridas, pero sin credenciales reales.

Ejemplo:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/sistema_obras"
```

Este archivo sí puede subirse al repositorio, porque no contiene información sensible real.

## Archivo `prisma.config.ts`

En Prisma 7, la URL de conexión ya no se define dentro de `schema.prisma`. En su lugar, se configura en el archivo `prisma.config.ts`.

Este archivo le indica a Prisma:

```text
Dónde está el schema.
Dónde se guardan las migraciones.
Cuál es la URL de conexión a la base de datos.
```

Ejemplo:

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

Este archivo es usado principalmente por comandos de Prisma como:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma format
```

## Archivo `prisma/schema.prisma`

El archivo `schema.prisma` define la estructura de los modelos de base de datos y la forma en que Prisma debe generar su cliente.

Ejemplo inicial:

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

Este archivo cumple dos funciones principales:

```text
1. Define que la base de datos será PostgreSQL.
2. Define los modelos que Prisma usará para generar consultas tipadas.
```

El modelo `prueba_conexion` es una tabla temporal o inicial usada para validar que Prisma puede conectarse y trabajar con PostgreSQL.

Más adelante, este archivo contendrá los modelos reales del sistema, como:

```text
usuarios
roles
centros_costo
solicitudes_pago
movimientos_fondo_centro_costo
adjuntos
auditoria
```

## Carpeta `src/generated/prisma/`

Esta carpeta es generada automáticamente por Prisma cuando se ejecuta:

```bash
npx prisma generate
```

No se debe crear manualmente.

Prisma lee el archivo `schema.prisma` y genera código TypeScript que permite interactuar con la base de datos mediante `PrismaClient`.

Por ejemplo, si en `schema.prisma` existe el modelo:

```prisma
model prueba_conexion {
  id         String   @id @default(uuid())
  mensaje   String
  creado_en DateTime @default(now())
}
```

Prisma genera métodos para consultar, crear, actualizar o eliminar registros de ese modelo.

Ejemplo de uso posterior:

```ts
await prisma.prueba_conexion.findMany();
```

## Archivo `src/lib/prisma.ts`

Este archivo centraliza la creación de la instancia de Prisma. Su función es evitar que cada ruta o servicio cree su propia conexión de forma independiente.

Ejemplo:

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

Este archivo realiza las siguientes acciones:

```text
Importa PrismaClient desde el cliente generado.
Importa el adapter de PostgreSQL.
Lee la variable DATABASE_URL.
Crea una instancia de PrismaClient.
Reutiliza la instancia durante el desarrollo.
Exporta prisma para que otros archivos puedan usarlo.
```

La razón de reutilizar la instancia en desarrollo es evitar que Next.js cree múltiples conexiones a la base de datos durante los reinicios automáticos del servidor de desarrollo.

## Paquetes `@prisma/adapter-pg` y `pg`

Para Prisma 7, se usa un adapter para la conexión directa a PostgreSQL.

Los paquetes instalados son:

```bash
npm install @prisma/adapter-pg pg
```

Su función es:

```text
pg                     Driver de PostgreSQL para Node.js.
@prisma/adapter-pg     Adaptador que permite a Prisma usar el driver pg.
```

El adapter se usa dentro de `src/lib/prisma.ts`:

```ts
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
```

## Archivo `src/app/api/v1/health/db/route.ts`

Este archivo es una ruta backend de Next.js. Sirve para probar si la aplicación puede conectarse correctamente a PostgreSQL.

Cuando se abre esta URL:

```text
http://localhost:3000/api/v1/health/db
```

Next.js ejecuta el archivo:

```text
src/app/api/v1/health/db/route.ts
```

Ejemplo:

```ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      ok: true,
      message: "Conexión a PostgreSQL correcta",
    });
  } catch (error) {
    console.error("Error de conexión a PostgreSQL:", error);

    return Response.json(
      {
        ok: false,
        message: "No fue posible conectar con PostgreSQL",
      },
      { status: 500 }
    );
  }
}
```

La consulta:

```sql
SELECT 1
```

es una prueba mínima de conexión. No consulta una tabla específica, solo valida que PostgreSQL responde.

## Archivo `tsconfig.json`

Este archivo configura TypeScript y permite usar alias de importación.

Para que esta importación funcione:

```ts
import { prisma } from "@/lib/prisma";
```

el archivo `tsconfig.json` debe tener una configuración similar a:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

Esto significa:

```text
@/lib/prisma
=
src/lib/prisma.ts
```

Sin esta configuración, Next.js puede buscar el archivo en una ruta incorrecta.

## Flujo completo de ejecución

Cuando se abre la ruta de prueba en el navegador, ocurre lo siguiente:

```text
1. El navegador solicita:
   GET /api/v1/health/db

2. Next.js busca y ejecuta:
   src/app/api/v1/health/db/route.ts

3. route.ts importa:
   prisma desde src/lib/prisma.ts

4. src/lib/prisma.ts importa:
   PrismaClient desde src/generated/prisma/client

5. src/lib/prisma.ts crea:
   un adapter de PostgreSQL con DATABASE_URL

6. Prisma usa:
   @prisma/adapter-pg y pg

7. La conexión apunta a:
   PostgreSQL local, base de datos sistema_obras

8. route.ts ejecuta:
   SELECT 1

9. PostgreSQL responde.

10. La ruta devuelve:
   ok: true
```

## Comandos principales

### Generar Prisma Client

```bash
npx prisma generate
```

Este comando genera el cliente Prisma en `src/generated/prisma/`.

Se usa cuando:

```text
Se modifica schema.prisma.
Se instala Prisma por primera vez.
Se elimina la carpeta generada.
Se cambian modelos de base de datos.
```

### Ejecutar migraciones

```bash
npx prisma migrate dev --name init
```

Este comando aplica cambios del modelo a PostgreSQL y crea archivos de migración.

Se usa cuando:

```text
Se crea una tabla nueva.
Se agrega un campo.
Se cambia una relación.
Se modifica el modelo de base de datos.
```

### Formatear schema

```bash
npx prisma format
```

Este comando organiza el formato del archivo `schema.prisma`.

### Levantar Next.js

```bash
npm run dev
```

Este comando levanta el servidor local de desarrollo de Next.js.

No debe confundirse con:

```bash
npx run dev
```

El comando correcto para ejecutar scripts del proyecto es `npm run dev`.

## Validación esperada

La conexión queda validada cuando, al abrir:

```text
http://localhost:3000/api/v1/health/db
```

la respuesta es:

```json
{
  "ok": true,
  "message": "Conexión a PostgreSQL correcta"
}
```

Si ocurre un error de conexión, la respuesta debe ser controlada:

```json
{
  "ok": false,
  "message": "No fue posible conectar con PostgreSQL"
}
```

## Resumen conceptual

La conexión puede entenderse así:

```text
schema.prisma
Define los modelos y el cliente que Prisma debe generar.

prisma.config.ts
Define dónde está el schema, dónde van las migraciones y cuál es la URL de la base de datos.

.env
Guarda la URL real de conexión a PostgreSQL.

npx prisma generate
Genera el cliente de Prisma en src/generated/prisma.

src/lib/prisma.ts
Crea una instancia reutilizable de PrismaClient.

route.ts
Usa la instancia prisma para probar la conexión.

PostgreSQL
Recibe y ejecuta las consultas.
```

En una frase:

```text
Prisma conecta Next.js con PostgreSQL mediante un cliente generado a partir del schema, configurado con variables de entorno y reutilizado desde src/lib/prisma.ts.
```
