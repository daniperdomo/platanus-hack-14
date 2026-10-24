# Arquitectura — Retención Cero

## Flujo de emisión

```mermaid
sequenceDiagram
    participant U as Usuario
    participant B as Bóveda (Next.js)
    participant O as Oráculo (FastAPI)
    participant DB as PostgreSQL + pgvector

    U->>B: Selfie + liveness (MediaPipe) + foto del carnet
    B->>B: Genera llave ECDSA P-256 (Web Crypto)
    B->>O: POST /ingest (selfie, carnet, llave pública)
    O->>O: EasyOCR → RUT, nacimiento, nacionalidad
    O->>O: DeepFace → selfie == carnet
    O->>DB: ¿Existe HMAC(RUT) o embedding cercano?
    DB-->>O: No
    O->>DB: Guarda HMAC(RUT) + embedding
    O-->>B: JWT con claims + cnf.jwk
    O->>O: Descarta imágenes y texto
    B->>B: Guarda JWT en LocalStorage
```

## Flujo de verificación

```mermaid
sequenceDiagram
    participant S as Sitio externo
    participant B as Bóveda
    participant O as Oráculo

    S->>B: Pide reglas (ej. mayor_de_edad)
    B->>O: POST /verify { token, rules }
    O-->>S: { valid, claims: { mayor_de_edad: true } }
```

## Decisiones

- **Imágenes solo en memoria.** Se decodifican con OpenCV desde los bytes del
  request; nunca se escriben a disco ni a la base de datos.
- **Unicidad sin identidad.** El RUT se guarda como HMAC-SHA256 con un pepper
  del servidor: permite detectar duplicados sin poder revertirlo. El embedding
  facial en pgvector detecta a la misma persona con otro documento.
- **Credencial en el dispositivo.** El JWT se liga a la llave pública del
  dispositivo (`cnf.jwk`), así queda preparada la prueba de posesión.
- **Divulgación mínima.** `/verify` solo responde las reglas que el sitio pidió.

## Despliegue

- `frontend/` → Vercel, con `frontend` como *Root Directory*.
- `backend/` → Render, usando `backend/Dockerfile` con `backend` como contexto.
- Ambos se conectan al repositorio personal espejo, porque Vercel y Render no
  pueden acceder al repo de la organización.
