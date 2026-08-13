# Uso: sin parametros genera el flyer con un fotograma fijo. Con -Frame y
# -Destino se puede pedir cualquier otro, que es lo que usa el animado.
param(
  [int]$Frame = 12,
  [string]$Destino = "$env:TEMP\calendario-nuevo.png"
)

Add-Type -AssemblyName System.Drawing

# Arma el flyer del calendario anual desde cero, con el escudo del club y el
# logo de IDPA. Para cambiar una fecha se edita la lista de abajo y se corre
# de nuevo: no hace falta abrir ningun editor de imagenes.

$raiz = "$env:USERPROFILE\Downloads\sitio-9x19"
$assets = Join-Path $raiz 'assets'
$salida = $Destino

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

# Fondo: la bandera del gif, puesta de pie —girada un cuarto de vuelta, así
# las franjas quedan verticales— y estirada a todo el flyer. Encima va un
# velo oscuro para que el texto claro se lea.
$arriba = [System.Drawing.Color]::FromArgb(22, 26, 34)
$abajo  = [System.Drawing.Color]::FromArgb(34, 38, 46)
$brochaFondo = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 0, $H), $arriba, $abajo)
$g.FillRectangle($brochaFondo, 0, 0, $W, $H)
$brochaFondo.Dispose()

$gif = [System.Drawing.Image]::FromFile((Join-Path $raiz 'originales/bandera-argentina.gif'))
$dim = New-Object System.Drawing.Imaging.FrameDimension $gif.FrameDimensionsList[0]
$gif.SelectActiveFrame($dim, $Frame) | Out-Null

$plana = New-Object System.Drawing.Bitmap $gif.Width, $gif.Height
$gp = [System.Drawing.Graphics]::FromImage($plana)
$gp.DrawImage($gif, 0, 0, $gif.Width, $gif.Height)
$gp.Dispose(); $gif.Dispose()
$plana.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone)

$matriz = New-Object System.Drawing.Imaging.ColorMatrix
$matriz.Matrix33 = 0.92
$atrib = New-Object System.Drawing.Imaging.ImageAttributes
$atrib.SetColorMatrix($matriz)
$todo = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$g.DrawImage($plana, $todo, 0, 0, $plana.Width, $plana.Height, [System.Drawing.GraphicsUnit]::Pixel, $atrib)
$atrib.Dispose(); $plana.Dispose()

# Velo oscuro encima
$velo = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 0, $H),
  ([System.Drawing.Color]::FromArgb(96, 14, 16, 22)),
  ([System.Drawing.Color]::FromArgb(96, 30, 28, 24)))
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


# Sobre la bandera hace falta sombra: si no, el texto claro desaparece en la
# franja blanca.
function ConSombra($g, $texto, $fuente, $brocha, $caja, $formato) {
  $sombra = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(170, 0, 0, 0))
  $corrida = New-Object System.Drawing.RectangleF ($caja.X + 2), ($caja.Y + 2), $caja.Width, $caja.Height
  $g.DrawString($texto, $fuente, $sombra, $corrida, $formato)
  $sombra.Dispose()
  $g.DrawString($texto, $fuente, $brocha, $caja, $formato)
}

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
$sombraTitulo = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150, 0, 0, 0))
$g.DrawString($t1, $fTitulo, $sombraTitulo, ($x + 3), ($y + 3))
$g.DrawString($t2, $fTitulo, $sombraTitulo, ($x + $a1 + 3), ($y + 3))
$sombraTitulo.Dispose()
$g.DrawString($t1, $fTitulo, $blanco, $x, $y)
$g.DrawString($t2, $fTitulo, $brochaDorado, ($x + $a1), $y)
$y += 108

$fSub = Fuente 'Segoe UI' 34 ([System.Drawing.FontStyle]::Regular)
$gris = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(168, 160, 148))
ConSombra $g 'Fechas tentativas año 2026' $fSub $blanco (New-Object System.Drawing.RectangleF 0, $y, $W, 44) $centro
$y += 62

# Línea separadora
$lapiz2 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 216, 180, 88)), 2
$g.DrawLine($lapiz2, 120, $y, $W - 120, $y)
$lapiz2.Dispose()
$y += 34

# --- las fechas

$fMes = Fuente 'Segoe UI Semibold' 31 ([System.Drawing.FontStyle]::Bold)
$fDia = Fuente 'Segoe UI' 42 ([System.Drawing.FontStyle]::Bold)
$fSede = Fuente 'Segoe UI' 26 ([System.Drawing.FontStyle]::Regular)
$fTipo = Fuente 'Segoe UI' 22 ([System.Drawing.FontStyle]::Italic)

$xMes = 380      # los meses terminan acá
$xDia = 560      # los días terminan acá
$xSede = 584     # las sedes empiezan acá
$paso = 76

$derecha = New-Object System.Drawing.StringFormat
$derecha.Alignment = [System.Drawing.StringAlignment]::Far

# Panel oscuro detrás de las fechas: la bandera se ve entera alrededor y el
# texto igual se lee.
$altoPanel = $fechas.Count * $paso + 26
$panel = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(168, 12, 14, 20))
$g.FillRectangle($panel, 64, ($y - 14), ($W - 128), $altoPanel)
$panel.Dispose()

foreach ($f in $fechas) {
  # punto rojo
  $r = 13
  $cx = 150; $cy = $y + 26
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
ConSombra $g '9x19shooting.com.ar' $fWeb $brochaDorado (New-Object System.Drawing.RectangleF 0, $y, $W, 48) $centro
$y += 52
$fRed = Fuente 'Segoe UI' 30 ([System.Drawing.FontStyle]::Regular)
ConSombra $g '@9x19_shooting' $fRed $blanco (New-Object System.Drawing.RectangleF 0, $y, $W, 42) $centro

$g.Dispose()
$bmp.Save($salida, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

"$salida  ${W}x${H}  $([int]((Get-Item $salida).Length/1KB)) KB"
