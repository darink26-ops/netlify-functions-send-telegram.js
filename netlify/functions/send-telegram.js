// Telegram relay for all landing-page forms.
// Accepts JSON: { name, phone, role, question1, email?, utm: {...}, landing_url?, referrer? }
// Returns 200 { success: true } only after Telegram confirms delivery — the client ties the
// Meta Pixel Lead event to this response, so it must never return 200 optimistically.

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const field = (value, fallback = 'Не вказано') => {
  const text = value === undefined || value === null ? '' : String(value).trim();
  return escapeHtml(text === '' ? fallback : text);
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return { statusCode: 500, body: JSON.stringify({ error: 'Config missing' }) };
  }

  const utm = data.utm || {};
  const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    .some((key) => utm[key]);

  const lines = [
    '📥 <b>Нова заявка з сайту</b>',
    '',
    `👤 <b>Ім'я:</b> ${field(data.name)}`,
    `📞 <b>Телефон:</b> ${field(data.phone)}`,
    `💼 <b>Роль:</b> ${field(data.role)}`,
  ];

  if (data.email) {
    lines.push(`✉️ <b>Email:</b> ${field(data.email)}`);
  }

  lines.push('', '❓ <b>Запит:</b>', field(data.question1, 'Не обрано'));

  if (hasUtm) {
    lines.push(
      '',
      '📊 <b>UTM мітки:</b>',
      `• <b>Source:</b> ${field(utm.utm_source, '—')}`,
      `• <b>Medium:</b> ${field(utm.utm_medium, '—')}`,
      `• <b>Campaign:</b> ${field(utm.utm_campaign, '—')}`,
      `• <b>Term:</b> ${field(utm.utm_term, '—')}`,
      `• <b>Content:</b> ${field(utm.utm_content, '—')}`
    );
  }

  if (data.landing_url) {
    lines.push('', `🔗 ${field(data.landing_url, '—')}`);
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const resData = await response.json().catch(() => null);

    if (response.ok && resData && resData.ok) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    console.error('Telegram API error:', resData);
    return { statusCode: 502, body: JSON.stringify({ error: 'Delivery failed' }) };
  } catch (err) {
    console.error('Function error:', err && err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
