exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Config missing' })
      };
    }

    const messageText = `
📥 <b>Нова заявка з квізу!</b>

👤 <b>Ім'я:</b> ${data.name || 'Не вказано'}
📞 <b>Телефон:</b> ${data.phone || 'Не вказано'}
${data.email ? `✉️ <b>Email:</b> ${data.email}\n` : ''}
❓ <b>1-ше запитання:</b>
${data.question1 || 'Не обрано'}

📊 <b>UTM Мітки:</b>
• <b>Source:</b> ${data.utm?.utm_source || '—'}
• <b>Medium:</b> ${data.utm?.utm_medium || '—'}
• <b>Campaign:</b> ${data.utm?.utm_campaign || '—'}
• <b>Term:</b> ${data.utm?.utm_term || '—'}
• <b>Content:</b> ${data.utm?.utm_content || '—'}
    `.trim();

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      })
    });

    const resData = await response.json();

    if (response.ok) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      console.error('Telegram API Error:', resData);
      return { statusCode: 500, body: JSON.stringify({ error: resData }) };
    }
  } catch (err) {
    console.error('Function Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
