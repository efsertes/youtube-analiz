const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

app.post('/analyze', async (req, res) => {
  const { transcript, title } = req.body;
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
        model: 'claude-opus-4-8',
        max_tokens: 4000,
        system: `Sen bir içerik asistanısın. Tüm yanıtlarını Türkçe ver. Verilen transkripti olduğu gibi işle, yorum katma. Transkriptte ne varsa onu çıkar.

## 1. DETAYLI ÖZET
Videonun tüm akışını, argümanlarını, verdiği örnekleri ve vardığı sonuçları kapsamlı şekilde anlat. Hiçbir önemli noktayı atlama. En az 10-15 cümle olsun.

## 2. GÜÇLÜ İFADELER
Doğrudan alıntılanabilecek keskin cümleler — transkriptten aynen, 5-8 adet. Türkçe değilse Türkçeye çevir.

## 3. VERİ VE SOMUT ÖRNEKLER
Geçen tüm rakamlar, tarihler, isimler, vakalar, istatistikler — liste halinde.

## 4. ANAHTAR KAVRAMLAR
Videonun kullandığı merkezi kavramlar ve tanımlar. Türkçe olarak yaz.`,
        messages: [{ role: 'user', content: `${title ? `Video başlığı: ${title}\n\n` : ''}Transkript:\n\n${transcript.substring(0, 10000)}` }]
      })
    });
    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    res.json({ analiz: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/translate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Metin gerekli' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 500,
        system: 'Verilen metni Türkçeye çevir. Sadece çeviriyi ver, başka hiçbir şey yazma.',
        messages: [{ role: 'user', content: text }]
      })
    });
    const data = await response.json();
    const translated = (data.content || []).map(b => b.text || '').join('');
    res.json({ translated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
