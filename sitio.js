// La portada funciona como pantallas: se ve una sección por vez y el menú
// cambia cuál, sin recargar. La dirección se actualiza igual (#donde,
// #contacto…), así el botón atrás del navegador y los enlaces compartidos
// siguen funcionando. Sin JavaScript se ven todas seguidas, como antes.

(function () {
  const principal = document.querySelector('main');
  if (!principal || !document.getElementById('inicio')) return;

  const pantallas = Array.from(principal.children).filter((n) => n.id);
  const menu = document.querySelectorAll('.barra nav a[href^="#"]');
  if (!pantallas.length) return;

  document.body.classList.add('por-pantallas');

  function mostrar(id, mover) {
    const hay = pantallas.some((p) => p.id === id);
    const elegida = hay ? id : 'inicio';

    pantallas.forEach((p) => {
      p.hidden = p.id !== elegida;
    });
    menu.forEach((a) => {
      a.classList.toggle('actual', a.getAttribute('href') === '#' + elegida);
    });
    // Que la sección nueva se lea desde arriba, no desde donde se venía.
    if (mover) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    return elegida;
  }

  menu.forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!pantallas.some((p) => p.id === id)) return;
      e.preventDefault();
      history.pushState({ pantalla: id }, '', '#' + id);
      mostrar(id, true);
    });
  });

  // Cualquier otro enlace de la propia página —"Quiero tirar", por ejemplo—
  // también cambia de pantalla en vez de desplazarse.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.closest('.barra')) return;
    const id = a.getAttribute('href').slice(1);
    if (!pantallas.some((p) => p.id === id)) return;
    e.preventDefault();
    history.pushState({ pantalla: id }, '', '#' + id);
    mostrar(id, true);
  });

  window.addEventListener('popstate', () => {
    mostrar(location.hash.slice(1), true);
  });

  mostrar(location.hash.slice(1), false);
})();


// Botón para volver al principio de la página en la que se está. Para ir
// a la portada del club están el escudo de la barra y el botón "El club".
// Se arma desde acá para no repetir el mismo HTML en cada página.

(function () {
  // Los torneos son la excepción: se entra desde "Nuestros torneos", así
  // que en todas esas páginas el botón devuelve a esa sección en vez de
  // subir dentro de las fotos.
  const enTorneos = location.pathname.indexOf('/torneos') === 0;

  const boton = document.createElement(enTorneos ? 'a' : 'button');
  boton.className = 'arriba';

  if (enTorneos) {
    boton.href = '/#torneos';
    boton.setAttribute('aria-label', 'Volver a Nuestros torneos');
    boton.innerHTML = '<span aria-hidden="true">←</span> Torneos';
  } else {
    boton.type = 'button';
    boton.setAttribute('aria-label', 'Volver al principio de la página');
    boton.innerHTML = '<span aria-hidden="true">↑</span> Inicio';
    boton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.body.append(boton);

  // En un torneo el botón es para volver, y eso se puede querer desde la
  // primera foto: queda siempre a la vista. En el resto del sitio sube al
  // principio, así que aparece recién cuando ya se bajó.
  if (enTorneos) {
    boton.classList.add('visible');
    return;
  }

  // En la portada por pantallas, el botón lleva a la de inicio si se está
  // en otra, y sube si ya se está en ella.
  if (document.body.classList.contains('por-pantallas')) {
    boton.addEventListener('click', () => {
      const inicio = document.getElementById('inicio');
      if (inicio && inicio.hidden) {
        history.pushState({ pantalla: 'inicio' }, '', '#inicio');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
    function revisarPortada() {
      const inicio = document.getElementById('inicio');
      const enOtra = inicio && inicio.hidden;
      boton.innerHTML = enOtra
        ? '<span aria-hidden="true">←</span> Inicio'
        : '<span aria-hidden="true">↑</span> Inicio';
      boton.classList.toggle('visible', enOtra || window.scrollY > 500);
    }
    window.addEventListener('scroll', revisarPortada, { passive: true });
    window.addEventListener('popstate', revisarPortada);
    document.addEventListener('click', () => setTimeout(revisarPortada, 0));
    revisarPortada();
    return;
  }

  const alturaMinima = 500;
  function revisar() {
    boton.classList.toggle('visible', window.scrollY > alturaMinima);
  }
  window.addEventListener('scroll', revisar, { passive: true });
  revisar();
})();


// Las próximas fechas: cuántos días faltan, y esconder la que ya pasó.
// El data-hasta de cada tarjeta es el último día del torneo; desde el día
// siguiente la tarjeta desaparece sola, así no queda anunciado un torneo
// viejo si nadie lo saca a mano. Si no queda ninguna, se va la sección.

(function () {
  const seccion = document.getElementById('proximas');
  if (!seccion) return;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let quedan = 0;

  seccion.querySelectorAll('[data-hasta]').forEach((tarjeta) => {
    const partes = tarjeta.dataset.hasta.split('-').map(Number);
    const fin = new Date(partes[0], partes[1] - 1, partes[2]);
    fin.setHours(0, 0, 0, 0);

    if (fin < hoy) {
      tarjeta.hidden = true;
      return;
    }
    quedan++;

    const dias = Math.round((fin - hoy) / 86400000);
    const cartel = tarjeta.querySelector('.faltan');
    if (!cartel) return;

    if (dias === 0) cartel.textContent = '¡Es hoy!';
    else if (dias === 1) cartel.textContent = 'Es mañana';
    else if (dias <= 60) cartel.textContent = 'Faltan ' + dias + ' días';
  });

  if (quedan === 0) seccion.hidden = true;
})();


// El formulario de contacto. Se manda sin recargar la página, así el
// visitante ve la respuesta en el mismo lugar donde escribió. Si no hay
// JavaScript, el formulario se envía solo con el navegador y Web3Forms
// muestra su propia página de confirmación.

(function () {
  const form = document.getElementById('contacto-club');
  if (!form) return;

  const estado = form.querySelector('.estado');
  const boton = form.querySelector('button[type="submit"]');

  function decir(texto, clase) {
    estado.textContent = texto;
    estado.className = 'estado' + (clase ? ' ' + clase : '');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    boton.disabled = true;
    decir('Enviando…');

    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      const datos = await r.json();

      if (r.ok && datos.success) {
        form.reset();
        decir('¡Listo! Recibimos tu consulta y te respondemos a la brevedad.', 'ok');
      } else {
        decir('No se pudo enviar. Escribinos a 9x19shooting@gmail.com.', 'mal');
      }
    } catch (_) {
      decir('No se pudo enviar, puede ser la conexión. Probá de nuevo o escribinos a 9x19shooting@gmail.com.', 'mal');
    } finally {
      boton.disabled = false;
    }
  });
})();






// Cualquier enlace con data-imagen abre esa imagen en un emergente, a su
// tamaño real mientras entre en la pantalla. Se cierra con Esc, con la X o
// tocando el fondo. Si no hay JavaScript, el enlace abre la imagen sola.

(function () {
  const enlaces = document.querySelectorAll('[data-imagen]');
  if (!enlaces.length) return;

  let capa = null;
  let caja = null;
  let img = null;
  let normal = '';   // la que entra en pantalla
  let grande = '';   // la de más resolución, para el zoom
  let eraChico = false;  // si se abrió como ventanita, vuelve a serlo
  let sinZoom = false;   // los afiches se miran enteros, no se amplían

  function armar() {
    capa = document.createElement('div');
    capa.className = 'visor';
    capa.innerHTML =
      '<button class="visor-cerrar" type="button" aria-label="Cerrar">✕</button>' +
      '<div class="visor-caja"><img alt=""></div>' +
      '<p class="visor-pie">Tocá la imagen para ampliarla</p>';
    document.body.append(capa);

    caja = capa.querySelector('.visor-caja');
    img = capa.querySelector('img');

    capa.querySelector('.visor-cerrar').addEventListener('click', cerrar);
    // Tocar el fondo cierra; tocar la imagen hace zoom.
    capa.addEventListener('click', (e) => {
      if (e.target === capa || e.target === caja) cerrar();
    });
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      // Ni la ventanita ni los afiches se amplían: tocarlos los cierra.
      if (sinZoom || capa.classList.contains('chico')) { cerrar(); return; }
      alternarZoom(e);
    });
    document.addEventListener('keydown', (e) => {
      if (capa.hidden) return;
      if (e.key === 'Escape') cerrar();
      else if (e.key === '+' || e.key === '-') alternarZoom();
    });
  }

  // Al ampliar se pasa a la imagen de más resolución y la caja habilita el
  // desplazamiento, centrado en el punto donde se tocó.
  function alternarZoom(evento) {
    const ampliando = !img.classList.contains('zoom');
    img.classList.toggle('zoom', ampliando);

    // La ventanita no cambia de tamaño al ampliar: la imagen crece adentro
    // y se recorre desplazándola.

    const pie = capa.querySelector('.visor-pie');
    if (pie) pie.textContent = ampliando ? 'Tocá de nuevo para achicarla' : 'Tocá la imagen para ampliarla';

    if (ampliando) {
      if (grande && img.src.indexOf(grande) === -1) img.src = grande;
      requestAnimationFrame(() => {
        const x = evento ? evento.offsetX / img.offsetWidth : 0.5;
        const y = evento ? evento.offsetY / img.offsetHeight : 0.5;
        caja.scrollLeft = x * (caja.scrollWidth - caja.clientWidth);
        caja.scrollTop = y * (caja.scrollHeight - caja.clientHeight);
      });
    } else if (normal) {
      img.src = normal;
    }
  }

  function abrir(src, texto, srcGrande, chico, noAmpliar, izquierda, siempre) {
    if (!capa) armar();
    normal = src;
    grande = srcGrande || src;
    img.classList.remove('zoom');
    img.src = src;
    img.alt = texto || '';
    // En modo ventanita se abre en una esquina y deja ver la página; al
    // ampliar la imagen pasa a ocupar la pantalla, como el resto.
    // La ventanita, en general, es cosa de pantalla grande: en el celular
    // un afiche tapando todo se lee mejor. El calendario es la excepción y
    // va en ventanita siempre, marcado con data-siempre-chico.
    const anchaLaPantalla = window.matchMedia('(min-width: 621px)').matches;
    chico = !!chico && (anchaLaPantalla || siempre);
    eraChico = chico;
    sinZoom = !!noAmpliar;
    capa.classList.toggle('chico', eraChico);
    // Del lado donde está la imagen en la página: el afiche vive a la
    // izquierda de su tarjeta y ahí conviene que se abra.
    capa.classList.toggle('izquierda', eraChico && !!izquierda);
    const pie = capa.querySelector('.visor-pie');
    if (pie) {
      pie.textContent = (chico || noAmpliar) ? '' : 'Tocá la imagen para ampliarla';
    }
    capa.hidden = false;
    document.body.style.overflow = chico ? '' : 'hidden';
  }

  function cerrar() {
    capa.hidden = true;
    capa.classList.remove('chico');
    capa.classList.remove('izquierda');
    img.classList.remove('zoom');
    img.removeAttribute('src');
    document.body.style.overflow = '';
  }

  enlaces.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      abrir(a.dataset.imagen, a.dataset.textoImagen, a.dataset.imagenGrande,
            'chico' in a.dataset, 'sinZoom' in a.dataset,
            'izquierda' in a.dataset, 'siempreChico' in a.dataset);
    });
  });

  // La imagen se baja apenas la página queda libre, no al hacer clic: así
  // el emergente abre con la imagen ya lista en vez de dejar el cuadro en
  // blanco mientras carga.
  function precargar() {
    enlaces.forEach((a) => {
      // Los animados no: pesan de más y no vale bajarlos por las dudas.
      if (/\.gif(\?|$)/i.test(a.dataset.imagen)) return;
      new Image().src = a.dataset.imagen;
    });
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(precargar, { timeout: 3000 });
  } else {
    window.addEventListener('load', () => setTimeout(precargar, 800));
  }
})();


// Cuántas veces se bajan la App y los manuales. El sitio es estático y no
// puede anotar nada, así que al tocar un botón de descarga se le avisa a
// una función de Firebase, que guarda la fecha, el archivo y de dónde vino
// el pedido (ver functions/index.js en el repo de 9x19 Score).
//
// El aviso NO es parte de la descarga: se manda y la descarga sigue su
// camino. Si Firebase no contesta, o si alguien bloquea el pedido, el
// archivo se baja igual y lo único que se pierde es el registro.

(function () {
  const AVISO = 'https://us-central1-x19shooting-sync.cloudfunctions.net/registrarDescarga';
  const botones = document.querySelectorAll('[data-descarga]');
  if (!botones.length) return;

  botones.forEach((b) => {
    b.addEventListener('click', () => {
      try {
        // keepalive: el pedido sobrevive aunque la página se vaya.
        fetch(AVISO + '?f=' + encodeURIComponent(b.dataset.descarga), {
          method: 'POST',
          body: '',
          keepalive: true,
          mode: 'cors',
        }).catch(() => {});
      } catch (e) {
        /* si algo falla, la descarga sigue igual */
      }
    });
  });
})();


// LA LISTA DE INSCRIPTOS DE UN TORNEO
//
// El botón "Inscriptos" de cada tarjeta abre esta ventana con los que ya
// se anotaron. La trae `listaDeInscriptos`, que no pide clave y devuelve
// sólo apellido y nombre, número de IDPA, división, clase y día: el
// resto de la inscripción —DNI, domicilio, credencial— no sale de ahí.
//
// La lista se pide cada vez que se abre y no se guarda: alguien que se
// anota mientras la ventana está abierta aparece al volver a abrirla.

(function () {
  const LISTA =
    'https://us-central1-x19shooting-sync.cloudfunctions.net/listaDeInscriptos';

  const fondo = document.getElementById('fondoInscriptos');
  if (!fondo) return;

  const titulo = document.getElementById('tituloInscriptos');
  const conteo = document.getElementById('conteoInscriptos');
  const estado = document.getElementById('estadoInscriptos');
  const tabla = document.getElementById('tablaInscriptos');
  const cerrar = document.getElementById('cerrarInscriptos');

  // Las clases se escriben como en el formulario; las divisiones ya son
  // sus tres letras y se dejan como est\u00e1n.
  const CLASES = {
    NV: 'Novicio', MM: 'Marksman', SS: 'Sharpshooter',
    EX: 'Expert', MA: 'Master', UN: 'Sin clasificar',
  };

  let queAbrio = null;

  function abrir() {
    fondo.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function cerrarLaLista() {
    fondo.hidden = true;
    document.body.style.overflow = '';
    if (queAbrio && queAbrio.focus) queAbrio.focus();
  }

  cerrar.addEventListener('click', cerrarLaLista);
  fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrarLaLista(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !fondo.hidden) cerrarLaLista();
  });

  function unConteo(numero, texto, destacado) {
    const caja = document.createElement('div');
    if (destacado) caja.className = 'total';
    const b = document.createElement('b');
    b.textContent = numero;
    const span = document.createElement('span');
    span.textContent = texto;
    caja.appendChild(b);
    caja.appendChild(span);
    conteo.appendChild(caja);
  }

  async function mostrar(slug, boton) {
    queAbrio = boton;
    titulo.textContent = 'Inscriptos';
    conteo.innerHTML = '';
    tabla.hidden = true;
    estado.className = 'estado-lista';
    estado.textContent = 'Buscando\u2026';
    abrir();

    let d;
    try {
      const r = await fetch(LISTA + '?torneo=' + encodeURIComponent(slug));
      d = await r.json();
      if (!d.ok) throw new Error('sin lista');
    } catch (e) {
      estado.className = 'estado-lista mal';
      estado.textContent = 'No se pudo traer la lista. Prob\u00e1 de nuevo en un rato.';
      return;
    }

    titulo.textContent = 'Inscriptos \u2014 ' + d.torneo.sede;

    const gente = d.inscriptos || [];
    if (!gente.length) {
      estado.textContent = 'Todav\u00eda no se anot\u00f3 nadie. Pod\u00e9s ser el primero.';
      return;
    }

    estado.textContent = '';

    // Cuántos hay cada día, en el orden en que se corre el torneo, y el
    // total al final. Los días salen del torneo y se muestran cortos: el
    // nombre entero —"Sábado 19 — Pre Match"— no entra en el celular.
    const porDia = {};
    gente.forEach((i) => { porDia[i.dia] = (porDia[i.dia] || 0) + 1; });

    conteo.innerHTML = '';
    Object.keys(d.torneo.dias || {}).forEach((clave) => {
      const corto = String(d.torneo.dias[clave]).split('\u2014')[0].trim();
      unConteo(porDia[clave] || 0, corto);
    });
    unConteo(gente.length, 'en total', true);

    const cuerpo = tabla.querySelector('tbody');
    cuerpo.innerHTML = '';

    gente.forEach((i) => {
      const tr = document.createElement('tr');
      const celdas = [
        { clase: 'quien', campo: 'Apellido y nombre', texto: i.apellido + ', ' + i.nombre },
        { campo: 'N\u00ba IDPA', texto: i.idpa },
        { campo: 'Divisi\u00f3n', texto: i.division },
        { campo: 'Clase', texto: CLASES[i.clase] || i.clase },
        { campo: 'D\u00eda', texto: (d.torneo.dias && d.torneo.dias[i.dia]) || i.dia },
      ];
      celdas.forEach((c) => {
        const td = document.createElement('td');
        if (c.clase) td.className = c.clase;
        td.dataset.campo = c.campo;
        td.textContent = c.texto || '\u2014';
        tr.appendChild(td);
      });
      cuerpo.appendChild(tr);
    });

    tabla.hidden = false;
  }

  document.querySelectorAll('[data-inscriptos]').forEach((b) => {
    b.addEventListener('click', () => mostrar(b.dataset.inscriptos, b));
  });
})();
