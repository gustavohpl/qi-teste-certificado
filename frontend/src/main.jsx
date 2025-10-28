import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import 'aos/dist/aos.css'
import AOS from 'aos'
import './style.css'

function App() {
  const [score, setScore] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { AOS.init({ once: true, duration: 600 }) }, [])

  const QUESTIONS = [
    { q: '2 + 2 = ?', options: ['3','4','5','6'], correct: 1 },
    { q: 'Sequência: 1,1,2,3,5, ?', options: ['7','8','13','21'], correct: 1 },
    { q: 'Qual é par?', options: ['11','13','17','18'], correct: 3 },
    { q: 'Metade de 50%', options: ['10%','20%','25%','50%'], correct: 0 },
  ]

  const calc = () => {
    setErr('')
    const checked = [...document.querySelectorAll('input[type=radio]:checked')]
    if (checked.length !== QUESTIONS.length) { setErr('Responda todas as questões.'); return }
    let s = 0
    checked.forEach((inp, i) => { if (Number(inp.value) === QUESTIONS[i].correct) s++ })
    setScore(s)
  }

  const pay = async () => {
    if (!name.trim() || !email.trim()) { setErr('Preencha nome e e-mail.'); return }
    setBusy(true); setErr('')
    try {
      const res = await fetch('/create-checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, score: Number(score||0) })
      })
      const data = await res.json()
      if (!res.ok || !data?.url) throw new Error(data.error || 'Falha ao criar sessão')
      window.location.href = data.url
    } catch (e) {
      setErr(e.message || 'Erro no pagamento')
      setBusy(false)
    }
  }

  return (
    <div class="max-w-4xl mx-auto p-6">
      <header class="mb-6" data-aos="fade-down">
        <h1 class="text-3xl font-black tracking-tight">
          🧠 Teste Lógico <span class="text-indigo-600">PRO</span>
        </h1>
        <p class="text-slate-600">Rápido, divertido e com certificado PDF.</p>
      </header>

      <section class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4" data-aos="fade-right">
          <div class="bg-white/80 backdrop-blur rounded-2xl shadow p-5">
            <label class="block text-sm font-medium">Nome</label>
            <input class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ring-indigo-300"
              value={name} onInput={e=>setName(e.target.value)} placeholder="Seu nome" />
            <label class="block mt-3 text-sm font-medium">E-mail</label>
            <input class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ring-indigo-300"
              value={email} onInput={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </div>

          <div class="bg-white/80 backdrop-blur rounded-2xl shadow p-5" data-aos="fade-up">
            <ol class="space-y-4">
              {QUESTIONS.map((it, i) => (
                <li class="border rounded-xl p-3" key={i}>
                  <p class="font-semibold">{i+1}) {it.q}</p>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    {it.options.map((opt, j) => (
                      <label class="flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-slate-50" key={j}>
                        <input type="radio" name={`q${i}`} value={j} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside class="space-y-4" data-aos="fade-left">
          <div class="bg-gradient-to-br from-indigo-600 to-sky-500 text-white rounded-2xl shadow p-5">
            <h2 class="text-xl font-bold">Seu resultado</h2>
            <p class="opacity-90">Clique para calcular sua pontuação.</p>
            <button class="mt-3 w-full rounded-xl bg-white/90 text-indigo-700 font-semibold py-2 hover:bg-white transition"
              onClick={calc}>
              Calcular Pontuação
            </button>

            {score !== null && (
              <div class="mt-4 bg-white/10 rounded-xl p-3">
                <p class="text-lg">🏁 {score} de {QUESTIONS.length} pontos</p>
                <button disabled={busy}
                  class={`mt-3 w-full rounded-xl bg-black/80 text-white font-semibold py-2 ${busy?'opacity-60':''}`}
                  onClick={pay}>
                  {busy ? 'Redirecionando...' : 'Gerar Certificado (R$ 4,00)'}
                </button>
              </div>
            )}
          </div>

          {err && <p class="text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{err}</p>}

          <div class="bg-white/80 rounded-2xl shadow p-5">
            <p class="text-sm text-slate-600"><strong>Aviso:</strong> uso recreativo, sem validade clínica.</p>
          </div>
        </aside>
      </section>
    </div>
  )
}

render(<App />, document.getElementById('app'))
