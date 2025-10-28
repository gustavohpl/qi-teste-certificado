document.addEventListener('DOMContentLoaded', () => {
  try {
    alert('JS carregado'); // teste rápido

    // ---- Seletores robustos (aceita dois IDs possíveis) ----
    const form      = document.getElementById('userForm');
    const nameEl    = form?.querySelector('input[name=name]');
    const emailEl   = form?.querySelector('input[name=email]');
    const calcBtn   = document.getElementById('calcScoreBtn') || document.getElementById('calcBtn');
    const payBtn    = document.getElementById('payBtn');
    const scoreBox  = document.getElementById('scoreBox');
    const errBox    = document.getElementById('errorBox');
    const questionsOl = document.getElementById('questionsOl');

    if (!form || !nameEl || !emailEl || !calcBtn || !payBtn || !scoreBox || !errBox || !questionsOl) {
      console.error('Elementos do DOM não encontrados. Verifique os IDs no index.html');
      return;
    }

    // ---- Banco de perguntas (exemplo) ----
    const QUESTIONS = [
      { q: '2 + 2 = ?', options: ['3','4','5','6'], correct: 1 },
      { q: 'Próximo da sequência: 1, 1, 2, 3, 5, ?', options: ['7','8','13','21'], correct: 1 },
      { q: 'Qual é par?', options: ['11','13','17','18'], correct: 3 },
      { q: 'Se todos A são B e C é A, então C é…', options: ['B','A','nenhum','indefinido'], correct: 0 },
      { q: 'Metade de 50%', options: ['10%','20%','25%','50%'], correct: 0 },
      { q: 'Área do quadrado com lado 3', options: ['6','9','12','3'], correct: 1 },
      { q: 'Inverso de 1/5', options: ['1/25','5','2/5','5/2'], correct: 1 },
      { q: 'Maior: 0,7 ou 2/3?', options: ['0,7','2/3','iguais','não sei'], correct: 0 },
      { q: 'Próximo par após 98', options: ['99','100','101','102'], correct: 1 },
      { q: 'Raiz de 81', options: ['7','8','9','10'], correct: 2 },
    ];

    // ---- Render das perguntas ----
    QUESTIONS.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'question';
      li.innerHTML = `
        <p class="q">${idx + 1}) ${item.q}</p>
        <div class="opts">
          ${item.options.map((opt, i) => `
            <label class="opt">
              <input type="radio" name="q${idx}" value="${i}" required />
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
      questionsOl.appendChild(li);
    });

    // ---- Calcular pontuação ----
    calcBtn.addEventListener('click', (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');

      const checked = [...document.querySelectorAll('input[type=radio]:checked')];
      if (checked.length !== QUESTIONS.length) {
        errBox.textContent = 'Responda todas as questões.';
        errBox.classList.remove('hidden');
        return;
      }

      let score = 0;
      checked.forEach((input, i) => { if (Number(input.value) === QUESTIONS[i].correct) score++; });

      scoreBox.innerHTML = `<strong>Resultado:</strong> ${score} de ${QUESTIONS.length} pontos.`;
      scoreBox.classList.remove('hidden');

      payBtn.dataset.score = String(score);
      payBtn.classList.remove('hidden');
    });

    // ---- Enviar para o Stripe Checkout ----
    payBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');

      const name  = nameEl.value.trim();
      const email = emailEl.value.trim();
      const score = Number(payBtn.dataset.score || 0);

      if (!name || !email) {
        errBox.textContent = 'Preencha nome e e-mail.';
        errBox.classList.remove('hidden');
        return;
      }

      payBtn.disabled = true;
      const original = payBtn.textContent;
      payBtn.textContent = 'Redirecionando para o pagamento...';

      try {
        const res = await fetch('/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, score })
        });
        const data = await res.json();
        if (!res.ok || !data?.url) throw new Error(data.error || 'Erro ao criar sessão.');
        window.location.href = data.url;
      } catch (err) {
        errBox.textContent = err.message || 'Falha ao iniciar pagamento.';
        errBox.classList.remove('hidden');
        payBtn.disabled = false;
        payBtn.textContent = original;
      }
    });

  } catch (err) {
    console.error('Erro de inicialização do app.js:', err);
    alert('Falha ao carregar scripts. Atualize a página.');
  }
});
