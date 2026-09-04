// EL FORMULARIO DE INSCRIPCIÓN
//
// Arma la página con los datos del torneo que sale de la dirección
// (`?t=esperanza`, de `torneos.js`), calcula cuánto hay que transferir a
// medida que se completa, y manda todo a la Cloud Function `inscribirse`,
// que es la que anota la inscripción y despacha los dos correos.
//
// Lo que se valida acá es para que la persona se entere en el momento y
// no después de enviar. **La validación que manda es la de la función**:
// lo que sale de un navegador es dato, no verdad.

(function () {
  'use strict';

  const INSCRIBIRSE =
    'https://us-central1-x19shooting-sync.cloudfunctions.net/inscribirse';

  // Las divisiones, las clases y las categorías son las de IDPA y no
  // cambian de un torneo a otro: por eso viven acá y no en `torneos.js`,
  // que es lo que se edita en cada torneo. Un torneo que corra solo
  // algunas divisiones las recorta con `divisiones: [...]` en su bloque.
  const DIVISIONES = [
    { valor: 'CDP', texto: 'CDP — Custom Defensive Pistol' },
    { valor: 'ESP', texto: 'ESP — Enhanced Service Pistol' },
    { valor: 'SSP', texto: 'SSP — Stock Service Pistol' },
    { valor: 'CCP', texto: 'CCP — Compact Carry Pistol' },
    { valor: 'PCC', texto: 'PCC — Pistol Cartridge Carbine' },
    { valor: 'CO', texto: 'CO — Carry Optic' },
  ];

  const CLASES = [
    { valor: 'NV', texto: 'Novicio (NV)' },
    { valor: 'MM', texto: 'Marksman (MM)' },
    { valor: 'SS', texto: 'Sharpshooter (SS)' },
    { valor: 'EX', texto: 'Expert (EX)' },
    { valor: 'MA', texto: 'Master (MA)' },
    { valor: 'UN', texto: 'Sin clasificación (UN) — invitado' },
  ];

  const CATEGORIAS = [
    { valor: 'Lady', texto: 'Lady' },
    { valor: 'Senior', texto: 'Senior (+50)' },
    { valor: 'SuperSenior', texto: 'Super Senior (+65)' },
  ];

  // El comprobante. Las fotos de celular pesan varios megas y se achican
  // antes de mandarlas; los PDF viajan tal cual, con un tope.
  const LADO_MAYOR = 1600;
  const CALIDAD = 0.82;
  const TOPE_PDF = 5 * 1024 * 1024;

  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // Qué torneo es

  const slug = new URLSearchParams(location.search).get('t') || '';
  const torneo = (window.TORNEOS || {})[slug];

  if (!torneo) {
    $('sin-torneo').hidden = false;
    return;
  }

  document.title = torneo.titulo + ' — Inscripción — Club 9x19 Shooting';
  $('t-titulo').textContent = torneo.titulo;

  const bajada = [];
  if (torneo.subtitulo) bajada.push(torneo.subtitulo);
  bajada.push(torneo.sede + ' · ' + torneo.ciudad);
  bajada.push(torneo.fecha);
  $('t-bajada').innerHTML = bajada.join('<br>');

  // ¿Todavía se puede inscribir? `cierra` es el último día que se acepta,
  // inclusive; se compara contra el día de hoy, no contra la hora, para
  // que el que entra a las once de la noche de ese día pueda anotarse.
  if (torneo.cierra && hoyEnTexto() > torneo.cierra) {
    $('cerrado').hidden = false;
    return;
  }

  function hoyEnTexto() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  // ------------------------------------------------------------------
  // Las opciones

  const form = $('inscripcion');
  form.hidden = false;

  function opciones(donde, nombre, lista, tipo) {
    $(donde).innerHTML = lista.map((o, i) => {
      const id = nombre + '-' + i;
      return (
        '<label class="opcion" for="' + id + '">' +
        '<input type="' + (tipo || 'radio') + '" id="' + id + '"' +
        ' name="' + nombre + '" value="' + o.valor + '">' +
        '<span>' + o.texto + '</span>' +
        '</label>'
      );
    }).join('');
  }

  const divisiones = torneo.divisiones
    ? DIVISIONES.filter((d) => torneo.divisiones.includes(d.valor))
    : DIVISIONES;

  opciones('opciones-division', 'division', divisiones);
  opciones('opciones-clase', 'clase', CLASES);
  opciones('opciones-categoria', 'categoria', CATEGORIAS);
  opciones('opciones-dia', 'dia', torneo.dias);
  opciones('opciones-segunda', 'segundaDivision', divisiones);

  if (torneo.horaComienzo) {
    $('ayuda-hora').textContent = 'El torneo comienza a las ' + torneo.horaComienzo + ' hs.';
  }

  // La división de la segunda arma solo aparece si dijo que corre con una.
  $('i-segunda').addEventListener('change', function () {
    $('grupo-segunda').hidden = !this.checked;
    if (!this.checked) {
      form.querySelectorAll('[name="segundaDivision"]').forEach((r) => { r.checked = false; });
    }
    recalcular();
  });

  // ------------------------------------------------------------------
  // Cuánto hay que transferir
  //
  // Se muestra para que la persona sepa qué transferir. El importe que
  // vale es el que calcula la función con su propia copia de los precios:
  // este número no viaja en el envío, justamente para que nadie lo edite.

  function plata(n) {
    return '$' + n.toLocaleString('es-AR');
  }

  // **Siempre el precio general, aunque haya cargado número de IDPA.** El
  // descuento de asociado se aplicó solo una versión y se sacó: ese número
  // no se consulta a ningún lado, así que cualquiera escribía cualquier
  // cosa y se cobraba solo cinco mil pesos menos. Lo del asociado lo
  // resuelve el club al mirar el comprobante.
  function recalcular() {
    const segunda = $('i-segunda').checked ? (torneo.precioSegundaArma || 0) : 0;

    $('p-total').textContent = plata(torneo.precio + segunda);

    const partes = ['Inscripción ' + plata(torneo.precio)];
    if (segunda) partes.push('Segunda arma ' + plata(segunda));
    $('p-desglose').textContent = partes.join(' · ');

    $('texto-compromiso').textContent =
      'Entiendo que tengo que transferir ' + plata(torneo.precio + segunda) +
      ' al alias ' + torneo.alias + ', y que la inscripción es un compromiso: ' +
      'solo se reintegra si se suspende el torneo.';
  }

  $('p-alias').textContent = torneo.alias;
  $('p-titular').textContent = torneo.titularAlias || '';
  $('p-nota').textContent = torneo.notaPago || '';
  recalcular();

  // ------------------------------------------------------------------
  // El comprobante
  //
  // Una foto de celular pesa 4 MB y no hace falta esa resolución para
  // leer una transferencia: se redibuja a 1600 px de lado mayor y queda
  // en menos de 500 kB. Si por lo que sea no se puede achicar —un formato
  // raro, un navegador viejo—, se manda el archivo original.

  const comprobante = $('i-comprobante');
  const elegido = $('archivo-elegido');

  comprobante.addEventListener('change', function () {
    const f = this.files && this.files[0];
    if (!f) { elegido.hidden = true; return; }
    elegido.hidden = false;
    elegido.textContent = 'Elegiste: ' + f.name;
  });

  function leerComoBase64(blob) {
    return new Promise((listo, mal) => {
      const lector = new FileReader();
      lector.onload = () => listo(String(lector.result).split(',')[1] || '');
      lector.onerror = () => mal(new Error('No se pudo leer el archivo'));
      lector.readAsDataURL(blob);
    });
  }

  async function prepararComprobante() {
    const f = comprobante.files && comprobante.files[0];
    if (!f) return null;

    if (f.type === 'application/pdf') {
      if (f.size > TOPE_PDF) {
        throw new Error('El PDF del comprobante pesa demasiado. Mandá una foto o una captura.');
      }
      return { nombre: f.name, tipo: f.type, datos: await leerComoBase64(f) };
    }

    if (!f.type.startsWith('image/')) {
      throw new Error('El comprobante tiene que ser una imagen o un PDF.');
    }

    try {
      const achicada = await achicar(f);
      return { nombre: cambiarAJpg(f.name), tipo: 'image/jpeg', datos: await leerComoBase64(achicada) };
    } catch (_) {
      return { nombre: f.name, tipo: f.type, datos: await leerComoBase64(f) };
    }
  }

  function cambiarAJpg(nombre) {
    return nombre.replace(/\.[^.]+$/, '') + '.jpg';
  }

  function achicar(archivo) {
    return new Promise((listo, mal) => {
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const escala = Math.min(1, LADO_MAYOR / Math.max(img.width, img.height));
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
        lienzo.toBlob(
          (b) => (b ? listo(b) : mal(new Error('No se pudo achicar'))),
          'image/jpeg',
          CALIDAD
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('No se pudo abrir la imagen')); };
      img.src = url;
    });
  }

  // ------------------------------------------------------------------
  // Validar y enviar

  const estado = form.querySelector('.estado');
  const enviar = form.querySelector('button[type="submit"]');

  function decir(texto, clase) {
    estado.textContent = texto;
    estado.className = 'estado' + (clase ? ' ' + clase : '');
  }

  function elegido_(nombre) {
    const r = form.querySelector('[name="' + nombre + '"]:checked');
    return r ? r.value : '';
  }

  // Marca en rojo lo que falta y devuelve el primer campo con problema,
  // para llevar la pantalla hasta ahí. Sin esto, en el celular, el aviso
  // queda abajo y el campo que falta arriba, fuera de la vista.
  function loQueFalta() {
    const problemas = [];

    form.querySelectorAll('.mal-campo').forEach((e) => e.classList.remove('mal-campo'));

    const textos = [
      ['i-apellido', 'el apellido'],
      ['i-nombre', 'el nombre'],
      ['i-correo', 'el correo'],
      ['i-direccion', 'la dirección'],
      ['i-dni', 'el DNI'],
      ['i-celular', 'el celular'],
      ['i-clu', 'el número de credencial'],
      ['i-clu-vence', 'el vencimiento de la credencial'],
    ];

    textos.forEach(([id, comoSeLlama]) => {
      const campo = $(id);
      if (!campo.value.trim()) problemas.push([campo, 'Falta ' + comoSeLlama]);
    });

    const correo = $('i-correo');
    if (correo.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.value.trim())) {
      problemas.push([correo, 'Revisá el correo: ahí te mandamos la confirmación']);
    }

    if (!elegido_('division')) problemas.push([$('grupo-division'), 'Elegí la división']);
    if (!elegido_('clase')) problemas.push([$('opciones-clase'), 'Elegí la clase']);
    if (!elegido_('dia')) problemas.push([$('opciones-dia'), 'Elegí qué día venís']);

    if ($('i-segunda').checked && !elegido_('segundaDivision')) {
      problemas.push([$('grupo-segunda'), 'Elegí la división de la segunda arma']);
    }

    if (!$('i-compromiso').checked) {
      problemas.push([$('i-compromiso'), 'Para inscribirte tenés que aceptar el compromiso de pago']);
    }

    problemas.forEach(([campo]) => campo.classList.add('mal-campo'));
    return problemas;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const problemas = loQueFalta();
    if (problemas.length) {
      const [campo, aviso] = problemas[0];
      decir(aviso, 'mal');
      campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (campo.focus) campo.focus({ preventScroll: true });
      return;
    }

    enviar.disabled = true;
    decir('Enviando…');

    let adjunto = null;
    try {
      adjunto = await prepararComprobante();
    } catch (err) {
      enviar.disabled = false;
      decir(err.message, 'mal');
      return;
    }

    const inscripcion = {
      torneo: slug,
      apellido: $('i-apellido').value.trim(),
      nombre: $('i-nombre').value.trim(),
      correo: $('i-correo').value.trim(),
      direccion: $('i-direccion').value.trim(),
      dni: $('i-dni').value.trim(),
      celular: $('i-celular').value.trim(),
      clu: $('i-clu').value.trim(),
      cluVence: $('i-clu-vence').value,
      idpa: $('i-idpa').value.trim(),
      division: elegido_('division'),
      clase: elegido_('clase'),
      categoria: elegido_('categoria'),
      dia: elegido_('dia'),
      segundaArma: $('i-segunda').checked,
      segundaDivision: $('i-segunda').checked ? elegido_('segundaDivision') : '',
      compromiso: $('i-compromiso').checked,
      botcheck: form.botcheck.checked,
      comprobante: adjunto,
    };

    try {
      const r = await fetch(INSCRIBIRSE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inscripcion),
      });
      const datos = await r.json().catch(() => ({}));

      if (r.ok && datos.ok) {
        form.hidden = true;
        $('listo-detalle').textContent =
          'Te mandamos la confirmación a ' + inscripcion.correo + ', con el resumen y ' +
          'cuánto transferir. Nos vemos en ' + torneo.sede + '.';
        $('listo').hidden = false;
        $('listo').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      decir(datos.error || 'No se pudo enviar la inscripción. Probá de nuevo o escribinos a 9x19shooting@gmail.com.', 'mal');
    } catch (_) {
      decir('No se pudo enviar, puede ser la conexión. Probá de nuevo, o escribinos a 9x19shooting@gmail.com.', 'mal');
    } finally {
      enviar.disabled = false;
    }
  });

  // El botón de borrar deja el formulario como estaba al abrirlo: sin eso,
  // el bloque de la segunda arma y el importe quedan como los dejó.
  form.addEventListener('reset', () => {
    setTimeout(() => {
      $('grupo-segunda').hidden = true;
      elegido.hidden = true;
      form.querySelectorAll('.mal-campo').forEach((e) => e.classList.remove('mal-campo'));
      decir('');
      recalcular();
    }, 0);
  });

})();
