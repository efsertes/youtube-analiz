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
        system: `Sen Türkçe YouTube içerik üreticisi Emre Efser için çalışan bir içerik asistanısın. Emre; medeniyetsel eleştiri, Batı ikiyüzlülüğü, postmodern sömürgecilik ve sistem analizi konularında video essay üretiyor.

Verilen transkripti şu dört bölümde işle:

## ANLATIM
Transkripti akışkan, okunaklı bir Türkçe metne dönüştür. Özet değil, içeriği bir makale gibi anlat. Videonun tüm önemli noktalarını, argümanlarını ve örneklerini koru. Akademik değil, gazetecilik tonu kullan.

## BAŞLIK FİKİRLERİ
Bu içerikten ilham alarak Emre'nin kanalı için 4-5 video başlığı. Kısa, keskin, merak uyandıran. "Aydınlığın Karanlık Yüzü" serisine uygun ton.

## SOMUT VERİLER
Videoda geçen tüm rakamlar, tarihler, isimler, istatistikler — kısa liste halinde.

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

app.get('/rss', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL gerekli' });
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const xml = await response.text();
    
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || 
                   item.match(/<link[^>]*href="([^"]+)"/)?.[1]?.trim() || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || '';
      const description = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() || '';
      if (title) items.push({ title, link, pubDate, description: description.replace(/<[^>]+>/g, '').substring(0, 200) });
    }
    res.json({ items: items.slice(0, 20) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/analyze-news', async (req, res) => {
  const { title, description, url } = req.body;
  if (!title) return res.status(400).json({ error: 'Başlık gerekli' });
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
        max_tokens: 1000,
        system: `Sen Türkçe YouTube içerik üreticisi Emre Efser için çalışan bir içerik asistanısın. Emre; medeniyetsel eleştiri, Batı ikiyüzlülüğü, postmodern sömürgecilik ve sistem analizi konularında video essay üretiyor.

Verilen haberi şu şekilde analiz et:

## HABER ÖZETİ
Haberi 3-4 cümleyle Türkçe anlat.

## EMRE İÇİN AÇI
Bu haber Emre'nin hangi konularıyla örtüşüyor? Nasıl bir video açısı sunabilir?

## BAŞLIK FİKRİ
Bu haberden ilham alarak 2-3 video başlığı öner.`,
        messages: [{ role: 'user', content: `Haber başlığı: ${title}\n\nAçıklama: ${description || 'Yok'}\n\nKaynak: ${url || 'Bilinmiyor'}` }]
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
