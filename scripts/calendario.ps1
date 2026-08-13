Add-Type -AssemblyName System.Drawing

# Arma el flyer del calendario anual desde cero, con el escudo del club y el
# logo de IDPA. Para cambiar una fecha se edita la lista de abajo y se corre
# de nuevo: no hace falta abrir ningun editor de imagenes.

$raiz = "$env:USERPROFILE\Downloads\sitio-9x19"
$assets = Join-Path $raiz 'assets'
$salida = "$env:TEMP\calendario-nuevo.png"

# --- las fechas del año

$fechas = @(
  @{ mes = 'Marzo';      dia = '22';      sede = 'Tiro Federal Argentino de Santa Fe' },
  @{ mes = 'Abril';      dia = '12';      sede = 'Club Fénix, San Luis' },
  @{ mes = 'Mayo';       dia = '31';      sede = 'Tiro Federal de Esperanza' },
  @{ mes = 'Junio';      dia = '14';      sede = 'Tiro Federal Argentino de Santa Fe' },
  @{ mes = 'Julio';      dia = '12';      sede = 'Tiro Federal de Esperanza' },
  @{ mes = 'Agosto';     dia = '22 y 23'; sede = 'Tiro Federal de Tucumán' },
  @{ mes = 'Septiembre'; dia = '20';      sede = 'Tiro Federal Argentino de Santa Fe' },
  @{ mes = 'Septiembre'; dia = '26 y 27'; sede = 'Tiro Federal de Paraná'; tipo = 'Clínica y Clasificación' },
  @{ mes = 'Octubre';    dia = '11';      sede = 'Tiro Federal de Esperanza' },
  @{ mes = 'Noviembre';  dia = '—';       sede = 'A confirmar' }
)

# --- lienzo

$W = 1080
$H = 1660
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'ClearTypeGridFit'
$g.InterpolationMode = 'HighQualityBicubic'
$g.PixelOffsetMode = 'HighQuality'

# Fondo: la bandera argentina puesta de pie, celeste-blanco-celeste en
# franjas verticales.
$celeste = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(117, 170, 219))
$blancoBandera = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$tercio = [int]($W / 3)
$g.FillRectangle($celeste, 0, 0, $tercio, $H)
$g.FillRectangle($blancoBandera, $tercio, 0, $tercio, $H)
$g.FillRectangle($celeste, ($tercio * 2), 0, ($W - $tercio * 2), $H)
$celeste.Dispose(); $blancoBandera.Dispose()

# Velo oscuro encima: deja ver la bandera pero permite leer el texto claro.
# Un poco más denso arriba y abajo, donde van el escudo y los logos.
$velo = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 0, $H),
  ([System.Drawing.Color]::FromArgb(178, 16, 18, 24)),
  ([System.Drawing.Color]::FromArgb(178, 36, 33, 29)))
$g.FillRectangle($velo, 0, 0, $W, $H)
$velo.Dispose()

# Marco fino dorado
$dorado = [System.Drawing.Color]::FromArgb(216, 180, 88)
$lapiz = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, 216, 180, 88)), 3
$g.DrawRectangle($lapiz, 26, 26, $W - 53, $H - 53)
$lapiz.Dispose()

# --- escudo del club

$logo = [System.Drawing.Image]::FromFile((Join-Path $assets 'logo-club.png'))
$anchoLogo = 380
$altoLogo = [int]($logo.Height * ($anchoLogo / [double]$logo.Width))
$g.DrawImage($logo, [int](($W - $anchoLogo) / 2), 70, $anchoLogo, $altoLogo)
$logo.Dispose()

$y = 70 + $altoLogo + 34

# --- título

function Fuente($nombre, $tam, $estilo) {
  New-Object System.Drawing.Font $nombre, $tam, $estilo, ([System.Drawing.GraphicsUnit]::Pixel)
}

$centro = New-Object System.Drawing.StringFormat
$centro.Alignment = [System.Drawing.StringAlignment]::Center

$fTitulo = Fuente 'Arial Narrow' 96 ([System.Drawing.FontStyle]::Bold)
$blanco = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(238, 236, 230))
$brochaDorado = New-Object System.Drawing.SolidBrush $dorado

# "CALENDARIO 2026" en dos colores, medido para quedar centrado
$t1 = 'CALENDARIO '
$t2 = '2026'
$a1 = $g.MeasureString($t1, $fTitulo).Width
$a2 = $g.MeasureString($t2, $fTitulo).Width
$x = ($W - ($a1 + $a2)) / 2
$g.DrawString($t1, $fTitulo, $blanco, $x, $y)
$g.DrawString($t2, $fTitulo, $brochaDorado, ($x + $a1), $y)
$y += 108

$fSub = Fuente 'Segoe UI' 34 ([System.Drawing.FontStyle]::Regular)
$gris = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(168, 160, 148))
$g.DrawString('Fechas tentativas año 2026', $fSub, $gris, (New-Object System.Drawing.RectangleF 0, $y, $W, 44), $centro)
$y += 62

# Línea separadora
$lapiz2 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 216, 180, 88)), 2
$g.DrawLine($lapiz2, 120, $y, $W - 120, $y)
$lapiz2.Dispose()
$y += 34

# --- las fechas

$fMes = Fuente 'Segoe UI Semibold' 34 ([System.Drawing.FontStyle]::Bold)
$fDia = Fuente 'Segoe UI' 42 ([System.Drawing.FontStyle]::Bold)
$fSede = Fuente 'Segoe UI' 28 ([System.Drawing.FontStyle]::Regular)
$fTipo = Fuente 'Segoe UI' 22 ([System.Drawing.FontStyle]::Italic)

$xMes = 336      # los meses terminan acá
$xDia = 524      # los días terminan acá
$xSede = 548     # las sedes empiezan acá
$paso = 76

$derecha = New-Object System.Drawing.StringFormat
$derecha.Alignment = [System.Drawing.StringAlignment]::Far

foreach ($f in $fechas) {
  # punto rojo
  $r = 13
  $cx = 104; $cy = $y + 26
  $brochaPunto = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point ($cx - $r), ($cy - $r)),
    (New-Object System.Drawing.Point ($cx + $r), ($cy + $r)),
    ([System.Drawing.Color]::FromArgb(210, 60, 45)),
    ([System.Drawing.Color]::FromArgb(120, 20, 16)))
  $g.FillEllipse($brochaPunto, ($cx - $r), ($cy - $r), ($r * 2), ($r * 2))
  $brochaPunto.Dispose()

  $g.DrawString($f.mes, $fMes, $brochaDorado, (New-Object System.Drawing.RectangleF 0, $y, $xMes, 56), $derecha)
  $g.DrawString($f.dia, $fDia, $blanco, (New-Object System.Drawing.RectangleF 0, ($y - 4), $xDia, 60), $derecha)
  if ($f.ContainsKey('tipo')) {
    $g.DrawString($f.sede, $fSede, $gris, $xSede, ($y - 2))
    $g.DrawString($f.tipo, $fTipo, $brochaDorado, $xSede, ($y + 30))
  } else {
    $g.DrawString($f.sede, $fSede, $gris, $xSede, ($y + 8))
  }
  $y += $paso
}

$y += 6
$lapiz3 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 216, 180, 88)), 2
$g.DrawLine($lapiz3, 120, $y, $W - 120, $y)
$lapiz3.Dispose()
$y += 40

# --- logo de IDPA y el sitio

$idpa = [System.Drawing.Image]::FromFile((Join-Path $assets 'idpa.png'))
$anchoIdpa = 340
$altoIdpa = [int]($idpa.Height * ($anchoIdpa / [double]$idpa.Width))
$g.DrawImage($idpa, [int](($W - $anchoIdpa) / 2), $y, $anchoIdpa, $altoIdpa)
$idpa.Dispose()
$y += $altoIdpa + 30

$fWeb = Fuente 'Segoe UI' 36 ([System.Drawing.FontStyle]::Bold)
$g.DrawString('9x19shooting.com.ar', $fWeb, $brochaDorado, (New-Object System.Drawing.RectangleF 0, $y, $W, 48), $centro)
$y += 52
$fRed = Fuente 'Segoe UI' 30 ([System.Drawing.FontStyle]::Regular)
$g.DrawString('@9x19_shooting', $fRed, $gris, (New-Object System.Drawing.RectangleF 0, $y, $W, 42), $centro)

$g.Dispose()
$bmp.Save($salida, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

"$salida  ${W}x${H}  $([int]((Get-Item $salida).Length/1KB)) KB"
