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

  const alturaMinima = 500;
  function revisar() {
    boton.classList.toggle('visible', window.scrollY > alturaMinima);
  }
  window.addEventListener('scroll', revisar, { passive: true });
  revisar();
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

  function abrir(src, texto, srcGrande) {
    if (!capa) armar();
    normal = src;
    grande = srcGrande || src;
    img.classList.remove('zoom');
    img.src = src;
    img.alt = texto || '';
    capa.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function cerrar() {
    capa.hidden = true;
    img.classList.remove('zoom');
    img.removeAttribute('src');
    document.body.style.overflow = '';
  }

  enlaces.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      abrir(a.dataset.imagen, a.dataset.textoImagen, a.dataset.imagenGrande);
    });
  });

  // La imagen se baja apenas la página queda libre, no al hacer clic: así
  // el emergente abre con la imagen ya lista en vez de dejar el cuadro en
  // blanco mientras carga.
  function precargar() {
    enlaces.forEach((a) => { new Image().src = a.dataset.imagen; });
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(precargar, { timeout: 3000 });
  } else {
    window.addEventListener('load', () => setTimeout(precargar, 800));
  }
})();
