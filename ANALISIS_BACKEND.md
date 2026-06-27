# Análisis Backend — AgenteViajes API (NestJS 11)

> Análisis profesional de seguridad, escalabilidad, rendimiento y buenas prácticas.
> Fecha: 2026-06-26 · Basado en el código real del repositorio (referencias `archivo:línea`).

---

## Contexto técnico detectado

- **~16.800 LOC**, 35+ módulos de dominio, PostgreSQL + pgvector + OpenAI embeddings.
- Despliegue en **Vercel/serverless** (`src/lambda.ts`, `vercel-build`) — esto cambia varias recomendaciones de escalabilidad.
- 4 guards globales encadenados: `Throttler → JwtAuth → Roles → Permisos` (`app.module.ts:122-128`).
- `synchronize: false` + migraciones SQL manuales (`migrations/*.sql`).

---

# 1. Diagnóstico actual

| Área | Nota | Resumen |
|------|------|---------|
| **Seguridad** | **7.5/10** | Base sólida (Helmet, JWT con rotación, queries parametrizadas, validación global). Fallos en revocación de tokens, brute-force en login y trust proxy. |
| **Escalabilidad** | **5/10** | Estado en memoria (cache + SSE) y pool de conexiones incompatible con serverless. Bloquea el escalado horizontal real. |
| **Rendimiento** | **5.5/10** | **Falta índice vectorial (crítico)** y *eager loading* masivo en `Reserva`. Paginación parcial. |
| **Buenas prácticas** | **6.5/10** | Modularidad excelente, pero *god services* y **sin filtro global de excepciones**. |
| **Testing/Mantenibilidad** | **3/10** | ~9 spec files (casi todos scaffold) sobre 70 módulos. Lógica crítica sin tests. |

### Fortalezas (confirmadas en el código)

- ✅ **Sin inyección SQL**: todo usa QueryBuilder con parámetros (`:search`, `:...ids`). El único `ILIKE` con interpolación usa parámetro correctamente (`reservas.service.ts:280`).
- ✅ **Auth robusta**: refresh tokens bcrypt-hasheados con **detección de reuso** (`auth.service.ts:80-86`).
- ✅ **Hardening HTTP**: Helmet, compression, límites de body diferenciados (`main.ts:32-45`), validación de env vars al arranque (`main.ts:12-17`).
- ✅ **Logs con redacción** del header `authorization` (`app.module.ts:55`).
- ✅ **Transacciones** en las escrituras críticas (reservas, pagos: `reservas.service.ts:505,668`).
- ✅ `synchronize: false` (correcto para producción).

### Debilidades críticas

1. 🔴 **No hay índice vectorial** (IVFFlat/HNSW) en `n8n_vectors.embedding` — solo GIN en metadata (`database.module.ts:12`). La búsqueda semántica es O(n) full-scan.
2. 🔴 **Eager loading masivo en `Reserva`** (`reserva.entity.ts:126-168`): `responsable`, `tour`, `servicios`(M2M), `integrantes`, `vuelos`, `hoteles`+`hotel`. Cada listado explota en joins cartesianos.
3. 🔴 **Estado en memoria** (CacheModule `max:200` + SSE gateway) → incompatible con múltiples instancias / serverless.
4. 🔴 **Pool `max:10` por instancia en serverless** (`app.module.ts:76`) → agotamiento de conexiones en Vercel.
5. 🟠 **Sin filtro global de excepciones** → respuestas de error inconsistentes y posible fuga de stack traces.
6. 🟠 **Login sin throttle reforzado** → vector de fuerza bruta.
7. 🟠 **Token de acceso de 2h** sin lista de revocación (la doc dice 15min — hay deriva).

---

# 2. Plan de mejoras en fases

## 🔴 Fase 1 — Crítica (0–2 semanas)

### 1.1 Índice vectorial pgvector (impacto enorme en búsqueda IA)

Sin esto, cada `POST /v1/tours/search` recorre toda la tabla. Migración:

```sql
-- HNSW: mejor recall/latencia para 3072 dims (pgvector >= 0.5)
CREATE INDEX IF NOT EXISTS idx_n8n_vectors_embedding_hnsw
  ON n8n_vectors USING hnsw (embedding vector_cosine_ops);
-- Asegura que la consulta use el operador <=> (ya lo hace: tours.service.ts:1586)
```

> **Nota:** 3072 dims supera el límite de indexado de HNSW en algunas versiones de pgvector (2000). Si da error, reduce dimensiones con `text-embedding-3-large` `dimensions: 1536` (parámetro en la llamada OpenAI) o usa media-precisión. **Verifica la versión de pgvector primero.**

### 1.2 Brute-force en login

```ts
// auth.controller.ts
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos/min por IP
@Public()
@Post('login')
login(...) {}
```

### 1.3 Trust proxy (el rate limiting hoy no funciona bien tras Vercel)

Detrás de un proxy todas las IPs llegan como la del proxy → el throttler global (`app.module.ts:59`) limita a *todos* juntos o a nadie.

```ts
// main.ts
app.set('trust proxy', 1);
```

Y configura `ThrottlerGuard` para leer `X-Forwarded-For`.

### 1.4 Filtro global de excepciones

```ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception, host) { /* shape uniforme + log; nunca exponer stack en prod */ }
}
// app.module.ts: { provide: APP_FILTER, useClass: AllExceptionsFilter }
```

### 1.5 Pool de conexiones para serverless

Si sigues en Vercel: usa el **endpoint pooled de Neon/PgBouncer** en `DATABASE_URL` y baja `max` a 2–5 por instancia. Sin esto, un pico de tráfico tumba la DB.

---

## 🟠 Fase 2 — Alta prioridad (2–6 semanas)

### 2.1 Eliminar eager loading masivo en `Reserva`

Cambia `eager: true` → `eager: false` y carga relaciones **explícitamente según el endpoint**:

- Listado (`findAll`): solo `responsable` + `tour` (campos mínimos con `.select()`).
- Detalle (`findOne`): el grafo completo.

Hoy el listado paginado (`reservas.service.ts:286`) trae integrantes+vuelos+hoteles+servicios de cada reserva → multiplica filas y memoria. Esta es probablemente tu consulta más lenta.

### 2.2 Cache distribuida (Redis)

Reemplaza `CacheModule.register({max:200})` por Redis (`@keyv/redis`, ya tienes `keyv`). Cachea catálogos, info-empresa, FAQs, `integracion/*` (endpoints públicos de solo lectura). Habilita escalado horizontal.

### 2.3 SSE/notificaciones cross-instancia

`notificaciones.gateway.ts` mantiene conexiones en memoria. Para >1 instancia necesitas **Redis Pub/Sub** o sticky sessions. En serverless, SSE de larga duración (`main.ts:27`) es problemático — considera mover notificaciones a un servicio dedicado o polling.

### 2.4 Índices de base de datos faltantes

Confirma índices en columnas de filtro frecuente: `reservas.fecha_creacion`, `reservas.estado`, FKs sin índice. Tienes algunos (`@Index` en reserva, pagos, tours) pero audita con `EXPLAIN ANALYZE` los listados.

### 2.5 Health check

No existe endpoint de salud. Añade `@nestjs/terminus`:

```ts
@Public() @Get('/health') // chequea DB + memoria
```

Necesario para readiness probes / balanceadores.

---

## 🟡 Fase 3 — Optimización (1–2 meses)

- **Revocación de tokens**: lista de denegación en Redis (`jti` por token) o reducir access token a 15–30 min como dice tu doc.
- **Cache en `JwtStrategy`**: hoy haces un `findOne` a la DB en **cada request** (`jwt.strategy.ts:30`). Cachea el usuario 30–60s en Redis.
- **Refactor de god services**: `tours.service.ts` (1597 LOC) y `reservas.service.ts` (1165 LOC) → separar por responsabilidad (ej. `tours-search.service`, `tours-pricing.service`, `reservas-asientos.service`).
- **Interceptor de respuesta** uniforme (`{ data, meta }`) + interceptor de timeout.
- **Migración a TypeORM migrations** ejecutables (hoy son `.sql` manuales → riesgo de drift entre entornos).

## 🟢 Fase 4 — Mantenimiento (2+ meses)

- **Testing**: cubrir `auth`, `reservas`, `pagos`, guards. Objetivo realista: 60% en módulos críticos.
- Swagger/OpenAPI (`@nestjs/swagger`) — no se detectó documentación de API.
- API key con comparación en tiempo constante (`api-key.guard.ts:19` usa `!==`, vulnerable a timing — menor).
- Alinear doc (`CLAUDE.md` dice access 15min/refresh 7d; el código usa 2h/24h).
- bcrypt rounds 10 → 12.

---

# 3. Recomendaciones de librerías

| Necesidad | Librería |
|-----------|----------|
| Health checks | `@nestjs/terminus` |
| Cache distribuida | `@keyv/redis` (ya tienes keyv) o `cache-manager-redis-yet` |
| Docs API | `@nestjs/swagger` |
| Migraciones | TypeORM CLI migrations |
| Monitoreo | Sentry + el `pino` que ya usas (añadir `requestId`) |
| Serverless DB | Neon pooled / PgBouncer |

---

# 4. Métricas de éxito

- **Búsqueda IA**: p95 de `/tours/search` < 100ms (hoy crece linealmente con nº de vectores).
- **Listado reservas**: p95 < 200ms tras quitar eager loading.
- **Conexiones DB**: < 80% del límite del plan bajo carga.
- **Cobertura tests**: módulos críticos ≥ 60%.
- **Errores 5xx**: < 0.1% con filtro global + Sentry.
- **Herramientas**: `EXPLAIN ANALYZE`, autoexplain, k6/autocannon para load testing, Sentry para errores.

---

# 5. Riesgos y consideraciones

- **Quitar `eager: true`** es el cambio más impactante pero **rompe** cualquier código que asuma relaciones cargadas. Requiere revisar cada uso de `Reserva` y tests antes de mergear. Esfuerzo: alto, riesgo: medio-alto.
- **Índice HNSW**: verificar versión pgvector y límite de dimensiones (3072) **antes** — puede requerir re-embeddings a 1536 dims (re-indexar todos los tours). Esfuerzo: medio.
- **Reducir token a 15min**: impacto en UX del frontend (más refresh) — coordinar con la app Flutter. Backwards-compatible si el cliente ya maneja refresh.
- **Redis**: nueva dependencia de infraestructura y coste. Imprescindible si vas a escalar horizontalmente; opcional si te quedas mono-instancia.
- **Serverless vs. instancia persistente**: SSE + cache en memoria + pool grande sugieren que **una instancia persistente** (contenedor) encaja mejor que Vercel functions para esta API. Decisión arquitectónica clave.

---

# 6. Acción recomendada esta semana

1. Índice vectorial (1.1) — *quick win* enorme.
2. Throttle en login + trust proxy (1.2, 1.3).
3. Filtro global de excepciones (1.4).
4. Medir el listado de reservas con `EXPLAIN ANALYZE` para cuantificar el coste del eager loading antes de tocarlo.
