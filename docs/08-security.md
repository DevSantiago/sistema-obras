# 08. Seguridad

> **Última actualización:** 18 Julio de 2026

---

# Objetivo

Este documento define la arquitectura de seguridad del Sistema de Gestión de Solicitudes de Pago.

Su propósito es describir los mecanismos implementados para garantizar la autenticación, autorización, protección de la información, trazabilidad de las operaciones y control de acceso a los recursos del sistema.

La seguridad constituye un componente transversal de la aplicación y se integra con todos los módulos funcionales, incluyendo usuarios, proyectos base, beneficiarios, solicitudes de pago, gestión documental, movimientos financieros y auditoría.

---

# Alcance

Este documento comprende los siguientes componentes:

- autenticación de usuarios;
- autorización basada en roles y permisos;
- control de acceso por líneas de negocio;
- control de acceso a proyectos base;
- administración de sesiones;
- protección de endpoints de la API;
- validación de solicitudes;
- seguridad en el almacenamiento de archivos;
- auditoría y trazabilidad;
- buenas prácticas de seguridad implementadas en la aplicación.

Las reglas específicas de negocio relacionadas con permisos funcionales se desarrollan en `03-roles-permissions.md`, mientras que los flujos operativos se documentan en los capítulos correspondientes.

---

# Principios de seguridad

La arquitectura de seguridad del sistema se fundamenta en los siguientes principios:

## Autenticación

Solo los usuarios previamente registrados pueden acceder al sistema.

La autenticación se realiza mediante credenciales propias administradas por la aplicación, utilizando correo electrónico y contraseña.

Las contraseñas nunca se almacenan en texto plano y son protegidas mediante algoritmos de hashing seguro.

---

## Autorización

Una vez autenticado, cada usuario únicamente puede acceder a los recursos autorizados por sus roles y permisos.

La autorización se valida tanto en el frontend como en cada endpoint del backend.

Ninguna operación crítica depende exclusivamente de validaciones realizadas en el cliente.

---

## Mínimo privilegio

Cada usuario dispone únicamente de los permisos estrictamente necesarios para desempeñar sus funciones.

La asignación de permisos se realiza mediante roles, evitando otorgar privilegios administrativos cuando no sean requeridos.

---

## Defensa en profundidad

La seguridad se implementa mediante múltiples capas de protección.

Entre ellas se incluyen:

- autenticación;
- autorización;
- validaciones de negocio;
- validaciones de entrada;
- protección de endpoints;
- auditoría;
- control de sesiones.

La existencia de una capa no reemplaza las validaciones realizadas por las demás.

---

## Trazabilidad

Todas las operaciones relevantes del sistema deben ser trazables.

Las acciones críticas registran, como mínimo:

- usuario responsable;
- fecha y hora;
- operación realizada;
- recurso afectado;
- estado anterior;
- estado resultante, cuando aplique.

La información de auditoría permite reconstruir el historial completo de una operación sin modificar los registros originales.

---

## Integridad de la información

Las operaciones que modifican información deben preservar la consistencia de los datos.

Las reglas de negocio se ejecutan dentro de transacciones cuando la operación afecta múltiples entidades relacionadas, garantizando que los cambios sean confirmados o revertidos de manera atómica.

---

## Confidencialidad

La información únicamente puede ser consultada por usuarios autorizados.

Los recursos protegidos, incluyendo solicitudes de pago, documentos adjuntos, movimientos financieros y datos personales, no son accesibles sin una sesión válida y los permisos correspondientes.

---

## Disponibilidad

La arquitectura procura mantener la disponibilidad del sistema mediante el manejo adecuado de errores, validaciones preventivas y mecanismos que eviten estados inconsistentes durante la ejecución de las operaciones críticas.

---

# Autenticación

La autenticación del Sistema de Gestión de Solicitudes de Pago se realiza mediante un mecanismo propio basado en correo electrónico y contraseña.

El acceso al sistema requiere una sesión válida emitida por el backend después de validar las credenciales del usuario.

---

## Credenciales

Cada usuario dispone de las siguientes credenciales de acceso:

- correo electrónico;
- contraseña.

El correo electrónico constituye el identificador utilizado durante el proceso de autenticación.

---

## Validación de credenciales

Durante el inicio de sesión el sistema realiza, como mínimo, las siguientes validaciones:

1. existencia del usuario;
2. estado activo del usuario;
3. verificación de la contraseña;
4. existencia de al menos un rol asignado;
5. autorización para acceder al sistema.

Si cualquiera de estas validaciones falla, el proceso de autenticación es rechazado.

---

## Almacenamiento de contraseñas

Las contraseñas nunca se almacenan en texto plano.

El sistema almacena únicamente el valor resultante de aplicar un algoritmo de hashing seguro sobre la contraseña suministrada por el usuario.

Durante el inicio de sesión, la contraseña ingresada se compara contra el hash almacenado.

---

## Sesión de usuario

Una autenticación exitosa genera una sesión asociada al usuario autenticado.

La sesión es utilizada por todos los endpoints protegidos para identificar al usuario responsable de cada operación.

El cierre de sesión invalida dicha sesión, impidiendo el acceso a los recursos protegidos hasta que el usuario vuelva a autenticarse.

---

## Información disponible durante la sesión

Una vez autenticado, el sistema dispone, como mínimo, de la siguiente información:

- identificador del usuario;
- nombre completo;
- correo electrónico;
- estado del usuario;
- roles asignados;
- permisos efectivos derivados de dichos roles;
- líneas de negocio autorizadas;
- proyectos base sobre los cuales posee acceso.

Esta información se utiliza para aplicar las reglas de autorización en toda la aplicación.

---

## Registro del último acceso

Cada inicio de sesión exitoso actualiza la fecha y hora del último acceso del usuario.

Esta información se utiliza con fines de auditoría, trazabilidad y administración del sistema.

---

# Autorización

La autorización determina las operaciones que un usuario puede ejecutar una vez ha sido autenticado.

El sistema implementa un modelo de control de acceso basado en roles (RBAC), complementado con permisos específicos y restricciones sobre líneas de negocio y proyectos base.

---

## Modelo RBAC

Cada usuario tiene un único rol activo.

Cada rol agrupa un conjunto de permisos funcionales que determinan las acciones permitidas dentro del sistema.

La autorización se calcula a partir de los permisos asociados a ese rol,
complementados por los accesos del usuario a proyectos base y líneas de
negocio.

---

## Permisos

Los permisos representan la unidad mínima de autorización.

Cada operación protegida de la aplicación requiere uno o más permisos específicos para poder ejecutarse.

Ejemplos de permisos incluyen:

- consultar solicitudes;
- crear solicitudes;
- editar solicitudes;
- aprobar solicitudes;
- registrar pagos;
- administrar usuarios;
- administrar proyectos base;
- consultar auditoría.

La definición completa de permisos se documenta en `03-roles-permissions.md`.

---

## Restricción por líneas de negocio

Además de los permisos funcionales, el sistema restringe el acceso a la información según las líneas de negocio autorizadas para cada usuario.

Un usuario únicamente puede consultar y operar información perteneciente a las líneas de negocio sobre las cuales tenga autorización.

---

## Restricción por proyectos base

Los usuarios pueden estar asociados a uno o varios proyectos base.

Esta asociación determina los proyectos sobre los cuales pueden:

- consultar información;
- crear solicitudes;
- aprobar solicitudes;
- registrar pagos;
- ejecutar cualquier otra operación protegida.

El sistema valida esta restricción antes de ejecutar cada operación.

---

## Validación de autorización

Cada endpoint protegido verifica, como mínimo:

1. existencia de una sesión válida;
2. estado activo del usuario;
3. permisos requeridos para la operación;
4. acceso a la línea de negocio correspondiente;
5. acceso al proyecto base involucrado, cuando aplique.

Si alguna validación falla, la operación es rechazada.

---

## Autorización en el backend

La autorización siempre se valida en el backend.

Las validaciones implementadas en el frontend tienen únicamente fines de experiencia de usuario y no constituyen un mecanismo de seguridad.

Ninguna operación crítica puede ejecutarse únicamente mediante controles del cliente.

---

## Principio de denegación por defecto

Toda operación se considera no autorizada mientras el sistema no verifique explícitamente que el usuario posee los permisos requeridos para ejecutarla.

La ausencia de permisos produce la denegación inmediata del acceso al recurso solicitado.

---

# Gestión de sesiones

La gestión de sesiones controla la permanencia del usuario autenticado dentro de la aplicación y garantiza que únicamente usuarios con una sesión válida puedan acceder a los recursos protegidos.

---

## Creación de sesión

Una sesión se crea únicamente cuando el proceso de autenticación finaliza exitosamente.

La sesión queda asociada al usuario autenticado y será utilizada por el backend para identificar al responsable de cada operación realizada en el sistema.

---

## Validación de sesión

Toda solicitud dirigida a un endpoint protegido debe incluir una sesión válida.

Antes de ejecutar cualquier operación, el backend verifica:

- existencia de la sesión;
- vigencia de la sesión;
- estado activo del usuario asociado;
- validez de las credenciales de autenticación.

Si alguna validación falla, la solicitud es rechazada.

---

## Expiración

Las sesiones poseen un tiempo de vida definido por la configuración de la aplicación.

Una vez expirada la sesión, el usuario deberá autenticarse nuevamente para continuar utilizando el sistema.

---

## Cierre de sesión

El cierre de sesión invalida la sesión activa del usuario.

A partir de ese momento, cualquier solicitud a recursos protegidos requiere una nueva autenticación.

---

## Invalidación por cambios administrativos

El sistema puede invalidar una sesión activa cuando ocurra cualquiera de las siguientes situaciones:

- el usuario sea desactivado;
- el usuario pierda todos sus roles;
- el usuario deje de tener permisos para acceder al sistema;
- el administrador fuerce el cierre de las sesiones del usuario.

Estas validaciones impiden que un usuario continúe utilizando permisos que ya no posee.

---

## Uso de la sesión

La sesión autenticada permite identificar automáticamente al usuario responsable de todas las operaciones del sistema, incluyendo:

- creación de solicitudes de pago;
- aprobación de solicitudes;
- devoluciones;
- anulaciones;
- registro de pagos;
- carga de documentos;
- administración de usuarios;
- administración de proyectos base;
- cualquier otra operación registrada por la auditoría.

No es necesario que el cliente envíe el identificador del usuario en cada petición, ya que este se obtiene directamente de la sesión autenticada.

---

# Protección de la API

Todos los endpoints del Sistema de Gestión de Solicitudes de Pago implementan mecanismos de protección que garantizan que únicamente usuarios autenticados y autorizados puedan ejecutar operaciones sobre los recursos del sistema.

La seguridad de la API se implementa en múltiples capas, combinando autenticación, autorización, validaciones funcionales y reglas de negocio.

---

## Endpoints públicos

Los endpoints públicos son aquellos que pueden ser consumidos sin una sesión autenticada.

En la versión actual del sistema, los endpoints públicos corresponden únicamente a las operaciones necesarias para el proceso de autenticación y verificación de disponibilidad del servicio.

Cualquier otro recurso requiere autenticación previa.

---

## Endpoints protegidos

Todos los módulos funcionales del sistema exigen una sesión válida.

Entre ellos se encuentran:

- usuarios;
- roles;
- proyectos base;
- centros de costo;
- beneficiarios;
- solicitudes de pago;
- documentos adjuntos;
- movimientos financieros;
- auditoría;
- configuración del sistema.

---

## Validaciones de acceso

Antes de ejecutar cualquier operación protegida, el backend verifica, como mínimo:

1. autenticación válida;
2. sesión vigente;
3. usuario activo;
4. permisos suficientes para la operación;
5. acceso a la línea de negocio correspondiente;
6. acceso al proyecto base involucrado, cuando aplique.

Si cualquiera de estas validaciones falla, la solicitud es rechazada.

---

## Validación de recursos

El sistema no solo verifica que el usuario posea permisos para ejecutar una operación, sino también que tenga autorización para acceder al recurso específico solicitado.

Por ejemplo, un usuario con permiso para consultar solicitudes únicamente podrá acceder a aquellas pertenecientes a los proyectos base y líneas de negocio sobre los cuales tenga autorización.

---

## Validación de estados

Las operaciones protegidas también verifican el estado actual de la entidad involucrada.

Por ejemplo:

- una solicitud en estado **BORRADOR** no puede registrarse como pagada;
- una solicitud **PAGADA** no puede volver a ser aprobada;
- una solicitud **ANULADA** no admite nuevas operaciones funcionales.

Estas restricciones garantizan el cumplimiento de la máquina de estados definida para el sistema.

---

## Respuesta ante accesos no autorizados

Cuando una solicitud incumple alguna regla de seguridad, el backend devuelve el código HTTP correspondiente según la causa detectada.

Entre los escenarios contemplados se encuentran:

- autenticación inexistente;
- sesión expirada;
- usuario inactivo;
- permisos insuficientes;
- recurso inexistente;
- acceso denegado al recurso solicitado.

La respuesta no expone información interna que pueda facilitar ataques o revelar detalles de la implementación del sistema.

---

## Registro de eventos de seguridad

Los intentos de acceso a recursos protegidos pueden ser registrados para efectos de auditoría, seguimiento y análisis de incidentes de seguridad.

Esta información permite identificar comportamientos anómalos, intentos reiterados de acceso no autorizado y otras situaciones relevantes para la administración del sistema.

---

# Validación de datos de entrada

Todas las solicitudes recibidas por la API son validadas antes de ejecutar cualquier regla de negocio.

Las validaciones buscan garantizar la integridad de la información, prevenir estados inconsistentes y reducir el riesgo de procesamiento de datos inválidos o maliciosos.

---

## Validación estructural

Cada endpoint valida que la solicitud cumpla con la estructura esperada.

Entre las validaciones realizadas se encuentran:

- obligatoriedad de los campos requeridos;
- tipo de dato de cada atributo;
- formato de fechas;
- formato de identificadores UUID;
- longitud máxima de cadenas de texto;
- valores permitidos para enumeraciones;
- formatos específicos según la naturaleza del dato.

Las solicitudes que no cumplan la estructura definida son rechazadas antes de ejecutar cualquier lógica del negocio.

---

## Validación funcional

Una vez superada la validación estructural, el sistema verifica las reglas funcionales correspondientes.

Entre ellas se incluyen, según el caso:

- existencia de los registros relacionados;
- estado válido de la entidad;
- coherencia entre los datos enviados;
- cumplimiento de reglas de negocio;
- consistencia con la máquina de estados;
- disponibilidad de recursos requeridos para ejecutar la operación.

---

## Sanitización de datos

Antes de almacenar la información, el sistema normaliza determinados valores para mantener consistencia en la base de datos.

Dependiendo del tipo de información, pueden aplicarse procesos como:

- eliminación de espacios innecesarios;
- normalización de formatos;
- conversión de caracteres cuando corresponda;
- tratamiento uniforme de valores nulos.

---

## Validación de archivos

Las operaciones que permiten adjuntar documentos verifican, como mínimo:

- existencia del archivo;
- tipo de archivo permitido;
- tamaño máximo permitido;
- integridad del archivo recibido;
- correcta asociación con la entidad correspondiente.

Los archivos que no cumplan estas condiciones son rechazados.

---

## Prevención de modificaciones inválidas

El sistema impide modificaciones que puedan comprometer la integridad de la información.

Entre ellas:

- modificar entidades inexistentes;
- modificar registros eliminados lógicamente;
- ejecutar transiciones no permitidas por la máquina de estados;
- alterar relaciones que violen restricciones de integridad referencial.

---

## Manejo de errores

Las validaciones generan respuestas controladas y consistentes para el consumidor de la API.

Los mensajes de error describen el problema detectado sin revelar información interna sobre la arquitectura, la base de datos o la implementación del sistema.

Esto reduce el riesgo de exposición de información sensible y facilita el consumo de la API por parte del frontend.

---

# Seguridad en la gestión documental

El módulo de gestión documental implementa controles de seguridad para garantizar la confidencialidad, integridad y trazabilidad de los documentos asociados a las solicitudes de pago.

Estos controles aplican tanto a los archivos cargados manualmente por los usuarios como a aquellos procesados mediante OCR.

---

## Acceso a documentos

Los documentos únicamente pueden ser consultados por usuarios que:

- posean una sesión válida;
- tengan permisos para consultar la solicitud correspondiente;
- tengan acceso al proyecto base asociado;
- tengan acceso a la línea de negocio correspondiente.

No es posible acceder directamente a un documento mediante su identificador o su ubicación física de almacenamiento.

---

## Almacenamiento

Los archivos se almacenan fuera de la base de datos utilizando un servicio de almacenamiento de objetos.

La base de datos conserva únicamente la información necesaria para administrar cada documento, incluyendo:

- identificador;
- nombre del archivo;
- tipo de archivo;
- tamaño;
- ubicación lógica;
- entidad asociada;
- usuario que realizó la carga;
- fecha y hora de creación.

---

## Asociación con entidades

Todo documento debe estar asociado a una entidad funcional del sistema.

Dependiendo del caso de uso, un archivo podrá asociarse a:

- una solicitud de pago;
- un ítem de nómina;
- un beneficiario;
- otra entidad soportada por el sistema.

El sistema impide la existencia de documentos huérfanos sin una relación funcional válida.

---

## Validación de archivos

Antes de almacenar un documento, el sistema verifica:

- formato permitido;
- tamaño máximo configurado;
- integridad del archivo recibido;
- correcta asociación con la entidad correspondiente.

Los archivos que no superen estas validaciones son rechazados.

---

## Procesamiento mediante OCR

Cuando un documento requiere procesamiento OCR, el sistema genera la información extraída sin modificar el archivo original.

Los resultados obtenidos son utilizados como apoyo para la captura y validación de información, pero no reemplazan la revisión realizada por el usuario.

Toda la información extraída puede ser corregida antes de ser utilizada dentro de los procesos del sistema.

---

## Conservación de documentos

Los documentos permanecen disponibles mientras la entidad funcional a la que pertenecen exista y las reglas de negocio permitan su conservación.

Cuando una entidad es eliminada físicamente mediante una eliminación en cascada definida por el modelo de datos, los registros documentales asociados también son eliminados conforme a las relaciones establecidas en la base de datos.

---

## Auditoría documental

Las operaciones relevantes sobre los documentos pueden ser registradas para efectos de auditoría.

Entre ellas se encuentran:

- carga de archivos;
- eliminación de documentos;
- procesamiento mediante OCR;
- asociación con entidades;
- consulta de documentos, cuando las políticas de auditoría así lo requieran.

Estos registros permiten reconstruir el historial completo de cada documento durante su ciclo de vida dentro del sistema.

---

# Auditoría y trazabilidad

El sistema implementa un mecanismo de auditoría que permite registrar las operaciones relevantes realizadas por los usuarios durante el ciclo de vida de la aplicación.

El objetivo de la auditoría es garantizar la trazabilidad completa de las acciones ejecutadas sobre la información, facilitar los procesos de seguimiento y apoyar las labores de control interno.

---

## Eventos auditables

Como mínimo, el sistema registra eventos relacionados con:

- autenticación de usuarios;
- administración de usuarios;
- asignación y revocación de roles;
- administración de proyectos base;
- creación de beneficiarios;
- actualización de beneficiarios;
- creación de solicitudes de pago;
- modificaciones de solicitudes;
- cambios de estado;
- aprobaciones;
- devoluciones;
- anulaciones;
- registro de pagos;
- carga y eliminación de documentos;
- operaciones administrativas del sistema.

La lista de eventos podrá ampliarse conforme evolucionen los módulos funcionales.

---

## Información registrada

Cada evento de auditoría almacena, como mínimo:

- identificador del evento;
- usuario responsable;
- fecha y hora;
- operación ejecutada;
- módulo afectado;
- identificador del recurso involucrado;
- dirección IP, cuando esté disponible;
- información adicional necesaria para reconstruir el evento.

---

## Cambios de estado

Las transiciones de la máquina de estados constituyen eventos de auditoría obligatorios.

Cada cambio registra:

- estado anterior;
- estado nuevo;
- usuario responsable;
- fecha y hora;
- observaciones asociadas, cuando existan.

Esto permite reconstruir completamente el flujo seguido por cada solicitud de pago.

---

## Integridad de la auditoría

Los registros de auditoría no forman parte del flujo operativo de la aplicación.

Su finalidad es documentar los eventos ocurridos, por lo que no pueden ser modificados mediante las operaciones funcionales disponibles para los usuarios.

La información registrada constituye evidencia histórica de las acciones ejecutadas dentro del sistema.

---

## Consulta de auditoría

El acceso a la información de auditoría se encuentra restringido a los usuarios que posean los permisos correspondientes.

Las consultas pueden realizarse mediante diferentes criterios, incluyendo:

- usuario;
- módulo;
- operación;
- rango de fechas;
- recurso afectado.

---

## Finalidad

La información de auditoría permite:

- reconstruir el historial de una operación;
- identificar al responsable de cada acción;
- facilitar procesos de control interno;
- apoyar investigaciones sobre incidentes;
- verificar el cumplimiento de los procedimientos definidos por la organización.

La auditoría constituye un mecanismo de apoyo al gobierno de la información y no reemplaza las validaciones de seguridad implementadas por la aplicación.

---

# Seguridad de la base de datos

La base de datos constituye el repositorio central de la información del Sistema de Gestión de Solicitudes de Pago y debe garantizar la confidencialidad, integridad y disponibilidad de los datos almacenados.

Las medidas de seguridad implementadas buscan proteger tanto la información operativa como los datos personales administrados por la aplicación.

---

## Acceso a la base de datos

La base de datos únicamente es accesible desde el backend de la aplicación.

No existen conexiones directas desde el frontend hacia el motor de base de datos.

Toda interacción con la información se realiza exclusivamente mediante la API del sistema.

---

## Acceso mediante Prisma ORM

El acceso a la base de datos se implementa utilizando Prisma ORM.

Esta capa centraliza las operaciones de persistencia y reduce el riesgo de errores derivados de la construcción manual de consultas.

Las consultas son ejecutadas utilizando los modelos definidos en el esquema de Prisma, garantizando consistencia entre la aplicación y la estructura de la base de datos.

---

## Integridad referencial

La integridad de la información es garantizada mediante restricciones definidas en el modelo de datos.

Entre ellas se incluyen:

- llaves primarias;
- llaves foráneas;
- restricciones de unicidad;
- valores obligatorios;
- restricciones de eliminación;
- relaciones uno a uno;
- relaciones uno a muchos;
- relaciones muchos a muchos.

Estas restricciones impiden la generación de información inconsistente.

---

## Transacciones

Las operaciones que modifican múltiples entidades relacionadas deben ejecutarse dentro de transacciones de base de datos.

Si ocurre un error durante la ejecución, todas las modificaciones realizadas son revertidas automáticamente, preservando la consistencia de la información.

---

## Eliminación lógica y física

El sistema implementa eliminación lógica para las entidades funcionales que deben conservar trazabilidad histórica.

La eliminación física únicamente se utiliza cuando la naturaleza de la información así lo permite o cuando las relaciones definidas mediante eliminación en cascada requieren la eliminación automática de registros dependientes.

---

## Protección de credenciales

Las credenciales de conexión a la base de datos no forman parte del código fuente de la aplicación.

Su configuración se realiza mediante variables de entorno administradas de forma independiente para cada ambiente de ejecución.

---

## Copias de seguridad

La estrategia de respaldo debe garantizar la recuperación de la información ante incidentes operativos.

Las copias de seguridad deberán realizarse de forma periódica y almacenarse en una ubicación independiente de la infraestructura principal, conforme a la estrategia de despliegue definida para el sistema.

---

## Restauración

El procedimiento de restauración debe permitir recuperar la base de datos manteniendo la integridad de las relaciones y la consistencia de la información.

Las pruebas de restauración deberán ejecutarse periódicamente para verificar la validez de los respaldos generados.

---

## Protección de datos

La información almacenada en la base de datos únicamente puede ser consultada y modificada a través de los mecanismos de autenticación, autorización y validación implementados por la aplicación.

La seguridad de la base de datos complementa las demás capas de protección definidas en la arquitectura del sistema.

---

# Configuración y gestión de secretos

La configuración del sistema se realiza mediante variables de entorno independientes para cada ambiente de ejecución.

Esta estrategia evita la exposición de información sensible dentro del código fuente y facilita la administración de la infraestructura.

---

## Variables de entorno

Toda configuración sensible debe almacenarse mediante variables de entorno.

Entre ellas se incluyen, como mínimo:

- credenciales de la base de datos;
- claves de autenticación;
- secretos utilizados para la firma y validación de sesiones;
- credenciales del servicio de almacenamiento de archivos;
- configuración del servicio OCR;
- parámetros de correo electrónico;
- cualquier otro dato confidencial requerido por la aplicación.

Estas variables no deben incorporarse al repositorio de código fuente.

---

## Separación por ambientes

Cada ambiente del sistema mantiene su propia configuración.

Como mínimo, se contemplan los siguientes ambientes:

- desarrollo;
- pruebas;
- producción.

Cada uno utiliza credenciales independientes y configuraciones específicas según sus necesidades operativas.

---

## Protección de credenciales

Las credenciales utilizadas por la aplicación deben ser conocidas únicamente por los servicios que las requieren para su funcionamiento.

No deben exponerse:

- en el código fuente;
- en respuestas de la API;
- en mensajes de error;
- en archivos públicos;
- en registros accesibles para usuarios finales.

---

## Rotación de secretos

Cuando exista un incidente de seguridad o una política organizacional lo requiera, los secretos utilizados por la aplicación deberán ser reemplazados.

La rotación debe realizarse minimizando la interrupción del servicio y garantizando la continuidad operativa.

---

## Acceso administrativo

Únicamente el personal autorizado para administrar la infraestructura podrá modificar la configuración sensible del sistema.

Los desarrolladores y usuarios funcionales no requieren acceso directo a las credenciales utilizadas por los ambientes productivos.

---

## Gestión de archivos de configuración

Los archivos utilizados para la configuración local del proyecto deben excluirse del control de versiones cuando contengan información sensible.

El repositorio únicamente podrá incluir archivos de ejemplo o plantillas sin credenciales reales.

---

## Principio de mínima exposición

La aplicación únicamente carga la configuración estrictamente necesaria para su funcionamiento.

Las credenciales y secretos permanecen restringidos al backend y nunca son enviados al frontend ni expuestos mediante la API.

---

# Buenas prácticas de seguridad

El desarrollo del Sistema de Gestión de Solicitudes de Pago adopta un conjunto de buenas prácticas orientadas a reducir riesgos de seguridad durante la implementación, operación y mantenimiento de la aplicación.

Estas prácticas complementan los mecanismos de autenticación, autorización y validación definidos en los capítulos anteriores.

---

## Validación en múltiples capas

Toda operación crítica es validada en diferentes niveles de la aplicación.

Las validaciones implementadas en el frontend mejoran la experiencia del usuario, mientras que las validaciones del backend constituyen el mecanismo definitivo para autorizar o rechazar una operación.

---

## Separación de responsabilidades

La arquitectura distribuye las responsabilidades entre los distintos componentes del sistema.

Cada capa cumple una función específica:

- el frontend administra la interacción con el usuario;
- la API implementa la lógica de negocio;
- la base de datos administra la persistencia de la información;
- los servicios externos procesan funciones especializadas, como almacenamiento de archivos u OCR.

Esta separación reduce el acoplamiento y facilita el mantenimiento de la aplicación.

---

## Uso de identificadores técnicos

Las entidades del sistema utilizan identificadores técnicos basados en UUID.

Los usuarios nunca interactúan directamente con los identificadores internos de la base de datos para construir reglas de negocio o determinar permisos de acceso.

---

## Protección frente a manipulación del cliente

El sistema no confía en la información suministrada por el cliente cuando esta pueda afectar la seguridad o la integridad de los datos.

Toda información crítica es obtenida o validada por el backend antes de ejecutar cualquier operación.

Entre ella se encuentran:

- usuario autenticado;
- permisos efectivos;
- estado de la entidad;
- relaciones entre registros;
- acceso al proyecto base;
- acceso a la línea de negocio.

---

## Uso de transacciones

Las operaciones que afectan múltiples registros relacionados se ejecutan mediante transacciones.

Esta práctica evita estados parciales de la información cuando ocurre un error durante la ejecución de una operación compleja.

---

## Trazabilidad permanente

Las operaciones relevantes del sistema generan información de auditoría que permite reconstruir el historial de las acciones ejecutadas.

La trazabilidad constituye un mecanismo de apoyo para la investigación de incidentes y el control de las operaciones realizadas por los usuarios.

---

## Actualización de dependencias

Las dependencias utilizadas por la aplicación deberán mantenerse actualizadas para incorporar correcciones de seguridad, mejoras de estabilidad y compatibilidad con las versiones soportadas de la plataforma tecnológica.

La actualización deberá realizarse siguiendo procedimientos controlados y verificando previamente la compatibilidad con el sistema.

---

## Desarrollo seguro

Durante el desarrollo deberán mantenerse las siguientes prácticas:

- revisión del código antes de su integración;
- uso de control de versiones;
- separación de ambientes de desarrollo, pruebas y producción;
- manejo adecuado de credenciales;
- aplicación consistente de las reglas de negocio;
- documentación actualizada de los cambios funcionales y técnicos.

Estas prácticas contribuyen a mantener un sistema seguro, mantenible y alineado con la arquitectura definida para el proyecto.

---

# Amenazas mitigadas

La arquitectura de seguridad del Sistema de Gestión de Solicitudes de Pago incorpora controles orientados a reducir los principales riesgos asociados al acceso, procesamiento y almacenamiento de la información.

Las medidas implementadas buscan minimizar la probabilidad de incidentes de seguridad y limitar su impacto sobre la operación del sistema.

---

## Acceso no autorizado

El sistema impide el acceso a usuarios que no hayan sido autenticados correctamente.

Todos los recursos protegidos requieren una sesión válida antes de permitir cualquier operación.

---

## Elevación de privilegios

La autorización basada en roles y permisos evita que un usuario ejecute operaciones para las cuales no ha sido autorizado.

Todas las validaciones de permisos se realizan en el backend antes de ejecutar la lógica de negocio.

---

## Acceso a información restringida

Las restricciones por líneas de negocio y proyectos base impiden que un usuario consulte o modifique información perteneciente a recursos sobre los cuales no posee autorización.

La autorización se verifica para cada operación y para cada recurso solicitado.

---

## Manipulación de la máquina de estados

El sistema valida todas las transiciones de estado antes de ejecutar una operación.

No es posible avanzar, retroceder o modificar el estado de una solicitud por fuera de las transiciones definidas por la máquina de estados del sistema.

---

## Manipulación de documentos

Los documentos únicamente pueden ser cargados, consultados o administrados por usuarios autorizados.

Además, cada archivo debe estar asociado a una entidad funcional válida, evitando la existencia de documentos sin relación con el negocio.

---

## Exposición de información sensible

Las credenciales, secretos de configuración y datos internos de la infraestructura no son expuestos mediante la API ni incorporados al código fuente.

Las respuestas del sistema tampoco revelan detalles internos sobre la implementación de la aplicación o de la base de datos.

---

## Corrupción de datos

Las operaciones que afectan múltiples entidades relacionadas se ejecutan mediante transacciones.

Este mecanismo evita que errores durante la ejecución produzcan estados parciales o inconsistentes en la información almacenada.

---

## Pérdida de trazabilidad

Las operaciones relevantes generan registros de auditoría que permiten identificar el usuario responsable, la fecha, la hora y la acción ejecutada.

Estos registros facilitan la reconstrucción del historial de cada operación y apoyan los procesos de control y seguimiento.

---

## Acceso directo a la base de datos

La base de datos no es accesible desde el frontend.

Toda interacción con la información se realiza exclusivamente a través de la API, aplicando previamente los mecanismos de autenticación, autorización y validación definidos por la aplicación.

---

## Protección integral

La estrategia de seguridad implementada combina múltiples mecanismos de protección que actúan de forma complementaria.

La autenticación, la autorización, las validaciones de negocio, la protección de la API, la gestión documental, la auditoría y las restricciones de acceso constituyen un modelo de defensa en profundidad que fortalece la seguridad del sistema y reduce los riesgos asociados a su operación.
