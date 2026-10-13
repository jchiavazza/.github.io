// LAS ESCUADRAS DE UN TORNEO
//
// Dos pantallas en una. Sin llave es para mirar: las cinco escuadras con
// quiénes están en cada una. Con `&k=<llave>` —la que cada inscripto
// recibe en su correo— aparece el botón para moverse.
//
// La llave no se guarda ni se muestra: viaja en la dirección, se usa para
// preguntar y para mover, y nada más. Mueve una sola inscripción.
//
// Acá no se decide nada: el servidor vuelve a revisar el cupo de la
// escuadra y si la inscripción sigue abierta.

(function () {
  'use strict';

  const ESCUADRAS =
    'https://us-central1-x19shooting-sync.cloudfunctions.net/escuadrasDelTorneo';
  const CAMBIAR =
    'https://us-central1-x19shooting-sync.cloudfunctions.net/cambiarDeEscuadra';

  const $ = (id) => document.getElementById(id);
  const parametros = new URLSearchParams(location.search);
  const slug = (parametros.get('t') || '').trim();
  const llave = (parametros.get('k') || '').trim();

  function decir(texto, mal) {
    $('aviso').textContent = texto || '';
    $('aviso').className = 'aviso-escuadras' + (mal ? ' mal' : '');
    $('aviso').hidden = !texto;
  }

  if (!slug) {
    decir('Falta el torneo en la dirección. Entrá desde la página del club.', true);
    return;
  }

  // El nombre y la fecha salen de `torneos.js`, el mismo archivo que usa
  // el formulario: así la pantalla dice algo aunque la consulta tarde.
  const torneo = (window.TORNEOS || {})[slug];
  if (torneo) {
    $('e-titulo').textContent = 'Escuadras · ' + torneo.titulo;
    $('e-datos').textContent = torneo.sede + ' · ' + torneo.fecha;
    document.title = 'Escuadras — ' + torneo.titulo;
  }

  let datos = null;

  function traer() {
    const url = ESCUADRAS + '?torneo=' + encodeURIComponent(slug) +
      (llave ? '&k=' + encodeURIComponent(llave) : '');
    return fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.ok) throw new Error(d && d.error ? d.error : 'sin datos');
        datos = d;
        dibujar();
      })
      .catch(() => {
        decir('No se pudieron traer las escuadras. Probá de nuevo en un rato.', true);
      });
  }

  function dibujar() {
    const t = datos.torneo || {};
    if (t.sede) $('e-datos').textContent = t.sede + ' · ' + t.fecha + (t.dia ? ' · ' + t.dia : '');

    // El cartel de arriba: quién sos, si la dirección traía tu llave.
    const soy = $('soy');
    if (llave && datos.mia) {
      soy.hidden = false;
      soy.className = 'soy';
      soy.innerHTML = datos.mia.escuadra
        ? 'Hola <b>' + esc(datos.mia.nombre) + '</b>: estás en la <b>escuadra ' +
          datos.mia.escuadra + '</b>. Podés moverte a cualquier otra que tenga lugar.'
        : 'Hola <b>' + esc(datos.mia.nombre) + '</b>: todavía no tenés escuadra. Elegí una.';
    } else if (llave) {
      soy.hidden = false;
      soy.className = 'soy mal';
      soy.textContent = 'Ese enlace no sirve: fijate de copiarlo entero desde tu correo. ' +
        'Mientras tanto, acá podés ver cómo van las escuadras.';
    } else {
      soy.hidden = true;
    }

    const puedeMoverse = !!(llave && datos.mia) && !t.cerrada;

    $('escuadras').innerHTML = (datos.escuadras || []).map((e) => {
      const llena = e.libres !== null && e.libres <= 0;
      const aca = !!(datos.mia && datos.mia.escuadra === e.numero);
      const quienes = e.tiradores.length
        ? e.tiradores.map((x) =>
            '<li>' + esc(x.apellido + ', ' + x.nombre) +
            ' <span>' + esc(x.division + ' ' + x.clase) + '</span></li>').join('')
        : '<li class="vacia">Todavía no eligió nadie</li>';

      const boton = puedeMoverse && !aca && !llena
        ? '<button class="boton mover" type="button" data-escuadra="' + e.numero + '">Moverme acá</button>'
        : '';

      return (
        '<div class="escuadra' + (llena ? ' completa' : '') + (aca ? ' aca' : '') + '">' +
        '<span class="cabeza"><b>Escuadra ' + e.numero + (aca ? ' — estás acá' : '') + '</b>' +
        '<span class="cuantos">' + (llena ? 'COMPLETA' : e.ocupados + '/' + e.tope) + '</span>' +
        '</span><ul>' + quienes + '</ul>' + boton + '</div>');
    }).join('');

    $('escuadras').querySelectorAll('.mover').forEach((b) => {
      b.addEventListener('click', () => mover(Number(b.dataset.escuadra), b));
    });

    if (t.cerrada) {
      decir('La inscripción ya cerró: las escuadras quedaron como están.');
    } else if (llave && datos.mia) {
      decir('');
    } else {
      decir('Para elegir o cambiar tu escuadra, entrá desde el enlace que te llegó por correo.');
    }
  }

  function mover(numero, boton) {
    boton.disabled = true;
    decir('Cambiando…');

    fetch(CAMBIAR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ torneo: slug, llave: llave, escuadra: numero }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.ok) throw new Error(d && d.error ? d.error : 'no se pudo');
        // Se vuelve a pedir todo: entre que se dibujó y se tocó el botón
        // pudo entrar alguien más en cualquier escuadra.
        return traer();
      })
      .catch((e) => {
        boton.disabled = false;
        decir(e.message || 'No se pudo cambiar. Probá de nuevo.', true);
      });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  traer();
})();
