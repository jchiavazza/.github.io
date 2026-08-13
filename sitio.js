// Botón para volver al principio de la página en la que se está. Para ir
// a la portada del club están el escudo de la barra y el botón "El club".
// Se arma desde acá para no repetir el mismo HTML en cada página.

(function () {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'arriba';
  boton.setAttribute('aria-label', 'Volver al principio de la página');
  boton.innerHTML = '<span aria-hidden="true">↑</span> Inicio';
  document.body.append(boton);

  boton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const alturaMinima = 500;
  function revisar() {
    boton.classList.toggle('visible', window.scrollY > alturaMinima);
  }
  window.addEventListener('scroll', revisar, { passive: true });
  revisar();
})();
