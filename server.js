const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

app.post('/analyze', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'Transkript gerekli' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Sen Türkçe YouTube içerik üreticisine danışmanlık yapan editörsün. Verilen transkripti analiz et:\n\n1. Ana tema ve argüman\n2. Dil ve anlatım tarzı\n3. Medeniyetsel eleştiri veya sistem analizi açısından değer\n4. Senin içeriklerine kullanılabilecek bilgi veya bakış açısı\n5. Önerilen bir içerik açısı\n\nTürkçe yaz, kısa ve pratik ol.',
        messages: [{ role: 'user', content: `Transkript:\n\n${transcript.substring(0, 6000)}` }]
      })
    });
    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    res.json({ analiz: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
