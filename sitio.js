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

  const alturaMinima = 500;
  function revisar() {
    boton.classList.toggle('visible', window.scrollY > alturaMinima);
  }
  window.addEventListener('scroll', revisar, { passive: true });
  revisar();
})();


// Volver a cargar un recuadro incrustado. JotForm deja su confirmación
// dentro del formulario y no vuelve solo: recargarlo es lo que permite
// escribir una segunda consulta sin salir de la página.

(function () {
  document.querySelectorAll('[data-recargar]').forEach((b) => {
    b.addEventListener('click', () => {
      const marco = document.getElementById(b.dataset.recargar);
      if (!marco) return;
      marco.src = marco.src;
      marco.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


// El formulario, a la altura que ocupa de verdad. JotForm le avisa al sitio
// que lo incrusta cuánto mide, con un mensaje "setHeight:<px>". Escuchándolo
// acá evitamos cargar su script y el formulario entra entero, sin barra de
// desplazamiento adentro del recuadro. Si el mensaje no llega, queda la
// altura fija del CSS.

(function () {
  const marco = document.querySelector('[id^="JotFormIFrame-"]');
  if (!marco) return;
  const caja = marco.parentElement;

  // Sin recorte: recortar el pie tapaba el botón de enviar cuando JotForm
  // reacomoda el formulario. Preferimos que se vea entero.
  let ajustado = false;

  function ajustar(alto) {
    if (!alto || alto < 300) return;
    ajustado = true;
    marco.style.height = alto + 'px';
    caja.style.height = alto + 'px';
  }

  window.addEventListener('message', (e) => {
    let host = '';
    try { host = new URL(e.origin).hostname; } catch (_) { return; }
    if (!/(^|\.)jotform\.com$/.test(host)) return;

    // Llega como "setHeight:920:230316846755663" o como JSON.
    if (typeof e.data === 'string') {
      const partes = e.data.split(':');
      if (partes[0] === 'setHeight') ajustar(parseInt(partes[1], 10));
    } else if (e.data && e.data.type === 'setHeight') {
      ajustar(parseInt(e.data.height, 10));
    }
  });

  // Si el aviso no llega —según el navegador y la configuración del
  // formulario a veces no sale—, cargamos el script de JotForm, que hace el
  // mismo trabajo desde su lado.
  setTimeout(() => {
    if (ajustado) return;
    const s = document.createElement('script');
    s.src = 'https://form.jotform.com/s/umd/latest/for-form-embed-handler.js';
    s.onload = () => {
      if (window.jotformEmbedHandler) {
        window.jotformEmbedHandler('iframe[id^="JotFormIFrame-"]', 'https://form.jotform.com/');
      }
    };
    document.body.append(s);
  }, 2500);
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
