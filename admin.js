const API = '';
let adminKey = sessionStorage.getItem('drake_admin') || '';
let scripts = [];

function mostrar(id, show) {
  document.getElementById(id).style.display = show ? '' : 'none';
}

if (adminKey) {
  mostrar('loginScreen', false);
  mostrar('painel', true);
  carregarScripts();
}

async function fazerLogin() {
  const key = document.getElementById('adminKey').value;
  const r = await fetch(API + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const d = await r.json();
  if (d.ok) {
    adminKey = key;
    sessionStorage.setItem('drake_admin', key);
    mostrar('loginScreen', false);
    mostrar('painel', true);
    carregarScripts();
  } else {
    alert('Chave inválida');
  }
}

function sair() {
  sessionStorage.removeItem('drake_admin');
  adminKey = '';
  location.reload();
}

async function carregarScripts() {
  const r = await fetch(API + '/api/scripts');
  scripts = await r.json();
  renderLista();
}

function renderLista() {
  const lista = document.getElementById('listaScripts');
  const q = (document.getElementById('f-busca').value || '').toLowerCase();
  lista.innerHTML = '';
  const filtrados = scripts.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.credit.toLowerCase().includes(q) ||
    s.game.toLowerCase().includes(q)
  );
  if (filtrados.length === 0) {
    lista.innerHTML = '<p style="color:#a8957a;text-align:center;padding:20px">Nenhum script.</p>';
    return;
  }
  filtrados.forEach(s => {
    const row = document.createElement('div');
    row.className = 'script-row';
    row.innerHTML = `
      <img src="${s.image || 'https://via.placeholder.com/100x100/ffc440/1e1408'}" alt="${s.name}">
      <div class="info">
        <h4>${s.name}</h4>
        <p>${s.credit} • ${s.game} • ${s.plays || 0} usos</p>
      </div>
      <button class="btn-del" onclick="deletar('${s.id}')">Excluir</button>
    `;
    lista.appendChild(row);
  });
}

async function deletar(id) {
  if (!confirm('Eliminar este script?')) return;
  const r = await fetch(API + '/api/admin/scripts/' + id, {
    method: 'DELETE',
    headers: { 'x-admin-key': adminKey }
  });
  if (r.ok) {
    alert('Script eliminado');
    carregarScripts();
  } else {
    alert('Error al eliminar');
  }
}

function limparForm() {
  document.getElementById('formScript').reset();
}

document.getElementById('formScript').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('name', document.getElementById('f-nome').value);
  fd.append('credit', document.getElementById('f-credit').value);
  fd.append('game', document.getElementById('f-game').value);
  fd.append('code', document.getElementById('f-code').value);
  const imgUrl = document.getElementById('f-image-url').value;
  if (imgUrl) fd.append('image', imgUrl);
  const imgFile = document.getElementById('f-image').files[0];
  if (imgFile) fd.append('image', imgFile);

  const r = await fetch(API + '/api/admin/scripts', {
    method: 'POST',
    headers: { 'x-admin-key': adminKey },
    body: fd
  });
  if (r.ok) {
    alert('Script publicado!');
    limparForm();
    carregarScripts();
  } else {
    alert('Error al publicar');
  }
});

document.getElementById('f-busca').addEventListener('input', renderLista);