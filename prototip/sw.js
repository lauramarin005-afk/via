/**
 * Service worker VIA.
 *
 * Ține învelișul aplicației în cache, ca să pornească instant și să se deschidă
 * și fără semnal. Datele NU se cachează: agenda și alertele trebuie să fie
 * proaspete, iar o agendă veche e mai rea decât una care lipsește.
 */

const VERSIUNE = 'via-v1';
const INVELIS = ['./', './index.html', './manifest.webmanifest', './icoane/via-192.png', './icoane/via-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIUNE).then((c) => c.addAll(INVELIS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chei) => Promise.all(chei.filter((k) => k !== VERSIUNE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const cerere = e.request;
  if (cerere.method !== 'GET') return;

  const adresa = new URL(cerere.url);
  if (adresa.origin !== self.location.origin) return;

  // Datele merg mereu la server; dacă nu se poate, e mai cinstit să eșueze.
  if (adresa.pathname.startsWith('/api/')) return;

  // Învelișul: întâi rețeaua, ca o versiune nouă să ajungă imediat; cache ca plasă.
  e.respondWith(
    fetch(cerere)
      .then((r) => {
        if (r.ok) { const copie = r.clone(); caches.open(VERSIUNE).then((c) => c.put(cerere, copie)); }
        return r;
      })
      .catch(() => caches.match(cerere).then((r) => r || caches.match('./index.html'))),
  );
});
