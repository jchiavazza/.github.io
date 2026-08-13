# Genera una página por torneo a partir de la lista. Correr de nuevo si se
# agrega una fecha; las páginas se sobrescriben.

$raiz = "$env:USERPROFILE\Downloads\sitio-9x19\torneos"

# En orden cronológico. Las páginas y las listas se arman desde acá.
$torneos = @(
  @{ slug='clinica-esperanza';       titulo='Clínica y Clasificación'; sede='Tiro Federal de Esperanza';  lugar='Esperanza, Santa Fe'; fecha='21 y 22 de febrero de 2026'; fotos=18 },
  @{ slug='clinica-san-luis';        titulo='Clínica y Clasificación'; sede='Polígono de Tiro Fénix';     lugar='San Luis';            fecha='1 de marzo de 2026';         fotos=37 },
  @{ slug='torneo-santa-fe-marzo';   titulo='Torneo';                  sede='Tiro Federal Argentino';     lugar='Santa Fe';            fecha='22 de marzo de 2026';        fotos=29 },
  @{ slug='primera-fecha-fenix';     titulo='Primera Fecha';           sede='Polígono de Tiro Fénix';     lugar='San Luis';            fecha='12 de abril de 2026';        fotos=28 },
  @{ slug='clinica-tucuman';         titulo='Clínica y Clasificación'; sede='Tiro Federal de Tucumán';    lugar='San Miguel de Tucumán'; fecha='23 de mayo de 2026';       fotos=20 },
  @{ slug='primera-fecha-esperanza'; titulo='Primera Fecha';           sede='Tiro Federal de Esperanza';  lugar='Esperanza, Santa Fe'; fecha='31 de mayo de 2026';         fotos=28 },
  @{ slug='segunda-fecha-santa-fe';  titulo='Segunda Fecha';           sede='Tiro Federal Argentino';     lugar='Santa Fe';            fecha='14 de junio de 2026';        fotos=20 },
  @{ slug='tercera-fecha-esperanza'; titulo='Tercera Fecha';           sede='Tiro Federal de Esperanza';  lugar='Esperanza, Santa Fe'; fecha='12 de julio de 2026';        fotos=31 }
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
<link rel="stylesheet" href="/estilo.css?v=18">

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
<script src="/sitio.js?v=13"></script>
</body>
</html>
"@

  $ruta = Join-Path $dir 'index.html'
  [System.IO.File]::WriteAllText($ruta, $html, (New-Object System.Text.UTF8Encoding $false))
  "$($t.slug)/index.html  ($($t.fotos) fotos)"
}

# --- las tarjetas, de la fecha más reciente a la más vieja

$tarjetas = ($torneos.Clone() | Sort-Object { $torneos.IndexOf($_) } -Descending | ForEach-Object {
@"
      <a class="torneo" href="/torneos/$($_.slug)/">
        <img src="/galeria/$($_.slug)/mini/01.jpg" alt="$($_.titulo) en $($_.sede), $($_.lugar)" loading="lazy">
        <div>
          <h3>$($_.titulo)</h3>
          <p>$($_.sede), $($_.lugar)<br>$($_.fecha) · $($_.fotos) fotos</p>
        </div>
      </a>
"@
}) -join "`n"

# En la portada las rutas van sin la barra inicial, como el resto del archivo.
$tarjetasPortada = $tarjetas -replace 'href="/torneos/', 'href="torneos/' -replace 'src="/galeria/', 'src="galeria/'

# El cierre se ancla en </section>: las tarjetas llevan </div> adentro, así
# que buscar el primero cortaría en la mitad de la primera tarjeta.
function ReemplazarGrilla($archivo, $bloque) {
  $texto = [System.IO.File]::ReadAllText($archivo)
  $patron = '(?s)<div class="grilla-torneos">.*?\r?\n\s*</div>\r?\n\s*</section>'
  if ($texto -notmatch $patron) { "OJO: no se encontro la grilla en $archivo"; return }
  $reemplazo = "<div class=`"grilla-torneos`">`r`n" + $bloque + "`r`n    </div>`r`n  </section>"
  $nuevo = [regex]::Replace($texto, $patron, { $reemplazo }, 1)
  [System.IO.File]::WriteAllText($archivo, $nuevo, (New-Object System.Text.UTF8Encoding $false))
  "actualizado: $archivo"
}

ReemplazarGrilla (Join-Path $raiz 'index.html') $tarjetas
ReemplazarGrilla "$env:USERPROFILE\Downloads\sitio-9x19\index.html" $tarjetasPortada
"lista de torneos y portada actualizadas con $($torneos.Count) fechas"
