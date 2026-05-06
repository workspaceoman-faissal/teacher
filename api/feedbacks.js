// api/feedbacks.js
// يُرجع جميع التقييمات للوحة تحكم المعلم — محمي بكلمة مرور



const GH_OWNER   = process.env.GH_OWNER;
const GH_REPO    = process.env.GH_REPO;
const GH_TOKEN   = process.env.GH_TOKEN;
const ADMIN_PASS = process.env.ADMIN_PASS || '1234';
const GH_FILE    = 'data/feedbacks.json';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pass');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pass = req.headers['x-admin-pass'];
  if (pass !== ADMIN_PASS) {
    return res.status(401).json({ error: 'غير مصرح' });
  }

  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`;
  const headers = {
    Authorization: `token ${GH_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'teacher-eval-app'
  };

  // GET — جلب جميع التقييمات
  if (req.method === 'GET') {
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) return res.status(200).json([]);
      const data = await r.json();
      const arr = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      return res.status(200).json(arr);
    } catch (e) {
      return res.status(200).json([]);
    }
  }

  // DELETE — حذف تقييم واحد أو حذف الكل
  if (req.method === 'DELETE') {
    const { id, clearAll } = req.body || {};
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) return res.status(404).json({ error: 'ملف غير موجود' });
      const data = await r.json();
      const sha = data.sha;
      let arr = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));

      if (clearAll) {
        arr = [];
      } else {
        arr = arr.filter(e => e.id !== id);
      }

      const body = {
        message: clearAll ? 'حذف جميع التقييمات' : `حذف تقييم ${id}`,
        content: Buffer.from(JSON.stringify(arr, null, 2), 'utf8').toString('base64'),
        sha
      };

      await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
