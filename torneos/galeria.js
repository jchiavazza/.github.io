// Galería de un torneo. Cada página declara cuál es en el div#galeria:
//
//   <div id="galeria" data-slug="primera-fecha-fenix" data-fotos="28"
//        data-titulo="Primera Fecha" data-sede="Polígono de Tiro Fénix"></div>
//
// Las fotos se llaman 01.jpg, 02.jpg… en /galeria/<slug>/, así que con el
// total alcanza para armar la lista. Para sumar un torneo: correr
// scripts/fotos.ps1 y copiar una de las páginas cambiando esos datos.

(function () {
  const caja = document.getElementById('galeria');
  if (!caja) return;

  const slug   = caja.dataset.slug;
  const total  = Number(caja.dataset.fotos);
  const titulo = caja.dataset.titulo || 'Torneo';
  const sede   = caja.dataset.sede || '';

  const dosDigitos = (n) => String(n).padStart(2, '0');

  const grilla = document.createElement('div');
  grilla.className = 'grilla-fotos';
  for (let i = 1; i <= total; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'foto';
    b.dataset.n = i;
    const img = document.createElement('img');
    img.src = `/galeria/${slug}/mini/${dosDigitos(i)}.jpg`;
    img.alt = `${titulo} en ${sede}, foto ${i} de ${total}`;
    img.loading = 'lazy';
    b.append(img);
    grilla.append(b);
  }
  caja.append(grilla);

  // ---- el visor

  const visor = document.getElementById('visor');
  const vImg = document.getElementById('visor-img');
  const vTitulo = document.getElementById('visor-torneo');
  const vCuenta = document.getElementById('visor-cuenta');
  let actual = null;

  function abrir(n) {
    if (n < 1) n = total;
    if (n > total) n = 1;
    actual = n;
    vImg.src = `/galeria/${slug}/g/${dosDigitos(n)}.jpg`;
    vImg.alt = `${titulo} en ${sede}, foto ${n} de ${total}`;
    vTitulo.textContent = `${titulo} — ${sede}`;
    vCuenta.textContent = `${n} / ${total}`;
    visor.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function cerrar() {
    visor.hidden = true;
    vImg.removeAttribute('src');
    actual = null;
    document.body.style.overflow = '';
  }

  function mover(paso) {
    if (actual) abrir(actual + paso);
  }

  grilla.addEventListener('click', (e) => {
    const b = e.target.closest('.foto');
    if (b) abrir(Number(b.dataset.n));
  });

  visor.querySelector('.visor-cerrar').addEventListener('click', cerrar);
  visor.querySelector('.visor-antes').addEventListener('click', () => mover(-1));
  visor.querySelector('.visor-luego').addEventListener('click', () => mover(1));

  // Tocar el fondo cierra; tocar la foto o los botones, no.
  visor.addEventListener('click', (e) => { if (e.target === visor) cerrar(); });

  document.addEventListener('keydown', (e) => {
    if (visor.hidden) return;
    if (e.key === 'Escape') cerrar();
    else if (e.key === 'ArrowLeft') mover(-1);
    else if (e.key === 'ArrowRight') mover(1);
  });
})();
