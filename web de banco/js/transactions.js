/**
 * AURA BANK - TRANSACTIONS & SPEI ENGINE
 * Historial de movimientos en MXN / USD y comprobantes oficiales SPEI
 */

const TransactionsEngine = (() => {
  // Transacciones iniciales en contexto mexicano e internacional
  let transactions = [
    {
      id: "tx-001",
      title: "Nómina Quincenal",
      subtitle: "Tech Global México S.A. de C.V.",
      category: "Ingreso",
      icon: "💼",
      amount: 38500.00,
      currency: "MXN",
      type: "income",
      date: "Hoy, 09:15 AM",
      timestamp: Date.now() - 3600000 * 2,
      status: "Liquidado",
      trackingKey: "20261002045678912345091523",
      sender: "Tech Global MX (CLABE ...9012)",
      receiver: "Tu Cuenta MIAUBANK (CLABE ...8123)",
      bank: "BBVA México",
      concept: "Pago Nómina 2da Quincena"
    },
    {
      id: "tx-002",
      title: "Apple Services",
      subtitle: "Apple One Premier & iCloud+",
      category: "Suscripción",
      icon: "🍎",
      amount: -449.00,
      currency: "MXN",
      type: "expense",
      date: "Ayer, 08:30 PM",
      timestamp: Date.now() - 3600000 * 22,
      status: "Aprobado",
      card: "Virtual Aurora ...9012"
    },
    {
      id: "tx-003",
      title: "Transferencia SPEI a Sofía",
      subtitle: "Sofía Garza Ramos · Banorte",
      category: "Transferencia",
      icon: "↗️",
      amount: -1850.00,
      currency: "MXN",
      type: "expense",
      date: "Ayer, 02:40 PM",
      timestamp: Date.now() - 3600000 * 28,
      status: "Liquidado",
      trackingKey: "20261001045612874563024018",
      sender: "Tu Cuenta MIAUBANK (CLABE ...8123)",
      receiver: "Sofía Garza (CLABE ...4592)",
      bank: "Banorte",
      concept: "Cena Masaryk fin de semana"
    },
    {
      id: "tx-004",
      title: "AWS Cloud Services",
      subtitle: "Amazon Web Services Inc.",
      category: "Servicios Cloud",
      icon: "☁️",
      amount: -124.50,
      currency: "USD",
      type: "expense",
      date: "30 Sep, 11:10 PM",
      timestamp: Date.now() - 3600000 * 50,
      status: "Aprobado",
      card: "Titanium Black ...4829"
    },
    {
      id: "tx-005",
      title: "Rendimientos MIAUBANK Cajitas",
      subtitle: "Tasa fija 14.25% anualizada",
      category: "Inversión",
      icon: "📈",
      amount: 68.42,
      currency: "MXN",
      type: "income",
      date: "30 Sep, 07:00 AM",
      timestamp: Date.now() - 3600000 * 66,
      status: "Acreditado",
      concept: "Rendimiento diario compuesto"
    },
    {
      id: "tx-006",
      title: "Stripe International Payout",
      subtitle: "Cobro cliente San Francisco, CA",
      category: "Ingreso Extranjero",
      icon: "🌐",
      amount: 2450.00,
      currency: "USD",
      type: "income",
      date: "28 Sep, 04:15 PM",
      timestamp: Date.now() - 3600000 * 110,
      status: "Liquidado",
      trackingKey: "WIRE-SF-9981240129",
      sender: "Stripe Payments US LLC",
      receiver: "Cuenta USD MIAUBANK ...8123",
      concept: "Factura Consultoría UI/UX"
    },
    {
      id: "tx-007",
      title: "Starbucks Masaryk",
      subtitle: "Starbucks Coffee México",
      category: "Alimentos",
      icon: "☕",
      amount: -165.00,
      currency: "MXN",
      type: "expense",
      date: "27 Sep, 10:20 AM",
      timestamp: Date.now() - 3600000 * 135,
      status: "Aprobado",
      card: "Apple Pay · Titanium Black"
    }
  ];

  let currentFilter = "ALL"; // ALL | MXN | USD | INCOME | EXPENSE

  /**
   * Genera una clave de rastreo Banxico SPEI realista
   */
  function generateSPEITrackingKey() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    const digits = Math.floor(10000000 + Math.random() * 90000000);
    return `${dateStr}MIAUSPEI${digits}${randomHex}`.slice(0, 26);
  }

  /**
   * Agrega un nuevo movimiento al historial
   */
  function addTransaction(tx) {
    const newTx = {
      id: `tx-${Date.now()}`,
      status: "Liquidado",
      date: "Hace un momento",
      timestamp: Date.now(),
      trackingKey: tx.trackingKey || generateSPEITrackingKey(),
      ...tx
    };

    transactions.unshift(newTx);
    renderTransactions();
    return newTx;
  }

  /**
   * Filtra las transacciones según la opción activa
   */
  function getFilteredTransactions() {
    return transactions.filter(t => {
      if (currentFilter === "MXN") return t.currency === "MXN";
      if (currentFilter === "USD") return t.currency === "USD";
      if (currentFilter === "INCOME") return t.type === "income";
      if (currentFilter === "EXPENSE") return t.type === "expense";
      return true; // "ALL"
    });
  }

  /**
   * Cambia el filtro actual de transacciones
   */
  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll(".tx-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    renderTransactions();
  }

  /**
   * Muestra el comprobante oficial CEP SPEI
   */
  function showReceiptModal(txId) {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    const receiptModal = document.getElementById("speiReceiptModal");
    if (!receiptModal) return;

    // Rellenar datos
    document.getElementById("receiptTrackingKey").textContent = tx.trackingKey || "AUT-MIAU-" + tx.id;
    document.getElementById("receiptDate").textContent = tx.date + " · " + new Date(tx.timestamp).toLocaleDateString('es-MX');
    document.getElementById("receiptBeneficiary").textContent = tx.receiver || tx.subtitle || "Comercio Afiliado";
    document.getElementById("receiptOrigin").textContent = tx.sender || "Cuenta MIAUBANK (...8123)";
    document.getElementById("receiptInstitution").textContent = tx.bank || "Banco Central / Sistema MIAUBANK";
    document.getElementById("receiptConcept").textContent = tx.concept || tx.title;

    const amountFormatted = tx.currency === "MXN"
      ? CurrencyEngine.formatMXN(Math.abs(tx.amount))
      : CurrencyEngine.formatUSD(Math.abs(tx.amount));

    document.getElementById("receiptAmount").textContent = amountFormatted;
    document.getElementById("receiptStatus").textContent = tx.status || "Liquidado";

    // Abrir modal
    receiptModal.classList.add("active");
  }

  /**
   * Renderiza el listado de transacciones en el DOM
   */
  function renderTransactions() {
    const container = document.getElementById("transactionsList");
    if (!container) return;

    const list = getFilteredTransactions();

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary); font-size: 0.9rem;">
          No se encontraron movimientos para este filtro.
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(tx => {
      const isPositive = tx.amount > 0;
      const sign = isPositive ? "+" : "-";
      const absAmount = Math.abs(tx.amount);
      const formattedAmount = tx.currency === "MXN" 
        ? CurrencyEngine.formatMXN(absAmount, false)
        : CurrencyEngine.formatUSD(absAmount, false);

      return `
        <div class="tx-item" onclick="TransactionsEngine.showReceiptModal('${tx.id}')">
          <div class="tx-left">
            <div class="tx-icon-circle">${tx.icon}</div>
            <div class="tx-meta">
              <span class="tx-title">${tx.title}</span>
              <span class="tx-subtitle">
                ${tx.subtitle}
                <span class="tx-time-dot"></span>
                ${tx.date}
              </span>
            </div>
          </div>
          <div class="tx-right">
            <span class="tx-amount ${isPositive ? 'positive' : 'negative'}">
              ${sign}${formattedAmount}
            </span>
            <span class="tx-currency-badge">${tx.currency} · ${tx.status}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  return {
    getTransactions: () => [...transactions],
    addTransaction,
    setFilter,
    showReceiptModal,
    renderTransactions,
    generateSPEITrackingKey
  };
})();
