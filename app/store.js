/* LoganGroeit — opslaglaag (Milestone 2)
 * Eén entiteit: wedstrijd. Lokale opslag via localStorage (JSON).
 * Velden: id, datum, tegenstander, fun_rating, notitie, aangemaakt_op
 */
(function (global) {
  'use strict';

  var SLEUTEL = 'logangroeit.wedstrijden.v1';

  function vandaagISO() {
    var d = new Date();
    var m = d.getMonth() + 1, dag = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dag < 10 ? '0' : '') + dag;
  }

  function nieuwId() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'w-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function isGeldigeDatum(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + 'T00:00:00');
    return !isNaN(d.getTime()) && s === s.slice(0, 10);
  }

  /** Gooit Error met leesbare NL-melding bij ongeldige invoer. */
  function valideer(invoer) {
    var rating = Number(invoer.fun_rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Kies een fun-rating van 1 tot en met 5.');
    }
    var datum = invoer.datum || vandaagISO();
    if (!isGeldigeDatum(datum)) {
      throw new Error('Vul een geldige datum in.');
    }
    if (datum > vandaagISO()) {
      throw new Error('De datum mag niet in de toekomst liggen.');
    }
    return {
      datum: datum,
      tegenstander: (invoer.tegenstander || '').trim().slice(0, 60),
      fun_rating: rating,
      notitie: (invoer.notitie || '').trim().slice(0, 280)
    };
  }

  function lees() {
    var ruw;
    try {
      ruw = global.localStorage.getItem(SLEUTEL);
    } catch (e) {
      return []; // bv. private mode / opslag geblokkeerd
    }
    if (!ruw) return [];
    try {
      var data = JSON.parse(ruw);
      return Array.isArray(data) ? data.filter(function (w) {
        return w && typeof w.id === 'string' && isGeldigeDatum(w.datum) &&
          Number.isInteger(w.fun_rating) && w.fun_rating >= 1 && w.fun_rating <= 5;
      }) : [];
    } catch (e) {
      return []; // corrupte opslag mag de app niet laten crashen
    }
  }

  function schrijf(lijst) {
    try {
      global.localStorage.setItem(SLEUTEL, JSON.stringify(lijst));
      return true;
    } catch (e) {
      throw new Error('Opslaan lukte niet — is de opslag van je telefoon vol?');
    }
  }

  /** Alle wedstrijden, nieuwste eerst (index op datum, tiebreak aangemaakt_op). */
  function alle() {
    return lees().sort(function (a, b) {
      if (a.datum !== b.datum) return a.datum < b.datum ? 1 : -1;
      return (b.aangemaakt_op || '') < (a.aangemaakt_op || '') ? -1 : 1;
    });
  }

  function recent(n) {
    return alle().slice(0, n || 3);
  }

  function zoek(id) {
    return alle().filter(function (w) { return w.id === id; })[0] || null;
  }

  function voegToe(invoer) {
    var schoon = valideer(invoer);
    schoon.id = nieuwId();
    schoon.aangemaakt_op = new Date().toISOString();
    var lijst = lees();
    lijst.push(schoon);
    schrijf(lijst);
    return schoon;
  }

  function werkBij(id, invoer) {
    var schoon = valideer(invoer);
    var lijst = lees();
    var i = lijst.findIndex(function (w) { return w.id === id; });
    if (i === -1) throw new Error('Deze wedstrijd bestaat niet meer.');
    lijst[i] = Object.assign({}, lijst[i], schoon);
    schrijf(lijst);
    return lijst[i];
  }

  function verwijder(id) {
    var lijst = lees().filter(function (w) { return w.id !== id; });
    schrijf(lijst);
  }

  global.Store = {
    vandaagISO: vandaagISO,
    alle: alle,
    recent: recent,
    zoek: zoek,
    voegToe: voegToe,
    werkBij: werkBij,
    verwijder: verwijder,
    valideer: valideer
  };
})(typeof window !== 'undefined' ? window : globalThis);
