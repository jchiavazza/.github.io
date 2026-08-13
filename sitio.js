// Botón para volver al principio de la página en la que se está. Para ir
// a la portada del club están el escudo de la barra y el botón "El club".
// Se arma desde acá para no repetir el mismo HTML en cada página.

(function () {
  // La galería de un torneo es la excepción: se entra desde la lista, así
  // que el botón devuelve ahí en vez de subir dentro de las fotos. En la
  // lista misma —/torneos/— vuelve a subir como en el resto del sitio.
  const enUnTorneo = /^\/torneos\/.+/.test(location.pathname);

  const boton = document.createElement(enUnTorneo ? 'a' : 'button');
  boton.className = 'arriba';

  if (enUnTorneo) {
    boton.href = '/torneos/';
    boton.setAttribute('aria-label', 'Volver a la lista de torneos');
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
