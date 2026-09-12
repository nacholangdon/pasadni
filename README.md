# PasaDNI 🇦🇷 — Censura Segura de DNI Argentino (Zero-Trust)

[![Live Demo](https://img.shields.io/badge/Demo-pasadni.pages.dev-teal?style=for-the-badge&logo=cloudflare)](https://pasadni.pages.dev)
[![Zero-Trust](https://img.shields.io/badge/Security-100%25%20Client--Side-emerald?style=for-the-badge&logo=shield)](https://pasadni.pages.dev)
[![Privacy Analytics](https://img.shields.io/badge/Analytics-Cookieless%20%28Cloudflare%29-orange?style=for-the-badge&logo=cloudflare)](https://pasadni.pages.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **Compartí tu documento sin regalar tu identidad.**  
> Aplicación web abierta y gratuita que permite censurar de forma irreversible los datos sensibles de tu DNI argentino (**Número de Trámite**, **Firma** y **Huella Dactilar**) antes de enviarlo por WhatsApp, correo electrónico o trámites de alquiler temporario.

👉 **Probalo en vivo:** [https://pasadni.pages.dev](https://pasadni.pages.dev)

---

## ⚠️ ¿Por qué es un riesgo compartir tu DNI sin censurar?

En Argentina, el **Número de Trámite** (los 11 dígitos impresos en el frente de la tarjeta DNI) funciona como un factor de autenticación crítico ante organismos del Estado y entidades privadas:

- 🏦 **Altas de cuentas bancarias y billeteras virtuales:** Es utilizado por APIs de onboarding (Renaper, Mi Argentina, bancos y fintechs) para validar identidades y otorgar préstamos express.
- 🆔 **Suplantación de identidad:** Si un tercero accede a una foto clara de tu DNI con N° de trámite y firma digitalizada legible, puede realizar trámites fiscales en AFIP/ARCA, solicitar líneas telefónicas o validar créditos a tu nombre.
- ✍️ **Firma y Huella biométrica:** Datos grafológicos y biométricos que nunca deberían compartirse con intermediarios desconocidos.

---

## 🔒 Regla de Oro: Arquitectura Zero-Trust (100% Client-Side)

PasaDNI fue concebido bajo el principio de **confianza cero**:

- 🛡️ **0 peticiones al exterior con tu imagen:** Tu foto **nunca** sale de la memoria volátil de tu navegador. No existe backend, base de datos ni servicios en la nube que procesen tus imágenes.
- ✂️ **Censura matemática destructiva:** Las zonas censuradas no son capas superpuestas ni opacidades cosméticas; los píxeles son sobrescritos y destruidos directamente en el búfer del Canvas antes de exportar la imagen final.
- 🧹 **Purgado automático de metadatos EXIF:** La re-rasterización en el Canvas elimina automáticamente las coordenadas de geolocalización GPS, marcas temporales y datos de modelo de cámara presentes en las fotos tomadas con teléfonos.
- 🔐 **Content Security Policy (CSP) estricta:** Implementada en `public/_headers` para bloquear cualquier script no autorizado o intento de fuga de datos.

---

## 📊 Analítica Web Ética (Sin Cookies / Cookieless)

Para medir el uso de la herramienta sin vulnerar la privacidad de los usuarios, PasaDNI utiliza **Cloudflare Web Analytics**:

- **Sin cookies de rastreo:** No almacena cookies (`_ga`, `_gid`, etc.) en el dispositivo.
- **Sin huella digital (Fingerprinting):** No realiza seguimiento individual entre distintos sitios web.
- **Cumplimiento legal automático:** Cumple de manera nativa con la normativa de protección de datos personales (Ley 25.326 de Argentina y estándares internacionales GDPR/LGPD) sin necesidad de pop-ups molestos de consentimiento.

---

## ⚡ Características Principales

- 🤖 **Detección Asistida con OpenCV.js:** Procesamiento de visión artificial ejecutado en un **Web Worker** en segundo plano para evitar bloqueos del hilo principal en dispositivos móviles.
- 📐 **Presuposición geométrica DNI AR:** Identifica la estructura y orientación de la tarjeta ID-1 y delimita automáticamente:
  - **Frente:** Número de Trámite y Firma Digitalizada.
  - **Dorso:** Huella Dactilar y Código de Barras / PDF417 / MRZ.
- ✍️ **Editor Canvas Táctil & Fallback Manual:** Arrastrá, cambiá de tamaño desde las esquinas o dibujá nuevos rectángulos con el dedo o el mouse en fotos con ángulos difíciles.
- 🎨 **3 Modos de Censura:**
  - **Bloque Negro Mate:** Máxima seguridad y destrucción de datos (imposible de revertir mediante filtros o IA).
  - **Pixelado Destructivo:** Malla de baja resolución sin interpolación.
  - **Desenfoque Profundo (Blur):** Filtro gaussiano intensivo.
- 🧪 **Generador de DNI de Muestra en Memoria:** Permite probar todas las funcionalidades con un clic sin necesidad de fotografiar tu documento real.
- 📱 **Mobile-First & PWA:** Compatible con la cámara nativa del celular (`capture="environment"`), instalable en Android e iOS.

---

## 🛠️ Stack Tecnológico

- **Framework:** React 19 + TypeScript + Vite
- **Estilos:** Tailwind CSS v3 (Dark Mode, paleta accesible de alto contraste)
- **Motor Gráfico:** HTML5 Canvas API nativa
- **Visión Artificial:** OpenCV.js optimizado en Web Worker
- **Iconografía:** Lucide React
- **Infraestructura:** Cloudflare Pages (distribución CDN Edge global sin costo)

---

## 🚀 Instalación y Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/nacholangdon/pasadni.git
cd pasadni

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador en `http://localhost:5173`.

---

## 📦 Compilación y Despliegue

### Compilación para Producción
```bash
npm run build
```
Genera los archivos estáticos listos para producción en la carpeta `dist/`.

### Despliegue en Cloudflare Pages
El proyecto cuenta con `wrangler.toml` y `public/_headers`:
```bash
npx wrangler pages deploy dist --project-name pasadni
```

### Despliegue alternativo en Vercel
El proyecto también incluye `vercel.json`:
```bash
npx vercel
```

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
