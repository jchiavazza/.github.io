$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# La clínica y clasificación de Paraná: fotos y videos.
#
# Igual que scripts\fotos-cuarta-fecha.ps1 — mini de 480 px y 1500 px para
# el visor; los videos se copian tal cual, que ya vienen comprimidos.

$origen = (Get-Item "$env:USERPROFILE\Desktop\Propuestas 2026  IDPA - FBI\Clasificacion Parn*\FOTOS Y VIDEOS\Para la Pagina Web").FullName
$dest   = "$env:USERPROFILE\Downloads\sitio-9x19\galeria\clinica-parana"

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

# El orden: primero la foto grupal, que es la que se ve en la tarjeta del
# torneo; despues el resto por fecha de captura y no por nombre —conviven
# fotos del celular (20260925_...), de WhatsApp (IMG-...) y descargadas
# (WhatsApp Image...), que por nombre quedarian con los tres dias
# mezclados—; y al final las dos planillas de resultados, que son tablas
# y no fotos.
$todas   = Get-ChildItem -LiteralPath $origen -File | Where-Object { $_.Extension -match '(?i)\.(jpg|jpeg|png)$' }
$portada = 'WhatsApp Image 2026-09-28 at 09.35.54.jpeg'
$ultimas = @('Sabado.png', 'Domingo.png')

$fotos = @($todas | Where-Object { $_.Name -eq $portada })
$fotos += ($todas | Where-Object { $_.Name -ne $portada -and $ultimas -notcontains $_.Name } | Sort-Object LastWriteTime)
foreach ($u in $ultimas) { $fotos += ($todas | Where-Object { $_.Name -eq $u }) }

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

$videos = Get-ChildItem -LiteralPath $origen -File |
  Where-Object { $_.Extension -match '(?i)\.(mp4|mov)$' } |
  Sort-Object LastWriteTime
$v = 0
foreach ($f in $videos) {
  $v++
  Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $dVid ('{0:D2}.mp4' -f $v)) -Force
  '  video {0:D2}.mp4  <-  {1}' -f $v, $f.Name
}

$pesoM = [math]::Round(((Get-ChildItem $dMini -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
$pesoG = [math]::Round(((Get-ChildItem $dGran -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
$pesoV = [math]::Round(((Get-ChildItem $dVid  -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
"clinica-parana: $n fotos (mini $pesoM MB, grandes $pesoG MB) y $v videos ($pesoV MB)"
