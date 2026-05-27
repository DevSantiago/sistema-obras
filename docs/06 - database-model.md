# 06. Modelo de base de datos

## Objetivo

Definir el modelo inicial de base de datos relacional para soportar la gestión de solicitudes de pago, usuarios, roles, obras, proveedores, adjuntos, historial de estados, comentarios y auditoría.

## Motor de base de datos

PostgreSQL sobre Cloud SQL.

## Entidades iniciales

- users
- roles
- user_roles
- projects
- providers
- payment_requests
- attachments
- status_history
- comments
- audit_logs
- ocr_results, en fase posterior

## Tabla users

Almacena los usuarios internos del sistema. La autenticación se realiza con Firebase Auth, pero los datos operativos y roles se gestionan internamente.

Campos principales:

- id
- firebase_uid
- full_name
- email
- phone
- is_active
- created_at
- updated_at

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Tabla roles

Define los roles disponibles en el sistema.

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
```

Roles iniciales:

- ADMIN
- SOLICITANTE
- REVISOR
- APROBADOR
- PAGOS


## Tabla user_roles

Permite asignar uno o varios roles a cada usuario.

```sql
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);
```

## Tabla projects

Representa las obras o proyectos.

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    location VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Tabla providers

Representa proveedores asociados a solicitudes de pago.

```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    document_number VARCHAR(50),
    email VARCHAR(150),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Tabla payment_requests

Entidad central del sistema.

```sql
CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL,

    item VARCHAR(100),
    provider_id UUID REFERENCES providers(id),
    project_id UUID REFERENCES projects(id),

    description TEXT NOT NULL,
    gross_amount NUMERIC(14,2) NOT NULL,
    net_amount NUMERIC(14,2) NOT NULL,

    current_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

    created_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    paid_by UUID REFERENCES users(id),

    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    scheduled_payment_at TIMESTAMP,
    paid_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_amounts CHECK (net_amount <= gross_amount),
    CONSTRAINT chk_positive_amounts CHECK (gross_amount >= 0 AND net_amount >= 0)
);
```

## Tabla attachments

Almacena metadatos de archivos. Los archivos físicos se guardan en Cloud Storage.

```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE,

    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    bucket_name VARCHAR(150) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,

    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),

    ocr_status VARCHAR(50) DEFAULT 'NOT_PROCESSED',
    ocr_text TEXT,
    ocr_json JSONB
);
```

## Tabla status_history

Registra todos los cambios de estado de una solicitud de pago.

```sql
CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE,

    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,

    changed_by UUID REFERENCES users(id),
    comment TEXT,

    changed_at TIMESTAMP DEFAULT NOW()
);
```

## Tabla comments

Permite comentarios asociados a una solicitud.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE,

    user_id UUID REFERENCES users(id),
    comment TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);
```

## Tabla audit_logs

Registra eventos relevantes del sistema.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    action VARCHAR(100) NOT NULL,

    old_data JSONB,
    new_data JSONB,

    ip_address VARCHAR(100),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);
```

## Índices recomendados

```sql

CREATE INDEX idx_payment_requests_status ON payment_requests(current_status);
CREATE INDEX idx_payment_requests_project ON payment_requests(project_id);
CREATE INDEX idx_payment_requests_provider ON payment_requests(provider_id);
CREATE INDEX idx_payment_requests_created_by ON payment_requests(created_by);
CREATE INDEX idx_payment_requests_created_at ON payment_requests(created_at);

CREATE INDEX idx_attachments_payment_request ON attachments(payment_request_id);
CREATE INDEX idx_status_history_payment_request ON status_history(payment_request_id);
CREATE INDEX idx_comments_payment_request ON comments(payment_request_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```
