# -*- coding: utf-8 -*-
# Códigos QR de los formularios de inscripción. De cada uno salen dos: uno
# chico para la tarjeta del sitio y uno grande para imprimir en el flyer.

import os
import qrcode
from qrcode.constants import ERROR_CORRECT_Q

raiz = os.path.expanduser(r'~\Downloads\sitio-9x19')
web = os.path.join(raiz, 'assets', 'qr')
impresion = os.path.join(raiz, 'originales', 'qr')
for d in (web, impresion):
    if not os.path.isdir(d):
        os.makedirs(d)

# Esperanza y Santa Fe apuntan al formulario propio del sitio. Parana
# sigue en JotForm: es una charla unica y no vale la pena moverla.
fechas = [
    ('tucuman',  'https://form.jotform.com/260535458428665'),
    ('santa-fe', 'https://9x19shooting.com.ar/inscripcion/?t=santa-fe'),
    ('parana',   'https://form.jotform.com/253155748498674'),
    ('esperanza','https://9x19shooting.com.ar/inscripcion/?t=esperanza'),
]

for nombre, url in fechas:
    for carpeta, caja, borde in ((web, 8, 2), (impresion, 30, 4)):
        # Corrección de errores alta: un QR impreso puede ensuciarse o
        # taparse en parte y se sigue leyendo.
        qr = qrcode.QRCode(error_correction=ERROR_CORRECT_Q, box_size=caja, border=borde)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')
        ruta = os.path.join(carpeta, nombre + '.png')
        img.save(ruta)
        print('%-42s %sx%s  %d KB' % (
            os.path.relpath(ruta, raiz), img.size[0], img.size[1],
            os.path.getsize(ruta) / 1024))
