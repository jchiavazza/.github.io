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
    return g ? g.tabla : [];
  }

  const deLaFecha = (t, i) => {
    const f = t.fechas[i];
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

  function filtros() {
    const caja = $('filtros');
    caja.innerHTML = '';

    const poner = (nombre, texto) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = texto;
      b.className = nombre === mirando ? 'actual' : '';
      b.onclick = () => {
        mirando = nombre;
        filtros();
        dibujar();
      };
      caja.appendChild(b);
    };

    poner('general', 'General');
    (datos.grupos || []).forEach((g) => poner(g.nombre, g.nombre));
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
    .catch(() => {
      $('sin-cerrar').hidden = false;
      $('sin-cerrar').textContent =
        'No se pudieron traer los resultados. Probá de nuevo en un rato.';
      $('cuerpo').hidden = true;
    });
})();
