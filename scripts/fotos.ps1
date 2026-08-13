Add-Type -AssemblyName System.Drawing

$raiz  = "$env:USERPROFILE\Downloads\sitio-9x19"
$orig  = "$raiz\Fotos"
$dest  = "$raiz\galeria"

# Nombre de carpeta -> slug y titulo que se muestra
$torneos = [ordered]@{
  'Primera Fecha Club Fenix' = @{ slug = 'primera-fecha-fenix';     titulo = 'Primera Fecha';  sede = 'Polígono de Tiro Fénix, San Luis' }
  'Primera Fecha Esperanza'  = @{ slug = 'primera-fecha-esperanza'; titulo = 'Primera Fecha';  sede = 'Tiro Federal de Esperanza, Santa Fe' }
  'Segunda Fecha Sant Fe'    = @{ slug = 'segunda-fecha-santa-fe';  titulo = 'Segunda Fecha';  sede = 'Tiro Federal Argentino de Santa Fe' }
  'Tercera Fecha Esperanza'  = @{ slug = 'tercera-fecha-esperanza'; titulo = 'Tercera Fecha';  sede = 'Tiro Federal de Esperanza, Santa Fe' }
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

$resumen = @()

foreach ($carpeta in $torneos.Keys) {
  $info = $torneos[$carpeta]
  $src  = Join-Path $orig $carpeta
  if (-not (Test-Path $src)) { "SIN CARPETA: $carpeta"; continue }

  $dMini = Join-Path $dest "$($info.slug)\mini"
  $dGran = Join-Path $dest "$($info.slug)\g"
  New-Item -ItemType Directory -Force $dMini | Out-Null
  New-Item -ItemType Directory -Force $dGran | Out-Null

  $fotos = Get-ChildItem $src -File | Where-Object { $_.Extension -match '(?i)\.(jpg|jpeg|png)$' } | Sort-Object Name
  $n = 0
  $fechas = @()
  foreach ($f in $fotos) {
    $n++
    $nombre = "{0:D2}.jpg" -f $n
    try {
      $img = [System.Drawing.Image]::FromFile($f.FullName)
    } catch { "  ERROR abriendo $($f.Name)"; continue }

    # Fecha: del nombre 20260411_... o de la fecha del archivo
    if ($f.BaseName -match '(20\d{6})') { $fechas += $matches[1] }

    $m = Escalar $img 480;  Guardar $m (Join-Path $dMini $nombre) 78; $m.Dispose()
    $gr = Escalar $img 1500; Guardar $gr (Join-Path $dGran $nombre) 82; $gr.Dispose()
    $img.Dispose()
  }

  $fecha = ($fechas | Sort-Object | Select-Object -First 1)
  $pesoM = [math]::Round(((Get-ChildItem $dMini -File | Measure-Object Length -Sum).Sum)/1MB, 1)
  $pesoG = [math]::Round(((Get-ChildItem $dGran -File | Measure-Object Length -Sum).Sum)/1MB, 1)
  "{0,-26} {1,3} fotos   mini {2,5} MB   grandes {3,5} MB   fecha {4}" -f $info.slug, $n, $pesoM, $pesoG, $fecha
  $resumen += [PSCustomObject]@{ slug = $info.slug; titulo = $info.titulo; sede = $info.sede; fotos = $n; fecha = $fecha }
}

"---"
$resumen | ConvertTo-Json -Compress | Set-Content "$env:TEMP\resumen-fotos.json" -Encoding utf8
"TOTAL: " + [math]::Round(((Get-ChildItem $dest -File -Recurse | Measure-Object Length -Sum).Sum)/1MB, 1) + " MB"
