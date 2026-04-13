# Documentación de la API (Agente de Viajes)

Esta documentación explica a detalle cómo funciona la API actual, sus características principales, los servicios con los que interactúa y una explicación exhaustiva sobre cómo implementa la lógica de embeddings y búsqueda semántica con `pgvector` para que sea fácilmente replicable en otros proyectos.

---

## 1. ¿Cómo funciona la API?

Esta API actúa como el backend unificado para un sistema de informacion y potencialmente como soporte de un asistente de Inteligencia Artificial (patrón RAG - Retrieval-Augmented Generation).

- **Framework:** Está desarrollada en [NestJS](https://nestjs.com/) utilizando **TypeScript**.
- **Base de Datos:** PostgreSQL.
- **ORM:** Emplea **TypeORM** para el mapeo objeto-relacional y de esquemas de datos.
- **Arquitectura:** Sigue la convención estándar de módulos de NestJS donde la lógica de negocio se aísla en _Services_ y la captura de peticiones HTTP en _Controllers_ (Arquitectura multicapa).
- **Versionamiento:** Utiliza versionamiento por URI nativo de NestJS (Ej. `/v1/tours`).

---

## 2. Características Principales

*   **Gestión Integral (CRUDs):** Administra de forma completa recursos clave del negocio como Tours, Sedes, Catálogos, Métodos de Pago, Cotizaciones y Reservas.
*   **Seguridad y Autenticación:** Sistema de acceso protegido mediante **JWT** (JSON Web Tokens). Maneja autorización de usuarios con un sistema robusto de roles (`JwtAuthGuard` y `RolesGuard` globales).
*   **Búsqueda Semántica Vectorial:** Convierte la información de los productos y configuraciones de empresa a "Embeddings" (vectores matemáticos de 3072 dimensiones) e integra las capacidades de búsqueda semántica.
*   **Validación Estricta:** Las consultas (`Body` de los endpoints) se validan en tiempo de ejecución combinando `class-validator`, `class-transformer` y un `ValidationPipe` global.

---

## 3. Servicios Vinculados

La API depende de los siguientes servicios externos o recursos tecnológicos:

1.  **PostgreSQL (con pgvector):** Motor principal de base de datos relacional y vectorial simultáneo mediante la extensión `pgvector`.
2.  **OpenAI API:** Interacciona con los modelos de embeddings de OpenAI (`text-embedding-3-large`) provistos vía clave API para generar los vectores.
3.  **n8n (Estructura de Base de Datos compatible):** Emplea una tabla llamada `n8n_vectors` para facilitar, a futuro o presente, la automatización fluida de "Agentes y AI Workflows" utilizando la plataforma **n8n**.
4.  **Integración de Mensajería:** Cuenta con un módulo para interacción vía WhatsApp.

---

## 4. Subida y Sincronización de Datos a `pgvector`

Una de las características más complejas y avanzadas del sistema es cómo procesa la información de texto plano a colecciones de vectores.

### Proceso Paso a Paso (Ejemplo con la entidad `Tour`):

**1. Creación/Modificación Transaccional:**
Cuando un usuario guarda un tour (en `ToursService`), este se guarda primeramente en una la tabla relacional típica `ToursMaestro`.

**2. Fragmentación Semántica (*Chunking*):**
En un proceso automático subyacente (`generateSemanticChunks`), la API divide la gran cantidad de texto del tour (inclusiones, itinerarios, políticas) en "pedazos" más pequeños de conocimiento lógico:
  *   **Fragmento 1 (Resumen del Tour):** Extrae un plano ejecutivo combinando título, precio, destinos y agencia.
  *   **Fragmento 2 (Detalles):** Combina y condensa toda la lista de cosas que sí incluye y aquellas excluidas.
  *   **Fragmentos (Días de Itinerario):** Separa cada día de la aventura en un bloque narrativo independiente.

**3. Generación del Embedding (Vectorización):**
Por cada uno de estos bloques de texto, el `EmbeddingsService` se comunica asíncronamente con la API de OpenAI y transforma el texto a un array de coma flotante de **3072 posiciones**.
```typescript
const response = await this.openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: textChunk
});
```

**4. Persistencia en `n8n_vectors`:**
En el caso de actualizaciones, el API primero limpia la tabla `n8n_vectors` de todos los vectores antiguos relacionados a ese Tour. Luego procede a llenar masivamente la tabla con los nuevos datos, estructurados mediante la entidad `N8nVector`:
- **`text`**: El chunk resultante de la fragmentación (string puro).
- **`metadata`**: Un JSON con las claves foráneas hacia el Maestro del Tour (`id_tour`), tipo de tour y fecha.
- **`embedding`**: Guarda el vector gigante matemático en la extensión instalada `vector(3072)`.

---

## 5. Estructura y Endpoints Principales

La aplicación se estructura en Módulos. Si bien pueden cambiar las terminaciones u orientaciones, estos son los troncales:

*   **Autenticación y Seguridad:** `/v1/auth`, `/v1/usuarios`.
*   **Catálogo Principal de Viajes:** `/v1/tours` (maneja a su vez el RAG vectorial internamente).
*   **Venta y Comercialización:** `/v1/cotizaciones` y `/v1/reservas`.
*   **Entidades y Configuraciones Fijas:** `/v1/sedes`, `/v1/catalogos`, `/v1/servicios`, `/v1/faqs`.
*   **Finanzas y Lineamientos:** `/v1/metodos-pago`, `/v1/politicas-reserva`, `/v1/pagos-realizados`.
*   **Operaciones Especiales:** `/v1/whatsapp`.

---

## 6. ¿Cómo replicar la Lógica Vectorial en otra API?

Para copiar esta técnica de RAG (Vector Store) a otra API, necesitas replicar tablas específicas en la base de datos y la fórmula TypeORM equivalente:

### Paso 1: Configurar la DB de destino
Instala la extensión en la base de datos relacional (Por ejemplo PostgreSQL 15+).
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Paso 2: La Tabla Vectorial Destino
Replica en TypeORM el mapeo para la tabla `n8n_vectors`. Esta usa un *transformador particular* para adaptar Number[] de Node.js a `Vector(3072)` de Postgres:
Se necesitan las dependencias NPM `pg` y `pgvector` en la API receptora.

1.  **`id`** (UUID o Identificador).
2.  **`text`** (Donde mantendrás el fragmento legible que retornará la consulta de similitud).
3.  **`metadata`** (JSON / JSONB donde crearás claves ficticias atadas a tablas "maestras", por ejemplo `{ "id_referencia": 12 }`. Es **acoplamiento blando / soft coupling** en lugar de Foreign Keys estrictas).
4.  **`embedding`** (Definido en TypeORM como: `@Column({ type: 'vector', length: 3072 })`).

### Paso 3: Las Tablas Origen (Replicables)
Cualquier tabla relacional de esa otra API puede ser un candidato para tener su propia información sincronizada a la tabla de vectores, la clave está en invocar un script de *chunking* equivalente y salvar dentro de la columna temporal **`metadata`** el rastreo bidireccional.

### Paso 4: El Método de Búsqueda
En la nueva API, crearás un Query SQL en TypeORM que efectúe el cálculo de la Distancia del Coseno. La estructura clave en NestJS sería la siguiente:

```typescript
import { toSql } from 'pgvector/utils';

// Conviertes el prompt del usuario en un vector...
const embeddingSql = toSql(vectorDelPromptDelUsuario_de_3072_posiciones);

const resultadosCrudos = await this.n8nVectorsRepository.createQueryBuilder('v')
  .select(['v.id', 'v.text', 'v.metadata'])
  // El operador <=> calcula la distancia, donde 0 es igualdad. 
  // '1 - x' devuelve la similitud pura entre 0 y 1
  .addSelect('1 - (v.embedding <=> :embedding::vector)', 'similarity')
  .where('v.embedding IS NOT NULL')
  .orderBy('v.embedding <=> :embedding::vector', 'ASC') // Se alinea el más cercano
  .setParameter('embedding', embeddingSql)  
  .limit(10) // Ajustar al número de resultados esperados de la IA en memoria corta
  .getRawAndEntities();

// 'resultadosCrudos' ya contiene los fragmentos de texto ideales para alimentar el prompt RAG
```
