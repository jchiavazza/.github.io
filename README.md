# 9x19shooting.com.ar

Sitio del **Club 9x19 Shooting**, club organizador de eventos de IDPA en
la Argentina, afiliado con el número CL100757. Páginas estáticas, sin
dependencias ni build.

> **En el sitio no se nombra ninguna ciudad como sede del club.** Se sacó
> a propósito: el club organiza en polígonos de todo el país y decir que
> es de un lugar lo achica. Las ciudades aparecen solo como sedes de cada
> torneo.

```
index.html               el club: IDPA, qué hacemos, sedes, torneos, contacto
score/index.html         la App 9x19 Score
clasificador/index.html  la App 9x19 Clasificador
torneos/                 una página por fecha, con su galería
privacidad/index.html    la política de privacidad del sitio
panel/index.html         registro de descargas (interno, pide clave)
descargas/               el APK del Clasificador
estilo.css               el sistema visual, compartido por todas
sitio.js                 pantallas, visor de imágenes, formulario, contador
assets/                  íconos, imágenes, afiches, manuales en PDF
```

La portada funciona **por pantallas**: cada opción del menú muestra su
sección y esconde las demás, sin recargar (ver el primer bloque de
`sitio.js`). Todo el contenido está igual en el HTML, así que los
buscadores lo leen entero.

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

## El contador de descargas vive en el repositorio de la App

Los botones que bajan el APK o un manual le avisan a una Cloud Function,
que anota fecha, archivo, IP, ciudad y navegador; `/panel/` es lo que
muestra ese registro, con una clave.

**El código de esas dos funciones está en `PuntajeApp/functions/index.js`,
no acá**, y no es por descuido: un proyecto de Firebase despliega sus
funciones desde una sola carpeta, y ahí ya vivía `borrarMatchesVencidos`,
la que borra de la nube los matches vencidos. Desplegar desde este
repositorio haría que Firebase diera por sentado que las del sitio son
todas las que hay y **borraría esa otra**, que es la que sostiene lo que
promete la política de privacidad de la App.

De este lado quedan el aviso (último bloque de `sitio.js`), la página
`/panel/` y lo que declara la política de privacidad. Si cambia lo que se
guarda, hay que actualizar `privacidad/index.html`.

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
