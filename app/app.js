/* LoganGroeit — schermen en interactie (Milestones 3-5) */
(function () {
  'use strict';

  var EMOJI = [
    { waarde: 1, teken: '😞', label: 'Heel vervelend' },
    { waarde: 2, teken: '😐', label: 'Matig' },
    { waarde: 3, teken: '🙂', label: 'Prima' },
    { waarde: 4, teken: '😄', label: 'Leuk' },
    { waarde: 5, teken: '🤩', label: 'Top' }
  ];

  var $ = function (sel) { return document.querySelector(sel); };
  var schermen = {
    home: $('#scherm-home'),
    rating: $('#scherm-rating'),
    tijdlijn: $('#scherm-tijdlijn')
  };

  var bewerktId = null;
  var gekozenRating = null;

  function emojiVoor(n) {
    var e = EMOJI.filter(function (x) { return x.waarde === n; })[0];
    return e ? e.teken : '❓';
  }

  function datumNL(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function toonScherm(naam) {
    Object.keys(schermen).forEach(function (k) {
      schermen[k].classList.toggle('actief', k === naam);
    });
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('actief', t.dataset.tab === naam);
    });
    window.scrollTo(0, 0);
  }

  function toast(tekst) {
    var el = $('#toast');
    el.textContent = '✓ ' + tekst;
    el.hidden = false;
    el.classList.add('zichtbaar');
    setTimeout(function () {
      el.classList.remove('zichtbaar');
      setTimeout(function () { el.hidden = true; }, 250);
    }, 1400);
  }

  function itemHtml(w) {
    var tegen = w.tegenstander ? '<span class="tegen">vs ' + escape(w.tegenstander) + '</span>' : '';
    var notitie = w.notitie ? '<p class="notitie">' + escape(w.notitie) + '</p>' : '';
    return '<li><button class="item" data-id="' + escape(w.id) + '">' +
      '<span class="item-emoji" aria-hidden="true">' + emojiVoor(w.fun_rating) + '</span>' +
      '<span class="item-tekst"><strong>' + datumNL(w.datum) + '</strong>' + tegen + notitie + '</span>' +
      '<span class="item-score">' + w.fun_rating + '/5</span></button></li>';
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    var alle = Store.alle();

    var recent = alle.slice(0, 3);
    $('#lijst-recent').innerHTML = recent.length
      ? recent.map(itemHtml).join('')
      : '<li class="leeg-inline">Nog geen wedstrijden gelogd.</li>';

    $('#lijst-tijdlijn').innerHTML = alle.map(itemHtml).join('');
    $('#leeg').hidden = alle.length > 0;

    if (alle.length) {
      var som = alle.reduce(function (t, w) { return t + w.fun_rating; }, 0);
      $('#tijdlijn-sub').textContent =
        alle.length + (alle.length === 1 ? ' wedstrijd' : ' wedstrijden') +
        ' · gemiddeld ' + (som / alle.length).toFixed(1) + '/5';
    } else {
      $('#tijdlijn-sub').textContent = '';
    }
  }

  function bouwEmoji() {
    $('#emoji-rij').innerHTML = EMOJI.map(function (e) {
      return '<button type="button" class="emoji" role="radio" aria-checked="false" ' +
        'data-waarde="' + e.waarde + '" aria-label="' + e.label + ' (' + e.waarde + ' van 5)">' +
        '<span aria-hidden="true">' + e.teken + '</span><small>' + e.label + '</small></button>';
    }).join('');
  }

  function kiesRating(n) {
    gekozenRating = n;
    document.querySelectorAll('.emoji').forEach(function (b) {
      var aan = Number(b.dataset.waarde) === n;
      b.classList.toggle('gekozen', aan);
      b.setAttribute('aria-checked', aan ? 'true' : 'false');
    });
    toonFout(null);
  }

  function toonFout(tekst) {
    var el = $('#fout');
    el.textContent = tekst || '';
    el.hidden = !tekst;
  }

  function openRating(wedstrijd) {
    bewerktId = wedstrijd ? wedstrijd.id : null;
    $('#rating-titel').textContent = wedstrijd ? 'Wedstrijd bewerken' : 'Nieuwe wedstrijd';
    $('#veld-datum').value = wedstrijd ? wedstrijd.datum : Store.vandaagISO();
    $('#veld-datum').max = Store.vandaagISO();
    $('#veld-tegenstander').value = wedstrijd ? wedstrijd.tegenstander || '' : '';
    $('#veld-notitie').value = wedstrijd ? wedstrijd.notitie || '' : '';
    $('#btn-verwijder').hidden = !wedstrijd;
    toonFout(null);
    gekozenRating = null;
    document.querySelectorAll('.emoji').forEach(function (b) {
      b.classList.remove('gekozen');
      b.setAttribute('aria-checked', 'false');
    });
    if (wedstrijd) kiesRating(wedstrijd.fun_rating);
    toonScherm('rating');
  }

  function opslaan(e) {
    e.preventDefault();
    var invoer = {
      datum: $('#veld-datum').value,
      tegenstander: $('#veld-tegenstander').value,
      fun_rating: gekozenRating,
      notitie: $('#veld-notitie').value
    };
    try {
      if (bewerktId) {
        Store.werkBij(bewerktId, invoer);
      } else {
        Store.voegToe(invoer);
      }
    } catch (fout) {
      toonFout(fout.message);
      return;
    }
    var bewerkt = !!bewerktId;
    bewerktId = null;
    render();
    toonScherm('home');
    toast(bewerkt ? 'Bijgewerkt' : 'Opgeslagen');
  }

  // --- events ---
  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { toonScherm(t.dataset.tab); });
  });

  $('#btn-nieuw').addEventListener('click', function () { openRating(null); });
  $('#btn-annuleer').addEventListener('click', function () {
    bewerktId = null;
    toonScherm('home');
  });
  $('#form-wedstrijd').addEventListener('submit', opslaan);

  $('#emoji-rij').addEventListener('click', function (e) {
    var knop = e.target.closest('.emoji');
    if (knop) kiesRating(Number(knop.dataset.waarde));
  });

  $('#btn-verwijder').addEventListener('click', function () {
    if (!bewerktId) return;
    if (!window.confirm('Deze wedstrijd verwijderen?')) return;
    Store.verwijder(bewerktId);
    bewerktId = null;
    render();
    toonScherm('tijdlijn');
    toast('Verwijderd');
  });

  document.addEventListener('click', function (e) {
    var item = e.target.closest('.item');
    if (!item) return;
    var w = Store.zoek(item.dataset.id);
    if (w) openRating(w);
  });

  bouwEmoji();
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline-cache is optioneel */ });
    });
  }
})();
