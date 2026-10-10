/**
 * AURA BANK - MAIN APPLICATION COORDINATOR
 * Gestión de modales, Dynamic Island, operaciones SPEI, FX y apartados
 */

const App = (() => {
  let islandTimeout = null;

  // Contactos frecuentes para transferencias rápidas
  const quickContacts = [
    { name: "Sofía Garza", bank: "Banorte", clabe: "072180010459283712", initials: "SG" },
    { name: "Carlos Slim", bank: "Inbursa", clabe: "036180500123984715", initials: "CS" },
    { name: "Mamá ❤️", bank: "BBVA", clabe: "012180015582910482", initials: "MA" },
    { name: "Tech Payroll", bank: "Santander", clabe: "014180655029384710", initials: "TP" }
  ];

  /**
   * Muestra notificación interactiva en la Dynamic Island
   */
  function notifyIsland(title, subtitle, badgeText = "") {
    const island = document.getElementById("dynamicIsland");
    const islandTitle = document.getElementById("islandTitle");
    const islandSub = document.getElementById("islandSub");
    const islandBadge = document.getElementById("islandBadge");

    if (!island) return;

    if (islandTitle) islandTitle.textContent = title;
    if (islandSub) islandSub.textContent = subtitle;
    if (islandBadge) islandBadge.textContent = badgeText;

    // Expandir Dynamic Island
    island.classList.add("expanded");

    if (islandTimeout) clearTimeout(islandTimeout);

    // Colapsar suavemente después de 4.2 segundos
    islandTimeout = setTimeout(() => {
      island.classList.remove("expanded");
    }, 4200);
  }

  /**
   * Abre un modal por ID
   */
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  /**
   * Cierra un modal por ID o todos
   */
  function closeModal(modalId) {
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove("active");
    } else {
      document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    }
    document.body.style.overflow = "";
  }

  /**
   * Configura listeners de cierre de modales (clic afuera y tecla Escape)
   */
  function setupModalDismissals() {
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          closeModal(overlay.id);
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });
  }

  /**
   * Rellena la lista de contactos frecuentes en el modal de transferencias
   */
  function renderQuickContacts() {
    const container = document.getElementById("quickContactsList");
    if (!container) return;

    container.innerHTML = quickContacts.map(c => `
      <button type="button" class="contact-chip" onclick="App.selectContact('${c.name}', '${c.bank}', '${c.clabe}')">
        <div class="contact-avatar">${c.initials}</div>
        <span class="contact-chip-name">${c.name}</span>
      </button>
    `).join('');
  }

  /**
   * Selecciona un contacto y rellena el formulario de transferencia
   */
  function selectContact(name, bank, clabe) {
    const destInput = document.getElementById("transferDestination");
    const nameInput = document.getElementById("transferBeneficiaryName");
    const bankInput = document.getElementById("transferBankName");

    if (destInput) destInput.value = clabe;
    if (nameInput) nameInput.value = name;
    if (bankInput) bankInput.value = bank;

    notifyIsland("Contacto Seleccionado", `${name} (${bank})`);
  }

  /**
   * Procesa el envío de una transferencia SPEI
   */
  function handleTransferSubmit(e) {
    e.preventDefault();

    const amountInput = document.getElementById("transferAmount");
    const destInput = document.getElementById("transferDestination");
    const nameInput = document.getElementById("transferBeneficiaryName");
    const conceptInput = document.getElementById("transferConcept");
    const bankInput = document.getElementById("transferBankName");
    const currencySelect = document.querySelector('input[name="transferCurrency"]:checked');

    const amount = parseFloat(amountInput.value);
    const destination = destInput.value.trim();
    const beneficiary = nameInput.value.trim() || "Beneficiario SPEI";
    const concept = conceptInput.value.trim() || "Transferencia SPEI";
    const bank = bankInput.value.trim() || "Banco Destino";
    const currency = currencySelect ? currencySelect.value : "MXN";

    if (!amount || amount <= 0) {
      alert("Por favor ingresa un monto válido mayor a 0.");
      return;
    }

    if (destination.length < 10) {
      alert("Por favor ingresa una CLABE (18 dígitos), tarjeta (16 dígitos) o celular válido.");
      return;
    }

    // Verificar saldo
    const balances = CurrencyEngine.getBalances();
    const available = currency === "MXN" ? balances.MXN : balances.USD;

    if (amount > available) {
      alert(`Saldo insuficiente. Tu saldo disponible en ${currency} es ${currency === 'MXN' ? CurrencyEngine.formatMXN(available) : CurrencyEngine.formatUSD(available)}.`);
      return;
    }

    // Cerrar modal de transferencia y solicitar Face ID
    closeModal("transferModal");

    CardSecurityEngine.triggerFaceIDAuth(() => {
      // Deducir saldo
      const deducted = CurrencyEngine.deductBalance(amount, currency);
      if (!deducted) return;

      // Registrar transacción
      const tx = TransactionsEngine.addTransaction({
        title: `Transferencia a ${beneficiary}`,
        subtitle: `${bank} · ${destination.slice(-4)}`,
        category: "Transferencia SPEI",
        icon: "↗️",
        amount: -amount,
        currency: currency,
        type: "expense",
        receiver: `${beneficiary} (${destination})`,
        bank: bank,
        concept: concept
      });

      // Notificar en la Dynamic Island
      const formattedAmount = currency === "MXN" ? CurrencyEngine.formatMXN(amount) : CurrencyEngine.formatUSD(amount);
      notifyIsland("SPEI Exitoso", `Envío a ${beneficiary}`, formattedAmount);

      // Limpiar campos
      amountInput.value = "";
      destInput.value = "";
      nameInput.value = "";
      conceptInput.value = "";

      // Mostrar de inmediato el comprobante oficial CEP de Banxico
      setTimeout(() => {
        TransactionsEngine.showReceiptModal(tx.id);
      }, 700);
    });
  }

  /**
   * Inicializa la calculadora de cambio de divisas (FX)
   */
  let fxDirection = "MXN_TO_USD"; // 'MXN_TO_USD' | 'USD_TO_MXN'

  function setupFXCalculator() {
    const fromInput = document.getElementById("fxFromAmount");
    const toInput = document.getElementById("fxToAmount");
    const fxRateInfo = document.getElementById("fxModalRateInfo");
    const swapBtn = document.getElementById("fxSwapDirectionBtn");
    const rate = CurrencyEngine.getFXRate();

    if (!fromInput || !toInput) return;

    function recalculate() {
      const val = parseFloat(fromInput.value) || 0;
      if (fxDirection === "MXN_TO_USD") {
        const result = val / rate.USD_TO_MXN;
        toInput.value = result > 0 ? result.toFixed(2) : "";
        if (fxRateInfo) fxRateInfo.textContent = `1 USD = $${rate.USD_TO_MXN.toFixed(2)} MXN`;
      } else {
        const result = val * rate.USD_TO_MXN;
        toInput.value = result > 0 ? result.toFixed(2) : "";
        if (fxRateInfo) fxRateInfo.textContent = `1 USD = $${rate.USD_TO_MXN.toFixed(2)} MXN`;
      }
    }

    fromInput.addEventListener("input", recalculate);

    if (swapBtn) {
      swapBtn.addEventListener("click", () => {
        fxDirection = fxDirection === "MXN_TO_USD" ? "USD_TO_MXN" : "MXN_TO_USD";

        const fromLabel = document.getElementById("fxFromCurrencyLabel");
        const toLabel = document.getElementById("fxToCurrencyLabel");
        const fromSymbol = document.getElementById("fxFromSymbol");
        const toSymbol = document.getElementById("fxToSymbol");

        if (fxDirection === "MXN_TO_USD") {
          fromLabel.textContent = "Pesos Mexicanos (MXN)";
          toLabel.textContent = "Dólares Estadounidenses (USD)";
          fromSymbol.textContent = "$";
          toSymbol.textContent = "$";
        } else {
          fromLabel.textContent = "Dólares Estadounidenses (USD)";
          toLabel.textContent = "Pesos Mexicanos (MXN)";
          fromSymbol.textContent = "$";
          toSymbol.textContent = "$";
        }

        fromInput.value = "";
        toInput.value = "";
      });
    }
  }

  /**
   * Ejecuta el cambio de divisa
   */
  function handleFXSubmit(e) {
    e.preventDefault();
    const fromInput = document.getElementById("fxFromAmount");
    const fromAmount = parseFloat(fromInput.value);

    if (!fromAmount || fromAmount <= 0) {
      alert("Por favor ingresa una cantidad a cambiar.");
      return;
    }

    const fromCurr = fxDirection === "MXN_TO_USD" ? "MXN" : "USD";
    const toCurr = fxDirection === "MXN_TO_USD" ? "USD" : "MXN";

    const res = CurrencyEngine.exchangeCurrencies(fromCurr, toCurr, fromAmount);

    if (!res.success) {
      alert(res.message);
      return;
    }

    closeModal("fxModal");

    // Registrar dos movimientos o movimiento de swap
    TransactionsEngine.addTransaction({
      title: `Cambio de Divisas: ${fromCurr} a ${toCurr}`,
      subtitle: `Tasa preferencial interbancaria`,
      category: "Cambio FX",
      icon: "🔄",
      amount: fromCurr === "MXN" ? -fromAmount : res.toAmount,
      currency: "MXN",
      type: "expense",
      concept: `Conversión instantánea de ${fromCurr} a ${toCurr}`
    });

    const receivedFormatted = toCurr === "USD" ? CurrencyEngine.formatUSD(res.toAmount) : CurrencyEngine.formatMXN(res.toAmount);
    notifyIsland("Cambio de Divisa", `Recibiste ${receivedFormatted}`);
    fromInput.value = "";
    document.getElementById("fxToAmount").value = "";
  }

  /**
   * Pagar servicio (CFE, Telmex, etc.)
   */
  function handlePayService(serviceName, defaultAmount) {
    const confirmPay = confirm(`¿Deseas pagar ${serviceName} por un monto de $${defaultAmount.toFixed(2)} MXN?`);
    if (!confirmPay) return;

    CardSecurityEngine.triggerFaceIDAuth(() => {
      const deducted = CurrencyEngine.deductBalance(defaultAmount, "MXN");
      if (!deducted) {
        alert("Saldo en MXN insuficiente.");
        return;
      }

      TransactionsEngine.addTransaction({
        title: `Pago de Servicio: ${serviceName}`,
        subtitle: `Folio Autorización Oficial #91823`,
        category: "Servicios",
        icon: "⚡",
        amount: -defaultAmount,
        currency: "MXN",
        type: "expense",
        concept: `Pago de recibo ${serviceName}`
      });

      notifyIsland("Servicio Pagado", `${serviceName} liquidado con éxito`);
      closeModal("servicesModal");
    });
  }

  /**
   * Apartado de ahorro: agregar dinero
   */
  function depositToVault(vaultName, amountMXN = 1000) {
    const balances = CurrencyEngine.getBalances();
    if (balances.MXN < amountMXN) {
      alert("Saldo en pesos insuficiente.");
      return;
    }

    CurrencyEngine.deductBalance(amountMXN, "MXN");

    TransactionsEngine.addTransaction({
      title: `Aporte a Apartado: ${vaultName}`,
      subtitle: `Generando 14.25% anual`,
      category: "Ahorro",
      icon: "🎯",
      amount: -amountMXN,
      currency: "MXN",
      type: "expense",
      concept: `Ahorro protegido ${vaultName}`
    });

    notifyIsland("Ahorro Actualizado", `+${CurrencyEngine.formatMXN(amountMXN)} a ${vaultName}`);
  }

  /**
   * Imprimir o guardar comprobante CEP SPEI
   */
  function printSPEIReceipt() {
    window.print();
  }

  /**
   * Inicialización global de la aplicación
   */
  function init() {
    // 1. Iniciar balances y divisas
    CurrencyEngine.renderBalances();

    // 2. Iniciar transacciones
    TransactionsEngine.renderTransactions();

    // 3. Iniciar tarjeta 3D y Face ID
    CardSecurityEngine.initCard3DEffect();
    CardSecurityEngine.renderCardUI();

    // 4. Modal listeners y contactos rápidos
    setupModalDismissals();
    renderQuickContacts();
    setupFXCalculator();

    // 5. Saludo inicial en Dynamic Island
    setTimeout(() => {
      notifyIsland("MIAUBANK Private", "Face ID Activo · Sesión Segura", "PROTEGIDO");
    }, 800);
  }

  return {
    init,
    notifyIsland,
    openModal,
    closeModal,
    selectContact,
    handleTransferSubmit,
    handleFXSubmit,
    handlePayService,
    depositToVault,
    printSPEIReceipt
  };
})();

// Arrancar al cargar el documento
document.addEventListener("DOMContentLoaded", App.init);
