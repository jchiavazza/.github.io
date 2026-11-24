// EL COMUNICADO DE LA TEMPORADA 2027
//
// Se muestra en la portada y en los resultados en vivo —la cartelera y
// la tabla de cada torneo—, porque el que entra a mirar la tabla casi
// nunca pasa por la portada: llega por el enlace directo que le pasaron
// por WhatsApp.
//
// Por eso el texto vive acá y no en el HTML de cada página: escrito
// cuatro veces, al tercer cambio una de las cuatro queda vieja. Cada
// página deja un hueco y este archivo lo llena:
//
//     <p class="comunicado" data-comunicado></p>
//
// La ventana se arma una sola vez al final del body, por más huecos que
// haya, y todos los botones abren esa misma.
//
// > La copia que no se puede evitar es `comunicados/2027/comunicado-2027.html`
// > del repositorio de la App, que es la hoja A4 de la que sale el PDF.
// > Son dos cosas distintas —una página y una hoja— y este sitio no
// > genera PDF. Si se corrige una, corregir la otra.

(function () {
  const TITULO = 'Temporada 2027';
  const LINEA = 'Las dos novedades de la temporada: una sola fecha de ' +
    'clasificación en todo el año, y el anual a nueve fechas con las ' +
    'siete mejores.';

  // Absoluta: el mismo archivo se arma desde la portada y desde /envivo/,
  // que están a distinta profundidad.
  const PDF = '/assets/Comunicado-2027-9x19-Shooting.pdf?v=2';

  // El aviso de descarga lo manda este archivo y no el `data-descarga`
  // de sitio.js, porque en /envivo/ ese script no se carga. El
  // identificador tiene que estar en la lista cerrada `ARCHIVOS` de
  // `registrarDescarga`, o la función contesta 400 y no anota nada.
  const AVISO = 'https://us-central1-x19shooting-sync.cloudfunctions.net/registrarDescarga';
  const QUE = 'comunicado-2027';

  const TEXTO = `
      <p class="entrada">Queremos adelantarles dos novedades para la temporada 2027.</p>

      <h4>Clasificación IDPA</h4>
      <p class="bajada-com">Una única fecha en el año: febrero de 2027</p>
      <p>
        Se va a realizar en el <strong>Tiro Federal de Esperanza</strong>,
        el <strong>20 y 21 de febrero</strong>, en estos horarios:
      </p>
      <ul class="horarios-com">
        <li><b>Sábado</b><span>9 a 12 hs · 15 a 19 hs</span></li>
        <li><b>Domingo</b><span>9 a 13 hs</span></li>
      </ul>
      <p>
        No va a haber otra fecha de clasificación de 9x19 Shooting en el
        resto del año. A quien todavía no esté clasificado, quiera subir de
        clase o esté por cumplir un año de su última clasificación, le
        recomendamos que la agende desde ahora.
      </p>

      <h4>Torneo Anual 2027 — Zona Litoral - NEA</h4>
      <ul class="cifras">
        <li><strong>9</strong> fechas</li>
        <li><strong>7</strong> mejores resultados computan</li>
      </ul>
      <p>
        Quien corra todas las fechas descarta sus dos peores, sin importar
        dónde hayan sido.
      </p>
      <p>
        Quien falte tiene una condición: <strong>no puede faltar a dos
        fechas del mismo club.</strong> La idea es que el anual recorra
        todos los clubes y que todos nos visitemos.
      </p>
      <p class="aviso-com">
        <strong>Quien falte a dos fechas del mismo club queda fuera del anual.</strong>
      </p>

      <p class="cierre-com">¡Los esperamos en la cancha!</p>

      <p class="bajar-pdf">
        <a class="boton chico" href="${PDF}" id="bajarComunicado"
           download="Comunicado-2027-9x19-Shooting.pdf">Descargar en PDF</a>
        <span>Para compartirlo o imprimirlo.</span>
      </p>`;

  const huecos = document.querySelectorAll('[data-comunicado]');
  if (!huecos.length) return;

  // -------------------------------------------------------- la ventana
  const fondo = document.createElement('div');
  fondo.className = 'fondo-lista';
  fondo.id = 'fondoComunicado';
  fondo.hidden = true;
  fondo.setAttribute('role', 'dialog');
  fondo.setAttribute('aria-modal', 'true');
  fondo.setAttribute('aria-labelledby', 'tituloComunicado');
  fondo.innerHTML =
    '<div class="caja-lista">' +
      '<header>' +
        '<h3 id="tituloComunicado">' + TITULO + '</h3>' +
        '<button class="boton chico cerrar-lista" type="button" id="cerrarComunicado">Cerrar</button>' +
      '</header>' +
      '<div class="adentro texto-comunicado">' + TEXTO + '</div>' +
    '</div>';
  document.body.appendChild(fondo);

  const cerrar = fondo.querySelector('#cerrarComunicado');

  // Qué botón la abrió, para devolverle el foco al cerrarla: con el
  // comunicado en dos pantallas ya no hay uno solo.
  let abrioQuien = null;

  function mostrar(desde) {
    abrioQuien = desde;
    fondo.hidden = false;
    document.body.style.overflow = 'hidden';
    cerrar.focus();
  }

  function esconder() {
    fondo.hidden = true;
    document.body.style.overflow = '';
    if (abrioQuien) abrioQuien.focus();
  }

  cerrar.addEventListener('click', esconder);
  fondo.addEventListener('click', (e) => { if (e.target === fondo) esconder(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !fondo.hidden) esconder();
  });

  // El aviso no es parte de la descarga: se manda por un lado y el PDF
  // se baja por otro. Si Firebase no contesta, se baja igual.
  const bajar = fondo.querySelector('#bajarComunicado');
  if (bajar) {
    bajar.addEventListener('click', () => {
      try {
        // keepalive: el pedido sobrevive aunque la página se vaya.
        fetch(AVISO + '?f=' + encodeURIComponent(QUE), {
          method: 'POST',
          body: '',
          keepalive: true,
          mode: 'cors',
        }).catch(() => {});
      } catch (e) {
        /* si algo falla, la descarga sigue igual */
      }
    });
  }

  // --------------------------------------------------------- los huecos
  huecos.forEach((hueco) => {
    hueco.classList.add('comunicado');
    hueco.innerHTML = '';

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton boton-comunicado';
    boton.textContent = 'Comunicado 2027';
    boton.addEventListener('click', () => mostrar(boton));

    const linea = document.createElement('span');
    // El botón solo no dice nada y nadie abre un comunicado a ciegas.
    linea.textContent = hueco.dataset.comunicado || LINEA;

    hueco.appendChild(boton);
    hueco.appendChild(linea);
  });
})();
