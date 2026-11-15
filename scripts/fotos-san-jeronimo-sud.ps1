$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# El 1er Torneo Social en San Jeronimo Sud, 14 y 15 de noviembre de 2026.
#
# Igual que scripts\fotos-quinta-fecha.ps1 -- mini de 480 px y 1500 px
# para el visor.
#
# ORDEN: por fecha de captura, no por nombre. Aca conviven fotos del
# celular (20261114_111125.jpg) y reenviadas por WhatsApp
# (IMG-20261114-WA0049.jpg): ordenadas por nombre, el 15 del celular
# quedaria antes que el 14 de WhatsApp, porque "2" va antes que "I". Se
# usa LastWriteTime, que en esta carpeta coincide con cuando se sacaron
# o se recibieron.

# El nombre de la carpeta lleva un grado (1° Torneo) y escribirlo aca lo
# rompe: este archivo esta en UTF-8 y PowerShell 5.1 lo lee como ANSI.
# Se la busca por patron.
$anio   = "$env:USERPROFILE\Desktop\Propuestas 2026  IDPA - FBI\2026"
$origen = (Get-ChildItem -LiteralPath $anio -Directory |
  Where-Object { $_.Name -like "*Torneo San Jeronimo Sud" } |
  Select-Object -First 1 |
  Get-ChildItem -Directory |
  Where-Object { $_.Name -eq "Fotos" }).FullName
if (-not $origen) { throw "no se encontro la carpeta de fotos" }
$dest   = "$env:USERPROFILE\Downloads\sitio-9x19\galeria\san-jeronimo-sud"

$jpgEnc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Guardar($bmp, $ruta, $calidad) {
  $p = New-Object System.Drawing.Imaging.EncoderParameters 1
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [int]$calidad)
  $bmp.Save($ruta, $jpgEnc, $p)
}

function Escalar($img, $max) {
  $esc = [Math]::Min($max / $img.Width, $max / $img.Height)
  if ($esc -gt 1) { $esc = 1 }
  $w = [int]($img.Width * $esc); $h = [int]($img.Height * $esc)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.SmoothingMode = 'HighQuality'
  $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()
  return $bmp
}

$dMini = Join-Path $dest 'mini'
$dGran = Join-Path $dest 'g'
New-Item -ItemType Directory -Force $dMini | Out-Null
New-Item -ItemType Directory -Force $dGran | Out-Null

$todas = Get-ChildItem -LiteralPath $origen -File |
  Where-Object { $_.Extension -match '(?i)\.(jpg|jpeg|png)$' } |
  Sort-Object LastWriteTime

# La primera foto es la que se ve en la tarjeta del torneo, asi que va
# una grupal: se elige mirando las miniaturas, no a ciegas.
$portada = $env:PORTADA_SJS

$fotos = @()
if ($portada) { $fotos += ($todas | Where-Object { $_.Name -eq $portada }) }
$fotos += ($todas | Where-Object { $_.Name -ne $portada })

$n = 0
foreach ($f in $fotos) {
  $n++
  $nombre = '{0:D2}.jpg' -f $n
  try { $img = [System.Drawing.Image]::FromFile($f.FullName) }
  catch { "  ERROR abriendo $($f.Name)"; continue }

  # Las del celular traen la orientacion en el EXIF y System.Drawing no
  # la aplica: sin esto, una foto vertical sale acostada.
  if ($img.PropertyIdList -contains 274) {
    switch ($img.GetPropertyItem(274).Value[0]) {
      3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
      6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
      8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
    }
  }

  $m = Escalar $img 480;   Guardar $m (Join-Path $dMini $nombre) 78; $m.Dispose()
  $gr = Escalar $img 1500; Guardar $gr (Join-Path $dGran $nombre) 82; $gr.Dispose()
  $img.Dispose()
  '  {0}  <-  {1}' -f $nombre, $f.Name
}

$pesoM = [math]::Round(((Get-ChildItem $dMini -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
$pesoG = [math]::Round(((Get-ChildItem $dGran -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
"san-jeronimo-sud: $n fotos (mini $pesoM MB, grandes $pesoG MB)"
