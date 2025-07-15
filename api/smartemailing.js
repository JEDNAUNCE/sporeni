export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Pouze POST metody jsou povoleny' });
  }

  const { jmeno, prijmeni, email, telefon } = req.body;

  if (!jmeno || !prijmeni || !email || !telefon) {
    return res.status(400).json({ error: 'Chybí některé povinné údaje' });
  }

  console.log("🔥 TOKEN:", process.env.SMARTEMAILING_TOKEN); // DEBUG: výpis tokenu
  console.log("📩 DATA POSÍLÁNA DO:", {
    emailaddress: email,
    name: `${jmeno} ${prijmeni}`,
    customFields: { telefon },
    groups: [18]
  });

  if (!process.env.SMARTEMAILING_TOKEN) {
    return res.status(500).json({ error: 'Chybí API token v prostředí' });
  }

  try {
    const response = await fetch('https://app.smartemailing.cz/api/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMARTEMAILING_TOKEN}`
      },
      body: JSON.stringify({
        emailaddress: email,
        name: `${jmeno} ${prijmeni}`,
        customFields: {
          telefon
        },
        groups: [18]
      })
    });

    const result = await response.json();
    console.log("✅ Odpověď SmartEmailing API:", result); // DEBUG: odpověď z API

    if (!response.ok) {
      return res.status(response.status).json(result);
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({ error: "Chyba na serveru" });
  }
}
