export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message, 'order-type': orderType, 'selected-design': selectedDesign } = req.body || {};

  // Минимальная валидация — поля должны быть заполнены
  const n = (name || '').trim();
  const e = (email || '').trim();
  const m = (message || '').trim();

  if (!n) return res.status(400).json({ error: 'Укажите имя' });
  if (!e) return res.status(400).json({ error: 'Укажите email' });
  if (!m) return res.status(400).json({ error: 'Укажите сообщение' });

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('Missing RESEND_API_KEY or CONTACT_EMAIL env vars');
    return res.status(500).json({ error: 'Сервис временно недоступен' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Catizens <onboarding@resend.dev>',
      to: toEmail,
      subject: `Catizens: новый заказ — ${orderType || 'форма'}`,
      text: [
        `Имя: ${n}`,
        `Email: ${e}`,
        `Тип заказа: ${orderType || '—'}`,
        selectedDesign ? `Дизайн: ${selectedDesign}` : null,
        '',
        'Сообщение:',
        m,
      ].filter(Boolean).join('\n'),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Не удалось отправить заявку' });
  }

  res.status(200).json({ success: true });
}