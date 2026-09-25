// Galería de un torneo. Cada página declara cuál es en el div#galeria:
//
//   <div id="galeria" data-slug="primera-fecha-fenix" data-fotos="28"
//        data-videos="7"
//        data-titulo="Primera Fecha" data-sede="Polígono de Tiro Fénix"></div>
//
// Las fotos se llaman 01.jpg, 02.jpg… en /galeria/<slug>/, así que con el
// total alcanza para armar la lista. Para sumar un torneo: correr
// scripts/fotos.ps1 y copiar una de las páginas cambiando esos datos.
//
// **Los videos van primero y son opcionales** (`data-videos`, que puede no
// estar): son lo que la gente busca de un torneo, y son pocos. Viven en
// `/galeria/<slug>/v/NN.mp4`, con su fotograma en `v/mini/NN.jpg`. El
// video sólo se descarga cuando alguien lo abre —son varios megas cada
// uno—: en la grilla lo que se ve es esa imagen.

(function () {
  const caja = document.getElementById('galeria');
  if (!caja) return;

  const slug   = caja.dataset.slug;
  const total  = Number(caja.dataset.fotos);
  const videos = Number(caja.dataset.videos || 0);
  const titulo = caja.dataset.titulo || 'Torneo';
  const sede   = caja.dataset.sede || '';

  const dosDigitos = (n) => String(n).padStart(2, '0');

  const grilla = document.createElement('div');
  grilla.className = 'grilla-fotos';

  for (let i = 1; i <= videos; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'foto es-video';
    b.dataset.v = i;
    const img = document.createElement('img');
    img.src = `/galeria/${slug}/v/mini/${dosDigitos(i)}.jpg`;
    img.alt = `${titulo} en ${sede}, video ${i} de ${videos}`;
    img.loading = 'lazy';
    const play = document.createElement('span');
    play.className = 'marca-play';
    play.setAttribute('aria-hidden', 'true');
    play.textContent = '▶';
    b.append(img, play);
    grilla.append(b);
  }

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

  // El video se arma recién cuando se abre y se desarma al cerrar: dejarlo
  // en la página lo mantendría descargando o sonando detrás del visor.
  let vVideo = null;

  function sacarVideo() {
    if (!vVideo) return;
    vVideo.pause();
    vVideo.remove();
    vVideo = null;
  }

  function abrirVideo(n) {
    if (n < 1) n = videos;
    if (n > videos) n = 1;
    actual = { tipo: 'video', n };

    sacarVideo();
    vImg.hidden = true;
    vImg.removeAttribute('src');

    vVideo = document.createElement('video');
    vVideo.src = `/galeria/${slug}/v/${dosDigitos(n)}.mp4`;
    vVideo.poster = `/galeria/${slug}/v/mini/${dosDigitos(n)}.jpg`;
    vVideo.controls = true;
    vVideo.autoplay = true;
    vVideo.playsInline = true;
    vVideo.preload = 'metadata';
    vImg.insertAdjacentElement('afterend', vVideo);

    vTitulo.textContent = `${titulo} — ${sede}`;
    vCuenta.textContent = `video ${n} / ${videos}`;
    visor.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function abrir(n) {
    if (n < 1) n = total;
    if (n > total) n = 1;
    actual = { tipo: 'foto', n };
    sacarVideo();
    vImg.hidden = false;
    vImg.src = `/galeria/${slug}/g/${dosDigitos(n)}.jpg`;
    vImg.alt = `${titulo} en ${sede}, foto ${n} de ${total}`;
    vTitulo.textContent = `${titulo} — ${sede}`;
    vCuenta.textContent = `${n} / ${total}`;
    visor.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function cerrar() {
    visor.hidden = true;
    sacarVideo();
    vImg.hidden = false;
    vImg.removeAttribute('src');
    actual = null;
    document.body.style.overflow = '';
  }

  // Las flechas se mueven dentro de lo que se está mirando: entre videos
  // si se abrió un video, entre fotos si se abrió una foto. Mezclarlos
  // haría que pasar de foto empiece a descargar videos de varios megas.
  function mover(paso) {
    if (!actual) return;
    if (actual.tipo === 'video') abrirVideo(actual.n + paso);
    else abrir(actual.n + paso);
  }

  grilla.addEventListener('click', (e) => {
    const b = e.target.closest('.foto');
    if (!b) return;
    if (b.dataset.v) abrirVideo(Number(b.dataset.v));
    else abrir(Number(b.dataset.n));
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
