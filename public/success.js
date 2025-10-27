// success.js
const statusDiv = document.getElementById('status');
const btn = document.getElementById('downloadBtn');


function getParam(name) {
const url = new URL(window.location.href);
return url.searchParams.get(name);
}


(async () => {
const sessionId = getParam('session_id');
if (!sessionId) {
statusDiv.innerHTML = '<p class="error">Sessão inválida.</p>';
return;
}
try {
statusDiv.textContent = 'Verificando pagamento...';
const res = await fetch(`/session-status?session_id=${encodeURIComponent(sessionId)}`);
const data = await res.json();
if (!res.ok) throw new Error(data.error || 'Falha no status.');


if (data.paid) {
statusDiv.innerHTML = `<p>Pagamento confirmado para <strong>${data.name}</strong> — Pontuação: <strong>${data.score}</strong>.</p>`;
btn.classList.remove('hidden');
btn.addEventListener('click', () => {
window.location.href = `/certificate?session_id=${encodeURIComponent(sessionId)}`;
});
} else {
statusDiv.innerHTML = '<p class="error">Pagamento ainda não confirmado. Aguarde alguns segundos e atualize.</p>';
}
} catch (e) {
statusDiv.innerHTML = `<p class="error">${e.message}</p>`;
}
})();