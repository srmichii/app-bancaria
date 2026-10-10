/**
 * AURA BANK - CARD 3D INTERACTION & SECURITY (FACE ID)
 * Giroscopio 3D, reflejo holográfico, revelado con Face ID y CVV dinámico
 */

const CardSecurityEngine = (() => {
  // Estado de las tarjetas
  const cardsData = {
    physical: {
      type: "physical",
      title: "Titanium Black",
      tier: "Private Banking",
      number: "4829 9012 3456 7890",
      last4: "7890",
      holder: "ALEJANDRO TAPIA",
      expiry: "09/30",
      cvv: "842",
      isLocked: false,
      revealed: false
    },
    virtual: {
      type: "virtual",
      title: "Aurora Virtual",
      tier: "Digital Multi-Currency",
      number: "5124 8830 1945 4321",
      last4: "4321",
      holder: "ALEJANDRO TAPIA",
      expiry: "12/29",
      cvv: "391",
      isLocked: false,
      revealed: false
    }
  };

  let activeCardType = "physical"; // 'physical' | 'virtual'
  let cvvCountdownInterval = null;
  let cvvSecondsRemaining = 300; // 5 minutos para CVV dinámico

  /**
   * Inicializa el efecto 3D tilt y glare de la tarjeta Apple
   */
  function initCard3DEffect() {
    const cardEl = document.getElementById("mainAppleCard");
    const container = document.getElementById("cardPerspectiveWrapper");

    if (!cardEl || !container) return;

    // Movimiento del cursor sobre el contenedor
    container.addEventListener("mousemove", (e) => {
      const rect = cardEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Ángulos de rotación suaves
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      cardEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      // Posición del reflejo metálico
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      cardEl.style.setProperty("--mouse-x", `${glareX}%`);
      cardEl.style.setProperty("--mouse-y", `${glareY}%`);
    });

    // Restaurar al salir
    container.addEventListener("mouseleave", () => {
      cardEl.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  }

  /**
   * Cambia entre tarjeta física y virtual
   */
  function switchCard(type) {
    if (!cardsData[type]) return;
    activeCardType = type;

    // Actualizar botones de pestañas
    document.querySelectorAll(".card-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.cardType === type);
    });

    renderCardUI();
  }

  /**
   * Reproduce tono de confirmación estilo Apple Pay / Face ID mediante Web Audio API
   */
  function playFaceIDChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Ignorar si el navegador bloquea audio antes de interacción
    }
  }

  /**
   * Inicia la autenticación con Face ID simulado
   */
  function triggerFaceIDAuth(onSuccessCallback) {
    const modal = document.getElementById("faceIdModal");
    const statusText = document.getElementById("faceIdStatusText");
    const bracket = document.querySelector(".face-id-bracket");

    if (!modal) return;

    modal.classList.add("active");
    if (statusText) statusText.textContent = "Verificando con Face ID...";
    if (bracket) bracket.style.borderColor = "var(--apple-blue)";

    // Simular escaneo biométrico en 1.4 segundos
    setTimeout(() => {
      if (bracket) bracket.style.borderColor = "var(--apple-green)";
      if (statusText) statusText.textContent = "Identidad Verificada";
      playFaceIDChime();

      setTimeout(() => {
        modal.classList.remove("active");
        if (typeof onSuccessCallback === "function") {
          onSuccessCallback();
        }
      }, 700);
    }, 1400);
  }

  /**
   * Revela los datos sensibles de la tarjeta tras autenticación
   */
  function requestRevealDetails() {
    const card = cardsData[activeCardType];

    if (card.revealed) {
      // Ocultar datos de nuevo
      card.revealed = false;
      renderCardUI();
      if (typeof App !== 'undefined') {
        App.notifyIsland("Seguridad", "Datos de tarjeta ocultos");
      }
      return;
    }

    // Solicitar Face ID
    triggerFaceIDAuth(() => {
      card.revealed = true;
      startCVVCountdown();
      renderCardUI();
      if (typeof App !== 'undefined') {
        App.notifyIsland("Face ID Aprobado", "Datos y CVV dinámico activos por 5 min");
      }
    });
  }

  /**
   * Temporizador del CVV dinámico de seguridad
   */
  function startCVVCountdown() {
    if (cvvCountdownInterval) clearInterval(cvvCountdownInterval);
    cvvSecondsRemaining = 300;

    cvvCountdownInterval = setInterval(() => {
      cvvSecondsRemaining--;
      const cvvTimerEl = document.getElementById("cardCvvTimer");
      if (cvvTimerEl) {
        const mins = Math.floor(cvvSecondsRemaining / 60);
        const secs = cvvSecondsRemaining % 60;
        cvvTimerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }

      if (cvvSecondsRemaining <= 0) {
        clearInterval(cvvCountdownInterval);
        cardsData[activeCardType].revealed = false;
        renderCardUI();
      }
    }, 1000);
  }

  /**
   * Congela o descongela la tarjeta activa
   */
  function toggleLockCard() {
    const card = cardsData[activeCardType];
    card.isLocked = !card.isLocked;
    renderCardUI();

    const msg = card.isLocked ? "Tarjeta congelada. Compras bloqueadas." : "Tarjeta activa y lista para operar.";
    if (typeof App !== 'undefined') {
      App.notifyIsland(card.isLocked ? "Tarjeta Congelada" : "Tarjeta Reactivada", msg);
    }
  }

  /**
   * Copia la CLABE interbancaria al portapapeles
   */
  function copyCLABE() {
    const clabe = "646180157023948123";
    navigator.clipboard.writeText(clabe).then(() => {
      if (typeof App !== 'undefined') {
        App.notifyIsland("CLABE Copiada", "646 180 1570 2394 8123");
      }
    }).catch(() => {
      // Fallback
      prompt("Copia tu CLABE interbancaria:", clabe);
    });
  }

  /**
   * Copia el número de tarjeta completo
   */
  function copyCardNumber() {
    const card = cardsData[activeCardType];
    const cleanNum = card.number.replace(/\s+/g, '');
    navigator.clipboard.writeText(cleanNum).then(() => {
      if (typeof App !== 'undefined') {
        App.notifyIsland("Número Copiado", `Tarjeta terminación ${card.last4}`);
      }
    });
  }

  /**
   * Renderiza el estado actual de la tarjeta en el DOM
   */
  function renderCardUI() {
    const card = cardsData[activeCardType];
    const cardEl = document.getElementById("mainAppleCard");
    const lockSwitch = document.getElementById("cardLockSwitch");

    if (!cardEl) return;

    // Cambiar clases de estilo según sea Titanium o Aurora
    cardEl.className = `apple-card ${card.type === 'physical' ? 'titanium-black' : 'aurora-virtual'} ${card.isLocked ? 'locked' : ''}`;

    // Textos de marca y tier
    document.getElementById("cardTierLabel").textContent = card.tier;
    document.getElementById("cardHolderName").textContent = card.holder;

    // Número de tarjeta
    const numDisplay = document.getElementById("cardNumberDisplay");
    if (card.revealed) {
      numDisplay.innerHTML = `<span style="font-family: var(--font-mono); letter-spacing: 0.08em;">${card.number}</span>`;
      document.getElementById("cardExpiryValue").textContent = card.expiry;
      document.getElementById("cardCvvValue").textContent = card.cvv;
      document.getElementById("revealDetailsBtnText").textContent = "Ocultar datos";
    } else {
      numDisplay.innerHTML = `
        <div class="card-number-hidden">
          <span class="number-dots">•••• •••• ••••</span>
          <span class="number-last4">${card.last4}</span>
        </div>
      `;
      document.getElementById("cardExpiryValue").textContent = "••/••";
      document.getElementById("cardCvvValue").textContent = "•••";
      document.getElementById("revealDetailsBtnText").textContent = "Ver datos y CVV";
    }

    if (lockSwitch) {
      lockSwitch.checked = card.isLocked;
    }
  }

  return {
    initCard3DEffect,
    switchCard,
    requestRevealDetails,
    toggleLockCard,
    copyCLABE,
    copyCardNumber,
    getActiveCard: () => cardsData[activeCardType],
    renderCardUI,
    triggerFaceIDAuth
  };
})();
