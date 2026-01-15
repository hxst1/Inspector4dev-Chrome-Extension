# Inspector 4 dev 🔍

Una alternativa gratuita y moderna a CSS Peeper para inspeccionar elementos web de forma rápida y elegante.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Características

### Inspección de Elementos
- **Tooltip flotante en hover**: Muestra el tag, id, clases y dimensiones del elemento sin necesidad de hacer clic
- **Highlight visual**: Los elementos se resaltan con un borde al pasar el cursor
- **Panel detallado**: Información completa de tipografía, colores, layout y box model

### Panel de Inspección
- **Drag & Drop completo**: Arrastra el panel a cualquier posición de la pantalla
- **Posicionamiento inteligente**: El panel se abre automáticamente en el lado opuesto al clic
- **Secciones colapsables**: Expande/colapsa secciones para ver solo lo que necesitas
- **Modo claro/oscuro**: Adapta el panel a tu preferencia visual

### Colores
- **Cards de color con preview**: Visualiza y copia colores instantáneamente
- **Copia rápida con tecla C**: Presiona C para copiar el color del texto del elemento seleccionado
- **Formato HEX**: Todos los colores se muestran y copian en formato hexadecimal

### Assets Gallery 🆕
- **Panel de assets completo**: Ve todas las imágenes, fondos y SVGs de la página
- **Vista previa instantánea**: Miniaturas de todos los assets
- **Descarga individual**: Botón de descarga para cada asset
- **Descarga masiva**: Descarga todos los assets con un clic
- **Soporte SVG**: Extrae y descarga SVGs como archivos independientes

### Exportación CSS
- **Copiar CSS básico**: Copia las propiedades más importantes del elemento
- **Exportar CSS completo**: Exporta todas las propiedades CSS con un selector sugerido

## 🚀 Instalación

### Desde Chrome Web Store (Próximamente)
*En desarrollo*

### Cargar extensión desempaquetada (Recomendado para desarrollo)

1. Descarga o clona este repositorio
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el **Modo de desarrollador** (esquina superior derecha)
4. Haz clic en **Cargar desempaquetada**
5. Selecciona la carpeta `element-inspector`

## 📖 Uso

### Activar el Inspector
- **Opción 1**: Haz clic en el icono de la extensión y activa el switch
- **Opción 2**: Usa el atajo `Alt + I`

### Inspeccionar Elementos
1. Mueve el cursor sobre la página - verás un **tooltip flotante** con información del elemento
2. Los elementos se resaltan con un borde morado
3. Haz clic en cualquier elemento para abrir el **panel de inspección completo**

### Mover el Panel
- **Drag & Drop**: Arrastra desde el icono de 6 puntos o desde cualquier parte del header
- **Posición inteligente**: Si haces clic en la derecha de la pantalla, el panel se abre a la izquierda (y viceversa)
- **Persistencia**: El panel recuerda su última posición mientras inspecciones diferentes elementos

### Copiar Colores
- **Clic en las cards de color**: Haz clic en cualquier card de color para copiarlo
- **Tecla C**: Con el panel abierto, presiona `C` para copiar el color del texto

### Ver Assets
- **Desde el panel**: Haz clic en el icono de cuadrícula (Assets)
- **Atajo**: Presiona `A` para abrir/cerrar el panel de assets
- **Desde el badge**: Haz clic en el badge "Inspector ON"

### Cerrar
- Haz clic en la X del panel
- Presiona `Esc`

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Alt + I` | Activar/Desactivar inspector |
| `Esc` | Cerrar panel |
| `C` | Copiar color del elemento en HEX |
| `A` | Abrir/cerrar panel de assets |

## ⚙️ Configuración

Desde el popup de la extensión puedes configurar:

| Opción | Descripción |
|--------|-------------|
| **Mostrar medidas** | Activa/desactiva la visualización del box model |
| **Copiar al clic** | Copia automáticamente el CSS al hacer clic |
| **Modo oscuro** | Cambia entre tema claro y oscuro del panel |

## 🎨 Información que Muestra

### Tooltip Flotante (Hover)
- Tag del elemento (`<div>`, `<span>`, etc.)
- ID (si existe)
- Primeras 2 clases
- Dimensiones (ancho × alto)

### Panel de Inspección

#### Tipografía
- Font Family
- Font Size
- Font Weight
- Line Height
- Letter Spacing
- Text Align

#### Colores (con preview visual)
- Color de texto
- Background color
- Click para copiar

#### Layout
- Display (destacado)
- Position
- Flex/Grid properties (si aplica)
- Z-Index
- Overflow

#### Box Model Visual
- Margin (naranja)
- Border (amarillo)
- Padding (verde)
- Content (morado)

#### Efectos & Más
- Border Radius
- Opacity
- Cursor
- Transition
- Box Shadow

## 🖼️ Panel de Assets

El panel de assets te permite:
- Ver todas las **imágenes** (`<img>`) de la página
- Ver **fondos CSS** (background-image)
- Ver y descargar **SVGs** inline
- **Descargar individualmente** cada asset
- **Descargar todo** con un solo clic

## 🛠️ Estructura del Proyecto

```
element-inspector/
├── manifest.json          # Configuración de la extensión
├── popup.html             # UI del popup
├── icons/                 # Iconos de la extensión
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── styles/
│   ├── popup.css          # Estilos del popup
│   └── inspector.css      # Estilos inyectados en páginas
└── scripts/
    ├── popup.js           # Lógica del popup
    └── inspector.js       # Content script principal
```

## 🔄 Changelog

### v2.0.0
- ✨ Añadido tooltip flotante con información del elemento en hover
- ✨ Drag & drop completo del panel
- ✨ Posicionamiento inteligente (izquierda/derecha según el clic)
- ✨ Panel de assets con descarga de imágenes, fondos y SVGs
- ✨ Tecla C para copiar color en HEX
- ✨ Tecla A para abrir panel de assets
- ✨ Exportación de CSS completo
- ✨ Secciones colapsables en el panel
- 🎨 Diseño mejorado de las cards de color
- 🎨 Badge rediseñado con texto "Inspector ON"

### v1.0.0
- 🎉 Versión inicial
- Inspección básica de elementos
- Panel con información de tipografía, colores, layout y box model
- Copia de CSS
- Modo claro/oscuro

## 🐛 Problemas Conocidos

- En algunas páginas con CSP estricto, los estilos pueden no aplicarse correctamente
- Los assets con CORS pueden no descargarse directamente

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📝 Licencia

MIT - Siéntete libre de usar, modificar y distribuir.

## 💡 Ideas Futuras

- [ ] Extracción de paleta de colores de la página
- [ ] Medición de distancias entre elementos
- [ ] Exportar a Figma/Sketch
- [ ] Comparación de estilos entre elementos
- [ ] Historial de elementos inspeccionados
- [ ] Anotaciones y notas sobre elementos
- [ ] Exportar assets como ZIP

---

<p align="center">Hecho con ♥ para desarrolladores</p>
