export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Pouze POST metody jsou povoleny' });
  }

  const { jmeno, prijmeni, email, telefon } = req.body;
  if (!jmeno || !prijmeni || !email || !telefon) {
    return res.status(400).json({ error: 'Chybí některé povinné údaje' });
  }

  const username = 'obchod@jednaunce.cz';
  const token = process.env.SMARTEMAILING_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Chybí API token v prostředí' });
  }

  const credentials = Buffer.from(`${username}:${token}`).toString('base64');
  console.log("🔥 Creds:", credentials);

  const payload = {
    emailaddress: email,
    name: `${jmeno} ${prijmeni}`,
    customFields: { telefon },
    groups: [19],         // << tady je klíč k úspěchu
    force_subscribe: true // přidá i do blacklistu, pokud byl; nebo přejmenován
  };

  console.log("📩 Co posíláme:", payload);

  try {
    const response = await fetch('https://app.smartemailing.cz/api/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("✅ Odpověď od API:", result);

    if (!response.ok) {
      return res.status(response.status).json(result);
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: 'Chyba na serveru' });
  }
}
