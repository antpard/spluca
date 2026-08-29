# Navegación unificada por tags

## Objetivo

Permitir que una persona explore posts, servicios y proyectos relacionados mediante una taxonomía común de tags, sin cambiar las rutas existentes ni depender de JavaScript en el cliente.

## Experiencia

- Cada tag visible en tarjetas y páginas de detalle será un enlace a `/tags/<tag-normalizado>`.
- Cada página de tag mostrará el nombre legible del tag y tres grupos independientes: Posts, Servicios y Proyectos.
- Los grupos vacíos no se renderizarán.
- La página incluirá enlaces de ancla para saltar entre grupos cuando existan, manteniendo la navegación usable en móvil y escritorio.
- Un tag desconocido responderá con la página 404 de Astro.

## Modelo y URLs

`src/lib/list.ts` seguirá siendo la fuente de contenido. Se añadirá un índice derivado que combina `articles`, `services` y `projects`. La comparación será case-insensitive y tolerará espacios sobrantes; la primera variante encontrada conservará el texto visible del tag.

Los slugs de tag se generarán con una función compartida: texto Unicode en minúsculas, espacios convertidos a guiones, caracteres no alfanuméricos reducidos y guiones redundantes eliminados. La página dinámica resolverá el slug contra el índice generado durante el build.

## Componentes y rutas

- `src/lib/tags.ts`: tipos, normalización, índice y agrupación por tag.
- `src/components/TagLink.astro`: representación accesible y enlazable de una etiqueta.
- `src/pages/tags/[tag].astro`: generación estática de páginas, SEO, breadcrumbs y grupos de resultados.
- `src/components/TagResults.astro`: presentación reutilizable de los resultados de un grupo.
- `src/lib/list.ts`: exportación del contenido combinado necesario para el índice.
- `src/components/ArticleSnippet.astro`, `ServiceSnippet.astro`, `ProjectSnippet.astro`: tags enlazables; los artículos también mostrarán sus tags.
- `src/layouts/BlogLayout.astro`, `ServiceLayout.astro`, `ProjectLayout.astro`: tags enlazables en páginas individuales.

La página de tag reutilizará los snippets existentes para mantener consistencia visual y evitar una segunda representación de cada tipo de contenido.

## SEO y accesibilidad

Cada tag tendrá `title`, descripción estable, canonical `/tags/<slug>` y breadcrumbs desde la home hasta el tag. Los enlaces tendrán texto visible, foco nativo y no dependerán de eventos JavaScript. El build generará todas las páginas a partir de los tags existentes.

## Validación

- Tests unitarios para slugificación, comparación case-insensitive, eliminación de duplicados y agrupación por tipo.
- Test de regresión que confirme que cada página de tag apunta a contenido existente.
- `pnpm test`.
- `pnpm build`.

