# ZeroID — Retención Cero

Demuestra que eres real, mayor de edad o residente **sin entregar tus datos personales**.

## El problema

Para registrarte en un sitio web te piden fotos de tu carnet, selfies, tu RUT y tu nombre, aunque la plataforma solo necesita saber si eres una persona real o si tienes más de 18 años. Esos datos quedan en servidores de terceros para siempre.

## La solución

1. **Validación sin retención:** tu cámara comprueba que eres real en el navegador. Leemos tu carnet una sola vez, en memoria, y descartamos al instante fotos y textos.
2. **Custodia en tu dispositivo:** tu credencial digital vive en tu navegador, ligada a una llave criptográfica que nunca sale de él.
3. **Respuesta en un clic:** el sitio pregunta una regla (`mayor_de_edad`) y recibe solo `true` o `false`.

Evitamos cuentas duplicadas guardando únicamente un hash irreversible del documento y un embedding facial, nunca la identidad.

## Stack

- **Bóveda (frontend):** Next.js, Tailwind CSS, Web Crypto API, MediaPipe.
- **Oráculo (backend):** FastAPI, DeepFace, EasyOCR, PostgreSQL + pgvector, JWT.
