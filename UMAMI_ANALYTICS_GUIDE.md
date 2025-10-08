# 📊 Guía de Umami Analytics - Tracking Completo para Amazon Afiliados

## 🎯 **¿Qué hemos implementado?**

Hemos integrado **Umami Analytics** en tu sitio de afiliados de Amazon para obtener métricas detalladas sobre el comportamiento de los usuarios y la efectividad de tus enlaces de afiliados.

### **✅ Eventos Trackeados Automáticamente:**

#### **1. Clicks en Enlaces de Afiliados**
- **Evento:** `affiliate-click`
- **Datos:** Nombre del producto, ASIN, precio
- **Componentes:** `AffiliateCard`, `ProductDetailCard`, `ProductTable`, `StickyBuyCTA`

#### **2. Interacciones con Tablas de Productos**
- **Evento:** `table-interaction`
- **Datos:** Tipo de acción, nombre del producto
- **Acciones trackeadas:**
  - Click en nombre del producto
  - Click en botón "Comprar"
  - Versiones desktop y móvil

#### **3. Botones de Compra**
- **Evento:** `buy-button-click`
- **Datos:** Producto, ASIN, tipo de botón
- **Tipos:** `more-info`, `buy-button`

#### **4. CTA Sticky (Móvil)**
- **Evento:** `sticky-cta-click`
- **Datos:** Producto, ASIN
- **Cuándo:** Usuario hace click en el botón flotante de móvil

#### **5. Comportamiento de Página**
- **Eventos:** `page-view`, `scroll-depth`, `time-on-page`
- **Datos:** Ruta, categoría, profundidad de scroll, tiempo
- **Tracking automático:** 25%, 50%, 75%, 100% de scroll

## 🔧 **Archivos Creados/Modificados:**

### **Nuevos Archivos:**
1. **`hooks/useUmami.ts`** - Hook principal para tracking
2. **`hooks/usePageTracking.ts`** - Tracking automático de páginas
3. **`lib/analytics.ts`** - Configuración y constantes
4. **`UMAMI_ANALYTICS_GUIDE.md`** - Esta guía

### **Archivos Modificados:**
1. **`pages/_document.tsx`** - Script de Umami agregado
2. **`pages/[slug].tsx`** - Tracking de páginas de artículos
3. **`components/AffiliateCard.tsx`** - Tracking de clicks
4. **`components/ProductDetailCard.tsx`** - Tracking de botones
5. **`components/ProductTable.tsx`** - Tracking de tabla
6. **`components/StickyBuyCTA.tsx`** - Tracking de CTA móvil
7. **`pages/_app.tsx`** - Mantiene ambos analytics (Vercel + Umami)

## 📈 **Cómo Acceder a tus Métricas:**

### **1. Dashboard de Umami**
- **URL:** [https://cloud.umami.is](https://cloud.umami.is)
- **Website ID:** `9b734560-f9b3-42bb-a754-99ffdb0f6159`

### **2. Métricas Clave a Monitorear:**

#### **📊 Conversión de Afiliados**
```
Eventos > affiliate-click
- Ver qué productos generan más clicks
- Analizar por ASIN y precio
- Comparar rendimiento entre productos
```

#### **📱 Rendimiento Móvil vs Desktop**
```
Eventos > table-interaction
- mobile-buy-button vs table-buy-button
- Optimizar experiencia según dispositivo
```

#### **⏱️ Engagement del Usuario**
```
Eventos > scroll-depth + time-on-page
- Identificar contenido más engaging
- Optimizar artículos con bajo engagement
```

#### **🎯 Efectividad de CTAs**
```
Eventos > sticky-cta-click vs buy-button-click
- Comparar rendimiento de CTAs
- Optimizar posicionamiento
```

## 🚀 **Cómo Usar los Datos para Optimizar:**

### **1. Identificar Productos Top**
```sql
-- En Umami, filtra por:
Event: affiliate-click
Group by: product (custom property)
```
**Acción:** Promociona más los productos con mayor CTR

### **2. Optimizar Tablas de Productos**
```sql
-- Compara:
table-buy-button vs mobile-buy-button
```
**Acción:** Mejora la experiencia del dispositivo con menor conversión

### **3. Mejorar Contenido**
```sql
-- Analiza:
scroll-depth < 50% + time-on-page < 30s
```
**Acción:** Reescribe artículos con bajo engagement

### **4. A/B Testing Manual**
- Cambia posición de productos en tablas
- Modifica textos de CTAs
- Compara métricas antes/después

## 🔍 **Eventos Personalizados Disponibles:**

### **Usar el Hook `useUmami`:**
```typescript
import { useUmami } from '../hooks/useUmami';

function MiComponente() {
  const { track, trackAffiliateClick } = useUmami();
  
  const handleCustomEvent = () => {
    track('custom-event', {
      category: 'test',
      value: 'example'
    });
  };
  
  const handleProductClick = () => {
    trackAffiliateClick('Producto X', 'B08XYZ123', '29.99€');
  };
}
```

### **Tracking Manual de Páginas:**
```typescript
import { usePageTracking } from '../hooks/usePageTracking';

function MiPagina() {
  usePageTracking({
    category: 'landing-page',
    trackScroll: true,
    trackTime: true
  });
}
```

## 📊 **Reportes Recomendados:**

### **1. Reporte Semanal de Conversión**
- Top 10 productos por clicks de afiliados
- Comparación móvil vs desktop
- Páginas con mayor tiempo de permanencia

### **2. Reporte Mensual de Optimización**
- Productos con bajo CTR para revisar
- Artículos con bajo scroll depth
- Análisis de funnel de conversión

### **3. Análisis Trimestral**
- Tendencias de categorías de productos
- Efectividad de diferentes tipos de CTA
- ROI por tipo de contenido

## 🛠️ **Troubleshooting:**

### **Si no ves eventos:**
1. Verifica que el script de Umami se carga correctamente
2. Abre DevTools > Console y busca errores
3. Confirma que `window.umami` existe

### **Si faltan datos:**
1. Los eventos pueden tardar unos minutos en aparecer
2. Verifica que el Website ID sea correcto
3. Asegúrate de que no hay bloqueadores de ads

### **Para debugging:**
```javascript
// En la consola del navegador:
console.log(window.umami);
window.umami.track('test-event', { test: true });
```

## 🎯 **Próximos Pasos:**

1. **Monitorea las primeras 48 horas** para verificar que todo funciona
2. **Establece baselines** de tus métricas actuales
3. **Crea alertas** para productos con alto rendimiento
4. **Optimiza iterativamente** basándote en los datos

## 💡 **Tips Pro:**

- **Segmenta por categoría** para análisis más precisos
- **Combina con Google Analytics** para vista completa
- **Exporta datos regularmente** para análisis históricos
- **Crea dashboards personalizados** en Umami

---

¡Tu sitio ahora tiene tracking completo! 🚀 Podrás tomar decisiones basadas en datos reales sobre qué productos promocionar y cómo optimizar la experiencia del usuario.
