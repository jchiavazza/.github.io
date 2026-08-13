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


// Cualquier enlace con data-imagen abre esa imagen en un emergente, a su
// tamaño real mientras entre en la pantalla. Se cierra con Esc, con la X o
// tocando el fondo. Si no hay JavaScript, el enlace abre la imagen sola.

(function () {
  const enlaces = document.querySelectorAll('[data-imagen]');
  if (!enlaces.length) return;

  let capa = null;

  function abrir(src, texto) {
    if (!capa) {
      capa = document.createElement('div');
      capa.className = 'visor';
      capa.innerHTML =
        '<button class="visor-cerrar" type="button" aria-label="Cerrar">✕</button>' +
        '<img alt="">';
      document.body.append(capa);

      capa.querySelector('.visor-cerrar').addEventListener('click', cerrar);
      capa.addEventListener('click', (e) => { if (e.target === capa) cerrar(); });
      document.addEventListener('keydown', (e) => {
        if (!capa.hidden && e.key === 'Escape') cerrar();
      });
    }
    const img = capa.querySelector('img');
    img.src = src;
    img.alt = texto || '';
    capa.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function cerrar() {
    capa.hidden = true;
    capa.querySelector('img').removeAttribute('src');
    document.body.style.overflow = '';
  }

  enlaces.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      abrir(a.dataset.imagen, a.dataset.textoImagen);
    });
  });
})();
