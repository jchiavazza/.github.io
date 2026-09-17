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
  // Sin clave: la cartelera
  // ------------------------------------------------------------------
  if (!clave) {
    $('pantalla-cartelera').hidden = false;
    cartelera();

    return;
  }

  // ------------------------------------------------------------------
  // La cartelera: todos los matches publicados
  // ------------------------------------------------------------------
  function cartelera() {
    // ¿Este torneo se está corriendo AHORA?
    //
    // Alcanza con que le falten planillas: un match al que no se le
    // terminó de cargar todo es un match en curso. El único resguardo es
    // la fecha —hoy, ayer o mañana—, porque si no, uno viejo que quedó a
    // medio cargar dejaría el cartel encendido para siempre.
    function seEstaCorriendo(m) {
      if (m.final) return false;
      if (m.posibles > 0 && m.cargados >= m.posibles) return false;
      if (!m.posibles) return false; // sin etapas todavía no hay nada que seguir

      if (!m.fecha) return true;
      const p = m.fecha.split('-').map(Number);
      const dias = (Date.now() - new Date(p[0], p[1] - 1, p[2]).getTime()) / 86400000;
      return dias >= -1 && dias <= 2;
    }

    function tarjeta(m) {
      const a = document.createElement('a');
      a.className = 'match-tarjeta';
      a.href = '?c=' + m.clave;

      // `final` lo marca la nube cuando el match ya no existe allá: la
      // tabla queda de archivo y no va a cambiar nunca más.
      const completo = m.final || (m.posibles > 0 && m.cargados >= m.posibles);
      const corriendo = seEstaCorriendo(m);

      const h = document.createElement('h3');
      h.textContent = m.nombre || 'Match';
      if (corriendo || completo) {
        const et = document.createElement('span');
        et.className = 'etiqueta ' + (corriendo ? 'envivo' : 'termino');
        et.textContent = corriendo ? 'EN VIVO' : 'TERMINADO';
        h.appendChild(et);
      }
      a.appendChild(h);

      const partes = [];
      if (m.fecha) partes.push(m.fecha.split('-').reverse().join('/'));
      if (m.nivel) partes.push(m.nivel);
      if (m.subtitulo) partes.push(m.subtitulo);
      partes.push(m.tiradores + (m.tiradores === 1 ? ' tirador' : ' tiradores'));
      partes.push(m.etapas + (m.etapas === 1 ? ' etapa' : ' etapas'));
      const pct = m.posibles ? Math.round((m.cargados / m.posibles) * 100) : 0;
      partes.push(completo ? 'completo' : pct + '% cargado');

      const p = document.createElement('p');
      p.className = 'detalle';
      p.textContent = partes.join(' · ');
      a.appendChild(p);

      const fondo = document.createElement('div');
      fondo.className = 'barra-fondo';
      const llena = document.createElement('div');
      llena.className = 'barra-llena';
      llena.style.width = pct + '%';
      fondo.appendChild(llena);
      a.appendChild(fondo);

      return a;
    }

    async function traerLista() {
      try {
        const r = await fetch(API + '/listaEnVivo');
        const d = await r.json();
        if (!d.ok) return;

        const cont = $('cartelera');
        cont.innerHTML = '';
        d.matches.forEach((m) => cont.appendChild(tarjeta(m)));
        $('sin-matches').hidden = d.matches.length > 0;
      } catch (e) {
        $('sin-matches').hidden = false;
        $('sin-matches').textContent = 'No se pudo cargar la lista de torneos.';
      }
    }

    traerLista();
    // Cada tanto, por si alguien publica uno mientras la página está
    // abierta o el que está corriendo pasa a terminado.
    setInterval(() => { if (!document.hidden) traerLista(); }, 30000);
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
    return datos.general;
  }

  function nombreDelFiltro() {
    if (filtro.tipo === 'division') return 'div:' + filtro.division;
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

    // Sólo las divisiones. La clase se ve en la fila de cada tirador.
    (datos.divisiones || []).forEach((d) => {
      boton(d, filtro.tipo === 'division' && filtro.division === d,
        () => { filtro = { tipo: 'division', division: d }; });
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
      else if ((d.divisiones || []).length !== $('filtros').children.length - 1) {
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
