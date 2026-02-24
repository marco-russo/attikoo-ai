export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo POST ammesso' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt mancante o non valido' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Sei un esperto valutatore di oggetti usati per un marketplace di baratto. Riceverai un prompt con titolo, descrizione e categorie. Rispondi in JSON con i seguenti campi:
{
  "valore_euro": "range di prezzo stimato in euro, es. '20–30'",
  "categoria": "una delle categorie suggerite nel prompt",
  "rarita": "Comune, Raro o Molto raro",
  "descrizione": "breve descrizione sintetica dell'oggetto (max 200 caratteri)"
}

Esempio:
{
  "valore_euro": "15–25",
  "categoria": "Abbigliamento e Accessori",
  "rarita": "Raro",
  "descrizione": "Vestito etnico moderno con motivi tradizionali, ideale per eventi culturali."
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      console.error('Risposta AI vuota');
      return res.status(500).json({ error: 'Risposta AI vuota' });
    }

    console.log('RISPOSTA GREZZA:', raw);

    // Estrai il blocco JSON dalla risposta
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('JSON non trovato nella risposta AI');
      return res.status(500).json({ error: 'JSON non trovato nella risposta AI' });
    }

    const valutazione = JSON.parse(match[0]);
    return res.status(200).json(valutazione);
  } catch (error) {
    console.error('Errore nella valutazione AI:', error);
    return res.status(500).json({ error: 'Errore nella valutazione AI' });
  }
}
