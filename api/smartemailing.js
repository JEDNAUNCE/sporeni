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

  console.log("📤 ODESÍLÁM KONTAKT DO SE API:", {
    emailaddress: email,
    name: `${jmeno} ${prijmeni}`,
    customFields: { telefon },
    force_subscribe: true
  });

  try {
    // 1. vytvoření nebo aktualizace kontaktu
    const createRes = await fetch('https://app.smartemailing.cz/api/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        emailaddress: email,
        name: `${jmeno} ${prijmeni}`,
        customFields: { telefon },
        force_subscribe: true
      })
    });

    const createResult = await createRes.json();
    console.log("✅ Výsledek vytvoření kontaktu:", createResult);

    if (!createRes.ok) {
      return res.status(createRes.status).json(createResult);
    }

    // 2. přidání kontaktu do skupiny pomocí e-mailu
    const groupRes = await fetch('https://app.smartemailing.cz/api/v3/contact-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        emailaddress: email,
        group_ids: [19]
      })
    });

    const groupResult = await groupRes.json();
    console.log("📥 Výsledek přiřazení do skupiny:", groupResult);

    if (!groupRes.ok) {
      return res.status(groupRes.status).json(groupResult);
    }

    return res.status(200).json({ success: true, result: groupResult });
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({ error: "Chyba na serveru" });
  }
}
