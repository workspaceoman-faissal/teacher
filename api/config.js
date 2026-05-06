// api/config.js
// يقرأ ويحفظ إعدادات الاستبيان في data/config.json على GitHub



const GH_OWNER   = process.env.GH_OWNER;
const GH_REPO    = process.env.GH_REPO;
const GH_TOKEN   = process.env.GH_TOKEN;
const ADMIN_PASS = process.env.ADMIN_PASS || '1234';
const GH_FILE    = 'data/config.json';

const ghHeaders = () => ({
  Authorization: `token ${GH_TOKEN}`,
  'Content-Type': 'application/json',
  'User-Agent': 'teacher-eval-app'
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pass');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`;

  // GET — متاح للجميع لمعرفة حالة الاستبيان
  if (req.method === 'GET') {
    try {
      const r = await fetch(url, { headers: ghHeaders() });
      if (!r.ok) return res.status(200).json({ isOpen: true, subject: 'تقنية المعلومات', semester: 'الفصل الثاني 1446' });
      const data = await r.json();
      const cfg = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      return res.status(200).json(cfg);
    } catch {
      return res.status(200).json({ isOpen: true });
    }
  }

  // POST — للمعلم فقط
  if (req.method === 'POST') {
    if (req.headers['x-admin-pass'] !== ADMIN_PASS) {
      return res.status(401).json({ error: 'غير مصرح' });
    }
    try {
      let sha = null;
      const r = await fetch(url, { headers: ghHeaders() });
      if (r.ok) {
        const d = await r.json();
        sha = d.sha;
      }
      const body = {
        message: 'تحديث الإعدادات',
        content: Buffer.from(JSON.stringify(req.body, null, 2), 'utf8').toString('base64')
      };
      if (sha) body.sha = sha;
      await fetch(url, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
