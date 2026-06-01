const express = require('express');
const cors = require('cors');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const YT_DLP = '/tmp/yt-dlp';

function kurYtDlp() {
  if (!fs.existsSync(YT_DLP)) {
    console.log('yt-dlp indiriliyor...');
    execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${YT_DLP} && chmod +x ${YT_DLP}`);
    console.log('yt-dlp kuruldu.');
  }
}

try { kurYtDlp(); } catch(e) { console.error('yt-dlp kurulamadı:', e.message); }

app.get('/transcript', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL gerekli' });
  
  try { kurYtDlp(); } catch(e) {}
  
  const tmpId = Date.now();
  exec(`${YT_DLP} --write-auto-sub --sub-lang tr,en --skip-download --sub-format json3 -o "/tmp/${tmpId}" "${url}" 2>&1`,
    (err, stdout) => {
      exec(`${YT_DLP} --get-id "${url}"`, (err2, id) => {
        if (err2) return res.status(500).json({ error: 'Video ID alınamadı', detail: err2.message });
        const videoId = id.trim();
        const files = ['tr', 'en'].map(l => `/tmp/${tmpId}.${l}.json3`);
        for (const f of files) {
          if (fs.existsSync(f)) {
            const data = JSON.parse(fs.readFileSync(f, 'utf8'));
            const text = data.events
              .filter(e => e.segs)
              .map(e => e.segs.map(s => s.utf8).join(''))
              .join(' ')
              .replace(/\n/g, ' ');
            return res.json({ transcript: text, videoId });
          }
        }
        res.status(404).json({ error: 'Transkript bulunamadı', stdout });
      });
    }
  );
});

app.get('/channel-videos', async (req, res) => {
  const channelUrl = req.query.url;
  if (!channelUrl) return res.status(400).json({ error: 'Kanal URL gerekli' });
  try { kurYtDlp(); } catch(e) {}
  
  exec(`${YT_DLP} --flat-playlist --print "%(id)s|||%(title)s|||%(upload_date)s" "${channelUrl}" 2>&1`,
    (err, stdout) => {
      if (err) return res.status(500).json({ error: err.message });
      const videos = stdout.trim().split('\n')
        .filter(l => l.includes('|||'))
        .map(l => {
          const [id, title, date] = l.split('|||');
          return { id, title, date, url: `https://youtube.com/watch?v=${id}` };
        });
      res.json({ videos });
    }
  );
});

app.get('/health', (req, res) => res.json({ status: 'ok', ytdlp: fs.existsSync(YT_DLP) }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server on port ${PORT}`); try { kurYtDlp(); } catch(e) {} });
