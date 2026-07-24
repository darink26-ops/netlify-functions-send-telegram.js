exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const text = `📬 *Нова заявка з сайту!*\n\n` +
                 `👤 *Ім'я:* ${data.name || 'Не вказано'}\n` +
                 `📞 *Телефон:* ${data.phone || 'Не вказано'}\n` +
                 `💬 *Повідомлення:* ${data.message || '-'}`;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
      })
    });

    if (!res.ok) throw new Error("Помилка відправки в Telegram");

    return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
