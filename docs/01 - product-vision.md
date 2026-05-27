# 01. Visión del producto

## Nombre tentativo

Sistema de Gestión de Solicitudes de Pago para Obras Civiles.

## Contexto del negocio

Actualmente, las solicitudes de pago se gestionan de forma manual. Los usuarios envían soportes mediante imágenes, fotografías o documentos que contienen información relevante como ítem, proveedor, obra, descripción, valor bruto y valor con retención. Posteriormente, una persona revisa esta información y la transcribe manualmente a Excel para realizar seguimiento y crear un registro para pagos.

Este proceso genera riesgos operativos asociados a errores de digitación, pérdida de trazabilidad, duplicidad de información, tiempos altos de revisión, dificultad para consultar estados y baja visibilidad del ciclo completo de aprobación y pago.

## Problema a resolver

La empresa requiere reemplazar el proceso manual basado en archivos, mensajes y Excel por un sistema propio que permita centralizar, controlar y auditar las solicitudes de pago desde su creación hasta su pago final.

El sistema debe permitir que los usuarios en campo creen solicitudes y adjunten soportes, mientras que los usuarios administrativos puedan revisar, aprobar, rechazar, programar pagos y exportar información para seguimiento.

## Objetivo general

Diseñar e implementar una plataforma multiplataforma, escalable y segura para gestionar solicitudes de pago asociadas a obras civiles, permitiendo trazabilidad completa del proceso, control de estados, gestión documental y reducción de trabajo manual.

## Objetivos específicos

- Centralizar la creación y consulta de solicitudes de pago.
- Permitir que usuarios en campo creen solicitudes desde dispositivos móviles.
- Permitir que usuarios administrativos gestionen solicitudes desde una aplicación web.
- Adjuntar soportes fotográficos o documentales a cada solicitud.
- Controlar el flujo de aprobación mediante estados definidos.
- Registrar historial de cambios y comentarios.
- Aplicar roles y permisos por tipo de usuario.
- Exportar información a Excel.
- Preparar el sistema para incorporar OCR asistido en fases posteriores.
- Evitar conexión directa entre frontend y base de datos.
- Mantener la lógica de negocio en el backend.

## Usuarios objetivo

### Usuarios administrativos

Usuarios ubicados principalmente en oficina. Sus responsabilidades incluyen revisar solicitudes, validar soportes, aprobar o rechazar solicitudes, programar pagos, consultar estados, hacer seguimiento y exportar información.

### Usuarios en campo

Usuarios ubicados en obra o terreno. Sus responsabilidades incluyen crear solicitudes, tomar fotografías, adjuntar documentos, enviar solicitudes y consultar el estado de sus solicitudes.

## Plataformas

El producto operará en dos contextos:

- Flutter Web para usuarios administrativos.
- Flutter Mobile para usuarios de campo.

## Alcance del MVP

El MVP incluirá:

- Login.
- Crear solicitud de pago.
- Adjuntar soportes.
- Consultar solicitudes.
- Ver detalle de solicitud.
- Cambiar estados.
- Roles y permisos básicos.
- Exportación a Excel.
- Historial de cambios.
- Comentarios básicos.

## Fuera del MVP

Quedan fuera del MVP:

- OCR automático avanzado.
- Integraciones con ERP.
- Firma digital.
- Modo offline avanzado.
- Automatizaciones complejas.
- Flujos contables avanzados.
- Aprobaciones multinivel configurables.
- Conciliación bancaria.
- Integración directa con sistemas de facturación electrónica.

## Principios de producto

- La trazabilidad es obligatoria.
- Ningún cambio relevante debe quedar sin registro.
- El backend es la única fuente de reglas de negocio.
- La experiencia móvil debe ser simple y rápida.
- La experiencia web debe priorizar revisión, filtros y seguimiento.
- El sistema debe ser extensible para futuras integraciones.
- La información debe poder exportarse para operación administrativa.
- El sistema debe reducir, no aumentar, la carga operativa.

## Métricas de éxito iniciales

- Reducción del tiempo de registro manual de solicitudes.
- Disminución de errores de transcripción.
- Porcentaje de solicitudes con soporte adjunto.
- Tiempo promedio entre creación y aprobación.
- Tiempo promedio entre aprobación y pago.
- Número de solicitudes gestionadas sin uso de Excel.
- Número de solicitudes rechazadas por falta de información.
- Uso activo por usuarios de campo y administrativos.
