const express = require('express');
const cors = require('cors');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

function kurArac() {
  try {
    execSync('pip3 install youtube-transcript-api --break-system-packages -q');
  } catch(e) {}
}

try { kurArac(); } catch(e) {}

app.get('/transcript', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL gerekli' });
  
  const videoId = url.match(/[?&]v=([^&]+)/)?.[1] || url.split('/').pop();
  if (!videoId) return res.status(400).json({ error: 'Video ID bulunamadı' });
  
  const script = `
import json, sys
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    t = api.fetch('${videoId}')
    print(json.dumps({'transcript': ' '.join([x.text for x in t]), 'videoId': '${videoId}'}))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;
  
  const tmpFile = `/tmp/script_${Date.now()}.py`;
  fs.writeFileSync(tmpFile, script);
  
  exec(`python3 ${tmpFile}`, (err, stdout) => {
    fs.unlinkSync(tmpFile);
    try {
      res.json(JSON.parse(stdout));
    } catch(e) {
      res.status(500).json({ error: 'Parse hatası', detail: stdout });
    }
  });
});

app.get('/channel-videos', (req, res) => {
  const channelUrl = req.query.url;
  if (!channelUrl) return res.status(400).json({ error: 'Kanal URL gerekli' });
  
  const script = `
import json
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    print(json.dumps({'error': 'Kanal listesi için yt-dlp gerekli'}))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;
  res.json({ videos: [], error: 'Kanal listesi yakında' });
});

app.get('/health', (req, res) => {
  try {
    execSync('python3 -c "import youtube_transcript_api"');
    res.json({ status: 'ok', api: true });
  } catch(e) {
    res.json({ status: 'ok', api: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
  kurArac();
});
