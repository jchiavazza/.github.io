# -*- coding: utf-8 -*-
# Achica el gif de la bandera para usarlo en la barra del sitio: el original
# mide 500 px y pesa 1,3 MB, y ahí se ve a 128 px de alto.

import os
from PIL import Image, ImageSequence

raiz = os.path.expanduser(r'~\Downloads\sitio-9x19')
origen = os.path.join(raiz, 'originales', 'bandera-argentina.gif')
destino = os.path.join(raiz, 'assets', 'bandera.gif')

gif = Image.open(origen)
alto = 132
ancho = int(gif.width * (alto / gif.height))

cuadros = []
# todos los cuadros: en cámara lenta, saltearlos se notaría como tirones
for cuadro in ImageSequence.Iterator(gif):
    c = cuadro.convert('RGBA').resize((ancho, alto), Image.LANCZOS)
    # de vuelta a paleta, dejando transparente lo que lo era
    p = c.convert('RGB').convert('P', palette=Image.ADAPTIVE, colors=127)
    mascara = c.split()[3].point(lambda a: 255 if a <= 128 else 0)
    p.paste(255, mascara)
    cuadros.append(p)

cuadros[0].save(
    destino,
    save_all=True,
    append_images=cuadros[1:],
    duration=430,     # bien lento: un ciclo completo lleva unos 16 segundos
    loop=0,
    transparency=255,
    disposal=2,
    optimize=True)

print('bandera.gif  %dx%d  %d cuadros  %d KB  (original: %d KB)' % (
    ancho, alto, len(cuadros),
    os.path.getsize(destino) / 1024, os.path.getsize(origen) / 1024))
