# OMC Leads — Prueba Técnica Frontend

Aplicación full stack para gestión de leads de One Million Copy SAS.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 13 (App Router), PrimeReact, TypeScript |
| Backend | NestJS 11, Prisma 7, PostgreSQL |
| Infra | Docker Compose |

## Requisitos previos

- Node.js 20+ y npm 10+
- Docker Desktop corriendo

## Instalación y arranque

```bash
# 1. Instalar dependencias (desde la raíz del proyecto)
npm install

# 2. Levantar todo con un solo comando
npm run dev
```

El comando `npm run dev`:
- Levanta PostgreSQL en Docker (`localhost:5432`)
- Crea `backend/.env` y `frontend/.env.local` si no existen
- Ejecuta migraciones de Prisma
- Libera el puerto `3001` si estaba ocupado
- Inicia el backend NestJS en `http://localhost:3001`
- Inicia el frontend Next.js en `http://localhost:3000`

## Seed de datos (por separado)

```bash
npm run seed --prefix backend
```

Este comando carga 15 leads de ejemplo en la base de datos local.

## Funcionalidades

### Parte 1 — Leads
- Tabla con paginación, ordenada por fecha (más reciente primero)
- Búsqueda por nombre o email
- Filtro por fuente (Instagram, Facebook, Landing Page, Referido, Otro)
- Filtro por rango de fechas
- Estados: carga, vacío, error
- Crear lead (modal con validaciones)
- Ver detalle (drawer lateral)
- Editar lead
- Eliminar con confirmación

### Parte 2 — Dashboard
- Total de leads
- Leads de los últimos 7 días
- Presupuesto promedio
- Fuente principal
- Gráfica doughnut por fuente
- Tabla de distribución con barras de progreso

### Parte 3 — Resumen inteligente (AI Summary)
- Análisis ejecutivo generado desde datos reales de la API
- Filtros opcionales por fuente y rango de fechas
- Muestra: análisis general, fuente principal y recomendaciones
- Estados de carga (skeleton) y error

## API endpoints

```
GET    /api/leads           Lista con filtros y paginación
GET    /api/leads/stats     Estadísticas
GET    /api/leads/:id       Detalle
POST   /api/leads           Crear
PATCH  /api/leads/:id       Editar
DELETE /api/leads/:id       Eliminar
```

## Comandos útiles

```bash
npm run docker:down   # Apagar Postgres
npm run docker:up     # Iniciar Postgres
```

## Decisiones técnicas

- **PrimeReact**: ya incluido en el template base, componentes robustos (DataTable, Dialog, Sidebar, Toast, ConfirmDialog)
- **React Hook Form**: manejo de formularios con validación nativa, sin dependencias adicionales problemáticas
- **Prisma v7**: requiere Driver Adapter (`@prisma/adapter-pg`) en lugar del `datasource url` tradicional
- **AI Summary**: conectado a LLM real vía API route de Next.js (`/api/ai-summary`), usando datos reales de la API como contexto y fallback local ante errores o cuando no hay provider activo
