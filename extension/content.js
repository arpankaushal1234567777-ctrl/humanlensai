// HumanLens AI — Real-time De-escalation Content Script
(function () {
  const API_ENDPOINT = 'https://humanlensai.vercel.app/api/analyze/text';

  let activeElement = null;
  let debounceTimeout = null;
  let currentAnalysis = null;
  let floatingPill = null;
  let popoverModal = null;
  let timerInterval = null;
  let timerSeconds = 20;

  function createFloatingPill() {
    if (floatingPill) return floatingPill;

    floatingPill = document.createElement('div');
    floatingPill.id = 'humanlens-floating-pill';
    floatingPill.style.display = 'none';
    floatingPill.innerHTML = `
      <span class="hl-dot"></span>
      <span class="hl-text">HumanLens</span>
    `;

    floatingPill.addEventListener('click', () => {
      if (currentAnalysis && currentAnalysis.intervention?.triggered) {
        showPopover(currentAnalysis);
      }
    });

    document.body.appendChild(floatingPill);
    return floatingPill;
  }

  function positionPill(targetEl) {
    if (!floatingPill || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    
    // Position near the bottom right of the target or bottom-right corner of screen
    if (rect.width > 0 && rect.height > 0) {
      const top = Math.min(window.innerHeight - 50, Math.max(10, rect.bottom - 42));
      const left = Math.min(window.innerWidth - 180, Math.max(10, rect.right - 150));
      floatingPill.style.top = `${top}px`;
      floatingPill.style.left = `${left}px`;
    } else {
      floatingPill.style.bottom = '24px';
      floatingPill.style.right = '24px';
      floatingPill.style.top = 'auto';
      floatingPill.style.left = 'auto';
    }
  }

  function getElementText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value || '';
    }
    return el.innerText || el.textContent || '';
  }

  function setElementText(el, newText) {
    if (!el) return;
    el.focus();
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = newText;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (el.isContentEditable) {
      // Modern contenteditable replacement (Gmail, Slack, WhatsApp)
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, newText);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  async function analyzeDraft(text) {
    if (!text || text.trim().length < 8) {
      if (floatingPill) floatingPill.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });
      if (!res.ok) return;
      const data = await res.json();
      currentAnalysis = data;

      const pill = createFloatingPill();
      positionPill(activeElement);

      if (data.intervention?.triggered || data.overallScore >= 0.5) {
        // Silently log friction score to backend to correlate with behavioral trends
        fetch('https://humanlensai.vercel.app/api/behavior/friction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frictionScore: data.overallScore, text: 'redacted' })
        }).catch(() => {});
      }

      if (data.intervention?.triggered) {
        pill.className = 'hl-danger';
        pill.querySelector('.hl-text').innerText = data.perception?.toneTag || '⚠️ Pause & Reflect';
        pill.style.display = 'flex';
      } else if (data.overallScore >= 0.25) {
        pill.className = 'hl-warning';
        pill.querySelector('.hl-text').innerText = data.perception?.toneTag || 'Noticeable Tone';
        pill.style.display = 'flex';
      } else {
        pill.style.display = 'none';
      }
    } catch (e) {
      // Silent error fallback
    }
  }

  function showPopover(analysis) {
    if (!analysis || !analysis.intervention) return;
    if (popoverModal) popoverModal.remove();

    popoverModal = document.createElement('div');
    popoverModal.id = 'humanlens-popover';

    timerSeconds = 20;
    if (timerInterval) clearInterval(timerInterval);

    popoverModal.innerHTML = `
      <div class="hl-popover-header">
        <div>
          <h3 class="hl-title">HumanLens &bull; Pause & Reflect</h3>
          <p class="hl-subtitle">${analysis.perception?.recipientImpact || 'This message may cause unintended tension.'}</p>
        </div>
        <button class="hl-close-btn" id="hl-modal-close">&times;</button>
      </div>

      <div class="hl-cooling-box">
        <div>
          <div style="font-weight:600; color:#fff;">20-Second Cooling Pause</div>
          <div style="color:#71717a; font-size:11px;">Physiological sigh downregulation</div>
        </div>
        <span class="hl-timer-val" id="hl-timer-val">${timerSeconds}s</span>
      </div>

      <div>
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:#a1a1aa; margin-bottom:8px;">
          Constructive Alternatives (1-Click Replace)
        </div>
        <div class="hl-rewrites-list" id="hl-rewrites-container"></div>
      </div>
    `;

    // Position centered or near active element
    popoverModal.style.top = '50%';
    popoverModal.style.left = '50%';
    popoverModal.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(popoverModal);

    // Populate rewrites
    const rewritesContainer = popoverModal.querySelector('#hl-rewrites-container');
    const rewrites = analysis.intervention.rewrites || [];
    rewrites.forEach((rw) => {
      const card = document.createElement('div');
      card.className = 'hl-rewrite-card';
      card.innerHTML = `
        <div class="hl-rw-style">
          <span>${rw.style}</span>
          <span style="color:#71717a;">Tap to apply &rarr;</span>
        </div>
        <div class="hl-rw-text">&ldquo;${rw.text}&rdquo;</div>
      `;
      card.addEventListener('click', () => {
        setElementText(activeElement, rw.text);
        closePopover();
        if (floatingPill) floatingPill.style.display = 'none';
      });
      rewritesContainer.appendChild(card);
    });

    // Close button
    popoverModal.querySelector('#hl-modal-close').addEventListener('click', closePopover);

    // Timer countdown
    const timerValEl = popoverModal.querySelector('#hl-timer-val');
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        if (timerValEl) timerValEl.innerText = `${timerSeconds}s`;
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  function closePopover() {
    if (popoverModal) {
      popoverModal.remove();
      popoverModal = null;
    }
    if (timerInterval) clearInterval(timerInterval);
  }

  // Global event delegation for text inputs and contenteditable
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.isContentEditable ||
      target.getAttribute('role') === 'textbox'
    ) {
      activeElement = target;
      createFloatingPill();
      positionPill(activeElement);
    }
  });

  document.addEventListener('input', (e) => {
    const target = e.target;
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.isContentEditable ||
      target.getAttribute('role') === 'textbox'
    ) {
      activeElement = target;
      if (debounceTimeout) clearTimeout(debounceTimeout);
      const text = getElementText(target);
      debounceTimeout = setTimeout(() => {
        analyzeDraft(text);
      }, 750);
    }
  });
})();
