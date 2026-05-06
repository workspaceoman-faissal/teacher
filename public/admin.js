document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const passInput = document.getElementById('admin-pass');
  const errorEl = document.getElementById('login-error');
  const dashboard = document.getElementById('dashboard') || document.querySelector('.dashboard-wrapper');
  let pass = localStorage.getItem('teacher_eval_pass') || '';

  const api = (p, o={}) => fetch(`/api/${p}`, {
    headers: {'Content-Type':'application/json','x-admin-pass':pass,...o.headers}, ...o
  });

  if (loginForm) {
    if (pass) passInput.value = pass;
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      pass = passInput.value.trim();
      if (!pass) return;
      try {
        const r = await api('feedbacks');
        if (r.ok) {
          localStorage.setItem('teacher_eval_pass', pass);
          loginForm.style.display = 'none';
          dashboard?.classList.remove('hidden');
          loadFeedbacks();
        } else {
          errorEl.textContent = '❌ كلمة المرور خاطئة'; errorEl.style.display = 'block';
        }
      } catch { errorEl.textContent = '❌ تعذر الاتصال بالخادم'; errorEl.style.display = 'block'; }
    });
  }

  async function loadFeedbacks() {
    try {
      const r = await api('feedbacks');
      const data = await r.json();
      const list = document.getElementById('feedbacks-list');
      if (!list) return;
      list.innerHTML = data.length ? data.map(f => `
        <div class="bg-white p-3 rounded shadow mb-2 text-sm">
          <div class="flex justify-between text-gray-500"><span>📅 ${new Date(f.date).toLocaleDateString('ar-SA')}</span><span>🎓 ${f.class||'-'}</span></div>
          <div class="grid grid-cols-3 gap-2 mt-1">⭐ ${f.overall_rating||'-'}/5 | 📖 ${f.method_rating||'-'}/5 | 🤝 ${f.handling_rating||'-'}/5</div>
          ${f.method_comment?`<p class="mt-1 text-gray-600 bg-gray-50 p-1 rounded">💬 ${f.method_comment}</p>`:''}
        </div>`).join('') : '<p class="text-gray-500 text-center">لا توجد تقييمات</p>';
      
      document.getElementById('total-count').textContent = data.length;
    } catch {}
  }

  document.getElementById('export-btn')?.addEventListener('click', async () => {
    const r = await api('feedbacks');
    const blob = new Blob([JSON.stringify(await r.json(), null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `تقييمات_${new Date().toISOString().split('T')[0]}.json`; a.click();
  });

  document.getElementById('settings-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const body = { subject: document.getElementById('subject-name')?.value, semester: document.getElementById('semester')?.value, isOpen: document.getElementById('survey-status')?.checked };
      const r = await api('config', {method:'POST', body: JSON.stringify(body)});
      if (r.ok) alert('✅ تم الحفظ'); else alert('❌ فشل الحفظ');
    } catch { alert('❌ خطأ في الاتصال'); }
  });
});
