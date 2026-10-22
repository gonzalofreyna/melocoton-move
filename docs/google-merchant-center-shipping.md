# Fase 7 — Google Merchant Center / Google Shopping

## Implementado en el feed

- URL para registrar como fuente programada: `https://www.melocotonmove.com/api/google-shopping.xml` (una vez desplegada esta rama).
- Consulta productos frescos desde la API de catálogo.
- Publica id, título, descripción, URL del producto, imagen principal, galería, precios en MXN, ofertas, stock, marca y categoría.
- Excluye productos con inventario desconocido, envío especial o reformers y productos con datos esenciales inválidos.
- No publica tarifas fijas en el feed. Skydropx sigue calculando el costo en checkout.
- Emite `g:shipping_label` por elegibilidad de promoción y plazo total de entrega: `promo-elegible-entrega-MIN-MAX-habiles` o `estandar-entrega-MIN-MAX-habiles`.
- Publica peso (`g:shipping_weight`) y dimensiones (`g:shipping_width`, `g:shipping_height`, `g:shipping_length`) cuando los datos son positivos y completos.

## Pendiente en Merchant Center — necesario antes de activar

1. Configurar entrega a México, políticas y plazos de gestión/transporte cuya suma coincida con los plazos totales de `shipping_label`. No convertir plazos totales en plazos de transporte sin descontar gestión.
2. Configurar tarifas verificadas en Merchant Center por destino y peso, coherentes con Skydropx. Merchant Center no consulta Skydropx automáticamente.
3. Para artículos `promo-elegible`, la tienda solo da envío gratis cuando TODOS los artículos del carrito son elegibles, el subtotal alcanza el umbral configurado en checkout (por defecto $499 MXN) y no existe envío especial. No anunciar envío gratis para cualquier compra individual por el solo hecho de llevar esa etiqueta. Confirmar configuración real de variables `FREE_SHIPPING_MIN_TOTAL` y `NEXT_PUBLIC_FREE_SHIPPING_MIN_TOTAL`.
4. Si Merchant Center no permite representar fielmente la promoción de carrito mixto, usar tarifas normales para esos artículos y configurar únicamente ofertas promocionales compatibles con la tienda.
5. Verificar con cotizaciones reales y destinos representativos (varios códigos postales, artículos ligeros/pesados, canastas mixtas, promociones) que Google no anuncie un costo inferior al cobrado en checkout.
6. Registrar el feed, verificar dominio, reglas de devoluciones, diagnóstico de artículos y aprobación en Merchant Center. Publicar anuncios/listados solo cuando las tarifas coincidan.

## Precauciones

- Quitar `g:shipping` del XML **no significa** que Google pueda mostrar «envío pendiente»: se requieren condiciones de envío en la cuenta.
- Si algún producto no tiene peso, dimensiones o plazo confiables, revisar manualmente su tarifa o excluirlo de grupos que dependen de esos datos.
- El feed no modifica el checkout, Skydropx, los precios ni el inventario de la tienda.
- Actualizar el feed en el sitio no configura automáticamente la cuenta Merchant Center.
