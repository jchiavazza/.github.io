// Resultados en vivo: pide la tabla ya calculada y la dibuja.
//
// Acá NO se calcula ningún puntaje. La cuenta la hace la función
// `resultadosEnVivo` con el mismo scoring.js que la app (ver
// functions/en-vivo.js en el repositorio de 9x19 Score): si el tiempo se
// calculara también acá, un día las dos tablas dirían cosas distintas y
// el que reclama un puesto tendría razón y no habría cómo saberlo.

(function () {
  const API = 'https://us-central1-x19shooting-sync.cloudfunctions.net';
  // Corriendo, cada siete segundos. Antes de la largada, cada dos
  // minutos: no hay nada que pueda cambiar y cada consulta se paga.
  const CADA = 7000;
  const CADA_ESPERANDO = 120000;
  // Un torneo de dos días para de noche, y el almuerzo de una jornada
  // larga también. Mientras no entra una sola planilla no hay nada que
  // mirar, así que se pregunta cada dos minutos en vez de cada siete
  // segundos; vuelve solo apenas se carga algo, sin recargar la página y
  // sin que nadie tenga que acordarse de nada.
  const CADA_DESCANSANDO = 120000;
  const SIN_NOVEDADES = 45 * 60 * 1000;

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
    // Todavía no largó: hay hora puesta, falta para esa hora y no se
    // cargó un solo puntaje. Si hay puntajes, arrancó antes de lo
    // previsto y manda la cancha, no el horario.
    if (m.arranca && Date.now() < m.arranca && !m.cargados) return false;

    // Un torneo publicado al que le faltan planillas es un torneo en
    // curso, y punto: es lo que el cartel tiene que avisar.
    //
    // No se mira ni la fecha ni cuándo sincronizó. Con la fecha, un match
    // cargado con la del torneo anterior no encendía nunca; con la
    // sincronización, se apagaba en cada pausa larga —el almuerzo de una
    // jornada de dos días lo dejaba gris—.
    //
    // Se apaga solo cuando el match se completa, o cuando desaparece de
    // la nube a los 45 días y la tabla queda archivada (`final`).
    if (m.final) return false;
    if (!m.posibles) return false;
    return m.cargados < m.posibles;
    }

    // Primero el que se está corriendo, después los demás del más nuevo
    // al más viejo. El orden que trae el servidor es por última
    // sincronización, que no es lo mismo: un torneo terminado al que se
    // le tocó algo ayer quedaría arriba del que se está corriendo hoy.
    function ordenar(matches) {
      return matches.slice().sort((a, b) => {
        const va = seEstaCorriendo(a) ? 1 : 0;
        const vb = seEstaCorriendo(b) ? 1 : 0;
        if (va !== vb) return vb - va;
        return (b.fecha || '').localeCompare(a.fecha || '');
      });
    }

    function tarjeta(m) {
      const a = document.createElement('a');
      a.className = 'match-tarjeta';
      a.href = '?c=' + m.clave;

      // `final` lo marca la nube cuando el match ya no existe allá: la
      // tabla queda de archivo y no va a cambiar nunca más.
      const completo = m.final || (m.posibles > 0 && m.cargados >= m.posibles);
      const corriendo = seEstaCorriendo(m);
      const programado = m.arranca && Date.now() < m.arranca && !m.cargados;

      if (corriendo) a.classList.add('corriendo');

      const h = document.createElement('h3');
      h.textContent = m.nombre || 'Match';
      if (corriendo || completo || programado) {
        const et = document.createElement('span');
        et.className = 'etiqueta ' + (corriendo ? 'envivo' : 'termino');
        et.textContent = corriendo ? 'EN VIVO' : programado ? 'PROGRAMADO' : 'TERMINADO';
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
      partes.push(programado
        ? 'arranca ' + new Date(m.arranca).toLocaleString('es-AR',
            { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : completo ? 'completo' : pct + '% cargado');

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
        ordenar(d.matches).forEach((m) => cont.appendChild(tarjeta(m)));
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
  $('volver-cartelera').hidden = false;

  let datos = null;
  let filtro = { tipo: 'general' };
  // Qué puesto tenía cada uno la vuelta anterior, para poder marcar al
  // que subió o bajó. Se guarda por filtro: el puesto en la general y el
  // de su división son distintos.
  let puestosAntes = {};
  let ultimoCambio = 0;
  let timer = null;
  let ritmoActual = null;

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

  // "arranca en 2 días" / "arranca en 3 horas" / "arranca a las 09:00".
  function cuantoFalta(cuando) {
    const minutos = Math.round((cuando - Date.now()) / 60000);
    if (minutos > 60 * 24) return 'arranca en ' + Math.round(minutos / (60 * 24)) + ' días';
    if (minutos > 60) return 'arranca en ' + Math.round(minutos / 60) + ' horas';
    if (minutos > 1) return 'arranca en ' + minutos + ' minutos';
    return 'está por arrancar';
  }

  // **Con una clase elegida se filtra la división y se numera de nuevo,
  // en el mismo orden.** El puesto que manda el servidor es sólo la
  // posición en esa lista (`conPuestos` en functions/en-vivo.js), así que
  // numerar la clase acá es la misma cuenta: no se ordena ni se calcula
  // nada distinto. Mandar además una tabla por clase desde el servidor
  // habría sido una tercera copia de cada fila, cada siete segundos.
  function filasDelFiltro() {
    if (!datos) return [];
    if (filtro.tipo !== 'division') return datos.general;
    const division = datos.porDivision[filtro.division] || [];
    if (!filtro.clase) return division;
    return division
      .filter((f) => (f.clase || '') === filtro.clase)
      .map((f, i) => ({ ...f, puesto: i + 1 }));
  }
  function nombreDelFiltro() {
    if (filtro.tipo === 'division') {
      return 'div:' + filtro.division + (filtro.clase ? '|' + filtro.clase : '');
    }
    return 'general';
  }

  // Las clases, de la más alta a la más baja, como las ordena IDPA. Una
  // que no esté en la lista —mal cargada, o de otra disciplina— va al
  // final, y se muestra igual: esconderla escondería a sus tiradores.
  const ORDEN_CLASES = ['MA', 'EX', 'SS', 'MM', 'NV', 'UN'];
  function clasesDe(division) {
    const hay = [...new Set((datos.porDivision[division] || []).map((f) => f.clase || '').filter(Boolean))];
    const lugar = (c) => (ORDEN_CLASES.indexOf(c) < 0 ? 99 : ORDEN_CLASES.indexOf(c));
    return hay.sort((a, b) => lugar(a) - lugar(b) || a.localeCompare(b));
  }

  // Qué botones hay que mostrar. Si no cambió, no se rehacen: rehacerlos
  // en cada refresco podía comerse un toque justo en ese momento.
  function firmaDeFiltros() {
    const divisiones = (datos.divisiones || []).join(',');
    const clases = filtro.tipo === 'division' ? clasesDe(filtro.division).join(',') : '';
    return divisiones + '/' + clases;
  }
  let filtrosDibujados = '';

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

    // Primero las divisiones; la clase, en el renglón de abajo.
    (datos.divisiones || []).forEach((d) => {
      boton(d, filtro.tipo === 'division' && filtro.division === d,
        () => { filtro = { tipo: 'division', division: d }; });
    });

    // **Las clases, sólo con una división elegida**: todas juntas eran
    // veinte botones para grupos de uno o dos, y así son a lo sumo seis.
    // "Todas" es la división completa, que es lo que se ve si no se elige
    // ninguna.
    const renglon = $('filtros-clase');
    renglon.innerHTML = '';
    const clases = filtro.tipo === 'division' ? clasesDe(filtro.division) : [];
    renglon.hidden = clases.length === 0;
    if (clases.length) {
      const rotulo = document.createElement('span');
      rotulo.className = 'rotulo';
      rotulo.textContent = 'Clase';
      renglon.appendChild(rotulo);

      const deClase = (etiqueta, clase) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = etiqueta;
        if ((filtro.clase || null) === clase) b.className = 'actual';
        b.addEventListener('click', () => {
          filtro = { tipo: 'division', division: filtro.division, clase };
          dibujarFiltros();
          dibujarTabla(true);
        });
        renglon.appendChild(b);
      };
      deClase('Todas', null);
      clases.forEach((c) => deClase(c, c));
    }

    filtrosDibujados = firmaDeFiltros();
  }

  // Los puntos y las penalizaciones son enteros casi siempre: "3" se lee
  // mejor que "3.00". El cero no se escribe, como en la app — una columna
  // llena de ceros esconde justo los que no lo son.
  function cantidad(n) {
    if (!n) return '';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  // La cabecera tiene dos renglones: arriba el número y el nombre de cada
  // escenario, abajo lo que va en cada columna. Se rehace cuando cambia
  // la cantidad de escenarios, que la decide el match.
  // **Las tablas publicadas antes de que existiera el detalle no lo
  // traen**, y la de un torneo archivado ya no se puede rearmar: su match
  // se borró de la nube. Sin esta pregunta, un torneo terminado mostraría
  // "falta" en todos los escenarios de todos los tiradores.
  function hayEscenarios() {
    return (datos.general || []).some((f) => Array.isArray(f.escenarios));
  }
  function escenariosAMostrar() {
    return hayEscenarios() ? (datos.match && datos.match.etapas) || [] : [];
  }

  // "Escenario 1 - El Mozo" → "El Mozo": el número ya va adelante, en
  // negrita, y con quince columnas cada letra del encabezado cuenta. Si el
  // nombre es sólo "Escenario 1", se deja como está.
  function nombreCorto(nombre, numero) {
    const limpio = String(nombre || '')
      .replace(new RegExp('^\\s*(escenario|etapa|stage)\\s*' + numero + '\\s*[-:.–]?\\s*', 'i'), '')
      .trim();
    return limpio || String(nombre || '').trim();
  }

  let escenariosDibujados = -1;
  function dibujarCabeza() {
    const etapas = escenariosAMostrar();
    if (etapas.length === escenariosDibujados) return;
    escenariosDibujados = etapas.length;
    document.querySelector('main').classList.toggle('con-escenarios', etapas.length > 0);

    const cabeza = $('cabeza');
    cabeza.innerHTML = '';
    const arriba = document.createElement('tr');
    const abajo = document.createElement('tr');

    const fija = (texto, clase, estilo) => {
      const th = document.createElement('th');
      th.textContent = texto;
      th.rowSpan = 2;
      if (clase) th.className = clase;
      if (estilo) th.style.textAlign = estilo;
      arriba.appendChild(th);
    };
    fija('#', 'fijo-1');
    fija('Tirador', 'fijo-2');
    fija('Nº IDPA', 'chico');
    fija('Club', 'chico');
    fija('Div.', 'chico');
    fija('Clase', 'chico');
    fija('Etapas', '', 'center');

    etapas.forEach((e, i) => {
      const alterno = i % 2 === 1 ? ' alterno' : '';
      const th = document.createElement('th');
      th.colSpan = 3;
      th.className = 'escenario' + alterno;
      th.title = (i + 1) + ': ' + (e.nombre || '');
      const n = document.createElement('b');
      n.textContent = i + 1;
      th.appendChild(n);
      th.appendChild(document.createTextNode(nombreCorto(e.nombre, i + 1)));
      arriba.appendChild(th);

      [['Tiempo', 'Tiempo sin penalizar'], ['PD', 'Puntos por debajo (incluye Miss y No-Shoot)'],
        ['P', 'Penalizaciones, en segundos']].forEach(([texto, ayuda]) => {
        const sub = document.createElement('th');
        sub.className = 'sub' + alterno;
        sub.textContent = texto;
        sub.title = ayuda;
        abajo.appendChild(sub);
      });
    });

    fija('Tiempo final', '', 'right');

    cabeza.appendChild(arriba);
    cabeza.appendChild(abajo);
  }

  // Las celdas de un escenario, para la pantalla ancha y para el teléfono.
  // `e` es [tiempo, pd, p], null si todavía no lo tiró, o 'DQ'.
  function celdasDeEscenarios(tr, f) {
    const etapas = escenariosAMostrar();
    if (!etapas.length) return;
    const lista = f.escenarios || [];
    const movil = document.createElement('div');

    etapas.forEach((etapa, i) => {
      const e = lista[i];
      const alterno = i % 2 === 1 ? ' alterno' : '';
      const linea = document.createElement('div');
      linea.className = 'linea';
      const num = document.createElement('b');
      num.textContent = i + 1;
      linea.appendChild(num);

      if (e === 'DQ') {
        const td = celda(tr, 'DQ', 'esc es-dq' + alterno);
        td.colSpan = 3;
        linea.classList.add('es-dq');
        linea.appendChild(document.createTextNode('DQ'));
      } else if (!e) {
        // Lo que falta tirar: es lo que deja ver, a mitad de torneo,
        // cuántos escenarios le quedan a cada uno.
        const td = celda(tr, '—', 'esc falta' + alterno);
        td.colSpan = 3;
        td.title = 'Todavía no tiró este escenario';
        linea.classList.add('falta');
        linea.appendChild(document.createTextNode('falta'));
      } else {
        celda(tr, tiempo(e[0]), 'esc' + alterno);
        celda(tr, cantidad(e[1]), 'esc' + alterno + (e[1] ? ' penal' : ''));
        celda(tr, cantidad(e[2]), 'esc' + alterno + (e[2] ? ' penal' : ''));

        const partes = [['', tiempo(e[0])], ['PD ', cantidad(e[1])], ['P ', cantidad(e[2])]];
        partes.forEach(([rotulo, valor], k) => {
          if (k > 0 && !valor) return;
          const s = document.createElement('span');
          if (k > 0) s.className = 'penal';
          s.textContent = rotulo + valor;
          linea.appendChild(s);
        });
      }
      movil.appendChild(linea);
    });

    const td = document.createElement('td');
    td.className = 'esc-movil';
    td.appendChild(movil);
    tr.appendChild(td);
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
      if (!cambioDeFiltro && f.compite) {
        const antesEstaba = antes[f.id];
        if (antesEstaba === undefined || antesEstaba === null) tr.classList.add('nuevo');
        else if (f.puesto < antesEstaba) tr.classList.add('subio');
        else if (f.puesto > antesEstaba) tr.classList.add('bajo');
      }

      // El número va siempre. Apagado mientras no haya tirado, para que
      // no se lea como un puesto ganado.
      celda(tr, String(f.puesto || ''), 'puesto' + (f.compite ? '' : ' sin-tirar'));

      const tdNombre = celda(tr, '', 'tirador');
      tdNombre.textContent = (f.apellido + ', ' + f.nombre).replace(/^, |, $/, '');
      if (!cambioDeFiltro && f.compite && antes[f.id] && antes[f.id] !== f.puesto) {
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
      celdasDeEscenarios(tr, f);
      // El tiempo final del torneo, al último: es la suma de todo lo que
      // está a su izquierda.
      celda(tr, f.etapasCargadas ? tiempo(f.tiempo) : '—', 'tiempo', 'Tiempo final');

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

  // Cuántas planillas había la última vez y cuándo cambió ese número. Se
  // mira eso y no la hora del recálculo: un celular con la app abierta
  // sincroniza cada veinte segundos aunque nadie esté cargando nada, y
  // con esa señal la pantalla no se dormiría nunca.
  let cargadosAntes = null;
  let ultimoMovimiento = Date.now();

  function estaDescansando() {
    if (!datos || !datos.match) return false;
    if (!datos.match.cargados) return false;
    return Date.now() - ultimoMovimiento > SIN_NOVEDADES;
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
      dibujarCabeza();
      // Una división o una clase nueva —un inscripto de último momento—
      // tiene que aparecer sin recargar la página.
      if (primeraVez || firmaDeFiltros() !== filtrosDibujados) dibujarFiltros();

      // En la primera vuelta no se destella: todo sería "nuevo".
      dibujarTabla(primeraVez);
      if (hayNovedad || primeraVez) ultimoCambio = d.actualizado;

      // El ritmo se decide con lo que acaba de llegar: si el torneo ya
      // largó —o si alguien cargó un puntaje antes de hora— se pasa a
      // preguntar cada siete segundos sin recargar la página.
      const cargados = (d.match || {}).cargados || 0;
      if (cargadosAntes === null || cargados !== cargadosAntes) {
        cargadosAntes = cargados;
        ultimoMovimiento = Date.now();
      }

      const esperando = faltaParaLargar();
      const descansando = !esperando && estaDescansando();
      const ritmo = esperando || descansando ? CADA_ESPERANDO : CADA;
      if (ritmo !== ritmoActual) {
        ritmoActual = ritmo;
        clearInterval(timer);
        timer = setInterval(traer, ritmo);
      }

      $('m-vivo').classList.toggle('parado', esperando || descansando);
      texto(
        $('m-actualizado'),
        esperando
          ? cuantoFalta(datos.arranca)
          : haceCuanto(ultimoCambio) + (descansando ? ' · en pausa' : '')
      );
    } catch (e) {
      $('m-vivo').classList.add('parado');
      texto($('m-actualizado'), 'sin conexión');
    }
  }

  // El reloj del "hace tanto" corre aunque no lleguen datos nuevos.
  setInterval(() => {
    if (faltaParaLargar()) {
      texto($('m-actualizado'), cuantoFalta(datos.arranca));
    } else if (ultimoCambio) {
      texto($('m-actualizado'), haceCuanto(ultimoCambio) + (estaDescansando() ? ' · en pausa' : ''));
    }
  }, 5000);

  // ¿Todavía no largó? Con hora puesta, sin puntajes y antes de esa hora.
  function faltaParaLargar() {
    if (!datos || !datos.arranca) return false;
    return Date.now() < datos.arranca && !datos.match.cargados;
  }

  function arrancar() {
    traer();
    clearInterval(timer);
    timer = setInterval(traer, faltaParaLargar() ? CADA_ESPERANDO : CADA);
  }

  // Con la pestaña en segundo plano no tiene sentido seguir preguntando:
  // nadie lo está mirando y son llamadas que se pagan.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timer);
    else arrancar();
  });

  arrancar();
})();
