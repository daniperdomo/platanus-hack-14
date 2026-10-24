# ZeroID Mobile 🔐

Una aplicación móvil en React Native (Expo) que funciona como un **Smart SSO y Gestor de Privacidad**.

## 🎨 Diseño

- **Dark Mode Premium**: Fondo antracita (#0A0B0E)
- **Acento Verde Cyber**: #00F098 para éxito/verificación
- **Rojo de Alerta**: #b42318 para revocar accesos
- **Glassmorphism**: Efectos de blur en modales

## 📱 Pantallas Implementadas

### 1. **index.tsx** - Onboarding & Captura QR
- Hero section con branding ZeroID
- Lista de features principales
- Integración de cámara con `expo-camera`
- Frame de escaneo con esquinas animadas
- Feedback háptico al capturar

### 2. **dashboard.tsx** - Lista de Accesos
- Tarjetas de sesiones activas con diseño premium
- Información de dispositivo y ubicación
- Tags de permisos otorgados
- Botón de "Revocar Acceso" destacado
- Estadísticas en la parte superior

### 3. **consent.tsx** - Modal de Autorización
- Bottom Sheet con `@gorhom/bottom-sheet`
- Efecto glassmorphism con `expo-blur`
- 3 secciones de privacidad diferenciadas:
  - ✨ **Lo bueno** (verde)
  - ⚠️ **Atención** (amarillo)
  - 🔒 **Requerido** (azul)
- Botón de autorización prominente
- Animaciones suaves

## 🚀 Instalación y Ejecución

### 1. Instalar dependencias adicionales

```bash
cd zeroid-mobile
npx expo install expo-router react-native-safe-area-context react-native-screens
npm install
```

### 2. Ejecutar el proyecto

```bash
# Iniciar el servidor de desarrollo
npm start

# O directamente en un simulador/emulador
npm run ios
npm run android
```

### 3. Probar en dispositivo físico

1. Descarga **Expo Go** en tu móvil
2. Escanea el QR que aparece en la terminal
3. La app se cargará automáticamente

## 📦 Dependencias Principales

- **expo** - Framework base
- **expo-router** - Navegación file-based
- **expo-camera** - Captura de QR
- **expo-blur** - Efectos de blur
- **expo-haptics** - Feedback táctil
- **@gorhom/bottom-sheet** - Modales suaves
- **react-native-reanimated** - Animaciones
- **react-native-gesture-handler** - Gestos

## 🎯 Flujo de Usuario

1. **Onboarding** → Usuario ve la landing con features
2. **Escanear QR** → Activa cámara y escanea código
3. **Consent Modal** → Aparece el bottom sheet de autorización
4. **Dashboard** → Ve sus sesiones activas y puede revocar

## 🔧 Configuración

### Permisos de Cámara

Los permisos están configurados en `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "Necesitamos acceso a la cámara..."
    }
  },
  "android": {
    "permissions": ["android.permission.CAMERA"]
  }
}
```

### Babel Config

El archivo `babel.config.js` incluye el plugin de reanimated:

```javascript
plugins: ['react-native-reanimated/plugin']
```

## 🎨 Paleta de Colores

```javascript
// Backgrounds
'#0A0B0E'  // Fondo principal
'#16181D'  // Cards
'#1F2937'  // Borders

// Text
'#FFFFFF'  // Títulos
'#E5E7EB'  // Texto normal
'#9CA3AF'  // Texto secundario
'#6B7280'  // Texto deshabilitado

// Accents
'#00F098'  // Success/Primary
'#b42318'  // Danger/Revoke
'#F59E0B'  // Warning
'#6366F1'  // Info
```

## 📝 Próximos Pasos

- [ ] Conectar con backend real
- [ ] Implementar lógica de escaneo QR
- [ ] Agregar autenticación
- [ ] Implementar revocación real de accesos
- [ ] Agregar notificaciones push
- [ ] Implementar biometría (Face ID/Touch ID)

## 🏗️ Estructura de Archivos

```
zeroid-mobile/
├── app/
│   ├── _layout.tsx      # Layout principal con navegación
│   ├── index.tsx        # Onboarding + Cámara
│   ├── dashboard.tsx    # Lista de accesos
│   └── consent.tsx      # Modal de autorización
├── assets/              # Imágenes y recursos
├── app.json            # Configuración de Expo
├── babel.config.js     # Configuración de Babel
├── package.json        # Dependencias
└── tsconfig.json       # Configuración de TypeScript
```

## 💡 Tips de Desarrollo

- Usa `npm start` y presiona `r` para recargar
- Presiona `m` para abrir el menú de desarrollo
- Usa el simulador de iOS en Mac para mejor experiencia
- El hot reload está habilitado por defecto

## 📱 Compatibilidad

- iOS 13+
- Android 6.0+ (API 23+)
- Expo SDK 58

---

Desarrollado con ❤️ para Platanus Hack 14
