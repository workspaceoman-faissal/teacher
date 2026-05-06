document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const btn = form?.querySelector('button[type="submit"]');
  const msg = document.createElement('div');
  msg.id = 'status-msg'; msg.style.marginTop = '1rem';
  form?.appendChild(msg);

  fetch('/api/config').then(r=>r.json()).then(c => {
    if (!c.isOpen) form?.replaceWith('<p class="text-red-600 text-center mt-6 font-bold">⚠️ الاستبيان مغلق مؤقتاً</p>');
  }).catch(()=>{});

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!btn) return;
    btn.disabled = true; btn.textContent = '⏳ جاري الإرسال...'; msg.innerHTML = '';

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.date = new Date().toISOString();
    payload.id = crypto.randomUUID();

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل غير معروف');
      form.style.display = 'none';
      msg.style.background = '#dcfce7'; msg.style.color = '#166534'; msg.style.padding = '1rem'; msg.style.borderRadius = '0.5rem';
      msg.textContent = '✅ تم إرسال تقييمك بنجاح. شكراً لمشاركتك!';
    } catch (err) {
      msg.style.background = '#fee2e2'; msg.style.color = '#991b1b'; msg.style.padding = '1rem'; msg.style.borderRadius = '0.5rem';
      msg.textContent = `❌ ${err.message}`;
      btn.disabled = false; btn.textContent = 'إرسال تقييمي ✈️';
    }
  });
});
