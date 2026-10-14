# Melocotón Move — Sistema visual editorial

## Dirección creativa

Wellness premium, limpio y contemporáneo. Fotografía real protagonista, márgenes generosos,
tipografía editorial y controles claros. Evitar múltiples tonos de rosa, gradientes intensos,
animaciones agresivas y sombras profundas.

## Tokens centralizados

Fuente única: `tailwind.config.js`, `styles/globals.css`.

| Token Tailwind | Valor | Uso |
|---|---|---|
| `brand-ink` | `#30292B` | Titulares y texto principal |
| `brand-blue` | `#3E3236` | Nombre heredado; acciones oscuras, nav |
| `brand-wine` | `#674650` | Acentos, promociones, precios |
| `brand-beige` | `#C9A38F` | Acentos arena, compatibilidad legacy |
| `brand-cream` | `#FFFFFF` | Fondo blanco puro predeterminado; integra fotos sobre fondo blanco |
| `brand-sand` | `#F0EAE4` | Alternancia de secciones |
| `brand-blush` | `#EBD9D1` | Acento suave |
| `brand-line` | `#E5DBD3` | Bordes y separadores |
| `brand-muted` | `#736764` | Texto secundario |

**Excepción deliberada:** enlace editorial Home mantiene `bg-gray-50`, por petición de la marca.

### Tipografías

- `font-display`: pila serif editorial con fuentes nativas, sin descarga externa
- `font-sans`: pila sans contemporánea nativa para textos y UI
- Uso: titulares principales `mm-heading`; pequeños sobrenombres `mm-eyebrow`

### Componentes visuales reutilizables

- `mm-container`, `mm-section`: ancho y ritmo vertical
- `mm-heading`, `mm-eyebrow`, `mm-copy`: jerarquía tipográfica
- `mm-card`: tarjeta editorial de bajo ruido visual
- `mm-button`, `mm-button-outline`, `mm-text-link`: acciones
- `mm-field`: inputs

Los botones deben mantener altura mínima de 44px y estados visibles de foco y disabled.
Los precios, promociones y disponibilidad se calculan siempre desde la API existente;
las clases visuales no cambian el comportamiento financiero.

## Hero

- H1 **dentro** del componente `HeroSection` para SSR. Cuando hay slides,
  el primer título configurado es H1; los demás son H2 con idénticas clases.
- En carga de configuración no se muestra un Hero alternativo que provoque saltos;
  sólo se prerenderiza un H1 accesible dentro del mismo componente.
- Video/imagen nativa de cada slide y respectivo CTA; no inventar copys ni reemplazar assets.
- Overlay editorial y CTA blanco, indicadores discretos, mobile-first.
- Videos inactivos pausados; autoplay reducido si el usuario solicita menos movimiento.

## Revisión antes de merge

```bash
npm run build
npm run start
# Terminal adicional
node scripts/audit-geo.mjs
node --env-file=.env.local scripts/audit-seo.mjs
node scripts/audit-design.mjs
```

Revisar manualmente a 375px, 768px y 1440px:
Hero y slides video/imagen, H1 único, header/logo, promo banner, bloque editorial bajo Hero,
categorías, fichas y variantes, carrito y cupones, búsqueda, checkout, personalizador con logo
y WhatsApp, texto legible sobre las fotos, foco con teclado y reduced motion.

### Límites

Este PR cambia sólo presentación: no modifica infraestructura, Lambda, catálogos,
precios, inventario, cupones ni reglas de pagos. El rediseño no garantiza mejoras SEO o ventas.
