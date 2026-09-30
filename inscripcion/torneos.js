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
    // cinco mil pesos menos. Lo del asociado se avisa en `notaPago` y lo
    // resuelve el club al mirar el comprobante.
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

    // Hasta cuándo se puede inscribir. Pasada esa fecha la página lo dice
    // y no deja enviar; la función tampoco acepta. Dos formas:
    //   '2026-10-08'        el día entero, inclusive
    //   '2026-09-17T12:00'  hasta esa hora, en hora de Argentina
    // Tiene que coincidir con functions/inscripciones.js del repo de Score.
    // A las 12 del mediodía del jueves, no a medianoche.
    cierra: '2026-10-08T12:00',

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

    notaPago: 'Si estás asociado a IDPA la inscripción te sale $40.000: transferí ese importe y avisanos.',

    // El sábado tiene cupo. Acá sólo hace falta decir qué días lo tienen:
    // cuántos lugares quedan lo cuenta el servidor y lo devuelve la lista
    // de inscriptos, para no contar dos veces al que corre con dos armas.
    // El número vive en `functions/inscripciones.js`, que es quien decide.
    cupos: { sabado: true },

    // A las 12 del mediodía del jueves, no a medianoche.
    cierra: '2026-11-12T12:00',
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

};
