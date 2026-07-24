const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Дозволяємо лише POST-запити
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Зчитуємо дані, які прийшли з форми
    const data = JSON.parse(event.body);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Telegram credentials are missing in Environment Variables' })
      };
    }

    // Красиво форматуємо текст повідомлення для Telegram
    const messageText = `
📥 <b>Нова заявка з квізу!</b>

👤 <b>Ім'я:</b> ${data.name || 'Не вказано'}
📞 <b>Телефон:</b> ${data.phone || 'Не вказано'}
${data.email ? `✉️ <b>Email:</b> ${data.email}\n` : ''}
❓ <b>1-ше запитання квізу:</b>
${data.question1 || 'Не обрано'}

📊 <b>UTM Мітки:</b>
• <b>Source:</b> ${data.utm?.utm_source || '—'}
• <b>Medium:</b> ${data.utm?.utm_medium || '—'}
• <b>Campaign:</b> ${data.utm?.utm_campaign || '—'}
• <b>Term:</b> ${data.utm?.utm_term || '—'}
• <b>Content:</b> ${data.utm?.utm_content || '—'}
    `.trim();

    // Відправляємо запит до Telegram API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      })
    });

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Success' })
      };
    } else {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorData })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
