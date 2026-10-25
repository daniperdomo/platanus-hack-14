# ZeroID — Tu identidad verificada, bajo tu control

Verifícate una sola vez y entra a cualquier sitio con un clic. Apruebas cada acceso desde tu teléfono y decides qué datos compartes, para qué se usan y por cuánto tiempo.

**Pruébalo:** [platanus-hack-14.vercel.app](https://platanus-hack-14.vercel.app)

## El problema

Cada vez que te registras en un sitio te piden fotos de tu documento, selfies y tus datos personales, aunque muchas veces solo necesitan saber que eres una persona real o mayor de edad. Esos datos quedan en servidores de terceros para siempre, y nunca sabes qué hacen con ellos.

Las empresas tampoco ganan: el KYC tradicional es lento, hace que muchos usuarios abandonen el registro y las obliga a custodiar datos sensibles que se pueden filtrar.

## La solución

ZeroID combina lo mejor del inicio de sesión social y del KYC:

| | Login social | KYC tradicional | ZeroID |
|---|:---:|:---:|:---:|
| Inicio de sesión en un clic | ✓ | — | ✓ |
| Identidad real verificada | — | ✓ | ✓ |
| Propósito y retención declarados por cada dato | — | — | ✓ |
| Apruebas cada acceso desde tu teléfono | — | — | ✓ |
| Historial de quién tiene tus datos | — | — | ✓ |
| Revocas el acceso cuando quieras | ✓ | — | ✓ |

## Cómo funciona

1. **Te verificas una vez.** Fotografías tu pasaporte y haces una prueba de vida. El servidor lee el documento, compara tu rostro con su foto y descarta las imágenes al instante: nunca se guardan.
2. **Eliges "Continuar con ZeroID".** En cualquier sitio afiliado, sin contraseñas nuevas ni formularios.
3. **Apruebas desde tu teléfono.** Ves qué datos pide el sitio, cuáles son opcionales y para qué los usará. Confirmas con tu huella.
4. **Controlas todo desde tu panel.** Ves cada sitio conectado, qué datos tiene y qué hace con ellos, y revocas el acceso con un clic.

## Privacidad por diseño

- **Retención cero de imágenes.** Las fotos del pasaporte y la selfie se procesan en memoria y se descartan; no tocan el disco ni la base de datos.
- **Unicidad sin identidad.** Para impedir cuentas duplicadas guardamos solo un hash irreversible del documento (HMAC con un secreto del servidor) y un embedding facial. Con eso detectamos a la misma persona, pero no sabemos quién es.
- **Bóveda cifrada.** Tus datos personales se cifran en tu dispositivo con una llave derivada de tu contraseña. El servidor guarda solo el texto cifrado y no lo puede leer.
- **Credencial ligada a tu dispositivo.** Cada aprobación se firma con una llave criptográfica que nunca sale de tu teléfono.
- **Divulgación mínima.** Un sitio puede pedir solo una respuesta, como "¿es mayor de edad?", y recibir un sí o un no, sin tu fecha de nacimiento.
- **Identificadores por sitio.** Cada sitio recibe un identificador distinto para ti, así que no pueden cruzar datos entre ellos.

## Para empresas

Integrar ZeroID es como integrar "Iniciar sesión con Google": un script y un botón. Cada sitio declara qué datos necesita y para qué, y recibe usuarios verificados, sin bots ni cuentas duplicadas, con el consentimiento registrado.

```js
zeroid.signIn({
  fields: [
    { field: "nombre",    purpose: "Emitir tu boleto",     retention: "1 año",  required: true },
    { field: "documento", purpose: "Validarte al abordar", retention: "1 año",  required: true },
    { field: "telefono",  purpose: "Avisos de retrasos",   retention: "Hasta que lo quites", required: false },
  ],
});
```

La demo incluye **Expreso Caribe**, una empresa de buses ficticia que usa el SDK para que sus pasajeros compren boletos con ZeroID.

## Stack

- **Web:** Next.js 16 y React 19, con Web Crypto para el cifrado de la bóveda.
- **App móvil:** Expo (React Native), con biometría del teléfono y llaves P-256.
- **Backend:** FastAPI, DeepFace para la comparación facial, Gemini para leer la MRZ del pasaporte, y PostgreSQL con pgvector.
- **Infraestructura:** Vercel, DigitalOcean App Platform y Neon.
