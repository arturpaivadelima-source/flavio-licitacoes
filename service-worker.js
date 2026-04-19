const CACHE = 'flavio-licitacoes-v1';
const STATIC = [
  '/flavio-licitacoes/',
  '/flavio-licitacoes/index.html',
  '/flavio-licitacoes/licitacoes.html',
  '/flavio-licitacoes/manifest.json',
  'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800&display=swap'
];

// Instala e faz cache dos arquivos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network first, cache como fallback
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Requisições da API PNCP: nunca cacheia (dados ao vivo)
  if (url.hostname === 'pncp.gov.br') return;

  // Outros recursos: tenta rede, cai no cache se offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza cache com resposta fresca
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
