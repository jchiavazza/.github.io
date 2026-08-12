# 9x19shooting.com.ar

Sitio del **Club 9x19 Shooting**, de Villa María, Córdoba: club de tiro
afiliado a IDPA con el número CL100757. Páginas estáticas, sin
dependencias ni build.

```
index.html        el club: qué es IDPA, actividades, sedes, contacto
score/index.html  la app 9x19 Score
estilo.css        el sistema visual, compartido por las dos
assets/           iconos e imagenes
```

El diseño replica el sistema de relieve de la app (`src/theme.js` en
`PuntajeApp`): mismos colores, mismas sombras. Si cambia la paleta de la
app, se cambia acá en las variables del `:root` de `estilo.css`.

La leyenda "Aplicación no oficial, sin relación con IDPA" va solo en la
página de la app, y tiene que quedarse: el club sí está afiliado, pero la
app no es un producto de IDPA ni está avalada por ellos.

## Cómo se publica

Repo `jchiavazza/.github.io`, rama `main`, GitHub Pages desde la raíz. El
dominio pasa por Cloudflare (los NS del dominio son de Cloudflare) y de
ahí a GitHub Pages.

```bash
git add -A && git commit -m "..." && git push
```

Tarda un par de minutos en verse. Después de pushear conviene abrir el
sitio, no solo confiar en que el push salió bien.

### Dos cosas que no hay que tocar

**El archivo `CNAME`.** Contiene `9x19shooting.com.ar` y es lo que hace
que GitHub Pages sirva el dominio propio. Si se borra —y un
`push --force` desde un clon que no lo tenga lo borra— el dominio deja de
resolver al sitio y hay que volver a configurarlo a mano en Settings →
Pages.

**El nombre del repo.** Quedó como `.github.io`, que es raro, pero con
dominio propio nunca se ve. Renombrar un repo con Pages activo y CNAME es
justo lo que desconfigura las dos cosas. No vale la pena.

## Lo que falta completar

- **Capturas del teléfono.** Hay tres marcos vacíos en la sección "Pensada
  para la cancha". Se reemplaza cada `div.captura-pendiente` por un `img`
  (ver el comentario en el HTML). Las mismas capturas van a la ficha de
  Play, que también las está esperando.
- **El botón de Play.** Mientras la app esté en prueba cerrada es un
  `span` inerte que dice "En revisión". Al salir a Producción se cambia
  por el enlace a
  `https://play.google.com/store/apps/details?id=com.shooting9x19.puntaje`
  y se borra el aviso de abajo. Está comentado en el HTML.
- **La versión en el pie** (hoy 1.2.1) se actualiza a mano.

## Los textos

Salen de `PLAY_STORE.md` y `POLITICA_DE_PRIVACIDAD.md` del repo de la app,
que están verificados contra el código. Si se corrigen allá, corregir acá.

La política de privacidad no se duplica: el sitio enlaza a la que está
publicada en https://jchiavazza.github.io/politica-9x19/ — esa URL está
declarada en la ficha de Play y no se puede mover.

## El placeholder anterior

Hasta el 12/8/2026 el dominio mostraba una pagina de "sitio en
construcción". No se perdió: está en la historia del repo, en el commit
anterior a este sitio.
