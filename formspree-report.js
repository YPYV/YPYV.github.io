document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('reportForm');
  const formStatus = document.getElementById('formStatus');
  
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // تعطيل الزر أثناء الإرسال
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';
    
    // جمع بيانات النموذج
    const formData = new FormData(form);
    
    try {
      // إرسال إلى Formspree
      const response = await fetch(https://formspree.io/f/xdekeank, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        formStatus.innerHTML = '✅ تم إرسال البلاغ بنجاح! شكراً لمساعدتك.';
        formStatus.className = 'form-status success';
        form.reset();
        
        // إخفاء الرسالة بعد 5 ثواني
        setTimeout(() => {
          formStatus.innerHTML = '';
          formStatus.className = 'form-status';
        }, 5000);
      } else {
        throw new Error('فشل الإرسال');
      }
    } catch (error) {
      formStatus.innerHTML = '❌ حدث خطأ في الإرسال. حاول مجدداً لاحقاً.';
      formStatus.className = 'form-status error';
      console.error('Error:', error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'إرسال البلاغ';
    }
  });
});
