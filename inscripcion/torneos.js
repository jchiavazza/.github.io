// LOS TORNEOS QUE SE PUEDEN INSCRIBIR
//
// Este es el único archivo que hay que tocar para abrir la inscripción de
// un torneo nuevo: se copia el bloque del anterior, se cambian los datos y
// se pushea. Ni el HTML ni la función de los correos hay que mirarlos.
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
    precio: 35000,          // el general
    precioAsociado: 30000,  // el de los asociados a IDPA
    precioSegundaArma: 20000,

    // A dónde se transfiere.
    alias: '9x19shooting.nx',
    titularAlias: 'José Chiavazza',

    // Una línea más abajo del importe, para lo que no entra en el resto.
    // Si no hace falta, se deja en '' y no se muestra nada.
    notaPago: 'Los asociados a IDPA tienen además una bonificación en la comida.',

    // Hasta cuándo se puede inscribir, inclusive. Pasada esa fecha la
    // página lo dice y no deja enviar; la función tampoco acepta.
    cierra: '2026-10-08',

    // Opcional: si un torneo corre solo algunas divisiones, se listan acá
    // y el formulario muestra únicamente esas. Sin esta línea salen todas.
    // divisiones: ['SSP', 'ESP', 'CDP'],
  },

};
