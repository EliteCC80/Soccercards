/* Node-testje voor de opslaglaag: node test/store.test.js */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Minimale localStorage-stub zodat store.js buiten de browser draait.
const geheugen = new Map();
globalThis.localStorage = {
  getItem: (k) => (geheugen.has(k) ? geheugen.get(k) : null),
  setItem: (k, v) => geheugen.set(k, String(v)),
  removeItem: (k) => geheugen.delete(k)
};

new Function(fs.readFileSync(path.join(__dirname, '..', 'app', 'store.js'), 'utf8'))();
const { Store } = globalThis;

let gedaan = 0;
function test(naam, fn) {
  fn();
  gedaan++;
  console.log('  ✓ ' + naam);
}
function faalt(fn, fragment) {
  try { fn(); } catch (e) {
    assert.ok(e.message.includes(fragment), `verwachtte "${fragment}" in "${e.message}"`);
    return;
  }
  throw new Error('verwachtte een fout, maar kreeg er geen');
}

console.log('Store-tests:');

test('start leeg', () => assert.deepStrictEqual(Store.alle(), []));

test('wegschrijven en uitlezen', () => {
  const w = Store.voegToe({ datum: '2026-09-12', tegenstander: 'DVO', fun_rating: 4, notitie: 'twee assists' });
  assert.ok(w.id && w.aangemaakt_op);
  const uit = Store.zoek(w.id);
  assert.strictEqual(uit.fun_rating, 4);
  assert.strictEqual(uit.tegenstander, 'DVO');
  assert.strictEqual(uit.notitie, 'twee assists');
});

test('datum is standaard vandaag', () => {
  const w = Store.voegToe({ fun_rating: 3 });
  assert.strictEqual(w.datum, Store.vandaagISO());
  Store.verwijder(w.id);
});

test('tijdlijn staat nieuwste eerst', () => {
  const oud = Store.voegToe({ datum: '2026-01-05', fun_rating: 2 });
  const nieuw = Store.voegToe({ datum: '2026-09-18', fun_rating: 5 });
  const alle = Store.alle();
  assert.strictEqual(alle[0].id, nieuw.id);
  assert.strictEqual(alle[alle.length - 1].id, oud.id);
});

test('recent geeft maximaal 3', () => assert.ok(Store.recent(3).length <= 3));

test('rating buiten 1-5 wordt geweigerd', () => {
  faalt(() => Store.voegToe({ fun_rating: 0 }), 'fun-rating');
  faalt(() => Store.voegToe({ fun_rating: 6 }), 'fun-rating');
  faalt(() => Store.voegToe({ fun_rating: null }), 'fun-rating');
  faalt(() => Store.voegToe({ fun_rating: 3.5 }), 'fun-rating');
});

test('datum in de toekomst wordt geweigerd', () => {
  faalt(() => Store.voegToe({ datum: '2099-01-01', fun_rating: 3 }), 'toekomst');
});

test('onzinnige datum wordt geweigerd', () => {
  faalt(() => Store.voegToe({ datum: 'morgen', fun_rating: 3 }), 'geldige datum');
});

test('bewerken overschrijft de bestaande rating', () => {
  const w = Store.voegToe({ datum: '2026-05-05', fun_rating: 2 });
  const bij = Store.werkBij(w.id, { datum: '2026-05-05', fun_rating: 5, notitie: 'toch leuk' });
  assert.strictEqual(bij.id, w.id);
  assert.strictEqual(Store.zoek(w.id).fun_rating, 5);
  assert.strictEqual(Store.zoek(w.id).notitie, 'toch leuk');
  assert.strictEqual(Store.alle().filter((x) => x.id === w.id).length, 1);
});

test('verwijderen haalt de wedstrijd weg', () => {
  const w = Store.voegToe({ datum: '2026-05-06', fun_rating: 1 });
  Store.verwijder(w.id);
  assert.strictEqual(Store.zoek(w.id), null);
});

test('corrupte opslag crasht niet', () => {
  geheugen.set('logangroeit.wedstrijden.v1', '{niet:[json');
  assert.deepStrictEqual(Store.alle(), []);
  geheugen.clear();
  assert.deepStrictEqual(Store.alle(), []);
});

console.log(`\n${gedaan} tests geslaagd.`);
