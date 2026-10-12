$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# La quinta fecha en Esperanza, el Torneo Coronacion: fotos y videos.
#
# Igual que scripts\fotos-clinica-parana.ps1 — mini de 480 px y 1500 px
# para el visor; los videos se copian tal cual, que ya vienen comprimidos
# por WhatsApp.

$origen = (Get-Item "$env:USERPROFILE\Desktop\Propuestas 2026  IDPA - FBI\Torneo Anual 2026 IDPA Jorge Pastor\Quinta Fecha Coronacion Esperanza\FOTOS Y VIDEOS").FullName
$dest   = "$env:USERPROFILE\Downloads\sitio-9x19\galeria\quinta-fecha-esperanza"

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
$dVid  = Join-Path $dest 'v'
New-Item -ItemType Directory -Force $dMini | Out-Null
New-Item -ItemType Directory -Force $dGran | Out-Null
New-Item -ItemType Directory -Force $dVid  | Out-Null

# Todo vino por WhatsApp y el nombre trae la hora —"...at 08.48.15"—, asi
# que ordenar por nombre es ordenar la jornada. La portada va primero y es
# la que se ve en la tarjeta del torneo: se elige mirando el contacto.
$todas   = Get-ChildItem -LiteralPath $origen -File | Where-Object { $_.Extension -match '(?i)\.(jpg|jpeg|png)$' }
$portada = '1.jpeg'

# Sacadas con la camara frontal, que las guarda espejadas: en la grupal el
# cartel del club se leia al reves. Se dan vuelta al generarlas, no en la
# carpeta de origen, que no se toca.
$espejadas = @('1.jpeg')

$fotos = @($todas | Where-Object { $_.Name -eq $portada })
$fotos += ($todas | Where-Object { $_.Name -ne $portada } | Sort-Object Name)

$n = 0
foreach ($f in $fotos) {
  $n++
  $nombre = '{0:D2}.jpg' -f $n
  try { $img = [System.Drawing.Image]::FromFile($f.FullName) }
  catch { "  ERROR abriendo $($f.Name)"; continue }

  if ($espejadas -contains $f.Name) {
    $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
    "  dada vuelta: $($f.Name) -> $nombre"
  }

  $m = Escalar $img 480;   Guardar $m (Join-Path $dMini $nombre) 78; $m.Dispose()
  $gr = Escalar $img 1500; Guardar $gr (Join-Path $dGran $nombre) 82; $gr.Dispose()
  $img.Dispose()
}

$videos = Get-ChildItem -LiteralPath $origen -File |
  Where-Object { $_.Extension -match '(?i)\.(mp4|mov)$' } |
  Sort-Object Name
$v = 0
foreach ($f in $videos) {
  $v++
  Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $dVid ('{0:D2}.mp4' -f $v)) -Force
  '  video {0:D2}.mp4  <-  {1}' -f $v, $f.Name
}

$pesoM = [math]::Round(((Get-ChildItem $dMini -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
$pesoG = [math]::Round(((Get-ChildItem $dGran -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
$pesoV = [math]::Round(((Get-ChildItem $dVid  -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
"quinta-fecha-esperanza: $n fotos (mini $pesoM MB, grandes $pesoG MB) y $v videos ($pesoV MB)"
