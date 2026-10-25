# ZeroID — Retención Cero

Demuestra que eres una persona real y mayor de edad en cualquier sitio web **sin entregar tu pasaporte, tu foto ni tu nombre**.

ZeroID verifica atributos, no personas. Lee tu pasaporte y tu rostro una sola vez, en memoria, y descarta las imágenes al instante. Te entrega una credencial firmada que vive en tu dispositivo. Cuando un sitio pregunta "¿es mayor de edad?", recibe un sí o un no, nunca tus datos.

## Cómo funciona

1. **Registro:** fotografías la página de datos de tu pasaporte y te tomas una selfie con prueba de vida. El servidor lee la MRZ, compara tu rostro con la foto del pasaporte y descarta ambas imágenes.
2. **Sin duplicados y sin identidad:** solo se guarda un hash irreversible del documento (HMAC con un secreto del servidor) y un embedding facial, para impedir que la misma persona se registre dos veces.
3. **Credencial en tu dispositivo:** recibes un JWT firmado y ligado a una llave criptográfica que nunca sale de tu navegador o teléfono. Tus datos personales opcionales viajan cifrados en una bóveda que el servidor no puede leer.
4. **Inicio de sesión con ZeroID:** los sitios integran el SDK y muestran el botón "Continuar con ZeroID". Tú apruebas en el teléfono con tu huella, y el sitio recibe solo lo que pidió.

## Estructura

| Carpeta | Qué es | Stack |
|---|---|---|
| `frontend/` | Web: landing, registro, panel del usuario y el SDK (`/sdk/zeroid.js`) | Next.js 16, React 19 |
| `expreso-caribe/` | Sitio de demostración de una empresa de buses que inicia sesión con ZeroID usando el SDK | Next.js 16 |
| `backend/` | Oráculo: verificación, credenciales y API para sitios | FastAPI, DeepFace, Gemini, PostgreSQL + pgvector |
| `app/` | App móvil: vincula el teléfono, aprueba inicios de sesión y muestra tus conexiones | Expo SDK 58, expo-router |
| `docs/` | Arquitectura y guía de despliegue | |

## Producción

| Parte | Dónde |
|---|---|
| Web | Vercel: [platanus-hack-14.vercel.app](https://platanus-hack-14.vercel.app) |
| Demo de Expreso Caribe | Vercel, proyecto aparte con *Root Directory* `expreso-caribe` |
| Backend | DigitalOcean App Platform: `https://octopus-app-h5zq3.ondigitalocean.app` ([docs de la API](https://octopus-app-h5zq3.ondigitalocean.app/docs)) |
| Base de datos | Neon (Postgres con pgvector) |

Para publicar cambios, sigue [`docs/despliegue.md`](docs/despliegue.md).

## Desarrollo local

### Requisitos

- Node.js 20 o superior
- Python 3.11
- Docker Desktop (para la base de datos local)
- Una API key de Gemini
- Expo Go en tu teléfono (para la app)

### 1. Base de datos

```bash
cd backend
docker compose up -d db
```

Levanta Postgres 16 con pgvector en `localhost:5432` (usuario, contraseña y base `zeroid`). Las tablas se crean solas cuando arranca el backend.

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements-dev.txt
cp .env.example .env
```

Completa `backend/.env`:

| Variable | Valor en local |
|---|---|
| `DATABASE_URL` | `postgresql://zeroid:zeroid@localhost:5432/zeroid` |
| `DATABASE_URL_UNPOOLED` | Vacía |
| `JWT_PRIVATE_KEY` | Una llave RSA en PEM (ver abajo) |
| `HASH_PEPPER` | Un secreto aleatorio (ver abajo); el backend no arranca con el valor de ejemplo |
| `GEMINI_API_KEY` | Tu key de Gemini |
| `CORS_ORIGINS` | `http://localhost:3000` |

Para generar los dos secretos:

```bash
python -c "from cryptography.hazmat.primitives.asymmetric import rsa; from cryptography.hazmat.primitives import serialization as s; k=rsa.generate_private_key(public_exponent=65537,key_size=2048); print(k.private_bytes(s.Encoding.PEM,s.PrivateFormat.PKCS8,s.NoEncryption()).decode())"
python -c "import secrets; print(secrets.token_hex(32))"
```

Arranca el servidor **desde `backend/`**, porque ahí es donde lee el `.env`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`--host 0.0.0.0` permite que el teléfono llegue al backend por la red local. En Windows, autoriza el puerto 8000 en el firewall.

### 3. Web

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

La web queda en `http://localhost:3000`.

### 4. Demo de Expreso Caribe

Registra el cliente de la demo; el script escribe sus llaves en `expreso-caribe/.env.local`:

```bash
cd backend
python -m scripts.demo_client
```

Luego:

```bash
cd expreso-caribe
npm install
npm run dev
```

La demo queda en `http://localhost:3001`. Por defecto carga el SDK desde `http://localhost:3000` y canjea los inicios de sesión contra `http://localhost:8000`; se cambian con `NEXT_PUBLIC_ZEROID_URL` y `ZEROID_API_URL` (ver `expreso-caribe/.env.example`).

### 5. App

```bash
cd app
npm install --legacy-peer-deps
cp .env.example .env
npx expo start -c
```

En `app/.env`, pon `EXPO_PUBLIC_API_URL` con la IP de tu computador en la red (por ejemplo `http://192.168.1.10:8000`), no `localhost`. Escanea el QR con Expo Go.

## Pruebas

```bash
cd backend
pytest -m "not integration" -q     # sin base de datos
pytest -q                          # todas; requieren Postgres en DATABASE_URL
```

Para la web y la app no hay pruebas automáticas; antes de subir cambios comprueba que compilan:

```bash
cd frontend && npx next build
cd expreso-caribe && npx next build
cd app && npx tsc --noEmit
```

## Scripts útiles

Desde `backend/`:

| Comando | Qué hace |
|---|---|
| `python -m scripts.demo_client [--origin URL]` | Registra Expreso Caribe como cliente del SDK |
| `python -m scripts.reset_db --yes` | Borra usuarios, cuentas, conexiones y solicitudes. Conserva las tablas y los clientes del SDK. **Usa la base de `DATABASE_URL`: revisa que no sea la de producción.** |

## Más documentación

- [`docs/arquitectura.md`](docs/arquitectura.md): flujos y decisiones de diseño.
- [`docs/despliegue.md`](docs/despliegue.md): cómo está publicado el proyecto y cómo subir cambios.
