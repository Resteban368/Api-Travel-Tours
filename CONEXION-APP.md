# Pasos para conectar la app (Flutter) con la API y llenar datos

## 1. Dejar la API lista (backend)

### 1.1 Base de datos (paso BD) — explicación simple

La API guarda los tours en **PostgreSQL**. Ese mismo PostgreSQL es el que ya usas en **n8n** (con las tablas `tours_maestro`, `n8n_vectors`, `sedes`, etc.).

Solo tienes que decidir **una** de estas dos situaciones:

---

**Opción A — Ya tienes la base de datos (la usas en n8n)**

- Esa base **ya tiene** las tablas (`tours_maestro`, `n8n_vectors`, etc.).
- Solo hay que decirle a la API: “no crees ni cambies tablas, úsalas como están”.
- En el código: en **`src/app.module.ts`** cambia `synchronize: true` por **`synchronize: false`** (línea donde está `TypeOrmModule.forRoot({ ... })`).
- En el **`.env`** tu **`DATABASE_URL`** debe apuntar a **esa misma base** (mismo usuario, misma base de datos que usa n8n).
- No hace falta ejecutar ningún script SQL; solo arrancar la API.

---

**Opción B — No tienes base de datos (empezar de cero)**

1. Instala **PostgreSQL** en tu PC (o usa uno en la nube).
2. Instala la extensión **pgvector** en esa base (para los vectores de los tours).
3. Crea una base de datos (por ejemplo `agente_viajes`).
4. Ejecuta el script que crea todas las tablas:
   - Abre terminal en la carpeta **Api** del proyecto.
   - Ejecuta (cambia `usuario` y `agente_viajes` por tu usuario y nombre de base):
   ```bash
   psql -U usuario -d agente_viajes -f database/schema.sql
   ```
5. En el **`.env`** pon **`DATABASE_URL`** con ese usuario, contraseña y nombre de base.
6. En **`src/app.module.ts`** puedes dejar **`synchronize: true`** si quieres que la API cree/actualice tablas automáticamente al arrancar (o `false` si prefieres controlar todo con el script).

---

**Resumen**

- **Si la BD ya existe (n8n):** solo `synchronize: false` en `app.module.ts` y `DATABASE_URL` correcta en `.env`.
- **Si la BD es nueva:** instalar Postgres + pgvector, crear la base, ejecutar `database/schema.sql`, y poner `DATABASE_URL` en `.env`.

### 1.2 Variables de entorno

En la carpeta de la API:

```bash
cp .env.example .env
```

Editar `.env`:

- **DATABASE_URL**: conexión a tu Postgres (ej. `postgresql://usuario:password@localhost:5432/agente_viajes`).
- **OPENAI_API_KEY**: tu API key de OpenAI (para generar embeddings).

### 1.3 Arrancar la API

```bash
cd Api
npm run start:dev
```

Debería quedar escuchando en **http://localhost:3000** (o el `PORT` que pongas en `.env`).

---

## 2. Conectar desde la app (Flutter)

### 2.1 URL base de la API

- **Emulador Android**: `http://10.0.2.2:3000` (localhost del ordenador).
- **Emulador iOS**: `http://127.0.0.1:3000` o `http://localhost:3000`.
- **Dispositivo físico**: usar la IP de tu PC en la red (ej. `http://192.168.1.10:3000`) y mismo puerto.

Define una constante o config (env) en Flutter, por ejemplo:

```dart
const String apiBaseUrl = 'http://10.0.2.2:3000';  // o tu IP
```

### 2.2 Modelo de datos (crear tour)

El body de **POST /tours** debe ser JSON con estos campos (nombres igual que en el schema):

| Campo        | Tipo    | Requerido | Descripción              |
|-------------|--------|-----------|--------------------------|
| `id_tour`   | number | Sí        | Identificador del tour   |
| `nombre_tour` | string | Sí      | Nombre del tour          |
| `link_pdf`  | string | No        | URL del PDF              |
| `estado`    | boolean| No        | Por defecto `true`       |
| `sede_id`   | number | No        | ID de la sede            |

Ejemplo en Dart (envío con `http` o `dio`):

```dart
// Ejemplo con http
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> crearTour() async {
  const baseUrl = 'http://10.0.2.2:3000';
  final body = {
    'id_tour': 1,
    'nombre_tour': 'Tour Roma 3 días',
    'link_pdf': 'https://ejemplo.com/roma.pdf',
    'estado': true,
    'sede_id': 1,
  };

  final res = await http.post(
    Uri.parse('$baseUrl/tours'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(body),
  );

  if (res.statusCode == 201 || res.statusCode == 200) {
    // Tour creado; la API devuelve el objeto guardado (id, id_tour, nombre_tour, ...)
    final tour = jsonDecode(res.body);
    print(tour);
  } else {
    print('Error: ${res.statusCode} ${res.body}');
  }
}
```

### 2.3 Endpoints que puedes usar desde la app

| Acción           | Método | Ruta           | Body / Uso                                      |
|------------------|--------|----------------|--------------------------------------------------|
| Listar tours     | GET    | `/tours`       | Sin body. Devuelve array de tours.               |
| Crear tour       | POST   | `/tours`       | JSON con `id_tour`, `nombre_tour`, etc.         |
| Ver un tour      | GET    | `/tours/:id`   | `:id` = PK de `tours_maestro` (número).         |
| Actualizar tour  | PATCH  | `/tours/:id`   | JSON con los campos a cambiar.                  |

La API tiene **CORS** activado, así que las peticiones desde el navegador o desde la app al backend no serán bloqueadas por CORS.

---

## 3. Probar que todo funciona

### 3.1 Probar la API desde la terminal

```bash
# Listar tours
curl http://localhost:3000/tours

# Crear un tour
curl -X POST http://localhost:3000/tours \
  -H "Content-Type: application/json" \
  -d '{"id_tour":1,"nombre_tour":"Tour prueba","link_pdf":null,"estado":true}'
```

### 3.2 Probar desde Flutter

- Llamar a **GET /tours** al abrir la pantalla de listado (para “llenar” la lista).
- En el formulario de alta, enviar **POST /tours** con el JSON del tour; si responde 200/201, los datos quedan guardados en `tours_maestro` y en `n8n_vectors` con el embedding.

---

## 4. Resumen de pasos

1. **BD**: Postgres + pgvector; ejecutar `database/schema.sql` si es BD nueva; si ya existe el schema (n8n), usar `synchronize: false`.
2. **API**: Crear `.env` con `DATABASE_URL` y `OPENAI_API_KEY`; ejecutar `npm run start:dev`.
3. **Flutter**: Configurar URL base (ej. `10.0.2.2:3000` o IP de tu PC), usar **GET /tours** para listar y **POST /tours** con el JSON anterior para crear tours y llenar datos.

Si quieres, en el siguiente paso podemos definir juntos los modelos Dart y el servicio HTTP en tu proyecto Flutter (carpetas y nombres de archivos).
