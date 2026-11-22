$ErrorActionPreference = 'Stop'

# Los videos del 1er Torneo en el Tiro Federal de Tucuman, 21 y 22 de
# noviembre de 2026. Van a galeria\san-jeronimo-sud\v\NN.mp4, con su fotograma de
# portada en v\mini\NN.jpg, que es lo que la grilla muestra: el video
# recien se descarga cuando alguien lo abre.
#
# POR QUE NO SE COPIAN Y LISTO
# Lo que entra aca queda para siempre en el historial del repositorio y
# se lo baja entero cualquiera que abra el video desde el celular. Uno
# de esta tanda venia del celular en 1920x1080 a 17 Mbps -- 22 MB por
# 10 segundos -- y recomprimido quedo en 2,1 MB.
#
# PERO UN BITRATE ALTO NO SIEMPRE SOBRA, y por eso no alcanza con medir.
# Cinco de estos venian en 480x854 a mas de 3 Mbps, que parece cinco
# veces lo que esa resolucion necesita; recomprimidos a crf 27 salieron
# MAS GRANDES que el original, y a crf 30 exactamente iguales. Son 60
# fps reales --se conto con mpdecimate: 301 cuadros unicos de 301-- y de
# mucho movimiento, asi que el encoder del telefono ya habia hecho un
# buen trabajo. Bajarlos a 30 fps tampoco achicaba, y ahi se perderia
# fluidez justo en lo que se quiere ver.
#
# De ahi la regla: se intenta recomprimir y **se mira el resultado**. Si
# no achica al menos un 15%, se descarta y se copia el original con
# -movflags +faststart, que mueve el indice al principio del archivo
# para que el video arranque sin bajarse entero. Tambien se copia, sin
# intentar nada, el que ya viene chico y liviano.

$FFMPEG  = 'C:\Program Files\HitPaw Video Converter\ffmpeg.exe'
$FFPROBE = 'C:\Program Files\HitPaw Video Converter\ffprobe.exe'
foreach ($exe in @($FFMPEG, $FFPROBE)) {
  if (-not (Test-Path -LiteralPath $exe)) { throw "no esta $exe" }
}

# El nombre de la carpeta lleva un grado (1 grado Torneo) y escribirlo
# aca lo rompe: este archivo esta en UTF-8 y PowerShell 5.1 lo lee como
# ANSI. Se la busca por patron, igual que en fotos-san-jeronimo-sud.ps1.
$anio   = "$env:USERPROFILE\Desktop\Propuestas 2026  IDPA - FBI\2026"
$origen = (Get-ChildItem -LiteralPath $anio -Directory |
  Where-Object { $_.Name -like "*Torneo Tucuman" } |
  Select-Object -First 1 |
  Get-ChildItem -Directory |
  Where-Object { $_.Name -eq "Fotos y Videos" }).FullName
if (-not $origen) { throw "no se encontro la carpeta de videos" }

$dest = "$env:USERPROFILE\Downloads\sitio-9x19\galeria\torneo-tucuman"
$dVid  = Join-Path $dest 'v'
$dMini = Join-Path $dVid  'mini'
New-Item -ItemType Directory -Force $dVid  | Out-Null
New-Item -ItemType Directory -Force $dMini | Out-Null

# Arriba de esto se recomprime. 2 Mbps alcanza de sobra para lo que se
# ve en la cancha, y es lo que ya traen los que vienen bien.
$TOPE_KBPS  = 2000
$ANCHO_MAX  = 720

function Medir($ruta) {
  $j = & $FFPROBE -v error -select_streams v:0 `
       -show_entries 'stream=width,height,bit_rate' `
       -show_entries 'format=duration,size' -of json $ruta | ConvertFrom-Json
  $s = $j.streams[0]
  $kbps = [math]::Round(([double]$j.format.size * 8) / [double]$j.format.duration / 1000)
  return [pscustomobject]@{
    Ancho = [int]$s.width; Alto = [int]$s.height
    Segundos = [double]$j.format.duration; Kbps = $kbps
  }
}

# Por nombre, como las fotos: son todos de WhatsApp y el nombre lleva la
# fecha adelante. Y comparten carpeta con las fotos, asi que hay que
# filtrar por extension.
$todos = Get-ChildItem -LiteralPath $origen -File |
  Where-Object { $_.Extension -match '(?i)\.(mp4|mov)$' } |
  Sort-Object Name

# **En la grilla los videos van antes que las fotos**, asi que el
# primero es lo primero que ve el que entra a la galeria. Por fecha le
# tocaba al del armado --una camioneta vista desde el galpon-- y va uno
# de cancha adelante, por lo mismo que las fotos fuerzan una grupal a la
# cabeza. El resto queda en orden.
$primero = $env:PRIMER_VIDEO_TUC
$videos = @()
if ($primero) { $videos += ($todos | Where-Object { $_.Name -eq $primero }) }
$videos += ($todos | Where-Object { $_.Name -ne $primero })

$n = 0
foreach ($f in $videos) {
  $n++
  $salida = Join-Path $dVid ('{0:D2}.mp4' -f $n)
  $m = Medir $f.FullName
  $pesaba = [math]::Round($f.Length / 1MB, 1)

  if ($m.Kbps -gt $TOPE_KBPS -or $m.Ancho -gt $ANCHO_MAX) {
    # Se prueba aparte, para poder descartarlo si no sirvio.
    $prueba = Join-Path $env:TEMP ('x19-' + [guid]::NewGuid().ToString('N') + '.mp4')
    # No agranda al que ya es mas chico que el tope: min(ANCHO, iw).
    # El -2 deja que el alto salga par, que lo exige yuv420p.
    & $FFMPEG -y -v error -i $f.FullName `
      -vf "scale='min($ANCHO_MAX,iw)':-2" `
      -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p `
      -c:a aac -b:a 128k -movflags +faststart $prueba

    if ((Get-Item $prueba).Length -lt $f.Length * 0.85) {
      Move-Item -LiteralPath $prueba -Destination $salida -Force
      $que = 'recomprimido'
    } else {
      # No valio la pena: el original ya estaba bien comprimido para lo
      # que muestra. Se copia tal cual.
      Remove-Item -LiteralPath $prueba -Force
      & $FFMPEG -y -v error -i $f.FullName -c copy -movflags +faststart $salida
      $que = 'copiado (recomprimir no achicaba)'
    }
  } else {
    & $FFMPEG -y -v error -i $f.FullName -c copy -movflags +faststart $salida
    $que = 'copiado'
  }

  # El fotograma de portada: a los 2 segundos, para no agarrar el negro
  # del arranque ni una mano tapando la camara.
  $enMini = Join-Path $dMini ('{0:D2}.jpg' -f $n)
  $cuando = [math]::Min(2, [math]::Max(0, $m.Segundos - 0.5))
  & $FFMPEG -y -v error -ss $cuando -i $f.FullName -frames:v 1 `
    -vf "scale='min(480,iw)':-2" -q:v 3 $enMini

  $ahora = [math]::Round((Get-Item $salida).Length / 1MB, 1)
  '  {0:D2}.mp4  <-  {1}   {2}x{3} {4} kb/s {5}s   {6}: {7} MB -> {8} MB' -f `
    $n, $f.Name, $m.Ancho, $m.Alto, $m.Kbps, [math]::Round($m.Segundos), $que, $pesaba, $ahora
}

$peso = [math]::Round(((Get-ChildItem $dVid -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
$pesoM = [math]::Round(((Get-ChildItem $dMini -File | Measure-Object Length -Sum).Sum) / 1MB, 2)
$antes = [math]::Round((($videos | Measure-Object Length -Sum).Sum) / 1MB, 1)
"torneo-tucuman: $n videos, $antes MB -> $peso MB (portadas $pesoM MB)"
