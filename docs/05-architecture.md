# 05. Arquitectura del sistema

## Objetivo

Definir la arquitectura técnica completa del sistema de solicitudes de pago y fondos de obra.

## Arquitectura general

```mermaid
flowchart TD
    subgraph Frontend
        Web[Aplicación Web Responsiva]
    end
    subgraph Auth
        Firebase[Firebase Auth]
    end
    subgraph Backend
        API[Cloud Run API Backend]
        AuthModule[Auth Module]
        RBAC[Roles and Permissions]
        Requests[Payment Requests Module]
        ProjectFunds[Project Funds Module]
        Movements[Fund Movements Module]
        Loans[Project Loans Module]
        Lenders[Lenders Module]
        Projects[Projects Module]
        Providers[Providers Module]
        Files[Attachments Module]
        Audit[Audit Service]
        Export[Export Module]
        OCR[OCR Module futuro]
    end
    subgraph Data
        DB[(Cloud SQL PostgreSQL)]
        Storage[(Cloud Storage)]
    end
    Web --> Firebase
    Web --> API
    API --> AuthModule
    API --> RBAC
    API --> Requests
    API --> ProjectFunds
    API --> Movements
    API --> Loans
    API --> Lenders
    API --> Projects
    API --> Providers
    API --> Files
    API --> Audit
    API --> Export
    API --> OCR
    Requests --> DB
    ProjectFunds --> DB
    Movements --> DB
    Loans --> DB
    Lenders --> DB
    Projects --> DB
    Providers --> DB
    Files --> DB
    Files --> Storage
    Audit --> DB
```

## Principios

- La Aplicación Web nunca se conecta directamente a la base de datos.
- Toda lógica de negocio vive en el backend.
- Firebase Auth autentica; el backend autoriza.
- Los archivos se almacenan en Cloud Storage.
- Los fondos de obra y movimientos financieros se gestionan únicamente desde backend.
- Toda afectación de fondos debe ser transaccional.
- Todo ingreso, egreso, préstamo, devolución, ajuste o pago debe quedar trazado.
- El backend resuelve la cuenta de fondos según el proyecto de la solicitud.

## Módulos principales

- Auth Module.
- Users and Roles Module.
- Projects Module.
- Providers Module.
- Payment Requests Module.
- Project Funds Module.
- Project Fund Movements Module.
- Project Loans Module.
- Lenders Module.
- Attachments Module.
- Audit Module.
- Export Module.
- OCR Module futuro.
