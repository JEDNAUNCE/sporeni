export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Pouze POST metody jsou povoleny' });
  }

  const { jmeno, prijmeni, email, telefon } = req.body;

  try {
    const smartRes = await fetch("https://app.smartemailing.cz/api/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer pq0l2gxzfzxgqos3cs67eqxka0ef45hdzkvlrdd9" // můžeš si pak skrýt
      },
      body: JSON.stringify({
        emailaddress: email,
        name: `${jmeno} ${prijmeni}`,
        customfields: {
          telefon: telefon
        },
        groups: [18]
      })
    });

    const result = await smartRes.json();

    if (!smartRes.ok) {
      console.error("Chyba od SmartEmailingu:", result);
      return res.status(smartRes.status).json(result);
    }

    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Chyba serveru:", err);
    res.status(500).json({ error: "Nepodařilo se kontakt odeslat" });
  }
}
