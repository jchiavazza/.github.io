# -*- coding: utf-8 -*-
"""Pone en cada galeria un resumen con lo que de verdad paso en ese torneo.

    python scripts/resumen-de-cada-torneo.py

POR QUE EXISTE
Search Console marcaba las galerias como "Rastreada: actualmente sin
indexar". No era un error de configuracion --estan en el sitemap, sin
noindex, enlazadas desde el home y con su canonical--: es que cada una
tenia 275 caracteres de texto y las doce eran casi identicas, porque las
fotos las arma JavaScript y de texto propio solo estaban el titulo, la
sede y la fecha. Google rastrea eso y decide que no vale la pena.

Lo unico que cambia ese veredicto es contenido propio, y el club ya lo
tiene publicado: la tabla en vivo de cada fecha guarda cuantos corrieron,
cuantos escenarios se tiraron y quien gano la general. De ahi sale el
resumen, asi que no hay nada escrito a mano que pueda quedar viejo o
decir algo que no paso.

Los torneos sin tabla publicada --las clinicas viejas, los anteriores a
la app-- se saltean y quedan como estaban: inventarles un parrafo seria
peor que no tenerlo.

El bloque se reescribe entero en cada corrida, asi que correrlo de nuevo
despues de corregir una tabla actualiza el texto.
"""
import io
import json
import os
import re
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TABLA = 'https://resultadosenvivo-4bizhyonoq-uc.a.run.app?c='
ENVIVO = 'https://9x19shooting.com.ar/envivo/?c='

# La clave publica de cada torneo --la corta, la que ya esta en la
# direccion de /envivo/--, no el codigo del match: ese es la llave para
# escribir y no se publica nunca.
TORNEOS = {
    'primera-fecha-esperanza': 'TJ5F3',
    'segunda-fecha-santa-fe':  'H3ZGP',
    'tercera-fecha-esperanza': 'ZUJX2',
    'cuarta-fecha-santa-fe':   'Y78GA',
    'quinta-fecha-esperanza':  'BWPR2',
    'clinica-parana':          'Z5ZLH',
    'san-jeronimo-sud':        'GX4A2',
}

INICIO = '    <!-- resumen: lo arma scripts/resumen-de-cada-torneo.py -->'
FIN = '    <!-- fin del resumen -->'


def bajar(clave):
    with urllib.request.urlopen(TABLA + clave, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def como_nombre(fila):
    """APELLIDO, NOMBRE SEGUNDO -> Apellido, Nombre."""
    def bonito(t):
        return ' '.join(p.capitalize() for p in (t or '').split())
    nombre = bonito(fila.get('nombre')).split(' ')[0]
    return (bonito(fila.get('apellido')) + ', ' + nombre).strip(', ')


def plural(n, uno, varios):
    return ('%d %s' % (n, uno)) if n == 1 else ('%d %s' % (n, varios))


def resumen(clave):
    d = bajar(clave)
    # **Todas las filas, tambien las de los descalificados.** En la tabla
    # el DQ va con `compite: false`, que es lo que lo deja afuera del
    # podio; pero corrio, estuvo en la cancha y ocupo una planilla, asi
    # que filtrarlo aca daria un numero mas chico que el que vio
    # cualquiera que fue. En San Jeronimo eran 30 y quedaban 28.
    gente = list(d.get('general') or [])
    if not gente:
        return None

    escenarios = max((len(f.get('escenarios') or []) for f in gente), default=0)
    divisiones = [x for x in (d.get('divisiones') or []) if x]

    # **El ganador solo cuando el torneo termino.** A mitad de match el
    # puesto 1 es el mejor DE LOS QUE YA TERMINARON --con uno solo
    # completo, el unico que termino--: publicarlo como campeon seria
    # mentir, y encima quedaria escrito.
    #
    # Lo dice `congelado` o `final`, las marcas que pone el disparador
    # cuando la tabla deja de recalcularse... salvo en los torneos
    # anteriores al 21/9/2026, que son de antes de que eso existiera. Por
    # eso vale tambien que **haya terminado la mayoria**: un torneo
    # corrido tiene a casi todos completos --22 de 23 en la primera
    # fecha, 31 de 34 en la segunda, porque siempre hay quien se retira--
    # y uno en disputa tiene a casi nadie: 1 de 12 en Tucuman a media
    # manana. Entre esos dos no hay zona gris.
    completos = [f for f in gente if f.get('completo')]
    corriendo = [f for f in gente if not f.get('dq')]
    termino = (bool(d.get('congelado') or d.get('final')) or
               len(completos) > len(corriendo) / 2)
    gano = None
    if termino:
        gano = next((f for f in gente if f.get('puesto') == 1 and f.get('completo')), None)

    texto = 'Corrieron <strong>' + plural(len(gente), 'tirador', 'tiradores') + '</strong>'
    if escenarios:
        texto += ' en ' + plural(escenarios, 'escenario', 'escenarios')
    if len(divisiones) > 1:
        texto += (', repartidos en ' + plural(len(divisiones), 'división', 'divisiones') +
                  ' (' + ', '.join(divisiones) + ')')
    texto += '.'

    # Quien gano, si el torneo llego a tener una general cerrada. Lo que
    # no se cuenta es cuantos se fueron en DQ: esta en la tabla, que
    # queda a un clic, y aca seria senalar a alguien de arriba.
    if gano:
        texto += (' La general la ganó <strong>' + como_nombre(gano) + '</strong>, de ' +
                  gano.get('division', '') + '.')

    return (texto, len(gente), not gano)


def bloque(texto, clave):
    return '\n'.join([
        INICIO,
        '    <section class="resumen-torneo">',
        '      <p>' + texto + '</p>',
        '      <p><a href="' + ENVIVO + clave + '">Ver la tabla de resultados completa</a></p>',
        '    </section>',
        FIN,
    ])


def main():
    hechos = 0
    for slug, clave in sorted(TORNEOS.items()):
        pagina = os.path.join(RAIZ, 'torneos', slug, 'index.html')
        if not os.path.exists(pagina):
            print('  falta la pagina de', slug)
            continue

        r = resumen(clave)
        if not r:
            print('  sin datos:', slug)
            continue
        texto, cuantos, enCurso = r
        aviso = '   (EN CURSO: sin ganador; volver a correrlo al terminar)' if enCurso else ''

        s = io.open(pagina, encoding='utf-8', newline='').read()
        fin = '\r\n' if '\r\n' in s else '\n'
        nuevo = bloque(texto, clave).replace('\n', fin)

        if INICIO in s:
            s = re.sub(re.escape(INICIO) + '.*?' + re.escape(FIN), nuevo, s, flags=re.S)
        else:
            # Arriba de la grilla de fotos, que es donde se lee.
            ancla = '  <section>' + fin + '    <div id="galeria"'
            if ancla not in s:
                print('  no se encontro donde ponerlo en', slug)
                continue
            s = s.replace(ancla, nuevo + fin + fin + ancla, 1)

        io.open(pagina, 'w', encoding='utf-8', newline='').write(s)
        print('  %-24s %d tiradores%s' % (slug, cuantos, aviso))
        hechos += 1

    print('%d galerias con su resumen' % hechos)


if __name__ == '__main__':
    main()
