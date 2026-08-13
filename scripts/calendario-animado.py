# -*- coding: utf-8 -*-
# Arma el calendario animado: pide a calendario.ps1 un flyer por cada
# fotograma de la bandera y los une en un gif que se repite solo.
#
#   python scripts/calendario-animado.py
#
# El gif queda en originales/difundir/calendario-animado.gif

import io, os, subprocess, sys, tempfile
from PIL import Image

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
generador = os.path.join(raiz, 'scripts', 'calendario.ps1')

# De los 37 fotogramas del gif de la bandera se toma uno de cada dos: el
# movimiento se sigue viendo y el archivo pesa la mitad.
fotogramas = list(range(0, 36, 2))

# Ancho y cantidad de colores por línea de comandos: el gif para difundir se
# quiere grande, y el del sitio, liviano.
#   python scripts/calendario-animado.py 640 256 calendario-animado.gif
ancho_final = int(sys.argv[1]) if len(sys.argv) > 1 else 640
colores = int(sys.argv[2]) if len(sys.argv) > 2 else 256
nombre = sys.argv[3] if len(sys.argv) > 3 else 'calendario-animado.gif'

carpeta = tempfile.mkdtemp(prefix='cal-')
cuadros = []

for i, f in enumerate(fotogramas):
    destino = os.path.join(carpeta, 'cuadro-%02d.png' % i)
    subprocess.run(
        ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass',
         '-File', generador, '-Frame', str(f), '-Destino', destino],
        check=True, capture_output=True)
    img = Image.open(destino).convert('RGB')
    alto = int(img.height * (ancho_final / img.width))
    chico = img.resize((ancho_final, alto), Image.LANCZOS)
    if colores < 256:
        chico = chico.convert('P', palette=Image.ADAPTIVE, colors=colores)
    cuadros.append(chico)
    sys.stdout.write('.')
    sys.stdout.flush()

print('')

salida = os.path.join(raiz, 'originales', 'difundir', nombre)
cuadros[0].save(
    salida,
    save_all=True,
    append_images=cuadros[1:],
    duration=90,      # milisegundos por cuadro
    loop=0,           # se repite para siempre
    optimize=True)

print('%s  %dx%d  %d cuadros  %d KB' % (
    os.path.basename(salida), cuadros[0].width, cuadros[0].height,
    len(cuadros), os.path.getsize(salida) / 1024))
