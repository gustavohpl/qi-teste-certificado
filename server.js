// server.js (ESM, Node 18+)
// -----------------------------------------
import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import path from 'path';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4242;
const BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

// --- Stripe ---
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Defina STRIPE_SECRET_KEY no arquivo .env');
  process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// ⚠️ Webhook (opcional): precisa vir ANTES do express.json()
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    try {
      const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!whSecret) {
        // Se não configurado, ignore educadamente
        return res.status(200).send();
      }
      const sig = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        paidSessions.add(session.id);
      }
      res.status(200).send();
    } catch (err) {
      console.error('⚠️ Falha ao validar webhook:', err.message);
      res.sendStatus(400);
    }
  }
);

// Depois do webhook, podemos parsear JSON normalmente
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

// Armazenamento simples em memória (MVP)
// Em produção, use um banco (SQLite/Postgres)
const paidSessions = new Set();

// Criar sessão de pagamento (Stripe Checkout)
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { name, email, score } = req.body;
    if (!name || !email || typeof score !== 'number') {
      return res.status(400).json({ error: 'Dados inválidos: name, email e score são obrigatórios.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Use só cartão enquanto testa. Depois podemos reativar o PIX.
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            unit_amount: 400, // R$ 4,00
            product_data: {
              name: 'Certificado do Teste Lógico',
              description: `Certificado com sua pontuação: ${score}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/index.html#pagamento-cancelado`,
      metadata: { name, score: String(score) },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Erro Stripe:', err?.raw?.message || err.message || err);
    return res.status(500).json({ error: 'Falha ao criar sessão de pagamento.' });
  }
});


// Checar status da sessão
app.get('/session-status', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id é obrigatório' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const paid = session.payment_status === 'paid';

    if (paid) paidSessions.add(session_id);

    res.json({
      paid,
      name: session.metadata?.name || '',
      score: Number(session.metadata?.score || 0),
      email: session.customer_email || '',
    });
  } catch (err) {
    console.error('Erro ao checar sessão:', err);
    res.status(500).json({ error: 'Falha ao verificar sessão.' });
  }
});

// Gerar certificado em PDF (apenas para sessão paga)
app.get('/certificate', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id é obrigatório' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const isPaid =
      session.payment_status === 'paid' || paidSessions.has(session_id);

    if (!isPaid) {
      return res.status(402).json({ error: 'Pagamento não confirmado.' });
    }

    const name = session.metadata?.name || 'Participante';
    const score = Number(session.metadata?.score || 0);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificado-${session_id}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Moldura
    doc.rect(20, 20, 555, 800).lineWidth(4).stroke('#0a66c2');

    // Título
    doc
      .fontSize(28)
      .fillColor('#0a66c2')
      .text('CERTIFICADO DE PARTICIPAÇÃO', { align: 'center' })
      .moveDown(1.2);

    doc
      .fontSize(16)
      .fillColor('#222')
      .text('Certificamos que', { align: 'center' })
      .moveDown(0.5);

    doc.fontSize(24).fillColor('#000').text(name, { align: 'center' }).moveDown(0.5);

    doc
      .fontSize(16)
      .fillColor('#222')
      .text(
        'concluiu o Teste Lógico Recreativo, obtendo a seguinte pontuação:',
        { align: 'center' }
      )
      .moveDown(0.5);

    doc
      .fontSize(36)
      .fillColor('#0a66c2')
      .text(`${score} pontos`, { align: 'center' })
      .moveDown(1);

    const date = new Date().toLocaleDateString('pt-BR');
    doc.fontSize(12).fillColor('#444').text(`Emitido em: ${date}`, {
      align: 'center',
    });

    doc.moveDown(2);
    doc
      .fontSize(12)
      .fillColor('#000')
      .text('______________________________', { align: 'center' })
      .text('Coordenação – SaberDigital', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Erro ao gerar certificado:', err);
    res.status(500).json({ error: 'Falha ao gerar certificado.' });
  }
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em ${BASE_URL}`);
});
