# 02. Proceso de negocio

> Última actualización funcional: 17 de julio de 2026.

Este documento describe los procesos funcionales del Sistema de Gestión de Solicitudes de Pago, las reglas de negocio que gobiernan cada módulo y la interacción entre los diferentes actores del sistema.

Su objetivo es servir como especificación funcional del comportamiento esperado de la aplicación, independientemente del estado actual de implementación de cada componente.

---

# 1. Procesos de negocio

El sistema se compone de los siguientes procesos funcionales:

1. Gestión de proyectos.
2. Gestión de beneficiarios.
3. Gestión de solicitudes de pago.
4. Gestión de aprobaciones.
5. Gestión de pagos.
6. Gestión financiera.
7. Gestión de nómina.
8. Gestión tributaria.
9. Gestión de operaciones de efectivo.

Cada proceso interactúa con los demás respetando las reglas de negocio y los permisos definidos para cada rol.

---

# 2. Flujo general de una solicitud

Toda solicitud de pago sigue el siguiente ciclo de vida:

```text
Crear solicitud
        │
        ▼
Guardar como BORRADOR
        │
        ├───────────────┐
        │               │
        │ Editar        │
        │ las veces     │
        │ necesarias    │
        │               │
        └──────┬────────┘
               │
               ▼
Enviar
               │
               ▼
PENDIENTE_APROBADOR_1
               │
        ┌──────┴─────────┐
        │                │
        │ Aprobar        │
        │                │
        ▼                ▼
DEVUELTA          PENDIENTE_APROBADOR_2
SOLICITANTE               │
        │          ┌──────┴────────┐
        │          │               │
        │          │ Aprobar       │
        │          │               │
        │          ▼               ▼
        │    DEVUELTA        PROGRAMADA_PAGO
        │    APROBADOR_1            │
        │                           ▼
        └──────────────►      PAGADA
```

El flujo representa el comportamiento funcional esperado del sistema y constituye la única secuencia válida para el procesamiento de solicitudes de pago.

---

# 3. Estados de la solicitud

Las solicitudes pueden encontrarse únicamente en uno de los siguientes estados:

```text
BORRADOR

PENDIENTE_APROBADOR_1

PENDIENTE_APROBADOR_2

DEVUELTA_APROBADOR_1

DEVUELTA_SOLICITANTE

PROGRAMADA_PAGO

PAGADA

ANULADA
```

No existe un estado operativo denominado **APROBADA**.

Una vez el Aprobador 2 aprueba la solicitud, ésta cambia inmediatamente al estado **PROGRAMADA_PAGO**, quedando disponible para el área de Pagos.

---

# 4. Reglas funcionales de cada estado

## BORRADOR

Representa una solicitud que aún no ha sido enviada al flujo de aprobación.

Mientras permanezca en este estado:

- el creador puede modificar toda la información de la solicitud;
- puede agregar o eliminar soportes;
- puede cambiar beneficiario, proyecto, centro de costo, impuestos, conceptos y valores;
- puede eliminar completamente la solicitud si aún no ha iniciado el proceso de aprobación;
- no genera movimientos financieros;
- no genera auditoría de aprobación;
- únicamente es visible para su creador y para el Administrador.

La edición de solicitudes en estado **BORRADOR** forma parte del comportamiento funcional obligatorio del sistema. Aunque el frontend aún no implemente completamente esta funcionalidad, el modelo de negocio la considera un requisito del producto.

---

## PENDIENTE_APROBADOR_1

La solicitud queda disponible para revisión del Aprobador 1.

Durante esta etapa el Aprobador 1 puede:

- aprobar;
- devolver al solicitante;
- modificar los campos funcionales autorizados;
- registrar observaciones.

Toda modificación realizada debe quedar registrada en la auditoría del sistema.

---

## DEVUELTA_SOLICITANTE

La solicitud retorna al usuario creador.

Mientras permanezca en este estado:

- puede ser editada nuevamente;
- pueden modificarse soportes;
- pueden ajustarse valores;
- pueden corregirse observaciones.

Una vez corregida deberá enviarse nuevamente, reiniciando el flujo desde **PENDIENTE_APROBADOR_1**.

---

## PENDIENTE_APROBADOR_2

Corresponde a la segunda revisión.

El Aprobador 2 puede:

- aprobar;
- devolver al Aprobador 1;
- registrar observaciones.

El Aprobador 2 no modifica la información funcional de la solicitud.

---

## DEVUELTA_APROBADOR_1

La solicitud retorna al Aprobador 1.

Este podrá:

- realizar ajustes autorizados;
- registrar nuevas observaciones;
- reenviar nuevamente al Aprobador 2.

---

## PROGRAMADA_PAGO

La solicitud ya cuenta con todas las aprobaciones.

A partir de este momento:

- no puede modificarse;
- queda disponible para el rol PAGOS;
- puede registrarse el medio de pago;
- puede registrarse el soporte de pago.

---

## PAGADA

Representa la finalización del proceso.

Al marcar una solicitud como pagada el sistema:

- registra el movimiento financiero correspondiente;
- actualiza el saldo del fondo;
- registra la trazabilidad del pago;
- conserva todos los soportes asociados.

---

## ANULADA

Estado terminal utilizado cuando la solicitud no continuará su proceso.

Una solicitud anulada:

- no puede reactivarse;
- conserva toda la trazabilidad histórica;
- no genera movimientos financieros.
- si está pendiente del primer nivel, únicamente el Aprobador de nivel 1 o el
  Administrador pueden anularla, indicando un motivo obligatorio;
- la anulación puede aplicarse a una selección múltiple y se registra de forma
  atómica para mantener la trazabilidad del lote.

### Gestión documental durante el ciclo de vida

Las solicitudes de pago pueden tener documentos asociados según el tipo de solicitud y el estado en el que se encuentren.

Mientras la solicitud permanezca en un estado editable (por ejemplo, **BORRADOR** o **DEVUELTA**), el solicitante podrá:

- cargar nuevos documentos;
- eliminar documentos previamente asociados;
- reemplazar documentos cuando sea necesario.

Una vez la solicitud ingrese al proceso de aprobación, las modificaciones documentales estarán sujetas a las reglas de negocio definidas para cada estado, garantizando la integridad del expediente y la trazabilidad de la información presentada.

---

# 5. Tipos de solicitud

## Tipos de solicitudes de pago

El sistema soporta actualmente los siguientes tipos de solicitudes de pago:

- Pago a proveedores.
- Nómina individual.
- Nómina grupal.
- Pago de impuestos.
- Reembolso de gastos.

Aunque cada tipo posee reglas particulares de validación, todos utilizan el mismo flujo general de aprobación y el mismo ciclo de vida definido para las solicitudes de pago.

---

# 6. Gestión de proyectos

Toda solicitud de pago pertenece obligatoriamente a un **proyecto base** y se ejecuta sobre uno de sus centros de costo.

El proyecto base constituye la unidad administrativa principal del sistema. Sobre él se agrupan los centros de costo, el fondo financiero y los permisos de operación.

La estructura funcional es la siguiente:

```text
Proyecto Base
│
├── Fondo General
│
├── PRO-OBRA
├── OBRA
├── PRO-INTERVENTORÍA
└── INTERVENTORÍA
```

El fondo general pertenece al proyecto base y representa el saldo financiero disponible para la ejecución del proyecto.

Los centros de costo representan la clasificación presupuestal y operativa donde se ejecutan los gastos.

Los centros de costo no administran saldos independientes.

---

## 6.1 Creación de un proyecto base

La creación de un proyecto base es un proceso transaccional.

Durante su creación el usuario autorizado deberá definir:

- Nombre del proyecto.
- Cliente.
- Información contractual.
- Líneas de negocio que ejecutará.

Las líneas disponibles son:

```text
OBRA

INTERVENTORÍA

OBRA + INTERVENTORÍA
```

Dependiendo de la selección, el sistema crea automáticamente los centros de costo iniciales.

### Caso 1

```text
OBRA
```

Se crea:

```text
PRO-OBRA
```

Estado inicial:

```text
EN_LICITACIÓN
```

---

### Caso 2

```text
INTERVENTORÍA
```

Se crea:

```text
PRO-INTERVENTORÍA
```

Estado inicial:

```text
EN_LICITACIÓN
```

---

### Caso 3

```text
OBRA + INTERVENTORÍA
```

Se crean simultáneamente:

```text
PRO-OBRA

PRO-INTERVENTORÍA
```

Ambos centros quedan inicialmente en:

```text
EN_LICITACIÓN
```

Adicionalmente el sistema crea:

- Fondo General.
- Configuración financiera inicial.
- Auditoría de creación.

---

## 6.2 Cambio de fase

Cuando una licitación es adjudicada, el centro correspondiente cambia de fase.

Para Obra:

```text
PRO-OBRA
EN_LICITACIÓN

↓

PRO-OBRA
FINALIZADO

↓

OBRA
EN_EJECUCIÓN
```

Para Interventoría:

```text
PRO-INTERVENTORÍA
EN_LICITACIÓN

↓

PRO-INTERVENTORÍA
FINALIZADO

↓

INTERVENTORÍA
EN_EJECUCIÓN
```

Este proceso crea un nuevo centro operativo sin modificar el historial financiero de la etapa de licitación.

Los movimientos registrados durante la fase PRO permanecen asociados permanentemente a dicha etapa.

No existe reclasificación automática de movimientos históricos.

---

## 6.3 Finalización

Cuando una línea termina su ejecución:

```text
OBRA
EN_EJECUCIÓN

↓

OBRA
FINALIZADO
```

o

```text
INTERVENTORÍA
EN_EJECUCIÓN

↓

INTERVENTORÍA
FINALIZADO
```

Cuando todos los centros pertenecientes al proyecto base se encuentren finalizados, el proyecto base podrá pasar al estado:

```text
FINALIZADO
```

---

## 6.4 Permisos de operación

Los permisos operativos no se asignan directamente sobre un centro de costo.

Se asignan mediante la combinación:

```text
Proyecto Base

+

Línea de negocio
```

Las líneas disponibles son:

```text
OBRA

INTERVENTORÍA
```

Si un usuario posee acceso a:

```text
Proyecto X

+

OBRA
```

podrá operar sobre:

```text
PRO-OBRA

OBRA
```

del mismo proyecto.

De igual forma, un usuario con acceso a:

```text
Proyecto X

+

INTERVENTORÍA
```

podrá operar sobre:

```text
PRO-INTERVENTORÍA

INTERVENTORÍA
```

La asignación de permisos no modifica las reglas de visibilidad de solicitudes.

El acceso únicamente habilita la posibilidad de crear y operar información dentro del proyecto autorizado.

---

# 7. Gestión de beneficiarios

## Reglas de negocio

Los beneficiarios administrados por el sistema podrán clasificarse como:

- Proveedor.
- Trabajador.
- Otro.

El sistema validará las reglas correspondientes para cada tipo de beneficiario, incluyendo restricciones sobre el tipo de documento permitido, unicidad del documento de identificación, normalización de la información registrada y control de beneficiarios activos e inactivos.

Cuando un beneficiario previamente inactivo sea registrado nuevamente con la misma identificación, el sistema podrá reactivarlo conservando su historial.

Todo pago realizado por el sistema debe tener asociado un beneficiario.

Las solicitudes de pago a proveedor permiten seleccionar beneficiarios activos
clasificados como `PROVEEDOR` u `OTRO`. Los beneficiarios `TRABAJADOR` continúan
reservados para los flujos de nómina y reembolso.

El beneficiario representa la persona natural o jurídica que recibe efectivamente el dinero.

El usuario del sistema y el beneficiario son conceptos independientes.

Un usuario puede crear solicitudes para múltiples beneficiarios.

Un beneficiario incluso puede no tener usuario asociado.

Los beneficiarios tipo `PROVEEDOR` funcionan además como directorio de contacto y datos de pago. Para crearlos o actualizarlos son obligatorios correo, teléfono, banco, tipo de cuenta, número de cuenta y concepto de pago, incluso si su medio sugerido es efectivo.

El módulo permite cargar proveedores mediante la plantilla Excel oficial. Antes de confirmar, valida campos, formatos, catálogos y documentos duplicados dentro del archivo o existentes en la base de datos. Solo importa filas válidas y nunca actualiza automáticamente proveedores existentes.

---

## 7.1 Tipos de beneficiario

El sistema soporta los siguientes tipos:

```text
PROVEEDOR

TRABAJADOR

OTRO
```

Cada tipo activa reglas particulares de validación.

---

## 7.2 Reglas generales

Todo beneficiario debe cumplir las siguientes reglas:

- deduplicación por tipo y número de documento;
- identificación única;
- trazabilidad histórica;
- auditoría de modificaciones.

Los datos bancarios serán obligatorios únicamente cuando el medio de pago preferido corresponda a:

```text
TRANSFERENCIA

CONSIGNACIÓN
```

Para pagos en:

```text
EFECTIVO
```

la información bancaria podrá permanecer vacía.

---

## 7.3 Restricciones

El sistema deberá impedir:

- trabajadores identificados mediante NIT;
- duplicidad de beneficiarios;
- eliminación de beneficiarios utilizados por solicitudes ya creadas.

Las modificaciones posteriores conservarán el historial de auditoría.

---

## 7.4 Relación con solicitudes

Una solicitud de pago siempre referencia exactamente un beneficiario.

Ese beneficiario determina:

- datos bancarios;
- tipo documental;
- información tributaria;
- receptor final del pago.

El cambio de beneficiario únicamente será posible mientras la solicitud permanezca en estado:

```text
BORRADOR
```

o

```text
DEVUELTA_SOLICITANTE
```

Después del envío al flujo de aprobación el beneficiario no podrá modificarse.

# 8. Gestión de aprobaciones

El proceso de aprobación garantiza que toda solicitud de pago sea revisada antes de afectar los recursos financieros del proyecto.

El sistema implementa un flujo secuencial de dos niveles de aprobación.

```text
Solicitante

↓

APROBADOR_1

↓

APROBADOR_2

↓

PAGOS
```

Cada nivel tiene responsabilidades claramente definidas y únicamente puede ejecutar las acciones autorizadas para su rol.

---

## 8.1 Primer nivel de aprobación

Cuando una solicitud es enviada por el solicitante, cambia al estado:

```text
PENDIENTE_APROBADOR_1
```

En este estado únicamente el rol **APROBADOR_1** puede realizar acciones sobre ella.

Las acciones permitidas son:

- Aprobar.
- Devolver al solicitante.
- Editar los campos funcionales autorizados.
- Registrar observaciones.

Toda modificación realizada por el Aprobador 1 debe quedar registrada en la auditoría indicando:

- usuario;
- fecha y hora;
- campo modificado;
- valor anterior;
- valor nuevo.

Durante la edición, el proyecto base, centro de costo, tipo, número y
solicitante permanecen inmutables. El valor neto se recalcula con el valor
bruto, impuestos y retenciones y descuentos. Si la solicitud fue devuelta
desde nivel 2, el cambio actualiza su valor reservado dentro del saldo
disponible del fondo; si todavía no ha sido aprobada en nivel 1, la reserva se
crea únicamente al aprobar.

El creador ya no puede modificar la solicitud mientras permanezca en revisión.

---

## 8.2 Devolución al solicitante

Cuando el Aprobador 1 encuentra inconsistencias podrá devolver la solicitud.

```text
PENDIENTE_APROBADOR_1

↓

DEVUELTA_SOLICITANTE
```

La devolución deberá registrar una observación obligatoria.

La bandeja admite devolución individual o múltiple mediante el checklist. En
una devolución múltiple todas las solicitudes reciben el mismo motivo y deben
pertenecer al mismo nivel; si una cambió de estado, no se devuelve ninguna.

La devolución desde nivel 1 todavía no tiene una reserva propia, por lo que no
libera ningún valor. Si la solicitud había regresado previamente desde nivel 2
y el Aprobador 1 decide devolverla al solicitante, la reserva se libera antes
de permitir cambios de valor, proyecto o fondo.

Mientras la solicitud permanezca devuelta:

- el solicitante podrá editar nuevamente toda la información;
- podrá modificar soportes;
- podrá cambiar valores;
- podrá cambiar beneficiario;
- podrá corregir observaciones.

Una vez corregida deberá enviarse nuevamente.

El proceso reinicia desde:

```text
PENDIENTE_APROBADOR_1
```

---

## 8.3 Segundo nivel de aprobación

Cuando el primer aprobador aprueba la solicitud ésta cambia a:

```text
PENDIENTE_APROBADOR_2
```

En este estado únicamente el rol **APROBADOR_2** puede actuar.

Las acciones permitidas son:

- Aprobar.
- Devolver al Aprobador 1.
- Registrar observaciones.

El Aprobador 2 actúa como instancia final de aprobación y no modifica la información funcional de la solicitud.

---

## 8.4 Devolución al Aprobador 1

Cuando el Aprobador 2 detecte inconsistencias podrá devolver la solicitud.

```text
PENDIENTE_APROBADOR_2

↓

DEVUELTA_APROBADOR_1
```

El Aprobador 1 podrá:

- realizar los ajustes permitidos;
- registrar nuevas observaciones;
- reenviar nuevamente la solicitud al segundo aprobador.

Mientras la solicitud permanezca en `DEVUELTA_APROBADOR_1`, conserva la reserva
creada en la aprobación de nivel 1. El Aprobador 1 puede reenviarla a nivel 2 o
devolverla al solicitante; esta última acción libera la reserva.

---

## 8.5 Aprobación definitiva

Cuando el segundo aprobador aprueba la solicitud ésta cambia inmediatamente al estado:

```text
PROGRAMADA_PAGO
```

No existe un estado intermedio denominado **APROBADA**.

Desde este momento la solicitud deja de pertenecer al proceso de aprobación y pasa a ser responsabilidad del área de Pagos.

---

# 9. Consulta y visibilidad de solicitudes

El módulo de solicitudes utiliza una única tabla principal para consultar y gestionar las solicitudes de pago.

No existen bandejas independientes por rol. La misma tabla adapta la información mostrada mediante filtros y acciones disponibles, de acuerdo con el rol del usuario, el estado de la solicitud y los permisos asignados sobre el proyecto.

Todo usuario con un acceso activo a un proyecto puede consultar todas las solicitudes asociadas a ese proyecto, independientemente de quién las haya creado. Esta visibilidad no concede por sí sola permisos para editar, enviar, aprobar o pagar solicitudes.

---

## 9.1 Tabla principal de solicitudes

La tabla deberá presentar, como mínimo, la siguiente información:

- Número de solicitud.
- Tipo de solicitud.
- Proyecto base.
- Centro de costo.
- Beneficiario.
- Concepto.
- Valor total.
- Estado.
- Usuario creador.
- Fecha de creación.
- Fecha de aprobación de nivel 1, cuando aplique.
- Fecha de aprobación de nivel 2, cuando aplique.
- Fecha de pago, cuando aplique.

Para conservar la legibilidad, estas fechas y horas se presentan agrupadas como trazabilidad del proceso tanto en la tabla como en el detalle. Las etapas que todavía no hayan ocurrido se identifican como pendientes.

Cuando la solicitud se encuentra pagada, su detalle permite consultar el comprobante registrado, tanto para pagos directos como para pagos derivados de una operación de efectivo.

Las acciones disponibles para cada registro dependerán del estado de la solicitud y del rol del usuario autenticado.

---

## 9.2 Filtros de consulta

La tabla permitirá consultar las solicitudes mediante un selector de vistas con las siguientes opciones:

```text
TODAS

BORRADORES

PENDIENTES_POR_ENVIAR

DEVUELTAS_PARA_CORRECCION

PENDIENTES_DE_MI_APROBACION

PROGRAMADAS_PARA_PAGO

PAGADAS
```

Adicionalmente, la consulta permitirá combinar filtros como:

- Proyecto base.
- Centro de costo.
- Tipo de solicitud.
- Beneficiario.
- Estado.
- Usuario creador.
- Número de solicitud.

También deberá incluir un filtro por rango de fechas:

```text
Fecha desde

Fecha hasta
```

Por defecto, el filtro aplicará sobre la fecha de creación de la solicitud.

En futuras versiones podrá permitirse seleccionar el tipo de fecha a consultar (creación, envío, aprobación o pago).

---

## 9.3 Visibilidad por rol

### Solicitante

Puede visualizar todas las solicitudes creadas por él mismo, independientemente del estado en que se encuentren.

Los filtros disponibles le permitirán consultar:

- Borradores.
- Pendientes por enviar.
- Devueltas para corrección.
- Pagadas.
- Histórico.

No puede visualizar solicitudes creadas por otros usuarios.

---

### Aprobador 1

Puede visualizar:

- sus propias solicitudes;
- solicitudes en estado `PENDIENTE_APROBADOR_1`;
- solicitudes en estado `DEVUELTA_APROBADOR_1`.

Desde la tabla podrá consultar sus solicitudes pendientes de aprobación utilizando el filtro **Pendientes de mi aprobación**.

No puede visualizar borradores creados por otros usuarios.

---

### Aprobador 2

Puede visualizar:

- sus propias solicitudes;
- solicitudes en estado `PENDIENTE_APROBADOR_2`.

Desde la tabla podrá consultar sus solicitudes pendientes utilizando el filtro **Pendientes de mi aprobación**.

No participa en las solicitudes que aún no han sido aprobadas por el primer nivel.

---

### Pagos

Puede visualizar:

- sus propias solicitudes;
- solicitudes en estado `PROGRAMADA_PAGO`;
- solicitudes en estado `PAGADA`.

El filtro **Programadas para pago** constituye su vista principal de trabajo.

No participa del proceso de aprobación.

---

### Administrador

El Administrador posee acceso completo al sistema.

Puede:

- visualizar todas las solicitudes;
- consultar cualquier estado;
- utilizar todos los filtros disponibles;
- administrar usuarios;
- administrar proyectos;
- administrar beneficiarios;
- ejecutar los procesos administrativos definidos por el sistema.

El Administrador no reemplaza automáticamente las funciones de los aprobadores.

Las aprobaciones continúan registrando el usuario que ejecutó cada acción.

---

## 9.4 Reglas generales

La aplicación de filtros no modifica los permisos de acceso del usuario.

Todas las consultas deberán validar simultáneamente:

- el rol del usuario;
- los permisos sobre el proyecto y la línea de negocio;
- el estado de la solicitud;
- las reglas de visibilidad definidas por el sistema.

El frontend únicamente presenta las opciones disponibles para el usuario autenticado. La autorización y validación de permisos deberá realizarse siempre en el backend.

---

# 10. Gestión de pagos

El proceso de pago inicia automáticamente cuando el Aprobador 2 aprueba una solicitud. Como resultado de esta aprobación, el sistema cambia su estado a PROGRAMADA_PAGO, dejándola disponible para que el área de Pagos ejecute el desembolso correspondiente:

```text
PROGRAMADA_PAGO
```

A partir de este momento, la solicitud deja de pertenecer al flujo de aprobaciones y pasa a ser responsabilidad del área de Pagos.

El objetivo del proceso es registrar la ejecución efectiva del pago, generar la trazabilidad correspondiente y producir los movimientos financieros que afectarán el saldo del proyecto.

---

## 10.1 Solicitudes programadas para pago

Únicamente las solicitudes en estado:

```text
PROGRAMADA_PAGO
```

podrán ser gestionadas por el rol **PAGOS**.

> **Regla de negocio**

El estado `PROGRAMADA_PAGO` es asignado automáticamente por el sistema como consecuencia de la aprobación realizada por el Aprobador 2.

El rol **PAGOS** no puede crear, modificar ni asignar este estado. Su responsabilidad inicia únicamente cuando la solicitud ya se encuentra programada para pago.

Estas solicitudes aparecerán en el filtro **Programadas para pago** de la tabla principal de solicitudes.

Mientras permanezcan en este estado:

- no podrán modificarse los datos funcionales de la solicitud;
- no podrán cambiarse el beneficiario, el proyecto, el centro de costo ni los valores aprobados;
- únicamente podrán registrarse los datos propios del proceso de pago.

La bandeja de Pagos muestra exclusivamente solicitudes en
`PROGRAMADA_PAGO`. Permite consultar el detalle del beneficiario y sus datos
bancarios, además de filtrar por proyecto base, centro de costo y medio de
pago. Las solicitudes que cambian a `PAGADA` dejan de aparecer
automáticamente.

---

## 10.2 Información del pago

Antes de finalizar un pago, el sistema deberá permitir registrar, como mínimo, la siguiente información:

- fecha de pago;
- medio de pago;
- número de comprobante o referencia;
- observaciones;
- soportes del pago.

Los soportes podrán corresponder, entre otros, a:

- comprobantes de transferencia;
- consignaciones;
- comprobantes bancarios;
- recibos de caja;
- documentos equivalentes.

Todos los soportes quedarán asociados permanentemente a la solicitud.

---

## 10.3 Medios de pago

El alcance implementado permite registrar los siguientes medios de pago:

```text
TRANSFERENCIA

CONSIGNACIÓN

EFECTIVO
```

Los pagos directos mediante transferencia, PSE o portal requieren referencia y soporte por
solicitud. Las consignaciones se ejecutan dentro de un retiro agrupado y
requieren referencia propia. Los pagos en efectivo también se ejecutan
dentro de un retiro agrupado, pero no requieren referencia bancaria. Todos
los pagos requieren soporte individual.

---

## 10.4 Registro del pago

Cuando el usuario de Pagos confirme la ejecución del pago, el sistema deberá:

- validar que la solicitud continúe en estado `PROGRAMADA_PAGO`;
- validar que el proyecto disponga del saldo suficiente;
- registrar la información del pago;
- almacenar los soportes asociados;
- generar la trazabilidad de la operación;
- cambiar el estado de la solicitud a `PAGADA`;
- generar el movimiento financiero correspondiente.

El cambio de estado y el movimiento financiero deberán ejecutarse dentro de la misma transacción para garantizar la consistencia de la información.

Para pagos directos mediante transferencia, PSE o portal, cada solicitud genera un movimiento
`EGRESO_SOLICITUD_PAGO` y descuenta su valor neto del fondo del proyecto.

Para efectivo y consignaciones, una operación agrupa una o varias solicitudes
del mismo proyecto y fondo. El retiro genera un único
`EGRESO_RETIRO_EFECTIVO` por el valor retirado. Marcar las solicitudes
asociadas como pagadas no genera egresos adicionales.

La fecha y hora del pago o retiro se asignan automáticamente cuando el backend
registra la operación. El usuario de Pagos no puede seleccionarlas ni
modificarlas desde el formulario.

---

## 10.5 Resultado del proceso

Al finalizar correctamente el proceso:

```text
PROGRAMADA_PAGO

↓

PAGADA

↓

Movimiento financiero

↓

Actualización del saldo del fondo
```

La solicitud conservará toda la información del pago y permanecerá disponible únicamente para consulta.

Una solicitud en estado **PAGADA** no podrá regresar a estados anteriores ni ser modificada.


---

# 11. Gestión financiera

El módulo financiero es el responsable de registrar todos los movimientos que afectan el saldo de los fondos de los proyectos.

Las solicitudes de pago constituyen únicamente una autorización para realizar un desembolso. El saldo financiero del proyecto únicamente se modifica cuando ocurre un movimiento financiero.

Todos los ingresos y egresos deberán registrarse en la tabla funcional:

```text
movimientos_fondo
```

Cada movimiento deberá generar la trazabilidad necesaria para reconstruir el historial financiero de un proyecto.

## Gestión de nómina

El sistema soporta dos modalidades de solicitudes de nómina:

- Nómina individual.
- Nómina grupal.

Las solicitudes de nómina individual corresponden al pago de un único trabajador.

Las solicitudes de nómina grupal permiten registrar múltiples trabajadores mediante la carga de una plantilla en formato Excel, la cual constituye el documento origen de la solicitud.

Cada solicitud registra el período de nómina correspondiente y los conceptos asociados definidos por las reglas de negocio implementadas por el sistema.

---

## 11.1 Tipos de movimientos

Los movimientos financieros se clasifican según su naturaleza.

### Ingresos

```text
INGRESO_APORTE

INGRESO_ANTICIPO

INGRESO_PRESTAMO_PERSONA

INGRESO_PRESTAMO_PROYECTO

INGRESO_DEVOLUCION_PRESTAMO

INGRESO_REINTEGRO_EFECTIVO

INGRESO_AJUSTE
```

---

### Egresos

```text
EGRESO_SOLICITUD_PAGO

EGRESO_RETIRO_EFECTIVO

EGRESO_PRESTAMO_PROYECTO

EGRESO_DEVOLUCION_ANTICIPO

EGRESO_IMPUESTO

EGRESO_CARGO_FINANCIERO

EGRESO_AJUSTE
```

Cada tipo de movimiento posee reglas propias de validación y auditoría.

---

## 11.2 Momento en que se afectan los saldos

Los saldos del proyecto únicamente cambian cuando se registra un movimiento financiero.

Por ejemplo:

| Evento | ¿Modifica saldo? |
|---------|------------------|
| Crear solicitud | No |
| Guardar borrador | No |
| Enviar aprobación | No |
| Aprobar nivel 1 | No; registra reserva presupuestal |
| Aprobar nivel 2 | No; conserva la reserva |
| Programar pago | No |
| Registrar pago | Sí |
| Registrar préstamo | Sí |
| Registrar reintegro | Sí |
| Registrar anticipo | Sí |

La aprobación de nivel 1 registra `valor_reservado` para controlar los
compromisos presupuestales. Esta reserva no descuenta ni modifica
`fondos.saldo_actual`.

En nivel 1, la selección se resta del saldo disponible para validar los nuevos
compromisos frente a las reservas existentes. En nivel 2, el saldo proyectado
representa el saldo real que quedaría al pagar únicamente las solicitudes
seleccionadas y conservar las demás reservas:
`saldo_actual - total_reservado_seleccionado - reserva_restante`.

En ambos niveles la interfaz separa el estado presupuestal de la simulación de
la selección. Sin solicitudes seleccionadas, la proyección se muestra como no
aplicable (`—`) para evitar confundirla con el saldo actual o disponible.
Las tarjetas presentan “Saldo actual”, “Reservado para pagos por terminar de
aprobar” y “Saldo disponible sin comprometer”. Cada valor incluye una
explicación breve sobre su origen y cálculo; la simulación hace lo mismo para
la selección y su proyección.
Las tablas de solicitudes de ambos niveles muestran al pie la cantidad de
registros y la suma total de sus valores netos.

En nivel 2, la simulación diferencia el valor seleccionado ahora de la reserva
que permanece comprometida. El estado presupuestal muestra el total reservado
y el saldo libre después de considerar todas las reservas; la proyección
muestra por separado el saldo contable después de pagar únicamente la
selección y el disponible sin comprometer después de conservar la reserva
restante.
En ambos niveles, la simulación se presenta debajo del estado presupuestal
para mantener una lectura secuencial del saldo general hacia el efecto de la
selección.

El saldo del fondo únicamente refleja el egreso cuando el pago ha sido
efectivamente realizado. Al pagar, `valor_reservado` se libera y se registra
el movimiento financiero correspondiente.

---

## 11.3 Registro transaccional de movimientos

Los procesos que afecten el saldo deben utilizar el servicio financiero común.
Este servicio recibe el fondo, el proyecto, el tipo, la dirección, el valor y
las relaciones de origen que correspondan.

Antes de afectar el saldo, el sistema valida:

- que el fondo esté activo y pertenezca al proyecto;
- que el centro de costo pertenezca al proyecto, cuando aplique;
- que la solicitud, el pago o la operación de efectivo correspondan al fondo y
  al proyecto informados;
- que el egreso no supere el saldo disponible;
- que el origen no haya generado previamente el mismo movimiento.

La actualización del fondo y la creación de `movimientos_fondo` se ejecutan en
una única transacción serializable. El registro conserva el saldo anterior y
el saldo nuevo. Si alguna validación o escritura falla, no se aplica ninguna
parte de la operación.

El servicio no constituye una operación manual ni expone un endpoint propio.
Es invocado por el proceso funcional que origina el movimiento, como el
registro de una transferencia directa, un retiro de efectivo o un reintegro.

---

## 11.4 Consulta de movimientos

Los usuarios autorizados pueden consultar el historial financiero aplicando
filtros por proyecto base, centro de costo, línea de negocio, fase, dirección
y tipo de movimiento.

La consulta muestra el valor, el saldo anterior y el saldo nuevo de cada
registro. Los movimientos sin centro de costo corresponden a afectaciones
generales del fondo y solo son visibles para los roles con visibilidad
financiera total.

Los usuarios limitados por accesos de proyecto únicamente pueden consultar
movimientos que estén imputados a centros de costo de sus líneas autorizadas.

---

## 11.5 Auditoría financiera

Todo movimiento deberá registrar, como mínimo:

- tipo de movimiento;
- dirección (ingreso o egreso);
- proyecto base;
- centro de costo;
- fondo afectado;
- valor;
- usuario que realiza el registro;
- fecha y hora;
- documento origen;
- observaciones.

Los movimientos financieros no podrán eliminarse.

En caso de corrección deberá registrarse un nuevo movimiento compensatorio, preservando el historial completo.

---

## 11.4 Consulta del fondo general

El módulo financiero permite consultar una tabla por proyecto base con:

- nombre del fondo general;
- saldo actual;
- centros de costo relacionados;
- gasto acumulado por centro;
- consolidado por línea `OBRA` o `INTERVENTORIA`;
- consolidado por fase `LICITACION` o `EJECUCION`.

El gasto imputado incluye los egresos directos relacionados con cada centro y
los pagos cubiertos por operaciones de efectivo. El movimiento general del
retiro no se suma nuevamente, evitando duplicar el gasto.

`ADMINISTRADOR`, `AUXILIAR_CONTABLE` y `PAGOS` consultan la totalidad de los
proyectos. `DIRECTOR` consulta únicamente proyectos y líneas con acceso
activo. Todos requieren el permiso `CONSULTAR_FONDOS`.

---

# 12. Operaciones de efectivo

Las operaciones realizadas mediante efectivo requieren un control adicional debido a que un único retiro puede utilizarse para pagar varias solicitudes.

Por esta razón, el sistema administrará retiros agrupados.

---

## 12.1 Retiro agrupado

Las operaciones registradas pueden consultarse desde el módulo Pagos. El
detalle conserva el soporte general del retiro, las solicitudes incluidas,
el soporte individual de cada pago y los valores requerido, retirado, pagado,
sobrante, reintegrado y pendiente de reintegro.

El estado de seguimiento se deriva de los movimientos ya registrados:

```text
SIN_SOBRANTE
SOBRANTE_PENDIENTE_REINGRESO
SOBRANTE_REINTEGRADO
```

Esta consulta no vuelve a registrar pagos, movimientos ni actualizaciones de
saldo. Un movimiento `EGRESO_RETIRO_EFECTIVO` permite abrir directamente el
detalle operativo de la operación relacionada.

Un retiro con `SOBRANTE_PENDIENTE_REINGRESO` admite uno o varios reingresos
posteriores. Cada reingreso exige valor y soporte documental, usa la fecha y
hora del sistema y no puede superar el pendiente vigente.

El registro crea `INGRESO_REINTEGRO_EFECTIVO`, incrementa el mismo fondo del
retiro y actualiza el pendiente. El soporte, el registro del reingreso, el
movimiento y el fondo se confirman en una única transacción serializable. El
estado pasa a `SOBRANTE_REINTEGRADO` cuando el pendiente llega a cero.

Un retiro agrupado corresponde a una salida de efectivo destinada a cubrir una o varias solicitudes de pago.

Su estructura conceptual es:

```text
Retiro

├── Solicitud 1
├── Solicitud 2
├── Solicitud 3
└── Solicitud N
```

Cada solicitud mantiene su:

- proyecto base;
- centro de costo;
- valor asignado;
- beneficiario.

Solo pueden agruparse solicitudes en `PROGRAMADA_PAGO`, con medio de pago
`EFECTIVO` o `CONSIGNACION`, pertenecientes al mismo proyecto base y fondo.
El retiro exige un soporte general y cada solicitud exige su propio soporte
de pago. Las consignaciones exigen además una referencia individual.

---

## 12.2 Valores controlados

Cada retiro administra los siguientes valores:

```text
Valor requerido

Valor retirado

Valor pagado

Valor sobrante

Valor reintegrado
```

Donde:

```text
Valor requerido
=
Suma de las solicitudes asociadas
```

```text
Valor sobrante
=
Valor retirado
-
Valor pagado
```

---

## 12.3 Reintegro de sobrantes

Cuando exista dinero sobrante, éste deberá regresar al fondo correspondiente.

El reintegro inmediato implementado:

- no requiere aprobación;
- genera un movimiento financiero;
- conserva trazabilidad completa.

Los reingresos posteriores permiten devoluciones parciales sucesivas, cada
una con soporte independiente, hasta completar el sobrante. Los retiros con
saldo pendiente pueden filtrarse y exportarse para seguimiento financiero,
con distribución por proyecto, fondo y centro de costo.

---

## 12.4 Alcance pendiente de operaciones de efectivo

HU-0903 y la Épica 10 ya cubren el registro del retiro, los pagos asociados,
los soportes iniciales, la afectación financiera, el reintegro inmediato y la
consulta del movimiento general.

La Épica 11 queda limitada a:

- consulta del detalle operativo del retiro y sus solicitudes;
- seguimiento del sobrante pendiente;
- reingresos posteriores, parciales y con soporte;
- estados propios de la operación;
- consulta y exportación de pendientes;
- ajustes mediante movimientos compensatorios.

La consulta del movimiento financiero no sustituye el detalle operativo. Un
movimiento `EGRESO_RETIRO_EFECTIVO` puede servir como acceso a la operación,
pero los pagos individuales, los soportes y el saldo pendiente pertenecen al
módulo de operaciones de efectivo.

Los errores operativos se corrigen sin editar ni eliminar el retiro, los
pagos o sus movimientos originales:

- un ajuste registra un ingreso o egreso compensatorio por el valor indicado;
- el ajuste corrige el valor retirado: un ingreso reduce el sobrante pendiente
  y un egreso lo aumenta;
- el pendiente anterior y el nuevo quedan auditados y limitan los reingresos
  posteriores para impedir una devolución duplicada;
- motivo, observación, usuario y fecha quedan en
  `correcciones_operacion_efectivo`;
- las anulaciones históricas se conservan para consulta, pero el flujo operativo ya no permite registrar nuevas anulaciones.

---

## 12.5 Estados del sobrante

```text
SIN_SOBRANTE

SOBRANTE_PENDIENTE_REINGRESO

SOBRANTE_REINTEGRADO

SOBRANTE_AJUSTADO

ANULADO
```

---

# 13. Préstamos y anticipos

## 13.1 Anticipos

Un anticipo corresponde a recursos entregados por una entidad, como una
alcaldía o gobernación, al fondo general de un proyecto base.

El anticipo:

- se relaciona con el proyecto y su fondo general;
- no se relaciona con un centro de costo;
- identifica la entidad aportante;
- exige valor, referencia y soporte;
- genera `INGRESO_ANTICIPO`;
- incrementa el saldo del fondo en la misma transacción.

La imputación por centro de costo ocurre posteriormente, cuando se registran
los pagos que utilizan los recursos. Solo `ADMINISTRADOR` y
`AUXILIAR_CONTABLE` pueden registrar anticipos.

La fecha y hora del anticipo corresponden al momento en que el sistema
registra la operación. El usuario no puede seleccionarlas ni modificarlas.

El sistema permitirá registrar préstamos para cubrir temporalmente faltantes de recursos.

Los préstamos constituyen movimientos financieros independientes de las solicitudes de pago.

---

## 13.2 Tipos de préstamo

```text
PROYECTO_A_PROYECTO

PERSONA_A_PROYECTO
```

---

## 13.3 Préstamo entre proyectos

Cuando un proyecto no disponga de saldo suficiente para realizar un pago, otro proyecto podrá transferir temporalmente recursos.

El préstamo genera simultáneamente:

- un egreso en el proyecto origen;
- un ingreso en el proyecto destino.

Ambos movimientos deberán quedar vinculados mediante un mismo identificador de operación.

La fecha y hora del préstamo corresponden al momento en que el sistema
registra la operación. El usuario no puede seleccionar ni modificar esta
fecha. El préstamo, el egreso del fondo origen, el ingreso del fondo destino y
la actualización de ambos saldos se realizan en una única transacción.

---

## 13.4 Préstamo de persona a proyecto

Una persona podrá entregar recursos al proyecto para cubrir una necesidad operativa.

El sistema registrará:

- ingreso del proyecto;
- acreedor seleccionado desde el catálogo de beneficiarios;
- valor;
- soporte;
- saldo pendiente de devolución.

La fecha y hora del préstamo corresponden al momento en que el sistema
registra la operación. El usuario no puede seleccionarlas ni modificarlas.

El catálogo de `beneficiarios_pago` funciona como registro maestro de
terceros del MVP. Anticipos y préstamos conservan la relación con el tercero y
una copia histórica de su nombre e identificación, evitando duplicados sin
perder trazabilidad si el beneficiario se edita posteriormente.

---

## 13.5 Devolución del préstamo

Cuando el proyecto devuelva el dinero prestado se registrará un nuevo movimiento financiero.

La devolución no modifica el movimiento original.

Genera un nuevo registro de egreso que disminuye el saldo pendiente del préstamo hasta dejarlo completamente saldado.

---

## 13.6 Validaciones

Antes de registrar un pago, el sistema verificará la disponibilidad de recursos.

Si el saldo disponible es insuficiente, el usuario deberá registrar previamente un préstamo o un ingreso que permita cubrir el valor requerido.

No será posible marcar una solicitud como pagada cuando el fondo correspondiente no disponga del saldo suficiente.

---

## 13.6 Estados del préstamo

Todo préstamo deberá mantener un estado que permita controlar su vigencia y el saldo pendiente de devolución.

Los estados disponibles son:

```text
ACTIVO

PARCIALMENTE_DEVUELTO

SALDADO

ANULADO
```

### ACTIVO

El préstamo se encuentra vigente y no se ha registrado ninguna devolución.

El saldo pendiente corresponde al valor total originalmente prestado.

---

### PARCIALMENTE_DEVUELTO

Se ha registrado una o varias devoluciones, pero todavía existe un saldo pendiente.

El sistema deberá conservar:

- valor inicial del préstamo;
- valor total devuelto;
- saldo pendiente;
- historial de devoluciones.

---

### SALDADO

El préstamo ha sido devuelto completamente.

Un préstamo saldado:

- no admite nuevas devoluciones;
- permanece disponible para consulta;
- conserva todos los movimientos financieros asociados;
- no puede reactivarse.

---

### ANULADO

Este estado únicamente podrá utilizarse cuando la operación haya sido registrada erróneamente y todavía no existan devoluciones asociadas.

La anulación no elimina los movimientos financieros.

El sistema deberá generar los movimientos compensatorios necesarios para revertir los efectos financieros de la operación y conservar la trazabilidad completa.

---

## 13.7 Devoluciones parciales

La devolución de un préstamo podrá realizarse en uno o varios pagos.

Cada devolución deberá:

- estar vinculada al préstamo original;
- registrar el valor devuelto;
- registrar la fecha de devolución;
- identificar al usuario responsable;
- incluir soporte documental;
- generar el movimiento financiero correspondiente;
- actualizar el saldo pendiente.

El valor de una devolución no podrá superar el saldo pendiente del préstamo.
La fecha y hora corresponden al momento en que el sistema registra la
operación y no pueden ser seleccionadas por el usuario. El proyecto destino,
que recibió los recursos, debe disponer de saldo suficiente para realizar el
egreso.

Cuando el saldo pendiente llegue a cero, el sistema cambiará automáticamente el estado del préstamo a:

```text
SALDADO
```

---

## 13.8 Efectos financieros

Los préstamos deberán generar movimientos financieros según su tipo.

### Préstamo de proyecto a proyecto

Al registrar el préstamo:

```text
Proyecto origen

↓

EGRESO_PRESTAMO_PROYECTO
```

y simultáneamente:

```text
Proyecto destino

↓

INGRESO_PRESTAMO_PROYECTO
```

Al registrar una devolución:

```text
Proyecto destino

↓

EGRESO_DEVOLUCION_PRESTAMO
```

y simultáneamente:

```text
Proyecto origen

↓

INGRESO_DEVOLUCION_PRESTAMO
```

Los movimientos de cada operación deberán compartir un mismo identificador transaccional.

---

### Préstamo de persona a proyecto

Al registrar el préstamo:

```text
Proyecto

↓

INGRESO_PRESTAMO_PERSONA
```

Al registrar una devolución:

```text
Proyecto

↓

EGRESO_DEVOLUCION_PRESTAMO_PERSONA
```

El sistema deberá mantener identificado al acreedor y el saldo pendiente de devolución.

---

## 13.9 Auditoría y trazabilidad

Todo préstamo deberá conservar, como mínimo:

- tipo de préstamo;
- proyecto origen, cuando aplique;
- proyecto destino;
- acreedor, cuando aplique;
- valor inicial;
- valor devuelto;
- saldo pendiente;
- fecha de registro;
- usuario responsable;
- soportes;
- observaciones;
- movimientos financieros relacionados;
- historial de cambios de estado.

Los préstamos y sus devoluciones no podrán eliminarse físicamente.

Toda corrección deberá realizarse mediante operaciones compensatorias que permitan conservar el historial financiero.

---

# 14. Gestión de nómina

El módulo de nómina permite gestionar las solicitudes de pago correspondientes a trabajadores vinculados a uno o varios proyectos.

Todas las solicitudes de nómina utilizan el mismo flujo de aprobación definido para el sistema y, una vez aprobadas, continúan el proceso de pago de la misma forma que cualquier otra solicitud.

El sistema soporta dos modalidades de nómina:

- Nómina individual.
- Nómina grupal.

La nómina individual genera una solicitud para un trabajador. La nómina
grupal genera una única solicitud consolidada con múltiples filas en
`detalles_nomina_solicitud`, permitiendo conservar el detalle individual de
cada trabajador.

Operativamente, el rol `DIRECTOR` crea y administra ambas modalidades dentro
de sus accesos. El `ADMINISTRADOR`, como superadministrador, conserva acceso
transversal.

## Solicitudes de pago de impuestos

El sistema permite registrar solicitudes de pago correspondientes a obligaciones tributarias.

Cada solicitud deberá identificar, como mínimo:

- el tipo de impuesto;
- el período tributario;
- la entidad recaudadora;
- los documentos soporte requeridos para el trámite.

Estas solicitudes siguen el mismo flujo de aprobación definido para las demás solicitudes de pago.

---

## 14.1 Nómina individual

La nómina individual corresponde a una solicitud de pago creada para un único trabajador.

Cada solicitud deberá estar asociada, como mínimo, a:

- proyecto base;
- centro de costo;
- trabajador beneficiario;
- período de pago;
- concepto;
- valor total;
- soportes asociados.

Una solicitud de nómina individual seguirá exactamente el mismo flujo de estados definido para las demás solicitudes de pago.

---

## 14.2 Nómina grupal

La nómina grupal permite registrar múltiples pagos correspondientes a un mismo período mediante una única operación de carga.

Su objetivo es facilitar el procesamiento masivo de la información sin perder la trazabilidad individual de cada trabajador.

La creación de una nómina grupal podrá realizarse mediante el cargue de una plantilla definida por el sistema.

Durante el proceso de carga, el sistema valida cada registro antes de crear
la solicitud consolidada.

La carga exitosa genera:

- una cabecera en `solicitudes_pago`;
- una fila en `detalles_nomina_solicitud` por trabajador y concepto;
- el archivo Excel como documento de origen.

La cabecera conserva el valor consolidado, el período, el estado y el flujo
de aprobaciones. Cada detalle conserva la identificación del trabajador y
sus valores. El consecutivo de la cabecera permanece nulo en `BORRADOR` y se
asigna al enviarla a aprobación de nivel 1.

---

## 14.3 Período de nómina

Toda solicitud de nómina deberá asociarse a un período de pago.

Como mínimo, el sistema registrará:

- año;
- mes;
- período o quincena, cuando aplique.

Esta información permitirá consultar posteriormente las solicitudes correspondientes a un mismo período de liquidación.

---

## 14.4 Beneficiarios

Las solicitudes de nómina únicamente podrán asociarse a beneficiarios cuyo tipo corresponda a:

```text
TRABAJADOR
```

El sistema impedirá crear solicitudes de nómina para beneficiarios registrados como proveedor u otro tipo de beneficiario.

Los datos bancarios utilizados durante el pago corresponderán a la información registrada para el trabajador al momento de ejecutar el desembolso.

---

## 14.5 Validaciones de la carga grupal

Antes de crear las solicitudes de pago, el sistema deberá validar cada uno de los registros contenidos en la plantilla de importación.

Como mínimo, se verificarán las siguientes condiciones:

- existencia del trabajador como beneficiario;
- que el beneficiario corresponda al tipo `TRABAJADOR`;
- existencia del proyecto base;
- existencia del centro de costo;
- consistencia del período de nómina;
- valores numéricos válidos;
- ausencia de registros duplicados dentro de la misma importación.

Las validaciones se realizarán de forma independiente para cada registro.

Los errores encontrados en un trabajador no impedirán la validación de los demás registros.

---

## 14.6 Resultado de la importación

Una vez finalizado el proceso de validación, el sistema presentará un resumen con el resultado de la importación.

Como mínimo deberá informar:

- total de registros procesados;
- registros válidos;
- registros con error;
- solicitudes creadas exitosamente.

Los registros con error deberán indicar la causa específica que impidió su procesamiento.

Únicamente los registros válidos generarán solicitudes de pago.

---

## 14.7 Flujo de aprobación

La cabecera consolidada sigue el flujo general definido para el sistema:

```text
BORRADOR

↓

PENDIENTE_APROBADOR_1

↓

PENDIENTE_APROBADOR_2

↓

PROGRAMADA_PAGO

↓

PAGADA
```

La edición en `BORRADOR` se realiza sobre la cabecera y sus detalles. El
envío, aprobación, devolución y pago aplican a la solicitud consolidada.

---

## 14.8 Pago de la nómina

Una vez aprobada una solicitud de nómina, el proceso de pago será administrado por el rol **PAGOS**, siguiendo las mismas reglas establecidas para cualquier otra solicitud.

Al registrarse el pago, el sistema deberá:

- generar el movimiento financiero correspondiente;
- actualizar el saldo del fondo asociado al proyecto;
- registrar la información del medio de pago;
- conservar los soportes del desembolso;
- cambiar el estado de la solicitud a `PAGADA`.

Cada trabajador conservará su propia evidencia de pago y su trazabilidad individual.

---

## 14.9 Auditoría y trazabilidad

El sistema deberá conservar el historial completo de cada solicitud de nómina.

Como mínimo deberá registrarse:

- usuario que realizó la importación o creación;
- fecha y hora de creación;
- período de nómina;
- trabajador beneficiario;
- proyecto y centro de costo;
- historial de aprobaciones;
- historial de devoluciones;
- información del pago;
- movimientos financieros generados;
- soportes asociados.

Toda modificación realizada durante el ciclo de vida de la solicitud deberá quedar registrada en la auditoría del sistema.

---

# 15. Gestión tributaria

El módulo de gestión tributaria permite administrar las solicitudes de pago correspondientes a obligaciones fiscales derivadas de la ejecución de los proyectos.

Estas solicitudes siguen el mismo flujo general de aprobación y pago definido para el sistema, diferenciándose únicamente por las validaciones propias de su naturaleza tributaria.

## Solicitudes de reembolso

Las solicitudes de reembolso permiten registrar pagos efectuados previamente por un colaborador para cubrir gastos relacionados con la ejecución de proyectos.

Cada solicitud deberá contener los documentos soporte que justifiquen el gasto realizado, los cuales serán administrados mediante el módulo de gestión documental del sistema.

Las solicitudes de reembolso siguen el mismo flujo general de aprobación establecido para las demás solicitudes de pago.

---

## 15.1 Alcance

Las solicitudes tributarias podrán utilizarse para registrar, entre otros:

- pago de impuestos nacionales;
- pago de impuestos territoriales;
- retenciones;
- estampillas;
- contribuciones;
- demás obligaciones tributarias asociadas a la operación del proyecto.

Cada solicitud corresponderá a una única obligación tributaria.

---

## 15.2 Información de la solicitud

Como mínimo, una solicitud tributaria deberá registrar:

- proyecto base;
- centro de costo;
- entidad beneficiaria;
- concepto tributario;
- período fiscal, cuando aplique;
- valor a pagar;
- fecha límite de pago;
- soportes asociados.

Dependiendo del tipo de impuesto, el sistema podrá requerir información adicional.

---

## 15.3 Beneficiarios

Las solicitudes tributarias podrán asociarse a beneficiarios previamente registrados en el sistema.

Generalmente corresponderán a entidades públicas u organismos recaudadores.

El beneficiario deberá contener la información necesaria para realizar el pago mediante el medio seleccionado.

---

## 15.4 Flujo de aprobación

Las solicitudes tributarias seguirán exactamente el mismo flujo de estados definido para todas las solicitudes de pago.

```text
BORRADOR

↓

PENDIENTE_APROBADOR_1

↓

PENDIENTE_APROBADOR_2

↓

PROGRAMADA_PAGO

↓

PAGADA
```

No existen aprobaciones adicionales para este tipo de solicitud.

---

## 15.5 Pago

Una vez aprobada la solicitud, el rol **PAGOS** registrará la ejecución del pago siguiendo las reglas establecidas en el proceso de gestión de pagos.

El sistema deberá:

- registrar la información del desembolso;
- almacenar los soportes correspondientes;
- generar el movimiento financiero;
- actualizar el saldo del fondo;
- cambiar el estado de la solicitud a `PAGADA`.

---

## 15.6 Auditoría y trazabilidad

El sistema conservará el historial completo de cada solicitud tributaria.

Como mínimo deberá registrarse:

- usuario creador;
- fecha de creación;
- entidad beneficiaria;
- concepto tributario;
- período fiscal, cuando aplique;
- historial de aprobaciones;
- información del pago;
- movimientos financieros generados;
- soportes asociados;
- historial de modificaciones.

Toda la información permanecerá disponible para efectos de consulta, auditoría y control financiero.

---

# 16. Gestión de reembolsos

El módulo de reembolsos permite gestionar la devolución de recursos a los colaboradores que, utilizando dinero propio, realizaron pagos necesarios para la ejecución de un proyecto.

Los reembolsos constituyen solicitudes de pago independientes y siguen el mismo flujo de aprobación definido para el sistema.

Su finalidad es reconocer gastos previamente ejecutados y debidamente soportados.

---

## 16.1 Alcance

Los reembolsos podrán utilizarse para recuperar gastos relacionados con la ejecución de actividades del proyecto, tales como:

- compra de materiales;
- compra de insumos;
- pago de servicios;
- transporte;
- alimentación;
- alojamiento;
- peajes;
- parqueaderos;
- otros gastos autorizados.

El sistema permitirá configurar los conceptos de gasto disponibles desde el módulo de administración.

---

## 16.2 Información de la solicitud

Cada solicitud de reembolso corresponde a un único gasto realizado por el beneficiario.

Si un colaborador requiere solicitar el reembolso de varios gastos, deberá crear una solicitud independiente para cada uno de ellos.

Como mínimo, una solicitud de reembolso deberá registrar:

- proyecto base;
- centro de costo;
- beneficiario;
- concepto del gasto;
- descripción;
- fecha del gasto;
- valor solicitado;
- soportes asociados.

Cuando un mismo reembolso incluya varios gastos, cada soporte deberá conservar su información individual.

---

## 16.3 Beneficiario

El beneficiario del reembolso corresponde a la persona que realizó el gasto con recursos propios.

El pago del reembolso se efectuará directamente a dicho beneficiario.

El sistema únicamente permitirá seleccionar beneficiarios previamente registrados.

---

## 16.4 Soportes

Toda solicitud de reembolso deberá contar con los documentos que acrediten el gasto realizado.

Como mínimo podrán adjuntarse:

- facturas;
- documentos equivalentes;
- cuentas de cobro;
- tiquetes;
- recibos;
- comprobantes de pago;
- demás documentos soporte.

El sistema permitirá asociar uno o varios archivos a una misma solicitud.

Desde dispositivos compatibles, el usuario puede tomar una fotografía con la
cámara trasera como alternativa a seleccionar un archivo existente. Esta
opción también está disponible al adjuntar comprobantes de pagos directos,
retiros, consignaciones y reingresos. Las fotografías conservan las mismas
reglas de tamaño y formato aplicables a los demás soportes.

Los soportes deberán conservarse durante todo el ciclo de vida de la solicitud y permanecer disponibles para consulta y auditoría.

---

## 16.5 Validaciones

Antes de permitir el envío de una solicitud de reembolso al flujo de aprobación, el sistema deberá verificar, como mínimo:

- que el beneficiario exista y se encuentre activo;
- que el proyecto base exista;
- que el centro de costo pertenezca al proyecto seleccionado;
- que el valor solicitado sea mayor a cero;
- que la fecha del gasto sea válida;

Los soportes son opcionales durante la creación y el envío de la solicitud de
reembolso. Cuando se adjunten, deben conservarse para consulta y auditoría.

Las solicitudes que no cumplan estas validaciones no podrán ser enviadas al proceso de aprobación.

---

## 16.6 Flujo de aprobación

Las solicitudes de reembolso seguirán exactamente el mismo flujo definido para las demás solicitudes de pago.

```text
BORRADOR

↓

PENDIENTE_APROBADOR_1

↓

PENDIENTE_APROBADOR_2

↓

PROGRAMADA_PAGO

↓

PAGADA
```

Durante el proceso de aprobación, los aprobadores verificarán que el gasto corresponda a actividades propias del proyecto y que los soportes aportados sean suficientes para justificar el reembolso.

Las devoluciones y observaciones seguirán las mismas reglas establecidas para cualquier otra solicitud de pago.

---

## 16.7 Pago del reembolso

Una vez la solicitud alcance el estado:

```text
PROGRAMADA_PAGO
```

el rol **PAGOS** podrá registrar la ejecución del desembolso.

Al registrar el pago, el sistema deberá:

- validar la disponibilidad de recursos del fondo correspondiente;
- registrar el medio de pago;
- registrar la fecha del pago;
- registrar el número de comprobante o referencia, cuando aplique;
- conservar los soportes del pago;
- generar el movimiento financiero correspondiente;
- actualizar el saldo del fondo;
- cambiar el estado de la solicitud a `PAGADA`.

---

## 16.8 Auditoría y trazabilidad

El sistema conservará el historial completo de cada solicitud de reembolso.

Como mínimo deberá registrarse:

- usuario creador;
- beneficiario;
- proyecto base;
- centro de costo;
- concepto del gasto;
- fecha del gasto;
- valor solicitado;
- historial de aprobaciones;
- historial de devoluciones;
- información del pago;
- movimientos financieros generados;
- soportes del gasto;
- soportes del pago;
- historial de modificaciones.

Las solicitudes de reembolso no podrán eliminarse una vez hayan ingresado al flujo de aprobación.

Toda modificación deberá quedar registrada en la auditoría del sistema, preservando la trazabilidad completa del proceso.

---

# 17. Auditoría y trazabilidad

La auditoría garantiza la trazabilidad completa de todas las operaciones realizadas dentro del sistema.

Su propósito es permitir la reconstrucción del historial funcional de cada registro, identificar el usuario responsable de cada acción y preservar la integridad de la información durante todo el ciclo de vida de los procesos.

La auditoría constituye un mecanismo de control y consulta. En ningún caso reemplaza las reglas de autorización o los permisos definidos para cada rol.

## Eventos auditables

Además de los eventos asociados al ciclo de vida de las solicitudes de pago, el sistema registra eventos relacionados con la gestión documental, incluyendo:

- carga de documentos;
- eliminación de documentos;
- asociación de documentos a procesos del negocio;
- registro de comprobantes de pago.

Cada evento conserva la información del usuario responsable, la fecha y hora de ejecución y el proceso afectado, garantizando la trazabilidad completa de las operaciones realizadas dentro del sistema.

---

## 17.1 Alcance

El sistema deberá registrar eventos de auditoría sobre, como mínimo, los siguientes módulos:

- Proyectos.
- Beneficiarios.
- Solicitudes de pago.
- Aprobaciones.
- Pagos.
- Movimientos financieros.
- Préstamos.
- Operaciones de efectivo.
- Usuarios.
- Roles y permisos.

Cada módulo podrá registrar eventos adicionales según sus necesidades funcionales.

---

## 17.2 Información registrada

Todo evento de auditoría deberá almacenar, como mínimo:

- módulo;
- tipo de operación;
- identificador del registro afectado;
- usuario responsable;
- fecha y hora del evento;
- dirección IP, cuando se encuentre disponible;
- observaciones, cuando apliquen.

Cuando una operación implique modificaciones sobre la información, el sistema también deberá conservar:

- valor anterior;
- valor nuevo;
- campo modificado.

---

## 17.3 Operaciones auditables

Como mínimo deberán registrarse los siguientes eventos:

### Proyectos

- creación;
- modificación;
- cambio de fase;
- finalización.

### Beneficiarios

- creación;
- modificación;
- cambio de estado.

### Solicitudes

- creación;
- envío a aprobación;
- devolución;
- aprobación;
- anulación;
- pago.

### Movimientos financieros

- creación;
- ajustes;
- operaciones compensatorias.

### Usuarios

- creación;
- modificación;
- cambio de rol;
- activación;
- inactivación.

---

## 17.4 Conservación de la información

Los registros de auditoría forman parte del historial funcional del sistema.

Por esta razón:

- no podrán modificarse;
- no podrán eliminarse;
- permanecerán asociados permanentemente al registro que originó el evento.

En caso de requerirse una corrección, el sistema deberá generar un nuevo evento de auditoría que deje evidencia del cambio realizado.

---

## 17.5 Consulta de auditoría

La información de auditoría podrá consultarse desde los módulos autorizados del sistema.

En solicitudes de pago, el detalle presenta una línea de tiempo única. Esta
vista reconstruye los eventos respaldados por las entidades operativas y los
combina con la bitácora complementaria de modificaciones y reenvíos, sin
duplicar aprobaciones, devoluciones, anulaciones ni pagos.

Las consultas podrán filtrarse, entre otros criterios, por:

- módulo;
- usuario;
- tipo de operación;
- proyecto;
- rango de fechas;
- registro afectado.

La consulta de auditoría estará restringida a los usuarios con los permisos correspondientes.

---

## 17.6 Principios generales

La auditoría constituye un registro histórico y no un mecanismo para modificar el comportamiento del sistema.

Todas las operaciones auditables deberán registrarse automáticamente por el backend, independientemente de la interfaz utilizada para ejecutar la acción.

Los registros de auditoría deberán preservarse durante toda la vida útil del sistema, garantizando la integridad, disponibilidad y trazabilidad de la información.

---

# 18. Notificaciones del flujo de aprobación

Las transiciones cubiertas por la Épica 19 generan una notificación persistente
para cada responsable. La creación ocurre dentro de la misma transacción que
actualiza la solicitud, pero el envío a Meta se ejecuta posteriormente.

Los aprobadores se resuelven por rol, acceso activo al proyecto y línea de
negocio de la solicitud. Las devoluciones de nivel 2 se dirigen al aprobador de
nivel 1 que atendió la solicitud; las devoluciones al solicitante utilizan el
usuario creador.

Cada registro conserva consecutivo, proyecto, beneficiario, valor, nuevo estado
y enlace. Si no existe un destinatario activo no se bloquea la transición. Si
el destinatario existe pero no tiene teléfono, la notificación permanece
pendiente para que el proceso de envío registre el problema y permita su
corrección posterior.
