/* دليل دمشق وريف دمشق — Formspree error reports
   Add only this file and one script tag before </body>.
   Existing site code is not replaced or modified.
*/
(() => {
  "use strict";

  const ENDPOINT = "https://formspree.io/f/xdekeank";
  const modalBody = document.getElementById("modalBody");
  const detailModal = document.getElementById("modal");
  if (!modalBody || !detailModal) return;

  const style = document.createElement("style");
  style.textContent = `
    .report-error-btn{background:var(--ember-bg,#f4e5de)!important;color:var(--ember,#a64b3a)!important}
    .report-error-btn:hover{background:var(--ember,#a64b3a)!important;color:#fff!important}
    .report-modal-bg{display:none;position:fixed;inset:0;background:rgba(12,24,26,.68);z-index:300;align-items:center;justify-content:center;padding:18px}
    .report-modal-bg.open{display:flex}
    .report-modal{width:min(560px,100%);max-height:90vh;overflow:auto;background:var(--card,#fffcf4);border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.35)}
    .report-modal-head{background:var(--deep,#163b3e);color:#fff;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .report-modal-head h3{margin:0;font-size:23px;font-family:"Lateef",serif}
    .report-modal-close{width:36px;height:36px;border:0;border-radius:9px;background:rgba(255,255,255,.14);color:#fff;font-size:21px;cursor:pointer}
    .report-modal-body{padding:20px}
    .report-place{background:var(--stone,#f3ecdd);border:1px solid var(--line,#e4d9c1);border-radius:11px;padding:12px;margin-bottom:16px;display:grid;gap:4px}
    .report-place span,.report-field label span{font-size:10px;color:var(--muted,#726a5c)}
    .report-place strong{color:var(--deep,#163b3e);font-size:14px}
    .report-field{display:grid;gap:7px;margin-bottom:14px}
    .report-field label{font-size:12px;font-weight:700;color:var(--deep,#163b3e)}
    .report-field input,.report-field select,.report-field textarea{width:100%;box-sizing:border-box;border:1px solid var(--line,#e4d9c1);background:var(--stone,#f3ecdd);color:var(--ink,#22282a);border-radius:10px;padding:11px 12px;font:inherit;outline:0}
    .report-field textarea{resize:vertical;min-height:120px;line-height:1.7}
    .report-field input:focus,.report-field select:focus,.report-field textarea:focus{border-color:var(--brass,#b08a3e);box-shadow:0 0 0 3px rgba(176,138,62,.14)}
    .report-submit{width:100%;border:0;border-radius:10px;background:var(--teal,#1f5c54);color:#fff;padding:12px 16px;font:inherit;font-weight:700;cursor:pointer}
    .report-submit:disabled{opacity:.6;cursor:not-allowed}
    .report-status{margin-top:12px;text-align:center;font-size:12px;font-weight:700;line-height:1.7}
    .report-status.success{color:var(--sage,#4b7a5b)}
    .report-status.error{color:var(--ember,#a64b3a)}
    @media(max-width:690px){.report-modal-bg{padding:10px}.report-modal-body{padding:16px}}
  `;
  document.head.appendChild(style);

  const reportBg = document.createElement("div");
  reportBg.className = "report-modal-bg";
  reportBg.id = "reportModal";
  reportBg.setAttribute("aria-hidden", "true");
  reportBg.innerHTML = `
    <div class="report-modal" role="dialog" aria-modal="true" aria-labelledby="reportModalTitle">
      <div class="report-modal-head">
        <h3 id="reportModalTitle">الإبلاغ عن خطأ</h3>
        <button class="report-modal-close" id="reportModalClose" type="button" aria-label="إغلاق">×</button>
      </div>
      <div class="report-modal-body">
        <div class="report-place"><span>الجهة</span><strong id="reportPlaceName">—</strong></div>
        <form id="reportForm" action="${ENDPOINT}" method="POST">
          <input type="hidden" name="entity_id" id="reportEntityId">
          <input type="hidden" name="entity_name" id="reportEntityName">
          <div class="report-field">
            <label for="reportType">نوع الخطأ *</label>
            <select id="reportType" name="error_type" required>
              <option value="">اختر نوع الخطأ</option>
              <option value="رقم الهاتف خاطئ">رقم الهاتف خاطئ</option>
              <option value="العنوان خاطئ">العنوان خاطئ</option>
              <option value="أوقات الدوام خاطئة">أوقات الدوام خاطئة</option>
              <option value="الجهة لم تعد موجودة">الجهة لم تعد موجودة</option>
              <option value="معلومة ناقصة">معلومة ناقصة</option>
              <option value="معلومة أخرى">معلومة أخرى</option>
            </select>
          </div>
          <div class="report-field">
            <label for="reportMessage">تفاصيل الخطأ *</label>
            <textarea id="reportMessage" name="message" rows="5" maxlength="2000" required placeholder="اكتب المعلومة التي تحتاج إلى تصحيح..."></textarea>
          </div>
          <div class="report-field">
            <label for="reportName">اسمك <span>(اختياري)</span></label>
            <input id="reportName" name="name" type="text" maxlength="100" autocomplete="name">
          </div>
          <div class="report-field">
            <label for="reportEmail">البريد الإلكتروني <span>(اختياري)</span></label>
            <input id="reportEmail" name="email" type="email" maxlength="150" autocomplete="email">
          </div>
          <button class="report-submit" id="reportSubmitBtn" type="submit">إرسال البلاغ</button>
          <div class="report-status" id="reportFormStatus" role="status" aria-live="polite"></div>
        </form>
      </div>
    </div>`;
  document.body.appendChild(reportBg);

  const close = () => {
    reportBg.classList.remove("open");
    reportBg.setAttribute("aria-hidden", "true");
  };

  const open = (entity) => {
    const form = document.getElementById("reportForm");
    form.reset();
    document.getElementById("reportPlaceName").textContent = entity.name || "جهة غير معروفة";
    document.getElementById("reportEntityId").value = entity.id ?? "";
    document.getElementById("reportEntityName").value = entity.name || "";
    document.getElementById("reportFormStatus").textContent = "";
    document.getElementById("reportFormStatus").className = "report-status";
    const submit = document.getElementById("reportSubmitBtn");
    submit.disabled = false;
    submit.textContent = "إرسال البلاغ";
    reportBg.classList.add("open");
    reportBg.setAttribute("aria-hidden", "false");
    document.getElementById("reportType").focus();
  };

  document.getElementById("reportModalClose").addEventListener("click", close);
  reportBg.addEventListener("click", (e) => { if (e.target === reportBg) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && reportBg.classList.contains("open")) close(); });

  document.getElementById("reportForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submit = document.getElementById("reportSubmitBtn");
    const status = document.getElementById("reportFormStatus");
    submit.disabled = true;
    submit.textContent = "جاري الإرسال...";
    status.textContent = "";
    status.className = "report-status";
    try {
      const response = await fetch(ENDPOINT, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Formspree request failed");
      status.textContent = "تم إرسال البلاغ بنجاح، شكرًا لمساعدتنا ❤️";
      status.className = "report-status success";
      submit.textContent = "تم الإرسال ✓";
      setTimeout(close, 2200);
    } catch (error) {
      console.error("Report form error:", error);
      status.textContent = "تعذر إرسال البلاغ حاليًا. حاول مرة أخرى.";
      status.className = "report-status error";
      submit.disabled = false;
      submit.textContent = "إرسال البلاغ";
    }
  });

  function getEntityFromModal() {
    const title = document.getElementById("modalTitle");
    const name = title?.textContent?.trim();
    if (!name) return null;
    const items = Array.isArray(window.state?.items) ? window.state.items : null;
    if (items) return items.find(x => x.name === name) || { name };
    return { name };
  }

  function ensureButton() {
    if (!detailModal.classList.contains("open")) return;
    const actions = modalBody.querySelector(".actions");
    if (!actions || actions.querySelector(".report-error-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action report-error-btn";
    button.textContent = "⚠️ بلّغ عن خطأ";
    button.addEventListener("click", () => {
      const title = document.getElementById("modalTitle")?.textContent?.trim() || "";
      let entity = { name: title };
      // app.js keeps its data in a closure, so identify the record by its visible name.
      const text = modalBody.textContent || "";
      entity.id = "";
      open(entity);
    });
    actions.appendChild(button);
  }

  new MutationObserver(ensureButton).observe(modalBody, { childList: true, subtree: true });
  new MutationObserver(ensureButton).observe(detailModal, { attributes: true, attributeFilter: ["class"] });
  ensureButton();
})();
