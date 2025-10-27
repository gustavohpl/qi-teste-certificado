// app.js
<input type="radio" name="q${idx}" value="${i}" required />
<span>${opt}</span>
</label>
`).join('')}
`;
questionsOl.appendChild(li);
});


const calcBtn = document.getElementById('calcScoreBtn');
const payBtn = document.getElementById('payBtn');
const scoreBox = document.getElementById('scoreBox');
const errBox = document.getElementById('errorBox');


calcBtn.addEventListener('click', () => {
errBox.classList.add('hidden');
const answers = [...document.querySelectorAll('input[type=radio]:checked')].map(i => Number(i.value));
if (answers.length !== QUESTIONS.length) {
errBox.textContent = 'Responda todas as questões.';
errBox.classList.remove('hidden');
return;
}
let score = 0;
answers.forEach((ans, i) => { if (ans === QUESTIONS[i].correct) score++; });


scoreBox.innerHTML = `<strong>Resultado:</strong> ${score} de ${QUESTIONS.length} pontos.`;
scoreBox.classList.remove('hidden');
payBtn.classList.remove('hidden');
payBtn.dataset.score = String(score);
});


payBtn.addEventListener('click', async () => {
const form = document.getElementById('userForm');
const name = form.querySelector('input[name=name]').value.trim();
const email = form.querySelector('input[name=email]').value.trim();
const score = Number(payBtn.dataset.score || 0);


if (!name || !email) {
errBox.textContent = 'Preencha nome e e-mail.';
errBox.classList.remove('hidden');
return;
}


payBtn.disabled = true; payBtn.textContent = 'Redirecionando para o pagamento...';
try {
const res = await fetch('/create-checkout-session', {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ name, email, score })
});
const data = await res.json();
if (!res.ok) throw new Error(data.error || 'Erro ao criar sessão.');
window.location.href = data.url;
} catch (e) {
errBox.textContent = e.message;
errBox.classList.remove('hidden');
payBtn.disabled = false; payBtn.textContent = 'Gerar Certificado (R$4,00)';
}
});