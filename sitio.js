// Botón de vuelta. En la portada sube al principio; en las páginas de
// adentro —la app y los torneos— vuelve a la portada del club, que es de
// donde se entró. Se arma desde acá para no repetirlo en cada página.

(function () {
  const esPortada = /^\/(index\.html)?$/.test(location.pathname);

  const boton = document.createElement(esPortada ? 'button' : 'a');
  boton.className = 'arriba';

  if (esPortada) {
    boton.type = 'button';
    boton.setAttribute('aria-label', 'Volver al principio de la página');
    boton.innerHTML = '<span aria-hidden="true">↑</span> Inicio';
    boton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  } else {
    boton.href = '/';
    boton.setAttribute('aria-label', 'Volver a la página principal del club');
    boton.innerHTML = '<span aria-hidden="true">←</span> Inicio';
  }

  document.body.append(boton);

  const alturaMinima = 500;
  function revisar() {
    boton.classList.toggle('visible', window.scrollY > alturaMinima);
  }
  window.addEventListener('scroll', revisar, { passive: true });
  revisar();
})();
