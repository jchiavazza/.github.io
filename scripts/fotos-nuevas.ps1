Add-Type -AssemblyName System.Drawing

# Procesa las carpetas de fotos que se dejan sueltas dentro de torneos\.
# De cada foto salen dos versiones en galeria\<slug>: una miniatura para la
# grilla y una de 1500 px para el visor. Los originales no se tocan: hay que
# sacarlos a mano de torneos\ cuando el resultado esté conforme.

$raiz  = "$env:USERPROFILE\Downloads\sitio-9x19"
$orig  = Join-Path $raiz 'torneos'
$dest  = Join-Path $raiz 'galeria'

$carpetas = [ordered]@{
  'Clinica y Clasificacion Esperanza Santa Fe' = 'clinica-esperanza'
  'Clinica y Clasificacion en San Luis'        = 'clinica-san-luis'
  'Torneo Tiro Federal de Santa Fe'            = 'torneo-santa-fe-marzo'
  'Clinica y Clasificacion en Tucuman'         = 'clinica-tucuman'
}

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

foreach ($carpeta in $carpetas.Keys) {
  $slug = $carpetas[$carpeta]
  $src = Join-Path $orig $carpeta
  if (-not (Test-Path $src)) { "SIN CARPETA: $carpeta"; continue }

  $dMini = Join-Path $dest "$slug\mini"
  $dGran = Join-Path $dest "$slug\g"
  New-Item -ItemType Directory -Force $dMini | Out-Null
  New-Item -ItemType Directory -Force $dGran | Out-Null

  $fotos = Get-ChildItem $src -File | Where-Object { $_.Extension -match '(?i)\.(jpg|jpeg|png)$' } | Sort-Object Name
  $n = 0
  foreach ($f in $fotos) {
    $n++
    $nombre = "{0:D2}.jpg" -f $n
    try { $img = [System.Drawing.Image]::FromFile($f.FullName) }
    catch { "  ERROR abriendo $($f.Name)"; continue }

    $m = Escalar $img 480;  Guardar $m (Join-Path $dMini $nombre) 78; $m.Dispose()
    $gr = Escalar $img 1500; Guardar $gr (Join-Path $dGran $nombre) 82; $gr.Dispose()
    $img.Dispose()
  }

  $pesoM = [math]::Round(((Get-ChildItem $dMini -File | Measure-Object Length -Sum).Sum)/1MB, 1)
  $pesoG = [math]::Round(((Get-ChildItem $dGran -File | Measure-Object Length -Sum).Sum)/1MB, 1)
  "{0,-24} {1,3} fotos   mini {2,5} MB   grandes {3,5} MB" -f $slug, $n, $pesoM, $pesoG
}
