# Generador de Videos para Artículos de Productos

Este script permite generar automáticamente videos para TikTok a partir de los artículos MDX de productos del sitio web.

## Características

- Extrae información de archivos MDX (título, productos, imágenes, descripciones)
- Genera un guión para el video utilizando OpenAI (opcional)
- Convierte texto a voz usando servicios TTS como ElevenLabs o Google Cloud TTS
- Crea videos en formato vertical (9:16) optimizados para TikTok
- Incluye imágenes de productos con transiciones

## Requisitos

- Node.js v16 o superior
- Remotion (para la generación de videos)
- FFmpeg instalado en el sistema (usado por Remotion)
- Claves de API (opcionales pero recomendadas):
  - OpenAI para generación de guiones
  - ElevenLabs o Google Cloud TTS para conversión de texto a voz

## Instalación

1. Instalar las dependencias:

```bash
cd video-generator
npm install
npm install remotion @remotion/cli @remotion/media-utils react react-dom
```

2. Crear un archivo `.env` en la carpeta `video-generator` con las siguientes variables:

```
OPENAI_API_KEY=tu_clave_api_openai
ELEVENLABS_API_KEY=tu_clave_api_elevenlabs
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
GOOGLE_TTS_API_KEY=tu_clave_api_google
```

## Uso

Para generar un video a partir de un archivo MDX:

```bash
node index.js nombre-del-archivo.mdx
```

O especificando la ruta completa:

```bash
node index.js /ruta/completa/al/archivo.mdx
```

### Ejemplo

```bash
node index.js las-mejores-cafeteras-de-capsulas-para-disfrutar-del-cafe-en-casa.mdx
```

## Estructura de directorios

- `output/`: Contiene los videos generados
- `temp/`: Archivos temporales (imágenes, audio)
  - `temp/images/`: Imágenes descargadas de los productos
  - `temp/audio/`: Archivos de audio generados

## Servicios

- `scriptGenerator.js`: Genera el guión para el video
- `audioGenerator.js`: Convierte el texto a voz
- `imageDownloader.js`: Descarga las imágenes de los productos
- `remotionVideoCreator.js`: Crea el video final con Remotion (reemplaza a videoCreator.js)

## Componentes de Remotion

- `/remotion/Video.jsx`: Punto de entrada para la composición de Remotion
- `/remotion/TikTokVideo.jsx`: Componente principal que estructura el video
- `/remotion/components/TitleSlide.jsx`: Componente para la diapositiva de título
- `/remotion/components/ProductSlide.jsx`: Componente para mostrar productos
- `/remotion/components/CallToActionSlide.jsx`: Componente para la llamada a la acción final

## Notas

- Si no se proporcionan claves de API, el script funcionará en modo limitado:
  - Generará un guión básico en lugar de usar IA
  - Creará un archivo de texto con el guión en lugar de audio
  - Indicará que se necesita generar el audio manualmente

- Para obtener mejores resultados, se recomienda:
  - Usar OpenAI para generar guiones más atractivos
  - Usar ElevenLabs para voces más naturales en español
  - Asegurarse de que las imágenes de los productos sean de alta calidad

## Ventajas de Remotion sobre FFmpeg

### Mejoras visuales
- **Animaciones fluidas**: Transiciones, entradas y salidas animadas con springs y interpolaciones
- **Elementos interactivos**: Textos animados, zoom suave en productos, efectos visuales
- **Mejor composición**: Estructura modular con componentes React reutilizables
- **Estética moderna**: Diseño adaptado al estilo visual de TikTok

### Mejoras técnicas
- **Sincronización audio/video**: Mejor sincronización entre narración y elementos visuales
- **Mantenibilidad**: Código más limpio y modular usando React
- **Extensibilidad**: Fácil de añadir nuevas funcionalidades o estilos
- **Rendimiento**: Renderizado más rápido para videos complejos

### Personalización
- **Estilos dinámicos**: Ajuste de colores, fuentes y layouts según la marca
- **Plantillas**: Posibilidad de crear diferentes plantillas para distintos tipos de videos
- **Interactividad**: Potencial para añadir elementos interactivos en el futuro
