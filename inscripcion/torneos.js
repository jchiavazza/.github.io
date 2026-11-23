// LOS TORNEOS QUE SE PUEDEN INSCRIBIR
//
// Este es el único archivo que hay que tocar para abrir la inscripción de
// un torneo nuevo: se copia el bloque del anterior, se cambian los datos y
// se pushea. Ni el HTML ni la función de los correos hay que mirarlos.
//
// AL AGREGAR UN TORNEO, SUBIR EL ?v= DE ESTE ARCHIVO en el index.html de
// esta carpeta. El navegador de quien ya entro una vez tiene guardada la
// version anterior, y con esa el torneo nuevo no existe: la pagina le
// contesta "No encontramos ese torneo" y no hay forma de que se entere.
//
// La clave de cada bloque —`esperanza`— es lo que va en la dirección:
//
//     9x19shooting.com.ar/inscripcion/?t=esperanza
//
// Esa es la dirección que se pone en el botón "Inscribirme" de la portada
// y en el código QR del afiche.
//
// ---------------------------------------------------------------------
// OJO: LOS PRECIOS ESTÁN ESCRITOS EN DOS LADOS
//
// Acá, para mostrarlos, y en `functions/inscripciones.js` del repositorio
// de la App, para calcular de verdad cuánto tenía que transferir cada uno.
// **Si cambiás un precio acá, cambialo también allá.**
//
// No es un descuido: si el importe viajara con el formulario, cualquiera
// podría editarlo en su navegador antes de enviarlo y el correo diría un
// número inventado. Por eso la función tiene su propia copia y no le cree
// a la página. Es la misma duplicación deliberada que DIAS_VENCIMIENTO
// entre la App y sus Cloud Functions.
// ---------------------------------------------------------------------
//
// LAS ESCUADRAS
//
// El torneo que las arma lleva `escuadras: { cuantas: 5, porEscuadra: 15,
// dia: 'domingo' }`. El formulario muestra las cinco con quiénes ya están
// y el tirador elige la suya; después puede cambiarse desde el enlace que
// le llega en el correo, mientras haya lugar.
//
// **El número manda del lado de la función**, igual que los precios: acá
// está para que la página sepa que hay que preguntar.
// ---------------------------------------------------------------------

window.TORNEOS = {

  esperanza: {
    // Lo que se ve arriba de todo, debajo del logo del club.
    titulo: '5º Torneo Social de IDPA',
    subtitulo: 'Torneo Clausura 2026',
    sede: 'Tiro Federal de Esperanza',
    ciudad: 'Esperanza, Santa Fe',
    direccion: 'Paso Viñal 1618',
    fecha: '10 y 11 de octubre de 2026',
    horaComienzo: '8:30',

    // Los días que se pueden elegir. Si el torneo es de un solo día, se
    // deja uno solo y la pregunta se muestra igual.
    dias: [
      { valor: 'sabado', texto: 'Sábado 10 — Pre Match' },
      { valor: 'domingo', texto: 'Domingo 11 — Torneo' },
    ],

    // Los precios, en pesos y sin puntos ni símbolos.
    //
    // **No hay precio de asociado acá, y no es un olvido.** Estuvo una
    // versión y se sacó: el número de IDPA no se consulta a ningún lado,
    // así que cualquiera escribía cualquier cosa y la página le cobraba
    // cinco mil pesos menos. Lo resuelve el club, que al recibir la
    // inscripción ve el número de IDPA y sabe cuánto tenía que pagar.
    // Se avisa en `notaPago`, que va destacada abajo del importe: en el
    // gris chico de una nota pasaba de largo y el asociado terminaba
    // transfiriendo de más.
    precio: 45000,
    precioSegundaArma: 20000,

    // A dónde se transfiere.
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    // Una línea más abajo del importe, para lo que no entra en el resto.
    // Si no hace falta, se deja en '' y no se muestra nada.
    notaPago: 'Si estás asociado a IDPA la inscripción te sale $40.000: transferí ese importe y avisanos.',

    // El pre match del sábado tiene cupo. Acá sólo se dice qué días lo
    // tienen: el número y la cuenta viven en `functions/inscripciones.js`.
    cupos: { sabado: true },

    // El almuerzo de camaradería es el domingo: al que viene al pre match
    // del sábado no se le pregunta. El valor es la clave del día, la
    // misma de `dias`. El torneo que no lo tenga no lleva esta línea.
    almuerzo: 'domingo',

    // Hasta cuándo se puede inscribir. Pasada esa fecha la página lo dice
    // y no deja enviar; la función tampoco acepta. Dos formas:
    //   '2026-10-08'        el día entero, inclusive
    //   '2026-09-17T12:00'  hasta esa hora, en hora de Argentina
    // Tiene que coincidir con functions/inscripciones.js del repo de Score.
    // A las 21 del jueves, no a medianoche.
    cierra: '2026-10-08T21:00',

    // Opcional: si un torneo corre solo algunas divisiones, se listan acá
    // y el formulario muestra únicamente esas. Sin esta línea salen todas.
    // divisiones: ['SSP', 'ESP', 'CDP'],
  },

  'san-jeronimo-sud': {
    titulo: '1º Torneo Social de IDPA',
    subtitulo: 'El primero en San Jerónimo Sud',
    sede: 'Tiro Federal Argentino de San Jerónimo Sud',
    ciudad: 'San Jerónimo Sud, Santa Fe',
    direccion: 'Av. 1 de Junio 50',
    fecha: '14 y 15 de noviembre de 2026',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 14 — Pre Match' },
      { valor: 'domingo', texto: 'Domingo 15 — Torneo' },
    ],

    precio: 45000,
    precioSegundaArma: 20000,

    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    notaPago: 'Si estás asociado a IDPA la inscripción te sale $40.000: transferí ese importe.',

    // El pre match del sábado tiene cupo. Acá sólo hace falta decir qué
    // días lo tienen:
    // cuántos lugares quedan lo cuenta el servidor y lo devuelve la lista
    // de inscriptos, para no contar dos veces al que corre con dos armas.
    // El número vive en `functions/inscripciones.js`, que es quien decide.
    cupos: { sabado: true },

    // Dos escuadras de quince, sólo el día del torneo, **la 2 y la 3**:
    // la ESCUADRA 1 es el pre match del sábado, porque los dos días
    // entran al mismo match de 9x19 Score. El número manda del lado de la
    // función; acá está para que la página pregunte.
    escuadras: { cuantas: 2, desde: 2, porEscuadra: 15, dia: 'domingo' },

    // El jueves a las 21, como dice el aviso del formulario.
    cierra: '2026-11-12T21:00',
  },

  // **Este torneo lo organiza otro club.** El Tiro Federal de Tucumán lo
  // corre y 9x19 pone el formulario: el alias es de ellos, así que la
  // plata no pasa por el club, y el aviso de cada inscripción le llega
  // también a su organizador. Eso último se decide del lado de la
  // función, que es la que manda el correo.
  tucuman: {
    titulo: 'Torneo de IDPA',
    subtitulo: 'Homenaje a Rolando Scaravilli',
    sede: 'Tiro Federal de Tucumán',
    ciudad: 'San Miguel de Tucumán',
    direccion: 'Av. Silvano Bores 585',
    fecha: '21 y 22 de noviembre de 2026',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 21 — Clasificación (72 disparos)' },
      { valor: 'domingo', texto: 'Domingo 22 — Torneo (78 disparos)' },
      { valor: 'ambos', texto: 'Los dos días — Clasificación y torneo' },
    ],

    // **Cada día tiene su precio.** La clasificación y el torneo se pagan
    // por separado, y el que viene a los dos paga la suma. Donde hay
    // `precios`, `precio` no se mira — y el total recién se sabe cuando
    // el tirador elige el día.
    precios: { sabado: 20000, domingo: 50000, ambos: 70000 },
    precioSegundaArma: 20000,

    alias: 'Tiro.federal.tucuman',
    titularAlias: 'Tiro Federal de Tucumán',

    // **A quién le escribe el inscripto.** En un torneo de otro club no
    // es el club: el comprobante que llega tarde lo mira quien cobra, y
    // de los lugares y la confirmación sabe quien organiza.
    correoContacto: 'cesartorrent@gmail.com',

    notaPago: '',

    // El jueves a las 21, como dice el aviso del formulario.
    cierra: '2026-11-19T21:00',
  },

  'santa-fe': {
    titulo: '4º Torneo Social de IDPA',
    subtitulo: 'Torneo Anual 2026 · Homenaje a Jorge Pastor',
    sede: 'Tiro Federal Argentino de Santa Fe',
    ciudad: 'Santa Fe',
    direccion: 'Av. Urquiza 751',
    fecha: '19 y 20 de septiembre de 2026',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 19 — Pre Match' },
      { valor: 'domingo', texto: 'Domingo 20 — Torneo' },
    ],

    precio: 35000,
    precioSegundaArma: 20000,

    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    notaPago: 'Si estás asociado a IDPA la inscripción te sale $30.000 y tenés bonificación en la comida: transferí ese importe y avisanos.',

    // A las 12 del mediodía del jueves, no a medianoche.
    cierra: '2026-09-17T12:00',
  },
  '2027-clasificacion': {
    titulo: 'Clasificación',
    subtitulo: 'Apertura de la temporada 2027',
    sede: 'Tiro Federal de Esperanza',
    ciudad: 'Esperanza, Santa Fe',
    direccion: 'Paso Viñal 1618',
    fecha: '20 y 21 de febrero de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 20' },
      { valor: 'domingo', texto: 'Domingo 21' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-02-18T21:00',
  },

  '2027-f1': {
    titulo: '1ª Fecha',
    subtitulo: 'Torneo Anual 2027',
    sede: 'Tiro Federal de Esperanza',
    ciudad: 'Esperanza, Santa Fe',
    direccion: 'Paso Viñal 1618',
    fecha: '13 y 14 de marzo de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 13' },
      { valor: 'domingo', texto: 'Domingo 14' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-03-11T21:00',
  },

  '2027-f2': {
    titulo: '2ª Fecha',
    subtitulo: 'Torneo Anual 2027',
    sede: 'Tiro Federal Argentino de Santa Fe',
    ciudad: 'Santa Fe',
    direccion: 'Av. Urquiza 751',
    fecha: '10 y 11 de abril de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 10' },
      { valor: 'domingo', texto: 'Domingo 11' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-04-08T21:00',
  },

  '2027-f3': {
    titulo: '3ª Fecha',
    subtitulo: 'Torneo Anual 2027',
    sede: 'Tiro Federal Argentino de San Jerónimo Sud',
    ciudad: 'San Jerónimo Sud, Santa Fe',
    direccion: 'Av. 1 de Junio 50',
    fecha: '15 y 16 de mayo de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 15' },
      { valor: 'domingo', texto: 'Domingo 16' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-05-13T21:00',
  },

  '2027-f4': {
    titulo: '4ª Fecha',
    subtitulo: 'Torneo Anual 2027',
    sede: 'Tiro Federal de Esperanza',
    ciudad: 'Esperanza, Santa Fe',
    direccion: 'Paso Viñal 1618',
    fecha: '12 y 13 de junio de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 12' },
      { valor: 'domingo', texto: 'Domingo 13' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-06-10T21:00',
  },

  '2027-f5': {
    titulo: '5ª Fecha',
    subtitulo: 'Torneo Anual 2027',
    sede: 'Tiro Federal Argentino de Santa Fe',
    ciudad: 'Santa Fe',
    direccion: 'Av. Urquiza 751',
    fecha: '10 y 11 de julio de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 10' },
      { valor: 'domingo', texto: 'Domingo 11' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-07-08T21:00',
  },

  '2027-f6': {
    titulo: '6ª Fecha',
    subtitulo: 'Torneo Anual 2027',
    sede: 'Tiro Federal Argentino de San Jerónimo Sud',
    ciudad: 'San Jerónimo Sud, Santa Fe',
    direccion: 'Av. 1 de Junio 50',
    fecha: '7 y 8 de agosto de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 7' },
      { valor: 'domingo', texto: 'Domingo 8' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-08-05T21:00',
  },

  '2027-f7': {
    titulo: '7ª Fecha',
    subtitulo: 'Torneo Anual 2027',
    sede: 'Tiro Federal de Esperanza',
    ciudad: 'Esperanza, Santa Fe',
    direccion: 'Paso Viñal 1618',
    fecha: '4 y 5 de septiembre de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 4' },
      { valor: 'domingo', texto: 'Domingo 5' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-09-02T21:00',
  },

  '2027-f8': {
    titulo: '8ª Fecha',
    subtitulo: 'Copa · Torneo Anual 2027',
    sede: 'Tiro Federal Argentino de Santa Fe',
    ciudad: 'Santa Fe',
    direccion: 'Av. Urquiza 751',
    fecha: '9 y 10 de octubre de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 9' },
      { valor: 'domingo', texto: 'Domingo 10' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-10-07T21:00',
  },

  '2027-f9': {
    titulo: '9ª Fecha',
    subtitulo: 'Torneo Anual 2027',
    sede: 'Tiro Federal de Esperanza',
    ciudad: 'Esperanza, Santa Fe',
    direccion: 'Paso Viñal 1618',
    fecha: '6 y 7 de noviembre de 2027',
    horaComienzo: '8:30',

    dias: [
      { valor: 'sabado', texto: 'Sábado 6' },
      { valor: 'domingo', texto: 'Domingo 7' },
    ],

    // Todavía no abre y no hay fecha anunciada. Cuando el club la
    // defina: `abre: '2027-01-15'`, y se abre sola ese día.
    abre: '',

    // Sin precio: el del año pasado no vale y abrir con él sería
    // peor que no abrir. Mientras no esté cargado la inscripción
    // no abre, aunque `abre` diga que sí.
    precio: 0,
    precioSegundaArma: 0,
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    cierra: '2027-11-04T21:00',
  },

};

// ¿Ya cerró la inscripción de este torneo?
//
// `cierra` puede ser un día entero ('2026-10-08', inclusive: se compara
// contra el día de hoy, para que el que entra a las once de la noche
// pueda anotarse) o un día con hora ('2026-09-17T12:00', en hora de
// Argentina: el -03:00 hace que cierre en el mismo instante para todos,
// esté donde esté el que mira). Sin `cierra`, el torneo no cierra solo.
//
// **Vive acá y no en cada página** porque la miran las dos: el
// formulario, para mostrar el cartel de cerrado, y la portada, para
// apagar el botón "Inscribirme" y sacar el QR. Escrita dos veces,
// tarde o temprano una de las dos diría otra cosa.
//
// Ojo: esto es la cortesía de no invitar a lo que ya cerró. **Lo que
// de verdad cierra la inscripción es la función**, que vuelve a mirar
// la misma fecha y rechaza lo que llegue tarde: acá cualquiera podría
// cambiar la hora de su teléfono.
// ¿Todavía NO abrió? Lo contrario de la de abajo, y con la misma
// forma de escribir la fecha. Un torneo del año que viene se carga
// con `abre` y hasta entonces la portada no invita a nada.
//
//   abre: '2027-01-15'       abre sola ese día
//   abre: '2027-01-15T09:00' a esa hora
//   abre: ''                 todavía no, sin fecha anunciada
//   sin `abre`               abierta, como siempre
//
// **Sin precio cargado tampoco abre**, diga lo que diga `abre`: el
// del año pasado no vale, y abrir cobrando ése sería peor que no
// abrir. La misma regla está en functions/inscripciones.js.
window.todaviaNoAbre = function (torneo) {
  const t = typeof torneo === 'string' ? ((window.TORNEOS || {})[torneo] || {}) : (torneo || {});
  // `precios` es el torneo que cobra por día, que no tiene `precio`.
  if (!t.precio && !t.precios) return true;
  if (!('abre' in t)) return false;
  const abre = t.abre;
  if (!abre) return true;
  if (abre.includes('T')) return Date.now() < Date.parse(abre + ':00-03:00');

  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return (d.getFullYear() + '-' + mm + '-' + dd) < abre;
};

// Para el cartel: "Inscripción desde el 15/1". Vacío si no hay fecha.
window.cuandoAbre = function (torneo) {
  const t = typeof torneo === 'string' ? ((window.TORNEOS || {})[torneo] || {}) : (torneo || {});
  const abre = String(t.abre || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(abre)) return '';
  const p = abre.split('-');
  return Number(p[2]) + '/' + Number(p[1]);
};

window.cerroLaInscripcion = function (torneo) {
  const cierra = typeof torneo === 'string'
    ? ((window.TORNEOS || {})[torneo] || {}).cierra
    : (torneo || {}).cierra;
  if (!cierra) return false;
  if (cierra.includes('T')) return Date.now() >= Date.parse(cierra + ':00-03:00');

  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return (d.getFullYear() + '-' + mm + '-' + dd) > cierra;
};
