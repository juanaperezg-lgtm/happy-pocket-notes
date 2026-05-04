# Happy Pocket Notes

Aplicación web sencilla y bonita para llevar el control diario de finanzas personales.

## Qué incluye

- Registro de **gastos e ingresos**
- Edición de movimientos existentes
- Presupuesto mensual general y presupuestos por categoría
- Vistas por **día, semana y mes**
- Comparación mensual y alertas por sobrepresupuesto por categoría
- Diario de notas del día
- Respaldo con exportación/importación en **JSON** y exportación/importación de movimientos en **CSV**
- Configuración de idioma (**ES/EN**) y moneda (**COP, USD, MXN, EUR**)

## Scripts (frontend)

- `npm run dev` — frontend en desarrollo (Vite)
- `npm run build` — build frontend
- `npm run test` — pruebas frontend (Vitest)
- `npm run lint` — lint del proyecto

## Backend robusto (API + PostgreSQL + Auth + Backups)

### 1. Variables de entorno

1. Copia `.env.example` a `.env`
2. Ajusta al menos:
   - `DATABASE_URL`
   - `JWT_SECRET`

### 2. Prisma / base de datos

- `npm run prisma:generate`
- `npm run prisma:migrate`

### 3. Ejecutar API

- `npm run server:dev` (desarrollo)
- `npm run server:start` (arranque simple)
- `npm run server:typecheck` (tipado backend)

Rutas principales:
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/bootstrap`
- CRUD de `/api/transactions`
- CRUD de `/api/journal`
- `GET/PUT /api/settings`

### 4. Backups automáticos

- `npm run backup:db` genera un `.dump` con `pg_dump` en `server/backups`
- Limpia respaldos viejos según `BACKUP_RETENTION_DAYS`
- Para automatizar realmente, programa ese comando en cron/Task Scheduler

## Estado actual

La UI ya está conectada al backend:
- Login/registro desde la propia app
- Sincronización de transacciones, notas y settings por API
- Migración automática inicial desde `localStorage` a la base remota cuando el usuario entra por primera vez

Para correr todo:
1. `npm run server:dev`
2. `npm run dev`
