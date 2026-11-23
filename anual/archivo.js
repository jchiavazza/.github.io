// La página de un campeonato ya cerrado.
//
// Muestra la foto que se guardó cuando terminó el año: la tabla final tal
// como quedó, con las fechas que la compusieron. **No recalcula nada y no
// lee las tablas de cada fecha**: si alguna se despublicara, o si una
// corrección tardía moviera un tiempo, este archivo no cambia. Es el acta
// del campeonato, no una consulta.
//
// El año lo dice la propia página, en <body data-anio>, que es lo único
// que distingue a una subpágina de otra.

(function () {
  const API = 'https://us-central1-x19shooting-sync.cloudfunctions.net';
  const $ = (id) => document.getElementById(id);
  const anio = document.body.dataset.anio;

  let datos = null;
  let mirando = 'general';

  // ------------------------------------------------------------------
  // Formato — igual que en la pantalla del campeonato en curso
  // ------------------------------------------------------------------

  function porciento(x, decimales) {
    if (x === null || x === undefined) return '—';
    return (x * 100).toFixed(decimales === undefined ? 1 : decimales).replace('.', ',') + '%';
  }

  function comoFecha(iso) {
    if (!iso) return '';
    const [a, m, d] = String(iso).split('-');
    return d + '/' + m + '/' + a;
  }

  const ordinal = (i) => i + 1 + 'ª';

  // ------------------------------------------------------------------
  // La tabla
  // ------------------------------------------------------------------

  function filasDeAhora() {
    if (mirando === 'general') return datos.general || [];
    const g = (datos.grupos || []).find((x) => x.nombre === mirando);
    // `g.tabla` con el mismo cuidado: una tabla vacía tampoco se guarda.
    return (g && g.tabla) || [];
  }

  // `t.fechas` puede no venir, y no es un error de nadie: **Firebase no
  // guarda un objeto vacío**, borra la clave. El que no completó ninguna
  // fecha --los dos DQ y los cuatro que se anotaron y no fueron-- se
  // archivó con `fechas: {}` y vuelve sin `fechas`. Son 6 de los 91 del
  // 2026, y con uno solo la tabla entera no se dibujaba.
  const deLaFecha = (t, i) => {
    const f = (t.fechas || {})[i];
    if (!f) return null;
    return mirando === 'general' ? f.general : f.grupo;
  };
  const total = (t) => (mirando === 'general' ? t.totalGeneral : t.totalGrupo);

  function encabezado() {
    const fila = $('encabezado');
    fila.querySelectorAll('.generado').forEach((x) => x.remove());

    (datos.fechas || []).forEach((f, i) => {
      const th = document.createElement('th');
      th.className = 'fecha generado';
      th.textContent = ordinal(i);
      th.title = f.nombre + ' · ' + comoFecha(f.fecha);
      fila.appendChild(th);
    });

    const th = document.createElement('th');
    th.className = 'total generado';
    th.textContent = 'Total';
    fila.appendChild(th);
  }

  function dibujar() {
    const cuerpo = $('tabla').querySelector('tbody');
    cuerpo.innerHTML = '';

    filasDeAhora().forEach((t, i) => {
      const tr = document.createElement('tr');
      const suma = total(t);
      if (i < 3 && suma > 0) tr.className = 'podio';
      if (!suma) tr.className = 'sin-sumar';

      const puesto = document.createElement('td');
      puesto.className = 'puesto' + (suma > 0 ? '' : ' sin-puntos');
      puesto.textContent = i + 1;
      tr.appendChild(puesto);

      const quien = document.createElement('td');
      quien.className = 'tirador';
      quien.textContent = t.apellido + ', ' + t.nombre;
      if (!suma && t.tuvoDq) {
        const marca = document.createElement('span');
        marca.className = 'marca-dq';
        marca.textContent = 'DQ';
        marca.title = 'Se fue en DQ: fue a tirar, pero no llegó a sumar';
        quien.appendChild(marca);
      }
      tr.appendChild(quien);

      [
        ['chico', 'Nº IDPA', t.numero || '—'],
        ['chico', 'Div.', t.division || ''],
        ['chico', 'Clase', t.clase || ''],
        ['chico corridas', 'Fechas', String(t.corridas || 0)],
      ].forEach(([clase, campo, texto]) => {
        const td = document.createElement('td');
        td.className = clase;
        td.dataset.campo = campo;
        td.textContent = texto;
        tr.appendChild(td);
      });

      (datos.fechas || []).forEach((f, k) => {
        const td = document.createElement('td');
        const valor = deLaFecha(t, k);
        // La descartada de cada tabla: en la general, la peor contra el
        // mejor de todos; en un grupo, contra el mejor del grupo.
        const tachadas = mirando === 'general' ? t.descartadas : t.descartadasGrupo;
        const fuera = (tachadas || []).indexOf(k) >= 0;
        td.className = 'fecha' + (valor === null ? ' vacia' : '') + (fuera ? ' descartada' : '');
        td.dataset.campo = ordinal(k);
        td.textContent = porciento(valor);
        if (fuera) td.title = 'La peor: no suma';
        tr.appendChild(td);
      });

      const td = document.createElement('td');
      td.className = 'total';
      td.dataset.campo = 'Total';
      td.textContent = porciento(suma, 1);
      tr.appendChild(td);

      cuerpo.appendChild(tr);
    });
  }

  // Los filtros van en dos renglones, como la tabla de un torneo en
  // /envivo/: arriba la division y abajo, si tiene mas de uno, sus
  // grupos de premiacion. Siete botones con nombres largos --"SSP EX +
  // SS" al lado de "CCP MM + NV"-- se leian como siete categorias
  // sueltas, y son cuatro divisiones con sus grupos adentro.
  //
  // No hay un boton "Todas" por division, y no es un olvido: el anual no
  // tiene una tabla por division. Cada grupo compara contra el mejor DE
  // ESE GRUPO, que es como premia el club, asi que una tabla de la
  // division entera seria una cuenta que no existe.
  const divisionDe = (g) => (g && (g.division || g.nombre)) || '';

  // La etiqueta del segundo renglon: el nombre del grupo sin la
  // division adelante. Sale del nombre y no de `clases` para conservar
  // como lo escribe el club: "EX + SS" y no "SS + EX + MA".
  function soloLasClases(g) {
    const t = String(g.nombre || '').slice(divisionDe(g).length).trim();
    return t || 'Unica';
  }

  function filtros() {
    const caja = $('filtros');
    const clases = $('filtros-clase');
    caja.innerHTML = '';
    clases.innerHTML = '';

    const grupos = datos.grupos || [];
    const elegido = grupos.filter((g) => g.nombre === mirando)[0];
    const division = elegido ? divisionDe(elegido) : '';

    const poner = (donde, texto, actual, nombre) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = texto;
      b.className = actual ? 'actual' : '';
      b.onclick = () => {
        mirando = nombre;
        filtros();
        dibujar();
      };
      donde.appendChild(b);
    };

    poner(caja, 'General', mirando === 'general', 'general');

    // Las divisiones, en el orden en que vienen los grupos. Tocar una
    // abre su primer grupo: sin tabla de division entera, hay que caer
    // en alguno, y el segundo renglon muestra cuales son los otros.
    const divisiones = [];
    grupos.forEach((g) => {
      const d = divisionDe(g);
      if (divisiones.indexOf(d) === -1) divisiones.push(d);
    });
    divisiones.forEach((d) => {
      const suyos = grupos.filter((g) => divisionDe(g) === d);
      poner(caja, d, division === d, suyos[0].nombre);
    });

    const hermanos = grupos.filter((g) => divisionDe(g) === division);
    clases.hidden = hermanos.length < 2;
    if (hermanos.length < 2) return;

    const rotulo = document.createElement('span');
    rotulo.className = 'rotulo';
    rotulo.textContent = 'Clase';
    clases.appendChild(rotulo);
    hermanos.forEach((g) => poner(clases, soloLasClases(g), g.nombre === mirando, g.nombre));
  }

  function pie() {
    const lista = $('lista-fechas');
    lista.innerHTML = '';
    (datos.fechas || []).forEach((f) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '/envivo/?c=' + f.clave;
      a.textContent = f.nombre;
      li.appendChild(a);
      li.appendChild(document.createTextNode(' · ' + comoFecha(f.fecha)));
      lista.appendChild(li);
    });
    $('pie').hidden = false;

    if ((datos.avisos || []).length) {
      $('nota-avisos').hidden = false;
      $('nota-avisos').textContent = datos.avisos.join(' · ');
    }
  }

  function cabecera() {
    $('a-titulo').textContent = datos.nombre || 'Torneo Anual';
    $('a-anio').textContent = datos.anio;
    document.title = (datos.nombre || 'Torneo Anual') + ' ' + datos.anio + ' — Club 9x19 Shooting';

    const cerrado = datos.cerradoEn
      ? new Date(datos.cerradoEn).toLocaleDateString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        })
      : null;
    $('a-datos').textContent =
      (datos.fechas || []).length + ' fechas · ' + (datos.general || []).length + ' tiradores' +
      (cerrado ? ' · resultados finales del ' + cerrado : '');
  }

  // ------------------------------------------------------------------

  fetch(API + '/anualArchivado?anio=' + encodeURIComponent(anio))
    .then((r) => (r.status === 404 ? null : r.json()))
    .then((d) => {
      // **Todavía no terminó.** La página existe desde antes de que el
      // año cierre —el sitio es estático y sus carpetas no se crean
      // solas—, así que mientras tanto manda a ver el campeonato en
      // curso, en vez de mostrar una tabla vacía.
      if (!d || !d.ok) {
        $('sin-cerrar').hidden = false;
        $('cuerpo').hidden = true;
        $('a-anio').textContent = anio;
        return;
      }
      datos = d;
      cabecera();
      filtros();
      encabezado();
      dibujar();
      pie();
    })
    .catch((e) => {
      // Dejarlo en la consola: el cartel de abajo dice que hubo un
      // problema, y durante meses ese cartel fue todo lo que se supo.
      console.error('No se pudo armar la tabla del campeonato', e);
      $('sin-cerrar').hidden = false;
      $('sin-cerrar').textContent =
        'No se pudieron traer los resultados. Probá de nuevo en un rato.';
      $('cuerpo').hidden = true;
    });
})();
