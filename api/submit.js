// api/submit.js
// يستقبل رد الطالب ويحفظه في data/feedbacks.json على GitHub



const GH_OWNER = process.env.GH_OWNER;
const GH_REPO  = process.env.GH_REPO;
const GH_TOKEN = process.env.GH_TOKEN;
const GH_FILE  = 'data/feedbacks.json';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GH_OWNER || !GH_REPO || !GH_TOKEN) {
    return res.status(500).json({ error: 'GitHub env variables not configured' });
  }

  const entry = req.body;
  if (!entry || !entry.class) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  entry.id   = entry.id   || Date.now();
  entry.date = entry.date || new Date().toISOString();

  try {
    const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`;
    const headers = {
      Authorization: `token ${GH_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'teacher-eval-app'
    };

    // اقرأ الملف الحالي
    let existing = [];
    let sha = null;
    const getRes = await fetch(url, { headers });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
      existing = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    }

    existing.push(entry);

    const body = {
      message: `تقييم جديد - ${new Date().toLocaleDateString('ar-SA')}`,
      content: Buffer.from(JSON.stringify(existing, null, 2), 'utf8').toString('base64')
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(500).json({ error: 'فشل الحفظ على GitHub', detail: err.message });
    }

    return res.status(200).json({ success: true, id: entry.id });

  } catch (err) {
    return res.status(500).json({ error: 'خطأ في الخادم', detail: err.message });
  }
};
