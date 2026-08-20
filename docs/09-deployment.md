# 09. Despliegue

> **Última actualización funcional:** Agosto de 2026.

> **Estrategia vigente:** VPS Hostinger con ambientes `stg` y `prod`,
> PostgreSQL dentro del VPS y almacenamiento documental privado en Amazon S3.

---

# Objetivo

Este documento define la estrategia de despliegue del Sistema de Gestión de Solicitudes de Pago.

Su propósito es establecer la estructura de ambientes, configuración de infraestructura, administración de migraciones, procedimientos de despliegue, validaciones posteriores a la publicación y lineamientos para garantizar una operación segura y consistente de la aplicación.

La estrategia de despliegue busca asegurar que todos los cambios funcionales lleguen a los ambientes correspondientes de forma controlada, minimizando el riesgo de afectar la disponibilidad del sistema o comprometer la integridad de la información.

---

# Alcance

Este documento comprende los siguientes aspectos:

- ambientes de ejecución;
- infraestructura de despliegue;
- configuración mediante variables de entorno;
- administración de migraciones;
- administración del seed;
- despliegue del backend;
- despliegue del frontend;
- almacenamiento de documentos;
- despliegue de servicios OCR;
- validaciones posteriores al despliegue;
- estrategia de respaldos;
- recuperación ante fallos.

Las reglas funcionales del sistema se documentan en los demás capítulos del proyecto y este documento se limita a los aspectos relacionados con la puesta en operación de la plataforma.

---

# Ambientes

El Sistema de Gestión de Solicitudes de Pago utiliza ambientes independientes para separar el desarrollo, las pruebas y la operación en producción.

Cada ambiente dispone de su propia configuración, base de datos, variables de entorno y servicios asociados.

La separación de ambientes evita que los cambios en desarrollo afecten la operación del sistema y permite realizar validaciones antes de publicar nuevas versiones.

---

## Ambiente local

El ambiente local corresponde al entorno utilizado por cada desarrollador durante la implementación de nuevas funcionalidades.

Características:

- ejecución local del frontend;
- ejecución local del backend;
- base de datos PostgreSQL local;
- almacenamiento de archivos configurado para desarrollo;
- variables de entorno locales;
- ejecución de migraciones y seed de desarrollo.

Este ambiente puede contener datos de prueba y no representa información productiva.

---

## Ambiente de desarrollo

El ambiente de desarrollo centraliza la integración de las funcionalidades implementadas por los desarrolladores.

Su propósito es validar el funcionamiento conjunto de los módulos antes de pasar a un ambiente de pruebas más controlado.

Características:

- despliegue continuo de funcionalidades en desarrollo;
- base de datos independiente;
- almacenamiento de documentos independiente;
- configuración propia de variables de entorno;
- ejecución de pruebas funcionales iniciales.

---

## Ambiente de staging

El ambiente de staging replica, en la mayor medida posible, la configuración utilizada en producción.

Su finalidad es validar una versión candidata antes de su publicación definitiva.

En este ambiente se realizan actividades como:

- pruebas funcionales integrales;
- validación de migraciones;
- validación del flujo completo de solicitudes;
- pruebas de integración entre módulos;
- validación del proceso de despliegue;
- verificación del rendimiento básico de la aplicación.

---

## Ambiente de producción

El ambiente de producción corresponde al entorno utilizado por los usuarios finales.

En este ambiente únicamente se despliegan versiones previamente validadas en staging.

Características:

- alta disponibilidad;
- base de datos productiva;
- almacenamiento definitivo de documentos;
- configuración segura de variables de entorno;
- monitoreo de la aplicación;
- ejecución periódica de respaldos.

---

## Independencia entre ambientes

Cada ambiente mantiene de forma independiente:

- base de datos;
- archivos almacenados;
- variables de entorno;
- secretos de autenticación;
- servicios externos;
- registros de auditoría.

No se comparten credenciales ni información operativa entre ambientes.

---

## Flujo de despliegue

Las nuevas funcionalidades siguen el siguiente flujo de publicación:

```text
Desarrollo local
        │
        ▼
Desarrollo
        │
        ▼
Staging
        │
        ▼
Producción
```

Cada transición requiere que la versión haya superado las validaciones técnicas y funcionales definidas para el ambiente correspondiente.

---

# Ambientes

El Sistema de Gestión de Solicitudes de Pago utiliza ambientes independientes para separar el desarrollo, las pruebas y la operación en producción.

Cada ambiente dispone de su propia configuración, base de datos, variables de entorno y servicios asociados.

La separación de ambientes evita que los cambios en desarrollo afecten la operación del sistema y permite realizar validaciones antes de publicar nuevas versiones.

---

## Ambiente local

El ambiente local corresponde al entorno utilizado por cada desarrollador durante la implementación de nuevas funcionalidades.

Características:

- ejecución local del frontend;
- ejecución local del backend;
- base de datos PostgreSQL local;
- almacenamiento de archivos configurado para desarrollo;
- variables de entorno locales;
- ejecución de migraciones y seed de desarrollo.

Este ambiente puede contener datos de prueba y no representa información productiva.

La operación vigente no contempla un ambiente `dev` remoto: el desarrollo se
mantiene local y las ramas se integran en `dev` antes de promoverse a `stg`.

---

## Ambiente de desarrollo

El ambiente de desarrollo centraliza la integración de las funcionalidades implementadas por los desarrolladores.

Su propósito es validar el funcionamiento conjunto de los módulos antes de pasar a un ambiente de pruebas más controlado.

Características:

- despliegue continuo de funcionalidades en desarrollo;
- base de datos independiente;
- almacenamiento de documentos independiente;
- configuración propia de variables de entorno;
- ejecución de pruebas funcionales iniciales.

---

## Ambiente de staging

El ambiente de staging replica, en la mayor medida posible, la configuración utilizada en producción.

Su finalidad es validar una versión candidata antes de su publicación definitiva.

En este ambiente se realizan actividades como:

- pruebas funcionales integrales;
- validación de migraciones;
- validación del flujo completo de solicitudes;
- pruebas de integración entre módulos;
- validación del proceso de despliegue;
- verificación del rendimiento básico de la aplicación.

---

## Ambiente de producción

El ambiente de producción corresponde al entorno utilizado por los usuarios finales.

En este ambiente únicamente se despliegan versiones previamente validadas en staging.

Características:

- alta disponibilidad;
- base de datos productiva;
- almacenamiento definitivo de documentos;
- configuración segura de variables de entorno;
- monitoreo de la aplicación;
- ejecución periódica de respaldos.

---

## Independencia entre ambientes

Cada ambiente mantiene de forma independiente:

- base de datos;
- archivos almacenados;
- variables de entorno;
- secretos de autenticación;
- servicios externos;
- registros de auditoría.

No se comparten credenciales ni información operativa entre ambientes.

---

## Flujo de despliegue

Las nuevas funcionalidades siguen el siguiente flujo de publicación:

```text
Desarrollo local
        │
        ▼
Desarrollo
        │
        ▼
Staging
        │
        ▼
Producción
```

Cada transición requiere que la versión haya superado las validaciones técnicas y funcionales definidas para el ambiente correspondiente.

---

# Infraestructura

La infraestructura del Sistema de Gestión de Solicitudes de Pago está diseñada bajo una arquitectura cliente-servidor, desacoplando la interfaz de usuario, la lógica de negocio, la base de datos y los servicios auxiliares.

Cada componente puede evolucionar de manera independiente sin afectar la arquitectura general del sistema.

---

## Frontend

El frontend se desarrolla utilizando **Next.js** con **React** y **TypeScript**.

Es responsable de:

- autenticación de usuarios;
- navegación de la aplicación;
- captura de información;
- visualización de consultas;
- interacción con la API;
- validaciones orientadas a mejorar la experiencia del usuario.

El frontend no accede directamente a la base de datos.

---

## Backend

El backend expone la API REST del sistema y concentra toda la lógica de negocio.

Entre sus responsabilidades se encuentran:

- autenticación;
- autorización;
- validaciones funcionales;
- administración de usuarios;
- administración de proyectos base;
- gestión de beneficiarios;
- gestión de solicitudes de pago;
- procesamiento documental;
- generación de movimientos financieros;
- auditoría.

Todas las operaciones que modifican información se ejecutan desde esta capa.

---

## Base de datos

La persistencia de la información se implementa mediante **PostgreSQL**.

El acceso a la base de datos se realiza exclusivamente a través de **Prisma ORM**, garantizando consistencia entre el modelo de datos y la aplicación.

La base de datos almacena:

- información operativa;
- configuraciones;
- relaciones entre entidades;
- auditoría;
- referencias documentales.

Los archivos físicos no se almacenan dentro de la base de datos.

---

## Almacenamiento documental

Los documentos adjuntos son almacenados en un servicio de almacenamiento de objetos.

La base de datos conserva únicamente los metadatos necesarios para administrar cada archivo y establecer su relación con las entidades funcionales del sistema.

---

## Servicio OCR

El procesamiento OCR se implementa como un servicio independiente del backend principal.

Este servicio procesa los documentos que requieren extracción automática de información y devuelve los resultados para su validación por parte del sistema.

Su desacoplamiento permite actualizar o reemplazar la tecnología OCR sin afectar el resto de la aplicación.

---

## Infraestructura de despliegue

La aplicación está diseñada para ejecutarse sobre un servidor VPS donde residen los componentes principales del sistema.

La infraestructura contempla, como mínimo:

- servidor de aplicaciones;
- base de datos PostgreSQL;
- almacenamiento de documentos;
- servicios auxiliares requeridos por la aplicación;
- mecanismos de respaldo y monitoreo.

Esta arquitectura permite escalar cada componente de manera independiente conforme aumenten las necesidades operativas del sistema.

La implementación inicial utiliza `docker-compose.vps.yml` y contiene:

- `app-stg` y `app-prod`, construidos desde una misma imagen versionada;
- PostgreSQL con bases y usuarios independientes por ambiente;
- una red interna que impide exponer PostgreSQL a internet;
- Caddy como proxy inverso y administrador de certificados HTTPS;
- volúmenes persistentes para PostgreSQL y certificados de Caddy.

Los archivos de configuración reales se crean a partir de las plantillas de
`deploy/env` y nunca se incluyen en Git.

`app-prod` pertenece al perfil opcional `production`. El arranque inicial sin
perfiles publica solamente staging; producción se habilita de forma explícita
después de validar la versión candidata.

---

# Variables de entorno

La configuración del sistema se realiza mediante variables de entorno específicas para cada ambiente de ejecución.

Esta estrategia permite mantener separados los parámetros de configuración de la aplicación respecto del código fuente y facilita la administración de credenciales, servicios externos y componentes de infraestructura.

Cada ambiente dispone de su propio conjunto de variables de entorno.

---

## Base de datos

Variables relacionadas con la conexión a PostgreSQL.

Entre ellas se incluyen:

- cadena de conexión;
- usuario;
- contraseña;
- puerto;
- nombre de la base de datos.

La configuración utilizada depende del ambiente donde se encuentre desplegada la aplicación.

---

## Autenticación

Variables utilizadas por el mecanismo de autenticación y administración de sesiones.

Incluyen, entre otras:

- secreto para la firma y validación de sesiones;
- tiempo de expiración de la sesión;
- configuración de cookies seguras, cuando aplique.

Estas variables deben mantenerse confidenciales y nunca formar parte del código fuente.

---

## Almacenamiento documental

Variables utilizadas para establecer la conexión con el servicio de almacenamiento de documentos.

Como mínimo incluyen:

- proveedor de almacenamiento;
- bucket o contenedor;
- credenciales de acceso;
- región o ubicación del servicio, cuando aplique.

---

## WhatsApp Business Platform

Staging y producción utilizan aplicaciones, números, tokens y plantillas
independientes. Los valores reales se guardan únicamente en los archivos
privados `deploy/env/stg.env` y `deploy/env/prod.env` del VPS.

Variables requeridas para la integración:

```text
WHATSAPP_ENABLED
APP_ENV
APP_BASE_URL
WHATSAPP_GRAPH_API_VERSION
WHATSAPP_WABA_ID
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_PHONE_NUMBER
WHATSAPP_APP_ID
WHATSAPP_APP_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
WHATSAPP_PROCESSOR_TOKEN
WHATSAPP_MAX_ATTEMPTS
WHATSAPP_BATCH_SIZE
WHATSAPP_RETRY_MINUTES
WHATSAPP_SENDING_TIMEOUT_MINUTES
WHATSAPP_REQUEST_TIMEOUT_MS
WHATSAPP_TEMPLATE_APROBACION_NIVEL_1
WHATSAPP_TEMPLATE_APROBACION_NIVEL_2
WHATSAPP_TEMPLATE_DEVOLUCION_APROBADOR_1
WHATSAPP_TEMPLATE_DEVOLUCION_SOLICITANTE
WHATSAPP_TEMPLATE_PROGRAMADA_PAGO
WHATSAPP_TEMPLATE_LANGUAGE
```

`WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_VERIFY_TOKEN` son
secretos. No deben compartirse por mensajes, registrarse en logs ni incluirse
en Git. El token de verificación se define internamente y debe coincidir con el
registrado en Meta.

`WHATSAPP_PROCESSOR_TOKEN` protege el endpoint interno que procesa la cola y
debe ser un secreto aleatorio diferente en staging y producción. El VPS debe
invocar el procesador periódicamente sin incluir ese secreto en el repositorio.
Para staging se puede programar cada minuto desde el host con:

```cron
* * * * * cd /opt/sistema-obras/app && docker compose -f docker-compose.vps.yml exec -T app-stg node -e "fetch('http://127.0.0.1:3000/api/v1/whatsapp/notificaciones/procesar',{method:'POST',headers:{authorization:'Bearer '+process.env.WHATSAPP_PROCESSOR_TOKEN}}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
```

La tarea procesa lotes pequeños, recupera registros que permanezcan en
`ENVIANDO` después del tiempo límite y reintenta estados `FALLIDA` sin bloquear
el flujo de aprobaciones.

Todas las plantillas funcionales reciben `destinatario` en el encabezado y los
parámetros de cuerpo `numero_solicitud`, `proyecto`, `beneficiario`, `valor` y
`estado`. Las devoluciones agregan `aprobador_uno` o `aprobador_dos` según el
origen, y la plantilla de pagos incluye ambos. Los botones utilizan URL estática.
La plantilla de prueba estándar `hello_world` se envía sin parámetros.

El webhook de staging es:

```text
https://stg.dimensiones.cloud/api/v1/webhooks/whatsapp
```

Antes de habilitar producción se deben aceptar los términos vigentes de
WhatsApp Business, configurar el medio de pago requerido, aprobar las
plantillas y publicar la aplicación de Meta. En el panel de la aplicación se
suscriben los campos `messages`; las actualizaciones de estado llegan dentro
de ese mismo flujo de webhook.

---

## Servicio OCR

Las funcionalidades de reconocimiento óptico de caracteres utilizan variables de configuración independientes.

Entre ellas pueden encontrarse:

- proveedor del servicio OCR;
- credenciales de autenticación;
- parámetros de procesamiento;
- límites de uso;
- configuración de tiempos de espera.

La disponibilidad de estas variables depende de la implementación del servicio OCR correspondiente.

Para Amazon S3 se utilizan:

```text
STORAGE_PROVIDER=s3
AWS_REGION
AWS_S3_BUCKET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

El SDK también admite credenciales temporales mediante `AWS_SESSION_TOKEN`.
Cada ambiente debe usar un bucket y una identidad IAM independientes. Los
buckets permanecen privados y los objetos se guardan cifrados con SSE-S3.

La infraestructura inicial utiliza tres buckets:

```text
dimensiones-obras-stg
dimensiones-obras-prod
dimensiones-obras-backups
```

En todos se debe activar el bloqueo de acceso público. Las políticas IAM de
referencia se encuentran en `deploy/aws`; deben reemplazarse los nombres de
bucket antes de aplicarlas. La identidad de cada aplicación solo recibe
`ListBucket`, `PutObject`, `GetObject` y `DeleteObject` sobre su propio bucket.
La identidad de respaldos solo recibe `PutObject` bajo el prefijo `postgres/`.

El archivo `deploy/aws/backup-lifecycle.json` establece una retención inicial
de 90 días y elimina versiones anteriores después de 30 días. Esta política
debe revisarse con el cliente antes de activarse.

---

## Correo electrónico

Los servicios de envío de correos electrónicos utilizan variables específicas para su configuración.

Estas variables pueden incluir:

- servidor SMTP o proveedor equivalente;
- credenciales de autenticación;
- remitente predeterminado;
- parámetros de seguridad.

---

## Configuración de la aplicación

Además de las variables anteriores, la aplicación utiliza parámetros generales para controlar su comportamiento.

Entre ellos pueden configurarse:

- ambiente de ejecución;
- nivel de registro de eventos;
- URL pública de la aplicación;
- URL de la API;
- parámetros generales de funcionamiento.

---

## Administración de variables

Las variables de entorno deben administrarse de manera independiente para cada ambiente.

No deben almacenarse:

- en el repositorio de código fuente;
- en archivos públicos;
- dentro del código de la aplicación;
- en documentación que contenga credenciales reales.

Cada ambiente debe utilizar únicamente las credenciales y configuraciones que le correspondan.


---

# Migraciones

La evolución del modelo de datos se administra mediante el sistema de migraciones de Prisma.

Cada cambio estructural de la base de datos debe quedar registrado mediante una migración versionada, garantizando la trazabilidad de la evolución del esquema y la consistencia entre los diferentes ambientes de ejecución.

---

## Principios

Las migraciones deben cumplir los siguientes principios:

- ser incrementales;
- ser reproducibles;
- mantener compatibilidad con las versiones desplegadas;
- evitar modificaciones manuales sobre la base de datos;
- permitir la reconstrucción completa del esquema desde una base de datos vacía.

---

## Orden de construcción del modelo

Las migraciones deben respetar el orden lógico de dependencias entre los módulos del sistema.

Como referencia, el modelo de datos evoluciona siguiendo una secuencia similar a la siguiente:

1. usuarios;
2. roles;
3. permisos;
4. relaciones entre usuarios, roles y permisos;
5. líneas de negocio;
6. proyectos base;
7. centros de costo;
8. beneficiarios;
9. secuencias del sistema;
10. solicitudes de pago;
11. documentos adjuntos;
12. pagos;
13. operaciones de efectivo y sus detalles;
14. movimientos del fondo;
15. préstamos entre proyectos;
16. auditoría;
17. demás módulos funcionales incorporados durante la evolución del sistema.

Nuevos módulos deberán integrarse respetando las dependencias definidas por el modelo de datos.

---

## Creación de migraciones

Toda modificación del esquema deberá realizarse mediante una nueva migración.

No deben modificarse migraciones que ya hayan sido ejecutadas en otros ambientes.

Cuando sea necesario corregir una estructura existente, la corrección deberá implementarse mediante una migración adicional.

---

## Aplicación de migraciones

Antes de desplegar una nueva versión de la aplicación deberán ejecutarse las migraciones pendientes sobre la base de datos correspondiente al ambiente de destino.

En staging se ejecuta exclusivamente:

```bash
docker compose -f docker-compose.vps.yml run --rm app-stg npx prisma migrate deploy
```

Después de validar staging, en producción se ejecuta:

```bash
docker compose -f docker-compose.vps.yml --profile production run --rm app-prod npx prisma migrate deploy
```

`prisma migrate dev` queda reservado al ambiente local.

La aplicación únicamente podrá iniciar cuando el esquema de la base de datos sea compatible con la versión desplegada.

---

## Generación del cliente Prisma

Después de cualquier modificación al esquema de Prisma deberá regenerarse el cliente utilizado por la aplicación.

Este procedimiento garantiza que los modelos disponibles para el backend correspondan exactamente con la estructura de la base de datos.

---

## Restricciones

Durante la operación normal del sistema no deben utilizarse procedimientos que eliminen la información existente para reconstruir la base de datos.

Las bases de datos de desarrollo, staging y producción deben evolucionar exclusivamente mediante migraciones incrementales.

---

## Validación

Antes de aplicar una migración en ambientes compartidos deberá verificarse:

- compatibilidad con el modelo de datos vigente;
- consistencia con las relaciones existentes;
- impacto sobre la información almacenada;
- compatibilidad con el backend y el frontend;
- correcta ejecución sobre una copia de prueba cuando la complejidad del cambio lo requiera.

Estas validaciones reducen el riesgo de inconsistencias durante el proceso de despliegue.

---

# Seed

El sistema utiliza un proceso de inicialización (seed) para crear la información base requerida por la aplicación.

El objetivo del seed es garantizar que todos los ambientes dispongan de la configuración mínima necesaria para operar correctamente después de ejecutar las migraciones.

---

## Objetivos

El proceso de seed debe:

- crear la información base del sistema;
- mantener consistencia entre ambientes;
- facilitar la instalación de nuevas instancias;
- evitar la creación manual de registros fundamentales.

El seed no debe utilizarse para cargar información operativa del negocio.

---

## Información inicial

Como mínimo, el seed deberá crear o actualizar la siguiente información:

- roles del sistema;
- permisos;
- relación entre roles y permisos;
- líneas de negocio;
- relación entre roles y líneas de negocio, cuando corresponda;
- secuencias iniciales del sistema;
- parámetros generales de configuración;
- usuario administrador inicial.

Nuevos catálogos funcionales podrán incorporarse conforme evolucione el sistema.

---

## Usuario administrador

El proceso de seed crea un usuario administrador inicial con los permisos necesarios para realizar la configuración inicial de la plataforma.

Una vez finalizada la instalación, las credenciales iniciales deberán modificarse antes de utilizar el sistema en ambientes productivos.

---

## Ejecución

El seed debe ejecutarse:

- después de aplicar las migraciones sobre una base de datos nueva;
- cuando se requiera inicializar un ambiente de desarrollo;
- cuando se incorporen nuevos catálogos base mediante actualizaciones del sistema.

Su ejecución debe ser segura ante múltiples ejecuciones consecutivas, evitando la creación de registros duplicados.

---

## Evolución del seed

Cada modificación de los catálogos base deberá reflejarse en el proceso de seed.

Esto garantiza que una nueva instalación genere automáticamente la configuración mínima requerida por la versión correspondiente de la aplicación.

---

## Restricciones

El proceso de seed no debe:

- eliminar información operativa existente;
- sobrescribir configuraciones realizadas por los administradores del sistema;
- modificar registros transaccionales;
- alterar información histórica.

Su alcance se limita exclusivamente a la información base necesaria para el funcionamiento de la plataforma.

---

## Validación

Después de ejecutar el seed deberá verificarse, como mínimo:

- existencia de los roles del sistema;
- existencia de los permisos;
- correcta relación entre roles y permisos;
- disponibilidad del usuario administrador;
- inicialización de las secuencias requeridas;
- creación de los parámetros generales de configuración.

Estas validaciones garantizan que el sistema se encuentre preparado para iniciar su operación.

---

# Proceso de despliegue

El despliegue de una nueva versión del Sistema de Gestión de Solicitudes de Pago sigue un procedimiento controlado cuyo propósito es minimizar riesgos, preservar la integridad de la información y garantizar la disponibilidad de la plataforma.

Cada despliegue debe ejecutarse de manera ordenada y verificable.

---

## Flujo general

El proceso de despliegue sigue la siguiente secuencia:

```text
Desarrollo
      │
      ▼
Integración
      │
      ▼
Staging
      │
      ▼
Producción
```

Una versión únicamente puede avanzar al siguiente ambiente cuando haya superado satisfactoriamente las validaciones del ambiente anterior.

---

## Preparación del despliegue

Antes de iniciar un despliegue deben verificarse, como mínimo, los siguientes aspectos:

- cambios integrados en la rama correspondiente;
- compilación exitosa de la aplicación;
- pruebas funcionales satisfactorias;
- migraciones revisadas;
- actualización del proceso de seed, cuando aplique;
- variables de entorno configuradas;
- disponibilidad de la infraestructura.

---

## Publicación de la aplicación

Durante el despliegue se ejecutan las actividades necesarias para publicar la nueva versión de la aplicación.

Como parte del proceso deben realizarse, según corresponda:

- obtención de la nueva versión del código fuente;
- instalación de dependencias;
- compilación de la aplicación;
- generación del cliente Prisma;
- aplicación de migraciones pendientes;
- ejecución del seed cuando sea requerido;
- reinicio controlado de los servicios.

Cada actividad debe completarse correctamente antes de continuar con la siguiente.

---

## Validaciones posteriores

Finalizado el despliegue debe verificarse el correcto funcionamiento de la plataforma.

Como mínimo se valida:

- disponibilidad de la aplicación;
- autenticación de usuarios;
- funcionamiento de la API;
- acceso a la base de datos;
- carga de archivos;
- consulta de documentos;
- ejecución de los principales procesos de negocio;
- generación de registros de auditoría.

---

## Manejo de errores

Si durante el despliegue se presenta un error que comprometa la estabilidad del sistema, el proceso deberá detenerse hasta identificar su causa.

No deberán ejecutarse pasos posteriores mientras existan errores pendientes que puedan afectar la integridad de la información.

Cuando sea necesario, podrá ejecutarse el procedimiento de recuperación definido para la plataforma.

---

## Despliegues en producción

Los despliegues sobre el ambiente de producción deberán realizarse únicamente cuando:

- la versión haya sido validada previamente en staging;
- existan respaldos recientes de la base de datos;
- las migraciones hayan sido verificadas;
- las variables de entorno correspondan al ambiente productivo;
- se encuentren disponibles mecanismos de monitoreo posteriores al despliegue.

---

## Trazabilidad

Cada despliegue debe permitir identificar, como mínimo:

- versión publicada;
- fecha y hora del despliegue;
- ambiente intervenido;
- responsable de la publicación;
- resultado del proceso;
- incidencias presentadas, en caso de existir.

Esta información facilita el seguimiento operativo y la atención de incidentes posteriores.

---

# Validación del despliegue

Una vez finalizado el proceso de despliegue, debe verificarse que todos los componentes del sistema operen correctamente antes de considerar la versión como disponible para los usuarios.

La validación debe cubrir tanto aspectos técnicos como funcionales.

---

## Validaciones técnicas

Inicialmente debe comprobarse el correcto funcionamiento de la infraestructura.

Como mínimo se valida:

- disponibilidad del servidor;
- disponibilidad de la aplicación;
- inicio correcto de los servicios;
- conexión con la base de datos;
- acceso al almacenamiento documental;
- disponibilidad del servicio OCR, cuando aplique;
- carga correcta de las variables de entorno.

La presencia de errores en cualquiera de estos componentes impide la liberación de la versión.

---

## Validaciones de base de datos

Después de aplicar las migraciones debe verificarse que:

- no existan errores de ejecución;
- el esquema corresponda a la versión desplegada;
- las relaciones entre entidades permanezcan consistentes;
- las tablas críticas sean accesibles;
- la información existente permanezca íntegra.

Asimismo, debe confirmarse que el cliente Prisma opere correctamente sobre el nuevo esquema.

---

## Validaciones funcionales

Posteriormente deben ejecutarse pruebas funcionales sobre los procesos principales del sistema.

Como mínimo deben verificarse:

- inicio de sesión;
- cierre de sesión;
- consulta de usuarios;
- consulta de proyectos;
- consulta de beneficiarios;
- creación de solicitudes de pago;
- aprobación de solicitudes;
- carga de documentos;
- consulta de adjuntos;
- generación de movimientos financieros;
- consultas generales del sistema.

Estas pruebas permiten detectar errores funcionales no identificados durante el proceso de despliegue.

---

## Validación de seguridad

Después del despliegue debe verificarse que los mecanismos de seguridad continúen funcionando correctamente.

Como mínimo se valida:

- autenticación;
- autorización por roles;
- protección de rutas;
- protección de endpoints;
- acceso a documentos;
- manejo de sesiones;
- registros de auditoría.

---

## Validación de rendimiento

Se recomienda verificar que la nueva versión mantenga un comportamiento estable.

Entre otros aspectos pueden revisarse:

- tiempos de respuesta;
- consumo de memoria;
- consumo de CPU;
- utilización de almacenamiento;
- tiempos de consulta sobre la base de datos.

Estas verificaciones permiten identificar degradaciones de desempeño ocasionadas por la nueva versión.

---

## Criterios de aceptación

Un despliegue se considera exitoso cuando:

- todas las migraciones finalizan correctamente;
- la aplicación inicia sin errores;
- las validaciones técnicas son satisfactorias;
- las pruebas funcionales concluyen sin incidencias críticas;
- los mecanismos de seguridad funcionan correctamente;
- no se detectan errores que comprometan la operación del sistema.

---

## Gestión de incidencias

Si durante la validación se identifican errores críticos, la nueva versión no deberá considerarse liberada.

En estos casos deberán ejecutarse las actividades de diagnóstico y recuperación definidas para la plataforma antes de habilitar nuevamente el acceso de los usuarios.

---

# Respaldos

La estrategia de respaldos tiene como objetivo garantizar la disponibilidad de la información y permitir la recuperación del sistema ante incidentes que afecten la base de datos, los documentos almacenados o la infraestructura.

Los respaldos deben ejecutarse de manera periódica, verificable y segura.

---

## Alcance

La política de respaldos comprende, como mínimo:

- base de datos PostgreSQL;
- documentos almacenados;
- archivos de configuración;
- variables de entorno;
- registros de auditoría, cuando corresponda;
- configuraciones necesarias para reconstruir la plataforma.

No es necesario respaldar el código fuente, ya que este se encuentra versionado mediante el sistema de control de versiones.

---

## Respaldo de la base de datos

La base de datos debe respaldarse de forma periódica utilizando mecanismos compatibles con PostgreSQL.

Cada respaldo debe garantizar:

- consistencia transaccional;
- integridad de la información;
- posibilidad de restauración completa;
- compatibilidad con la versión utilizada por la aplicación.

Los respaldos deberán almacenarse de forma independiente al servidor principal.

El script `deploy/backup-postgres.sh` genera respaldos PostgreSQL en formato
custom y los carga cifrados al bucket privado indicado por
`BACKUP_S3_BUCKET`. Debe ejecutarse diariamente desde cron o un temporizador
del VPS con las variables de `deploy/env/backup.env.example`.

---

## Respaldo de documentos

Los documentos cargados por los usuarios forman parte de la información crítica del sistema.

El mecanismo de respaldo debe garantizar la conservación de:

- archivos originales;
- estructura lógica de almacenamiento;
- metadatos necesarios para su recuperación.

La pérdida de documentos puede afectar la trazabilidad de las solicitudes de pago y los procesos de auditoría.

---

## Frecuencia

La frecuencia de los respaldos dependerá de las necesidades operativas de la organización.

Como referencia, se recomienda:

- respaldos diarios de la base de datos;
- respaldos periódicos del almacenamiento documental;
- respaldos antes de cada despliegue en producción;
- respaldos antes de ejecutar migraciones que modifiquen la estructura de la base de datos.

La frecuencia podrá ajustarse conforme aumente el volumen de operación del sistema.

---

## Retención

Los respaldos deberán conservarse durante un periodo definido por la política de continuidad del negocio.

La estrategia de retención debe permitir disponer de múltiples puntos de recuperación sin comprometer la capacidad de almacenamiento.

La eliminación automática de respaldos antiguos deberá realizarse conforme a la política establecida por la organización.

---

## Protección de los respaldos

Los archivos de respaldo deberán protegerse mediante controles adecuados de seguridad.

Como mínimo deberán garantizarse:

- acceso restringido;
- almacenamiento seguro;
- protección frente a modificaciones no autorizadas;
- protección frente a pérdidas accidentales.

Cuando los respaldos contengan información sensible, deberán utilizar mecanismos de cifrado durante su almacenamiento y transferencia.

---

## Verificación

La existencia de un respaldo no garantiza su utilidad.

Periódicamente deberán realizarse pruebas de restauración para verificar:

- integridad de los archivos;
- consistencia de la base de datos restaurada;
- disponibilidad de los documentos;
- correcto funcionamiento de la aplicación después de la recuperación.

Estas verificaciones permiten asegurar que los respaldos puedan utilizarse efectivamente en caso de incidente.

---

# Recuperación ante desastres

La estrategia de recuperación ante desastres tiene como objetivo restablecer la operación del Sistema de Gestión de Solicitudes de Pago en el menor tiempo posible después de un incidente que afecte la disponibilidad de la plataforma o comprometa la integridad de la información.

La recuperación deberá realizarse siguiendo procedimientos previamente definidos y validados.

---

## Alcance

La estrategia de recuperación contempla, como mínimo, los siguientes componentes:

- servidor de aplicaciones;
- base de datos PostgreSQL;
- almacenamiento documental;
- variables de entorno;
- configuraciones de la aplicación;
- servicios auxiliares requeridos para la operación.

La recuperación deberá garantizar que todos los componentes vuelvan a operar de manera consistente.

---

## Escenarios de recuperación

Entre los principales escenarios considerados se encuentran:

- falla del servidor de aplicaciones;
- corrupción de la base de datos;
- pérdida parcial o total del almacenamiento documental;
- error durante un despliegue;
- eliminación accidental de información;
- fallas de infraestructura;
- incidentes de seguridad que requieran restauración desde un respaldo confiable.

Cada escenario deberá contar con un procedimiento documentado de recuperación.

---

## Restauración de la base de datos

Cuando sea necesario restaurar la base de datos deberán utilizarse los respaldos previamente generados y verificados.

Durante el proceso deberá garantizarse:

- consistencia de la información restaurada;
- compatibilidad con la versión de la aplicación;
- preservación de las relaciones entre entidades;
- correcta ejecución de las migraciones posteriores, cuando corresponda.

Una vez finalizada la restauración deberá verificarse el correcto funcionamiento de la aplicación.

---

## Restauración del almacenamiento documental

En caso de pérdida de documentos deberá recuperarse el almacenamiento utilizando los respaldos disponibles.

La restauración deberá conservar:

- archivos originales;
- estructura lógica de almacenamiento;
- metadatos registrados en la base de datos;
- asociaciones entre documentos y entidades funcionales.

La información documental deberá permanecer consistente con los registros almacenados en la base de datos.

---

## Recuperación de la aplicación

Cuando el servidor de aplicaciones deba reconstruirse, el procedimiento comprenderá, como mínimo:

- aprovisionamiento de la infraestructura;
- despliegue de la versión correspondiente de la aplicación;
- configuración de las variables de entorno;
- generación del cliente Prisma;
- aplicación de migraciones pendientes;
- restauración de la base de datos, cuando sea necesario;
- validación integral del sistema.

---

## Validación posterior

Después de completar el proceso de recuperación deberán ejecutarse las validaciones definidas para el despliegue de una nueva versión.

Como mínimo deberá verificarse:

- acceso de los usuarios;
- funcionamiento de la API;
- disponibilidad de la base de datos;
- disponibilidad de los documentos;
- funcionamiento del servicio OCR, cuando aplique;
- integridad de la información;
- correcta operación de los procesos principales del sistema.

La recuperación únicamente se considerará finalizada cuando todas las validaciones sean satisfactorias.

---

## Mejora continua

Después de cada incidente deberán analizarse las causas que originaron la contingencia y documentarse las acciones de mejora correspondientes.

Estas acciones permitirán fortalecer la estrategia de continuidad del negocio, optimizar los procedimientos de recuperación y reducir la probabilidad de incidentes futuros.

---

# Monitoreo y mantenimiento operativo

El monitoreo permanente de la plataforma permite identificar oportunamente fallas, degradaciones del servicio y situaciones que puedan afectar la disponibilidad o el rendimiento del Sistema de Gestión de Solicitudes de Pago.

Las actividades de mantenimiento tienen como propósito preservar la estabilidad, seguridad y continuidad operativa del sistema durante todo su ciclo de vida.

---

## Monitoreo de la infraestructura

La infraestructura deberá monitorearse de forma continua para verificar el estado de los recursos críticos.

Como mínimo se recomienda supervisar:

- disponibilidad del servidor;
- utilización de CPU;
- consumo de memoria;
- utilización de almacenamiento;
- disponibilidad de la red;
- espacio libre en disco.

La detección temprana de anomalías permite actuar antes de que afecten la operación del sistema.

---

## Monitoreo de la aplicación

La aplicación deberá registrar y supervisar los eventos relevantes para su funcionamiento.

Entre ellos se encuentran:

- inicio y detención de servicios;
- errores de ejecución;
- excepciones no controladas;
- tiempos de respuesta elevados;
- fallas de conexión con servicios externos;
- errores durante el procesamiento de solicitudes.

Los eventos registrados facilitan el diagnóstico y la resolución de incidentes.

---

## Monitoreo de la base de datos

La base de datos constituye uno de los componentes críticos de la plataforma y deberá supervisarse de manera permanente.

Como mínimo se recomienda monitorear:

- disponibilidad del servicio;
- tiempos de respuesta;
- utilización del almacenamiento;
- crecimiento de la base de datos;
- conexiones activas;
- consultas de larga duración.

Estas verificaciones permiten detectar oportunamente problemas de rendimiento o capacidad.

---

## Registros de eventos

La aplicación deberá generar registros que faciliten el seguimiento de la operación y el análisis de incidentes.

Los registros podrán incluir, entre otros:

- eventos de autenticación;
- errores del sistema;
- operaciones críticas;
- actividades administrativas;
- ejecución de procesos automáticos;
- eventos relacionados con la infraestructura.

Los registros deberán conservarse durante el tiempo definido por la política de operación de la organización.

---

## Mantenimiento preventivo

Periódicamente deberán realizarse actividades de mantenimiento preventivo para preservar la estabilidad del sistema.

Estas actividades pueden incluir:

- actualización de dependencias;
- actualización del sistema operativo;
- actualización de componentes de seguridad;
- optimización de la base de datos;
- revisión del almacenamiento disponible;
- validación de respaldos;
- revisión de certificados digitales, cuando aplique.

Todo mantenimiento deberá planificarse procurando minimizar el impacto sobre los usuarios.

---

## Gestión de incidencias

Cuando se presente un incidente operativo deberá registrarse, como mínimo:

- fecha y hora del evento;
- componente afectado;
- descripción del incidente;
- causa identificada, cuando sea conocida;
- acciones ejecutadas;
- fecha de solución.

La información recopilada permitirá identificar tendencias y establecer acciones de mejora continua.

---

## Mejora continua

La información obtenida mediante el monitoreo y la gestión de incidencias deberá utilizarse para fortalecer la operación del sistema.

Las mejoras podrán orientarse a:

- incrementar la disponibilidad;
- optimizar el rendimiento;
- fortalecer la seguridad;
- reducir tiempos de recuperación;
- mejorar la experiencia de los usuarios;
- aumentar la confiabilidad de la plataforma.

El monitoreo continuo constituye un elemento fundamental para garantizar la operación estable del Sistema de Gestión de Solicitudes de Pago.

---

# Historial de versiones

La presente documentación deberá mantenerse sincronizada con la evolución funcional y técnica del Sistema de Gestión de Solicitudes de Pago.

Toda modificación que afecte la arquitectura, la infraestructura, el proceso de despliegue o la operación de la plataforma deberá reflejarse en este documento.

---

## Control de cambios

Cada actualización de este documento deberá registrar, como mínimo:

- versión de la documentación;
- fecha de actualización;
- descripción de los cambios realizados;
- responsable de la actualización.

---

## Versiones

| Versión | Fecha | Descripción |
|----------|--------|-------------|
| 1.0 | Julio de 2026 | Versión inicial del documento de despliegue del Sistema de Gestión de Solicitudes de Pago. |

---

## Documentos relacionados

Este documento debe interpretarse conjuntamente con la siguiente documentación del proyecto:

- **01-product-vision.md**
- **02-business-process.md**
- **03-roles-permissions.md**
- **04-state-machine.md**
- **05-architecture.md**
- **06-database-model.md**
- **07-api-contract.md**
- **08-security.md**
- **10-ocr-strategy.md**
- **11-mvp-backlog.md**
- **12-user-roles-flow.md**

Las modificaciones realizadas en cualquiera de estos documentos deberán revisarse para mantener la consistencia de toda la documentación técnica del proyecto.
