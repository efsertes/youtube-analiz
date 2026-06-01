const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/transcript', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL gerekli' });
  exec(`yt-dlp --write-auto-sub --sub-lang tr,en --skip-download --sub-format json3 -o "/tmp/%(id)s" "${url}" 2>&1`, 
    (err, stdout, stderr) => {
      exec(`yt-dlp --get-id "${url}"`, (err2, id) => {
        if (err2) return res.status(500).json({ error: 'Video ID alınamadı' });
        const videoId = id.trim();
        const fs = require('fs');
        const files = ['tr', 'en'].map(l => `/tmp/${videoId}.${l}.json3`);
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
        res.status(404).json({ error: 'Transkript bulunamadı' });
      });
    }
  );
});

app.get('/channel-videos', async (req, res) => {
  const channelUrl = req.query.url;
  if (!channelUrl) return res.status(400).json({ error: 'Kanal URL gerekli' });
  exec(`yt-dlp --flat-playlist --print "%(id)s|||%(title)s|||%(upload_date)s" "${channelUrl}" 2>&1`, 
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
