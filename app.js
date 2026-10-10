const API = '';
let todosScripts = [];

async function carregar() {
  const r = await fetch(API + '/api/scripts');
  todosScripts = await r.json();
  render(todosScripts);
}

function render(list) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  if (list.length === 0) {
    grid.innerHTML = '<p style="color:#a8957a;grid-column:1/-1;text-align:center;padding:40px">Nenhum script publicado.</p>';
    return;
  }
  list.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${s.image || 'https://via.placeholder.com/400x200/ffc440/1e1408?text=Drake+Exe'}" alt="${s.name}">
      <div class="card-body">
        <div class="game">${s.game}</div>
        <h3>${s.name}</h3>
        <div class="credit">por ${s.credit}</div>
        <div class="plays">▶ ${s.plays || 0} usos</div>
      </div>
    `;
    card.addEventListener('click', () => abrirDetalhe(s.id));
    grid.appendChild(card);
  });
}

function abrirDetalhe(id) {
  const s = todosScripts.find(x => x.id === id);
  if (!s) return;
  const grid = document.getElementById('grid');
  grid.innerHTML = `
    <div class="detalhe" style="grid-column:1/-1">
      <button onclick="carregar()" class="btn-copiar">← Volver</button>
      <img src="${s.image || 'https://via.placeholder.com/800x300/ffc440/1e1408?text=Drake+Exe'}" alt="${s.name}">
      <h1>${s.name}</h1>
      <div class="meta">por ${s.credit} • ${s.game} • ${s.plays || 0} usos</div>
      <pre id="codeBox">${escapeHtml(s.code)}</pre>
      <button class="btn-copiar" onclick="copiarCodigo()">Copiar script</button>
      <button class="btn-copiar" onclick="executarScript()">Executar</button>
    </div>
  `;
}

function escapeHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function copiarCodigo() {
  const code = document.getElementById('codeBox').textContent;
  navigator.clipboard.writeText(code).then(() => {
    alert('Script copiado ao portapapeles');
  });
}

function executarScript() {
  const code = document.getElementById('codeBox').textContent;
  const url = window.location.origin + '/api/scripts/' + todosScripts.find(s => code.includes(s.code.substring(0, 20)))?.id + '/code';
  const loadstring = `loadstring(game:HttpGet("${url}"))()`;
  navigator.clipboard.writeText(loadstring).then(() => {
    alert('Loadstring copiado:\n\n' + loadstring);
  });
}

document.getElementById('busca').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtrado = todosScripts.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.credit.toLowerCase().includes(q) ||
    s.game.toLowerCase().includes(q)
  );
  render(filtrado);
});

carregar();