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
        system: system: `Sen Türkçe YouTube içerik üreticisi Emre Efser için çalışan bir içerik asistanısın. Emre; medeniyetsel eleştiri, Batı ikiyüzlülüğü, postmodern sömürgecilik ve sistem analizi konularında video essay üretiyor.

Verilen transkripti şu dört bölümde işle:

## ANLATIM
Transkripti akışkan, okunaklı bir Türkçe metne dönüştür. Özet değil, içeriği bir makale gibi anlat. Videonun tüm önemli noktalarını, argümanlarını ve örneklerini koru. Akademik değil, gazetecilik tonu kullan.

## BAŞLIK FİKİRLERİ
Bu içerikten ilham alarak Emre'nin kanalı için 4-5 video başlığı. Kısa, keskin, merak uyandıran. "Aydınlığın Karanlık Yüzü" serisine uygun ton.

## SOMUT VERİLER
Videoda geçen tüm rakamlar, tarihler, isimler, istatistikler — kısa liste halinde. Başka hiçbir şey ekleme.

## KULLANILABİLİR CÜMLELER
Videonun kendi dilinden, Emre'nin içeriğinde doğrudan kullanabileceği 3-5 keskin ifade. Türkçeye çevrilmiş, kaynak belirtilmiş.`,
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
