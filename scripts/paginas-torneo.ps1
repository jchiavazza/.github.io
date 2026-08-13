# Genera una página por torneo a partir de la lista. Correr de nuevo si se
# agrega una fecha; las páginas se sobrescriben.

$raiz = "$env:USERPROFILE\Downloads\sitio-9x19\torneos"

$torneos = @(
  @{ slug='primera-fecha-fenix';     titulo='Primera Fecha'; sede='Polígono de Tiro Fénix';        lugar='San Luis';           fecha='11 de abril de 2026'; fotos=28 },
  @{ slug='primera-fecha-esperanza'; titulo='Primera Fecha'; sede='Tiro Federal de Esperanza';     lugar='Esperanza, Santa Fe'; fecha='30 de mayo de 2026';  fotos=28 },
  @{ slug='segunda-fecha-santa-fe';  titulo='Segunda Fecha'; sede='Tiro Federal Argentino';        lugar='Santa Fe';            fecha='13 de junio de 2026'; fotos=20 },
  @{ slug='tercera-fecha-esperanza'; titulo='Tercera Fecha'; sede='Tiro Federal de Esperanza';     lugar='Esperanza, Santa Fe'; fecha='12 de julio de 2026'; fotos=31 }
)

foreach ($t in $torneos) {
  $dir = Join-Path $raiz $t.slug
  New-Item -ItemType Directory -Force $dir | Out-Null

  $html = @"
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$($t.titulo) en $($t.sede) — Club 9x19 Shooting</title>
<meta name="description" content="Fotos de la $($t.titulo.ToLower()) de IDPA que organizó el Club 9x19 Shooting en $($t.sede), $($t.lugar), el $($t.fecha).">
<link rel="icon" href="/assets/icono.png">
<link rel="stylesheet" href="/estilo.css?v=7">

<meta property="og:type" content="website">
<meta property="og:title" content="$($t.titulo) — $($t.sede)">
<meta property="og:description" content="$($t.lugar) · $($t.fecha)">
<meta property="og:image" content="https://9x19shooting.com.ar/galeria/$($t.slug)/g/01.jpg">
<meta property="og:url" content="https://9x19shooting.com.ar/torneos/$($t.slug)/">
<meta property="og:locale" content="es_AR">
</head>
<body>

<div class="envoltorio">
  <div class="barra">
    <a class="marca" href="/"><img src="/assets/logo-club.png" alt="Club 9x19 Shooting"></a>
    <nav>
      <a href="/#contacto">Contacto</a>
    </nav>
  </div>
</div>

<main class="envoltorio">

  <header class="portada">
    <h1>$($t.titulo)</h1>
    <p class="bajada">$($t.sede) · $($t.lugar)<br>$($t.fecha)</p>
  </header>

  <section>
    <div id="galeria"
         data-slug="$($t.slug)"
         data-fotos="$($t.fotos)"
         data-titulo="$($t.titulo)"
         data-sede="$($t.sede)"></div>
  </section>

</main>

<footer>
  <div class="envoltorio">
    <p>
      Club 9x19 Shooting · Villa María, Córdoba, Argentina ·
      <a href="mailto:9x19shooting@gmail.com">9x19shooting@gmail.com</a>
    </p>
  </div>
</footer>

<!-- Visor: se abre al tocar una miniatura. Se cierra con Esc, con la X o
     tocando el fondo; se pasa de foto con las flechas del teclado. -->
<div id="visor" class="visor" hidden>
  <button class="visor-cerrar" type="button" aria-label="Cerrar">✕</button>
  <button class="visor-nav visor-antes" type="button" aria-label="Anterior">‹</button>
  <img id="visor-img" alt="">
  <button class="visor-nav visor-luego" type="button" aria-label="Siguiente">›</button>
  <p class="visor-pie"><span id="visor-torneo"></span> <span id="visor-cuenta"></span></p>
</div>

<script src="/torneos/galeria.js?v=1"></script>
<script src="/sitio.js?v=4"></script>
</body>
</html>
"@

  $ruta = Join-Path $dir 'index.html'
  [System.IO.File]::WriteAllText($ruta, $html, (New-Object System.Text.UTF8Encoding $false))
  "$($t.slug)/index.html  ($($t.fotos) fotos)"
}
