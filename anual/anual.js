// El torneo anual: pide la tabla ya calculada y la dibuja.
//
// Acá NO se suma ni se descarta nada. La cuenta la hace la función
// `resultadosAnual` (functions/anual.js en el repositorio de 9x19 Score),
// con las mismas tablas que se publican en /envivo/. Si el porcentaje se
// calculara también acá, un día las dos pantallas dirían cosas distintas
// y el que reclama un puesto tendría razón sin que hubiera cómo saberlo.

(function () {
  const API = 'https://us-central1-x19shooting-sync.cloudfunctions.net';
  const $ = (id) => document.getElementById(id);

  let datos = null;
  // Qué se está mirando: la general o el nombre de un grupo.
  let mirando = 'general';

  // ------------------------------------------------------------------
  // Formato
  // ------------------------------------------------------------------

  // 0,884 -> "88,4%". El porcentaje se entiende sin explicación; el
  // número entre cero y uno hay que traducirlo mentalmente.
  function porciento(x, decimales) {
    if (x === null || x === undefined) return '—';
    return (x * 100).toFixed(decimales === undefined ? 1 : decimales).replace('.', ',') + '%';
  }

  function comoFecha(iso) {
    if (!iso) return '';
    const [a, m, d] = String(iso).split('-');
    return d + '/' + m + '/' + a;
  }

  // "1ª", "2ª"… para el encabezado de cada columna.
  const ordinal = (i) => i + 1 + 'ª';

  // ------------------------------------------------------------------
  // La tabla
  // ------------------------------------------------------------------

  function filasDeAhora() {
    if (mirando === 'general') return datos.general || [];
    const g = (datos.grupos || []).find((x) => x.nombre === mirando);
    return g ? g.tabla : [];
  }

  // En la general manda el porcentaje contra el mejor de todos; adentro
  // de un grupo, contra el mejor del grupo. Son dos cuentas distintas y
  // la misma pantalla muestra una o la otra.
  const deLaFecha = (t, i) => {
    const f = t.fechas[i];
    if (!f) return null;
    return mirando === 'general' ? f.general : f.grupo;
  };
  const total = (t) => (mirando === 'general' ? t.totalGeneral : t.totalGrupo);

  function encabezado() {
    const fila = $('encabezado');
    // Se rehace de cero: la cantidad de fechas la decide el servidor.
    fila.querySelectorAll('.generado').forEach((x) => x.remove());

    (datos.fechas || []).forEach((f, i) => {
      const th = document.createElement('th');
      th.className = 'fecha generado' + (f.enCurso ? ' corriendo' : '');
      th.textContent = ordinal(i) + (f.enCurso ? ' •' : '');
      th.title = f.nombre + ' · ' + comoFecha(f.fecha) + (f.enCurso ? ' · se está corriendo' : '');
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

    const filas = filasDeAhora();
    $('vacio').hidden = filas.length > 0;

    filas.forEach((t, i) => {
      const tr = document.createElement('tr');
      const suma = total(t);
      if (i < 3 && suma > 0) tr.className = 'podio';

      const puesto = document.createElement('td');
      puesto.className = 'puesto' + (suma > 0 ? '' : ' sin-puntos');
      puesto.textContent = i + 1;
      tr.appendChild(puesto);

      const quien = document.createElement('td');
      quien.className = 'tirador';
      quien.textContent = t.apellido + ', ' + t.nombre;
      tr.appendChild(quien);

      [
        ['chico', 'Nº IDPA', t.numero || '—'],
        ['chico', 'Div.', t.division || ''],
        ['chico', 'Clase', t.clase || ''],
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
        // Descartada: la peor de las que corrió, que no suma. Sólo tiene
        // sentido marcarla en la general, que es donde se eligen las
        // cuatro que cuentan.
        const fuera = mirando === 'general' && (t.descartadas || []).indexOf(k) >= 0;
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

    // Los nombres que se tomaron como la misma persona. Se muestran
    // porque juntar de más le regalaría puntos a alguien: conviene que
    // esté a la vista y no escondido en un registro.
    if ((datos.avisos || []).length) {
      $('nota-avisos').hidden = false;
      $('nota-avisos').textContent = datos.avisos.join(' · ');
    }
  }

  // Mientras una fecha se corre, todo lo que se ve es provisorio: el
  // 100% de esa fecha es el mejor de los que ya terminaron, así que los
  // porcentajes bajan a medida que entran los rápidos y los puestos se
  // mueven. Decirlo es la diferencia entre una tabla en vivo y una tabla
  // equivocada.
  function cartelEnCurso() {
    const cuales = (datos.fechas || []).filter((f) => f.enCurso);
    $('en-curso').hidden = !cuales.length;
    if (!cuales.length) return;

    const cual = cuales.map((f) => f.nombre).join(' y ');
    $('en-curso-texto').textContent =
      cual + ' se está corriendo: los porcentajes de esa fecha son provisorios ' +
      'hasta que terminen todos, así que los puestos todavía se mueven. ' +
      'Cada tirador entra recién cuando completa sus etapas.';
  }

  function cabecera() {
    const anio = (datos.fechas[0] || {}).fecha || '';
    $('a-titulo').textContent = 'Torneo Anual' + (anio ? ' ' + anio.slice(0, 4) : '');
    document.title = $('a-titulo').textContent + ' — Club 9x19 Shooting';

    const corridas = (datos.fechas || []).length;
    $('a-datos').textContent =
      corridas === 1 ? '1 fecha publicada' : corridas + ' fechas publicadas';

    $('a-cuantas').textContent =
      'De las cinco fechas se computan las ' + datos.cuantasCuentan +
      ' mejores de cada tirador: la peor se descarta y queda tachada.';
  }

  // ------------------------------------------------------------------

  // Con una fecha corriéndose la tabla cambia sola cada pocos minutos.
  // Dos minutos: el servidor guarda el resultado un minuto, así que
  // preguntar más seguido devolvería lo mismo.
  const CADA = 120000;
  let reloj = null;

  function cargar() {
    return fetch(API + '/resultadosAnual')
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.ok) throw new Error((d && d.error) || 'sin datos');
        datos = d;
        if (!(datos.fechas || []).length) {
          $('vacio').hidden = false;
          return;
        }
        cabecera();
        cartelEnCurso();
        // El filtro elegido se conserva entre refrescos: si el que está
        // mirando su grupo volviera a la general cada dos minutos, la
        // página sería inusable justo el día que más se mira.
        if (mirando !== 'general' && !(datos.grupos || []).some((g) => g.nombre === mirando)) {
          mirando = 'general';
        }
        filtros();
        encabezado();
        dibujar();
        pie();

        // El reloj se enciende sólo mientras haya algo que mirar, y se
        // apaga cuando el torneo termina de cargarse.
        if (datos.enCurso && !reloj) reloj = setInterval(cargar, CADA);
        if (!datos.enCurso && reloj) {
          clearInterval(reloj);
          reloj = null;
        }
      })
      .catch(() => {
        // Si ya hay una tabla en pantalla, un refresco fallido no la
        // borra: se deja lo último bueno y se prueba de nuevo.
        if (datos) return;
        $('vacio').hidden = false;
        $('vacio').textContent = 'No se pudo cargar la clasificación. Probá de nuevo en un rato.';
      });
  }

  cargar();
})();
