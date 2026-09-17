// Resultados en vivo: pide la tabla ya calculada y la dibuja.
//
// Acá NO se calcula ningún puntaje. La cuenta la hace la función
// `resultadosEnVivo` con el mismo scoring.js que la app (ver
// functions/en-vivo.js en el repositorio de 9x19 Score): si el tiempo se
// calculara también acá, un día las dos tablas dirían cosas distintas y
// el que reclama un puesto tendría razón y no habría cómo saberlo.

(function () {
  const API = 'https://us-central1-x19shooting-sync.cloudfunctions.net';
  const CADA = 7000; // cada cuánto se pregunta por novedades

  const $ = (id) => document.getElementById(id);
  const clave = (new URLSearchParams(location.search).get('c') || '').trim().toUpperCase();

  // ------------------------------------------------------------------
  // Sin clave: la pantalla del organizador
  // ------------------------------------------------------------------
  if (!clave) {
    $('pantalla-publicar').hidden = false;

    const estado = $('estado-publicar');
    const boton = $('publicar');

    async function publicar() {
      const codigo = $('codigo').value.trim();
      if (!codigo) { $('codigo').focus(); return; }

      boton.disabled = true;
      estado.className = 'estado';
      estado.textContent = 'Buscando el match…';

      try {
        const r = await fetch(API + '/publicarEnVivo?codigo=' + encodeURIComponent(codigo), { method: 'POST', body: '' });
        const d = await r.json();

        if (!d.ok) {
          estado.className = 'estado mal';
          estado.textContent = d.error || 'No se pudo publicar.';
          return;
        }

        estado.className = 'estado ok';
        estado.textContent = d.match ? 'Publicado: ' + d.match : 'Publicado.';
        $('enlace-url').textContent = d.url;
        $('enlace-ver').href = d.url;
        $('enlace').hidden = false;
      } catch (e) {
        estado.className = 'estado mal';
        estado.textContent = 'No se pudo conectar.';
      } finally {
        boton.disabled = false;
      }
    }

    boton.addEventListener('click', publicar);
    $('codigo').addEventListener('keydown', (e) => { if (e.key === 'Enter') publicar(); });
    return;
  }

  // ------------------------------------------------------------------
  // Con clave: la tabla
  // ------------------------------------------------------------------
  $('pantalla-tabla').hidden = false;

  let datos = null;
  let filtro = { tipo: 'general' };
  // Qué puesto tenía cada uno la vuelta anterior, para poder marcar al
  // que subió o bajó. Se guarda por filtro: el puesto en la general y el
  // de su división son distintos.
  let puestosAntes = {};
  let ultimoCambio = 0;
  let timer = null;

  function texto(el, valor) { el.textContent = valor; }

  function tiempo(seg) {
    return (seg || 0).toFixed(2);
  }

  function haceCuanto(ms) {
    const s = Math.round((Date.now() - ms) / 1000);
    if (s < 10) return 'recién actualizado';
    if (s < 60) return 'hace ' + s + " s";
    const m = Math.round(s / 60);
    if (m < 60) return 'hace ' + m + (m === 1 ? ' minuto' : ' minutos');
    const h = Math.round(m / 60);
    return 'hace ' + h + (h === 1 ? ' hora' : ' horas');
  }

  function filasDelFiltro() {
    if (!datos) return [];
    if (filtro.tipo === 'division') return datos.porDivision[filtro.division] || [];
    if (filtro.tipo === 'divisionClase') return datos.porDivisionClase[filtro.clave] || [];
    return datos.general;
  }

  function nombreDelFiltro() {
    if (filtro.tipo === 'division') return 'div:' + filtro.division;
    if (filtro.tipo === 'divisionClase') return 'dc:' + filtro.clave;
    return 'general';
  }

  function dibujarFiltros() {
    const cont = $('filtros');
    cont.innerHTML = '';

    function boton(etiqueta, esActual, alTocar) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = etiqueta;
      if (esActual) b.className = 'actual';
      b.addEventListener('click', () => { alTocar(); dibujarFiltros(); dibujarTabla(true); });
      cont.appendChild(b);
    }

    boton('General', filtro.tipo === 'general', () => { filtro = { tipo: 'general' }; });

    (datos.divisiones || []).forEach((d) => {
      boton(d, filtro.tipo === 'division' && filtro.division === d,
        () => { filtro = { tipo: 'division', division: d }; });
    });

    // División + clase, sólo las combinaciones que alguien corre.
    Object.keys(datos.porDivisionClase || {}).sort().forEach((k) => {
      const [d, c] = k.split('|');
      boton(d + ' ' + c, filtro.tipo === 'divisionClase' && filtro.clave === k,
        () => { filtro = { tipo: 'divisionClase', clave: k }; });
    });
  }

  function celda(tr, texto, clase, campo) {
    const td = document.createElement('td');
    if (clase) td.className = clase;
    if (campo) td.dataset.campo = campo;
    td.textContent = texto;
    tr.appendChild(td);
    return td;
  }

  function dibujarTabla(cambioDeFiltro) {
    const filas = filasDelFiltro();
    const cuerpo = $('tabla').querySelector('tbody');
    const antes = puestosAntes[nombreDelFiltro()] || {};
    const ahora = {};

    cuerpo.innerHTML = '';
    $('vacio').hidden = filas.length > 0;

    filas.forEach((f) => {
      const tr = document.createElement('tr');
      if (f.dq) tr.className = 'dq';
      ahora[f.id] = f.puesto;

      // El destello sólo cuando llegaron datos nuevos: al cambiar de
      // filtro toda la tabla "cambiaría" y parpadearía entera sin que
      // haya pasado nada en la cancha.
      if (!cambioDeFiltro && f.puesto) {
        const antesEstaba = antes[f.id];
        if (antesEstaba === undefined || antesEstaba === null) tr.classList.add('nuevo');
        else if (f.puesto < antesEstaba) tr.classList.add('subio');
        else if (f.puesto > antesEstaba) tr.classList.add('bajo');
      }

      celda(tr, f.puesto ? String(f.puesto) : '–', 'puesto');

      const tdNombre = celda(tr, '', 'tirador');
      tdNombre.textContent = (f.apellido + ', ' + f.nombre).replace(/^, |, $/, '');
      if (!cambioDeFiltro && f.puesto && antes[f.id] && antes[f.id] !== f.puesto) {
        const flecha = document.createElement('span');
        const sube = f.puesto < antes[f.id];
        flecha.className = 'flecha ' + (sube ? 'sube' : 'baja');
        flecha.textContent = sube ? '▲' + (antes[f.id] - f.puesto) : '▼' + (f.puesto - antes[f.id]);
        tdNombre.appendChild(flecha);
      }
      if (f.dq) {
        const dq = document.createElement('span');
        dq.className = 'marca-dq';
        dq.textContent = 'DQ';
        tdNombre.appendChild(dq);
      }

      celda(tr, f.numero || '—', 'chico', 'Nº IDPA');
      celda(tr, f.club || '—', 'chico', 'Club');
      celda(tr, f.division || '—', 'chico', 'División');
      celda(tr, f.clase || '—', 'chico', 'Clase');
      celda(tr, f.etapasCargadas + '/' + (datos.match.etapas.length || 0), 'etapas', 'Etapas');
      celda(tr, f.etapasCargadas ? tiempo(f.tiempo) : '—', 'tiempo', 'Tiempo');

      cuerpo.appendChild(tr);
    });

    puestosAntes[nombreDelFiltro()] = ahora;
  }

  function dibujarCabecera() {
    const m = datos.match;
    texto($('m-nombre'), m.nombre);
    document.title = m.nombre + ' — En vivo';

    const partes = [];
    if (m.subtitulo) partes.push(m.subtitulo);
    if (m.nivel) partes.push(m.nivel);
    if (m.fecha) partes.push(m.fecha.split('-').reverse().join('/'));
    partes.push(m.tiradores + (m.tiradores === 1 ? ' tirador' : ' tiradores'));
    partes.push(m.etapas.length + (m.etapas.length === 1 ? ' etapa' : ' etapas'));
    texto($('m-datos'), partes.join(' · '));

    const pct = m.posibles ? Math.round((m.cargados / m.posibles) * 100) : 0;
    $('m-barra').style.width = pct + '%';
    texto($('m-avance'), m.posibles
      ? pct + '% cargado (' + m.cargados + ' de ' + m.posibles + ' planillas)'
      : 'sin etapas cargadas');
  }

  async function traer() {
    try {
      const r = await fetch(API + '/resultadosEnVivo?c=' + encodeURIComponent(clave));
      if (r.status === 404) {
        $('m-nombre').textContent = 'No encontramos este match';
        $('m-datos').textContent = 'Puede que el enlace esté mal copiado o que el organizador lo haya despublicado.';
        $('m-vivo').classList.add('parado');
        texto($('m-actualizado'), 'sin conexión con el match');
        clearInterval(timer);
        return;
      }
      const d = await r.json();
      if (!d.ok) return;

      const primeraVez = datos === null;
      const hayNovedad = !primeraVez && d.actualizado !== datos.actualizado;
      datos = d;

      dibujarCabecera();
      if (primeraVez) dibujarFiltros();
      else if ((d.divisiones || []).length !== ($('filtros').children.length - 1 - Object.keys(d.porDivisionClase || {}).length)) {
        dibujarFiltros(); // apareció una división nueva
      }

      // En la primera vuelta no se destella: todo sería "nuevo".
      dibujarTabla(primeraVez);
      if (hayNovedad || primeraVez) ultimoCambio = d.actualizado;

      $('m-vivo').classList.remove('parado');
      texto($('m-actualizado'), haceCuanto(ultimoCambio));
    } catch (e) {
      $('m-vivo').classList.add('parado');
      texto($('m-actualizado'), 'sin conexión');
    }
  }

  // El reloj del "hace tanto" corre aunque no lleguen datos nuevos.
  setInterval(() => {
    if (ultimoCambio && !$('m-vivo').classList.contains('parado')) {
      texto($('m-actualizado'), haceCuanto(ultimoCambio));
    }
  }, 5000);

  function arrancar() {
    traer();
    clearInterval(timer);
    timer = setInterval(traer, CADA);
  }

  // Con la pestaña en segundo plano no tiene sentido seguir preguntando:
  // nadie lo está mirando y son llamadas que se pagan.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timer);
    else arrancar();
  });

  arrancar();
})();
