$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# La cuarta fecha: fotos y videos.
#
# Las fotos salen en dos tamaños, como en las demás galerías —mini 480 px
# para la grilla, 1500 px para el visor— y los videos se copian tal cual:
# vienen de WhatsApp, ya comprimidos, y acá no hay ffmpeg para rehacerlos.

$origen = 'C:\Users\JOSE LUIS CHIAVAZZA\Desktop\Propuestas 2026  IDPA - FBI\Torneo Anual 2026 IDPA Jorge Pastor\Cuarta Fecha Santa Fe\FOTOS\PAGINA'
$dest   = "$env:USERPROFILE\Downloads\sitio-9x19\galeria\cuarta-fecha-santa-fe"

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

# --- las fotos
$fotos = Get-ChildItem $origen -File | Where-Object { $_.Extension -match '(?i)\.(jpg|jpeg|png)$' } | Sort-Object Name
$n = 0
foreach ($f in $fotos) {
  $n++
  $nombre = '{0:D2}.jpg' -f $n
  try { $img = [System.Drawing.Image]::FromFile($f.FullName) }
  catch { "  ERROR abriendo $($f.Name)"; continue }

  $m = Escalar $img 480;   Guardar $m (Join-Path $dMini $nombre) 78; $m.Dispose()
  $gr = Escalar $img 1500; Guardar $gr (Join-Path $dGran $nombre) 82; $gr.Dispose()
  $img.Dispose()
}

# --- los videos, tal cual
$videos = Get-ChildItem $origen -File | Where-Object { $_.Extension -match '(?i)\.(mp4|mov)$' } | Sort-Object Name
$v = 0
foreach ($f in $videos) {
  $v++
  Copy-Item $f.FullName (Join-Path $dVid ('{0:D2}.mp4' -f $v)) -Force
}

$pesoM = [math]::Round(((Get-ChildItem $dMini -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
$pesoG = [math]::Round(((Get-ChildItem $dGran -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
$pesoV = [math]::Round(((Get-ChildItem $dVid  -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
"cuarta-fecha-santa-fe: $n fotos (mini $pesoM MB, grandes $pesoG MB) y $v videos ($pesoV MB)"
