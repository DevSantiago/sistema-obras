# 12. Flujos por usuario y rol

> Última actualización funcional: 18 Julio de 2026.

## Objetivo

Describir los principales flujos operativos que puede ejecutar cada rol dentro del Sistema de Gestión de Solicitudes de Pago.

Este documento no reemplaza la definición de permisos (`03-roles-permissions.md`) ni el backlog funcional (`11-mvp-backlog.md`). Su propósito es mostrar, de forma resumida, cómo interactúa cada rol con el sistema y cuáles son los procesos que ejecuta durante la operación normal.

Cuando un flujo corresponda a una funcionalidad aún no implementada, se identificará expresamente como **Flujo proyectado**.

---

## Administrador

Rol técnico con acceso total al sistema.

### Flujo principal

```text
Ingresar al sistema
↓
Administrar proyectos base
↓
Administrar usuarios y accesos
↓
Administrar beneficiarios
↓
Consultar cualquier solicitud
↓
Ejecutar funciones administrativas según los permisos del sistema
```

Puede intervenir excepcionalmente cualquier proceso cuando sea necesario para la administración, soporte o mantenimiento del sistema.

---

## Director

Responsable de la gestión operativa de los proyectos a los que tiene acceso.

### Flujo principal

```text
Ingresar al sistema
↓
Consultar proyectos asignados
↓
Crear solicitudes de pago
↓
Crear solicitudes de nómina individual o grupal
↓
Adjuntar soportes
↓
Enviar solicitudes a aprobación
↓
Consultar el estado y trazabilidad de sus solicitudes
```

El Director únicamente puede operar sobre los proyectos y líneas de negocio para los cuales tenga accesos activos.

No puede ejecutar aprobaciones de nivel 1, aprobaciones de nivel 2 ni registrar pagos.

---

## Solicitante

Responsable de crear y gestionar solicitudes de pago asociadas a los proyectos para los cuales posee accesos activos.

### Flujo principal

```text
Ingresar al sistema
↓
Consultar proyectos asignados
↓
Crear solicitud de pago
↓
Seleccionar beneficiario
↓
Registrar la información requerida
↓
Adjuntar soportes
↓
Enviar la solicitud a aprobación
↓
Consultar el estado y la trazabilidad de sus solicitudes
```

El Solicitante únicamente puede operar sobre la línea de negocio **OBRA** de los proyectos a los cuales tenga acceso.

No puede aprobar solicitudes ni registrar pagos.

---

## Aprobador 1

Responsable de realizar la primera validación funcional de las solicitudes de pago.

### Flujo principal

```text
Ingresar al sistema
↓
Consultar solicitudes pendientes de aprobación
↓
Revisar la información registrada
↓
Validar soportes y valores
↓
Aprobar o devolver la solicitud
↓
Consultar la trazabilidad de las solicitudes revisadas
```

El Aprobador 1 puede modificar la información de la solicitud cuando las reglas del proceso lo permitan. Todas las modificaciones quedan registradas en la auditoría del sistema.

No puede realizar la aprobación de nivel 2 ni registrar pagos.


---

## Aprobador 2

Responsable de realizar la validación financiera y la aprobación final de las solicitudes de pago.

### Flujo principal

```text
Ingresar al sistema
↓
Consultar solicitudes pendientes de aprobación final
↓
Revisar la información aprobada por Aprobador 1
↓
Validar disponibilidad presupuestal y consistencia financiera
↓
Aprobar o devolver la solicitud
↓
Si aprueba, la solicitud queda disponible para programación y pago
```

El Aprobador 2 constituye la última instancia de aprobación dentro del flujo de solicitudes de pago.

No puede registrar pagos ni modificar el estado de una solicitud ya pagada.

---

## Auxiliar contable

Responsable de ejecutar procesos financieros y contables definidos por la organización.

### Flujo principal (proyectado)

```text
Ingresar al sistema
↓
Consultar información financiera
↓
Registrar operaciones contables autorizadas
↓
Registrar reingresos de efectivo cuando aplique
↓
Registrar cargos financieros
↓
Consultar la trazabilidad de los movimientos realizados
```

Este rol será el principal responsable de las funcionalidades del módulo financiero que se incorporarán en fases posteriores del desarrollo.

No participa en los flujos de aprobación ni en el registro de pagos a beneficiarios.

---

## Pagos

Responsable de ejecutar el pago de las solicitudes previamente aprobadas.

### Flujo principal

```text
Ingresar al sistema
↓
Consultar solicitudes programadas para pago
↓
Verificar la información del beneficiario
↓
Registrar la ejecución del pago
↓
Seleccionar pago electrónico directo o retiro y pagos
↓
Adjuntar o fotografiar los soportes requeridos
↓
Marcar la solicitud como pagada
↓
El sistema registra automáticamente el movimiento financiero
```

El rol Pagos únicamente puede ejecutar solicitudes que hayan finalizado satisfactoriamente el proceso de aprobación.

No puede crear solicitudes, aprobar solicitudes ni administrar usuarios, proyectos o beneficiarios.

Los pagos electrónicos directos (`TRANSFERENCIA`, `PSE` o `PORTAL`) se
registran individualmente o por lote. La fecha y hora de ejecución son
asignadas por el servidor y no se seleccionan manualmente. Las
solicitudes en `EFECTIVO` o `CONSIGNACION` pueden agruparse en un retiro
cuando pertenecen al mismo proyecto y fondo.

La bandeja muestra el total de las solicitudes visibles y, al seleccionar una
o varias, presenta por separado la cantidad y el valor que se procesará.

---

# Funcionalidades proyectadas

Las siguientes funcionalidades hacen parte de la evolución prevista del sistema y serán incorporadas conforme avance el desarrollo del módulo financiero.

## Operaciones proyectadas

- Registro de cargos financieros asociados a cuentas bancarias.
- Gestión de solicitudes de pago de impuestos.
- Administración de impuestos y retenciones.
- Consulta financiera consolidada por proyecto, centro de costo y fondo.
- Gestión avanzada de movimientos financieros.
