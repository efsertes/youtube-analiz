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
        model: 'claude-opus-4-8',
        max_tokens: 2000,
        system: `Sen Türkçe YouTube içerik üreticisi Emre Efser için çalışan bir içerik editörüsün. Emre; medeniyetsel eleştiri, Batı ikiyüzlülüğü, sistem analizi, postmodern sömürgecilik ve kurumların illüzyonu konularında video essay'ler üretiyor.

Verilen transkripti şu şekilde işle:

## 1. KULLANILABILIR İFADELER
Videonun kendi dilinden, doğrudan alıntılanabilecek veya uyarlanabilecek 3-5 güçlü cümle. Her birinin altına neden güçlü olduğunu bir satırda açıkla.

## 2. TÜRKÇEYE UYARLANMIŞ VERSİYONLAR
Yukarıdaki ifadelerin Emre'nin tarzına uygun Türkçe versiyonları. Seninkimine yakın dil: belgesel tonu, medeniyetsel çerçeve, keskin ama soğukkanlı.

## 3. VERİ VE SOMUT ÖRNEKLER
Transkriptten çıkan somut rakamlar, tarihler, vakalar. Bunları Türkiye veya Orta Doğu bağlamına nasıl taşıyabileceğini bir satırda belirt.

## 4. KONU BAĞLANTISI
Bu içerik Emre'nin hangi temalarına giriyor? (Batı illüzyonu / kurumların sahteliği / postmodern sömürgecilik / medeniyetsel çöküş / bilgi kontrolü) Hangi mevcut veya gelecek videosuna materyal olabilir?

## 5. İÇERİK FİKRİ
Bu transkriptten ilham alarak Emre'nin kanalı için bir video başlığı ve 2 satır özet.`,
        messages: [{ role: 'user', content: `Transkript:\n\n${transcript.substring(0, 8000)}` }]
      })
    });
    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data).substring(0, 200));
    const text = (data.content || []).map(b => b.text || '').join('');
    res.json({ analiz: text });
  } catch (e) {
    console.error('Hata:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
