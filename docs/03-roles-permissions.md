# 03. Roles y permisos

> Última actualización funcional: 17 de julio de 2026.

Este documento define el modelo de autorización del Sistema de Gestión de Solicitudes de Pago, los roles disponibles, los permisos asociados a cada rol y las reglas generales de acceso a la información.

Las reglas funcionales de los procesos de negocio, estados de las solicitudes y flujo de aprobación se encuentran documentadas en **02-business-process.md**.

---

# 1. Modelo de autorización

El sistema implementa un modelo de autorización basado en permisos.

El nombre del rol identifica la responsabilidad funcional del usuario dentro de la organización, mientras que los permisos determinan las acciones que realmente puede ejecutar dentro del sistema.

Adicionalmente, el acceso operativo restringe sobre qué proyectos y líneas de negocio puede trabajar cada usuario.

El modelo puede representarse de la siguiente manera:

```text
ROL

↓

PERMISOS

↓

ACCESOS OPERATIVOS

↓

OPERACIÓN DEL USUARIO
```

---

## 1.1 Roles

Cada usuario posee un único rol activo.

El rol representa la responsabilidad funcional del usuario dentro del sistema y agrupa un conjunto de permisos que habilitan determinadas acciones.

Los roles no contienen reglas específicas de negocio. Dichas reglas se implementan mediante permisos y validaciones del sistema.

---

## 1.2 Permisos

Los permisos representan las acciones que un usuario puede ejecutar.

Cada permiso podrá asignarse a uno o varios roles mediante la relación correspondiente entre roles y permisos.

Algunos ejemplos son:

```text
CREAR_SOLICITUDES

CREAR_PROYECTOS

CREAR_USUARIOS

ASIGNAR_ACCESOS

APROBAR_NIVEL_1

APROBAR_NIVEL_2

MARCAR_COMO_PAGADO

CONSULTAR_TODO
```

La incorporación de nuevos permisos no requiere modificar la estructura general de roles del sistema.

---

## 1.3 Accesos operativos

Los permisos funcionales determinan qué puede hacer un usuario.

Los accesos operativos determinan dónde puede hacerlo.

Los accesos se asignan mediante la combinación:

```text
Proyecto Base

+

Línea de negocio
```

Las líneas de negocio disponibles son:

```text
OBRA

INTERVENTORÍA
```

Un acceso a la línea **OBRA** habilita la operación sobre los centros de costo:

```text
PRO-OBRA

OBRA
```

Un acceso a la línea **INTERVENTORÍA** habilita la operación sobre:

```text
PRO-INTERVENTORÍA

INTERVENTORÍA
```

---

## 1.4 Visibilidad de la información

La visibilidad de la información no depende únicamente del rol.

El sistema evalúa simultáneamente:

- el rol del usuario;
- los permisos asignados;
- el proyecto base;
- la línea de negocio;
- el estado de la solicitud;
- la relación del usuario con la solicitud.

Las reglas detalladas de visibilidad se encuentran definidas en el documento **02-business-process.md**.

---

# 2. Roles del sistema

El Sistema de Gestión de Solicitudes de Pago define un conjunto de roles que representan las responsabilidades funcionales de los usuarios dentro de la organización.

Cada usuario tendrá asignado un único rol activo, el cual determinará el conjunto de permisos disponibles y las operaciones que podrá ejecutar dentro del sistema.

Los roles vigentes para el MVP son:

```text
ADMINISTRADOR

DIRECTOR

APROBADOR_1

APROBADOR_2

AUXILIAR_CONTABLE

PAGOS

SOLICITANTE
```

Cada uno de estos roles podrá operar únicamente sobre los proyectos y líneas de negocio para los cuales tenga accesos activos.

Las responsabilidades de cada rol se describen en las siguientes secciones.

---

# 3. Reglas generales de autorización

Independientemente del rol asignado, el sistema aplicará las siguientes reglas generales:

- Cada usuario tendrá un único rol activo.
- Los permisos se asignarán al rol y no directamente al usuario.
- Un usuario únicamente podrá operar sobre los proyectos para los cuales tenga accesos vigentes.
- La visibilidad de la información dependerá de los permisos, del proyecto, de la línea de negocio y del estado del proceso.
- Todas las operaciones estarán sujetas a validaciones de negocio y quedarán registradas en la auditoría del sistema.
- Ningún usuario podrá ejecutar acciones para las cuales no tenga permisos explícitos.
- El rol **ADMINISTRADOR** tendrá acceso total al sistema, sin restricciones por proyecto o línea de negocio, salvo aquellas definidas por políticas de seguridad futuras.

---

# 4. Definición de roles

En las siguientes secciones se describen las responsabilidades, permisos y restricciones de cada uno de los roles definidos para el sistema.

---

## 4.1 Administrador

El **Administrador** es el responsable de la configuración y administración general del sistema.

Posee acceso completo a todos los módulos y funcionalidades del aplicativo, sin restricciones por proyecto o línea de negocio.

### Responsabilidades

- Administrar la configuración general del sistema.
- Gestionar usuarios, roles y permisos.
- Administrar proyectos base.
- Administrar beneficiarios.
- Consultar toda la información del sistema.
- Configurar parámetros generales.
- Gestionar la operación financiera cuando corresponda.
- Consultar la auditoría del sistema.

### Permisos principales

- Crear, editar e inactivar usuarios.
- Crear y administrar proyectos.
- Asignar accesos operativos.
- Crear solicitudes.
- Aprobar solicitudes en cualquier nivel.
- Registrar pagos.
- Registrar anticipos.
- Registrar préstamos de persona a proyecto y entre proyectos.
- Consultar todos los módulos.
- Administrar beneficiarios.
- Consultar auditoría.

### Restricciones

Por tratarse del rol de administración del sistema, no posee restricciones funcionales dentro del MVP.

---

## 4.2 Director

El **Director** corresponde al responsable operativo de uno o varios proyectos y participa activamente en su administración.

Puede crear y gestionar información relacionada con los proyectos bajo su responsabilidad, pero no interviene en el proceso de aprobación ni en la ejecución de pagos.

### Responsabilidades

- Gestionar los proyectos asignados.
- Crear solicitudes de pago.
- Crear y administrar nómina individual y agrupada.
- Administrar usuarios cuando tenga autorización.
- Administrar proyectos cuando el negocio lo requiera.
- Asignar accesos operativos cuando tenga los permisos correspondientes.

### Permisos principales

- Crear solicitudes.
- Crear nómina individual.
- Validar, crear y editar nómina agrupada.
- Crear proyectos.
- Crear usuarios.
- Asignar accesos.
- Consultar la información de los proyectos autorizados.

### Restricciones

No puede:

- aprobar solicitudes;
- registrar pagos;
- ejecutar operaciones financieras reservadas para otros roles.

---

## 4.3 Aprobador 1

El **Aprobador 1** es el primer responsable de validar las solicitudes de pago antes de que continúen al siguiente nivel de aprobación.

Su función principal consiste en verificar que la solicitud sea coherente desde el punto de vista operativo, administrativo y documental.

### Responsabilidades

- Revisar las solicitudes pendientes de primer nivel.
- Aprobar o devolver solicitudes.
- Registrar observaciones durante el proceso de revisión.
- Consultar la información necesaria para realizar la validación.

### Permisos principales

- Aprobar solicitudes de primer nivel.
- Devolver solicitudes al solicitante.
- Consultar las solicitudes sobre las cuales tenga competencia.
- Crear solicitudes cuando corresponda.

### Restricciones

No puede:

- realizar aprobaciones de segundo nivel;
- registrar pagos;
- modificar la información financiera derivada del pago.

---

## 4.4 Aprobador 2

El **Aprobador 2** corresponde al segundo y último nivel de aprobación dentro del flujo de solicitudes de pago.

Su aprobación representa la autorización definitiva para que la solicitud pase al estado **PROGRAMADA_PAGO**, quedando disponible para su posterior ejecución por el rol de Pagos.

### Responsabilidades

- Revisar las solicitudes pendientes de segundo nivel.
- Aprobar o devolver solicitudes.
- Verificar que la información financiera y documental sea consistente antes de autorizar el pago.

### Permisos principales

- Aprobar solicitudes de segundo nivel.
- Devolver solicitudes al nivel anterior cuando corresponda.
- Consultar las solicitudes sobre las cuales tenga competencia.

### Restricciones

No puede:

- registrar pagos;
- modificar movimientos financieros;
- alterar la programación de pagos una vez aprobada la solicitud.

---

## 4.5 Auxiliar Contable

El **Auxiliar Contable** apoya la operación administrativa y financiera del sistema.

Su participación se concentra en los procesos contables y financieros definidos para cada módulo, sin intervenir en el flujo de aprobación de las solicitudes.

### Responsabilidades

- Gestionar beneficiarios cuando tenga autorización.
- Registrar operaciones financieras habilitadas por el sistema.
- Apoyar los procesos administrativos relacionados con la ejecución presupuestal.

### Permisos principales

- Crear solicitudes cuando corresponda.
- Gestionar beneficiarios según los permisos asignados.
- Registrar operaciones financieras autorizadas para su rol.
- Registrar anticipos de entidades al fondo general de un proyecto.
- Registrar préstamos de persona al fondo general de un proyecto.
- Registrar préstamos entre proyectos base.

### Restricciones

No puede:

- aprobar solicitudes;
- registrar pagos;
- modificar permisos o accesos del sistema.

---

## 4.6 Pagos

El rol **Pagos** es responsable de ejecutar los desembolsos correspondientes a las solicitudes que hayan finalizado exitosamente el proceso de aprobación.

Su intervención inicia cuando una solicitud alcanza el estado **PROGRAMADA_PAGO**.

### Responsabilidades

- Registrar la ejecución del pago.
- Registrar la información del desembolso.
- Adjuntar los soportes del pago.
- Generar los movimientos financieros derivados de la operación.

### Permisos principales

- Consultar solicitudes programadas para pago.
- Registrar pagos.
- Adjuntar soportes del pago.
- Finalizar solicitudes mediante el registro del pago.
- Consultar fondos generales y gasto acumulado.

### Restricciones

No puede:

- aprobar solicitudes;
- devolver solicitudes;
- crear o modificar proyectos;
- administrar usuarios o permisos;
- programar pagos, ya que esta acción ocurre automáticamente al finalizar el proceso de aprobación.

---

## 4.7 Solicitante

El **Solicitante** corresponde al usuario operativo encargado de registrar las solicitudes de pago dentro de los proyectos sobre los cuales posee acceso.

Es el punto de inicio del flujo de solicitudes.

### Responsabilidades

- Crear solicitudes de pago.
- Adjuntar los documentos soporte.
- Corregir solicitudes devueltas.
- Consultar el estado de sus solicitudes.

### Permisos principales

- Crear solicitudes.
- Editar solicitudes mientras la operación lo permita.
- Adjuntar soportes.
- Consultar las solicitudes propias.

### Restricciones

No puede:

- aprobar solicitudes;
- registrar pagos;
- administrar proyectos;
- administrar usuarios;
- modificar permisos o accesos.

---

# 5. Matriz resumida de responsabilidades

| Funcionalidad | Administrador | Director | Aprobador 1 | Aprobador 2 | Auxiliar Contable | Pagos | Solicitante |
|---------------|:-------------:|:--------:|:-----------:|:-----------:|:-----------------:|:------:|:------------:|
| Administrar usuarios | ✓ | Según permisos | Según permisos | — | — | — | — |
| Administrar proyectos | ✓ | Según permisos | Según permisos | — | — | — | — |
| Gestionar beneficiarios | ✓ | Según permisos | Según permisos | Según permisos | Según permisos | — | Según permisos |
| Crear solicitudes | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| Crear nómina individual y agrupada | Acceso transversal | ✓ | — | — | — | — | — |
| Aprobar nivel 1 | ✓ | — | ✓ | — | — | — | — |
| Aprobar nivel 2 | ✓ | — | — | ✓ | — | — | — |
| Registrar pagos | ✓ | — | — | — | — | ✓ | — |
| Registrar anticipos | ✓ | — | — | — | ✓ | — | — |
| Registrar préstamos | ✓ | — | — | — | ✓ | — | — |
| Consultar auditoría | ✓ | Según permisos | Según permisos | Según permisos | Según permisos | Según permisos | — |
| Administrar configuración del sistema | ✓ | — | — | — | — | — | — |

---

# 6. Consideraciones finales

La asignación de un rol no garantiza por sí sola el acceso a toda la información del sistema.

Las operaciones que un usuario puede ejecutar dependerán de la combinación de:

- rol asignado;
- permisos asociados al rol;
- proyecto base autorizado;
- línea de negocio autorizada;
- estado del proceso correspondiente.

Todas las acciones ejecutadas por los usuarios quedarán registradas en el módulo de auditoría y trazabilidad del sistema, de conformidad con las políticas definidas para el MVP.
