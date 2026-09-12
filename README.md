# PasaDNI 🇦🇷 — Censura Segura de DNI Argentino (Zero-Trust)

[![Live Demo](https://img.shields.io/badge/Demo-pasadni.pages.dev-teal?style=for-the-badge&logo=cloudflare)](https://pasadni.pages.dev)
[![Zero-Trust](https://img.shields.io/badge/Security-100%25%20Client--Side-emerald?style=for-the-badge&logo=shield)](https://pasadni.pages.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **Compartí tu documento sin regalar tu identidad.**  
> Aplicación web abierta y gratuita que permite censurar de forma irreversible los datos sensibles de tu DNI argentino (**Número de Trámite**, **Firma** y **Huella Dactilar**) antes de enviarlo por WhatsApp, email o trámites de alquiler.

---

## 🔒 Regla de Oro: Zero-Trust (100% Client-Side)

- **0 llamadas a servidores:** Tu documento **nunca** se sube ni se transmite por internet. Todo el procesamiento de imagen y visión artificial ocurre exclusivamente en la memoria RAM de tu navegador.
- **Censura matemática destructiva:** Los datos tapados no son capas transparentes ni simples overlays visuales; son reemplazados a nivel de la matriz de píxeles antes de generar el archivo final.
- **Purgado automático de EXIF:** La imagen exportada se genera limpia de metadatos (sin coordenadas GPS, fechas de captura ni número de serie del teléfono).

---

## ⚡ Características Principales

- 🤖 **Detección Asistida por Visión Artificial (OpenCV.js):** Ejecutado dentro de un **Web Worker** en segundo plano para no congelar la pantalla táctil ni la interfaz en celulares.
- 📐 **Presuposición geométrica DNI AR:** Identifica la proporción de tarjeta ID-1 y delimita automáticamente el **N° de Trámite** y la **Firma** (frente), o la **Huella Dactilar** y **MRZ/Código de barras** (dorso).
- ✍️ **Editor Canvas Táctil & Fallback Manual:** Arrastrá o redimensioná rectángulos con el dedo/mouse, o dibujá zonas personalizadas en fotos tomadas en ángulos difíciles.
- 🎨 **3 Modos de Censura:**
  - **Bloque Negro Mate:** Máxima seguridad (imposible de revertir con IA).
  - **Pixelado Destructivo:** Malla de baja resolución sin interpolación.
  - **Desenfoque Profundo (Blur):** Filtro gaussiano intensivo.
- 🧪 **Generador de DNI de Muestra:** Permite probar todas las herramientas con 1 clic sin tener que fotografiar tu documento real.
- 📱 **Mobile-First & PWA:** Compatible con la cámara nativa del celular (`capture="environment"`), instalable en Android e iOS.

---

## 🛠️ Stack Tecnológico

- **Framework:** React 19 + TypeScript + Vite
- **Estilos:** Tailwind CSS (Dark Mode, paleta moderna de alta accesibilidad)
- **Motor Gráfico:** HTML5 Canvas API nativa
- **Visión Artificial:** OpenCV.js en Web Workers dedicados
- **Hosting:** Cloudflare Pages (distribución CDN global sin costo)

---

## 🚀 Instalación y Desarrollo Local

```bash
# Clonar repositorio
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

### Compilar para Producción
```bash
npm run build
```
Los archivos estáticos optimizados se generarán en la carpeta `dist/`.

### Despliegue en Cloudflare Pages
El proyecto incluye `wrangler.toml` y `public/_headers` con cabeceras estrictas de seguridad (CSP):
```bash
npx wrangler pages deploy dist --project-name pasadni
```

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.
