/**
 * AURA BANK - CURRENCY & FX ENGINE
 * Manejo de divisas MXN / USD, tasas de cambio en tiempo real y formatos
 */

const CurrencyEngine = (() => {
  // Tasas de cambio Banxico / Interbancario simuladas
  const FX_RATE = {
    USD_TO_MXN: 17.8540,
    MXN_TO_USD: 1 / 17.8540,
    SPREAD: 0.003, // 0.3% spread preferencial institucional
    LAST_UPDATE: new Date()
  };

  // Balances del usuario
  let balances = {
    MXN: 184520.50,
    USD: 9850.00
  };

  // Rendimiento anualizado (Cajitas / Inversión estilo Nu / Hey Banco / Cetes)
  const ANNUAL_YIELD_RATE = 0.1425; // 14.25% anual

  // Modo de visualización activo: 'MXN' | 'USD' | 'DUAL'
  let currentDisplayMode = 'MXN';
  let isBalanceHidden = false;

  /**
   * Formatea un número a Pesos Mexicanos (MXN)
   */
  function formatMXN(amount, withCode = true) {
    if (isBalanceHidden) return '••••••••';
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return withCode ? `${formatted} MXN` : formatted;
  }

  /**
   * Formatea un número a Dólares Estadounidenses (USD)
   */
  function formatUSD(amount, withCode = true) {
    if (isBalanceHidden) return '••••••••';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return withCode ? `${formatted} USD` : formatted;
  }

  /**
   * Convierte MXN a USD
   */
  function convertMXNtoUSD(mxnAmount) {
    return mxnAmount * FX_RATE.MXN_TO_USD;
  }

  /**
   * Convierte USD a MXN
   */
  function convertUSDtoMXN(usdAmount) {
    return usdAmount * FX_RATE.USD_TO_MXN;
  }

  /**
   * Obtiene el patrimonio total consolidado según la divisa seleccionada
   */
  function getTotalConsolidatedBalance(currency = currentDisplayMode) {
    if (currency === 'USD') {
      return balances.USD + convertMXNtoUSD(balances.MXN);
    }
    // Por defecto en MXN
    return balances.MXN + convertUSDtoMXN(balances.USD);
  }

  /**
   * Calcula el rendimiento diario acumulado
   */
  function getDailyYield(balanceMXN = balances.MXN) {
    const dailyRate = ANNUAL_YIELD_RATE / 365;
    return balanceMXN * dailyRate;
  }

  /**
   * Actualiza los elementos del DOM relacionados con balances
   */
  function renderBalances() {
    const mainBalanceEl = document.getElementById('mainBalanceAmount');
    const currencyCodeEl = document.getElementById('mainCurrencyCode');
    const secondaryBalanceEl = document.getElementById('secondaryBalanceAmount');
    const secondaryCodeEl = document.getElementById('secondaryCurrencyCode');
    const dailyYieldEl = document.getElementById('dailyYieldAmount');
    const fxRateTickerEl = document.getElementById('fxTickerRate');

    if (fxRateTickerEl) {
      fxRateTickerEl.textContent = `$1 USD = $${FX_RATE.USD_TO_MXN.toFixed(2)} MXN`;
    }

    if (!mainBalanceEl) return;

    if (isBalanceHidden) {
      mainBalanceEl.textContent = '••••••••';
      currencyCodeEl.textContent = '';
      if (secondaryBalanceEl) secondaryBalanceEl.textContent = '••••••••';
      return;
    }

    if (currentDisplayMode === 'MXN') {
      const totalInMXN = getTotalConsolidatedBalance('MXN');
      mainBalanceEl.textContent = formatMXN(balances.MXN, false);
      currencyCodeEl.textContent = 'MXN';

      if (secondaryBalanceEl && secondaryCodeEl) {
        secondaryBalanceEl.textContent = formatUSD(balances.USD, false);
        secondaryCodeEl.textContent = `USD (Total consol: ${formatMXN(totalInMXN, true)})`;
      }
    } else if (currentDisplayMode === 'USD') {
      const totalInUSD = getTotalConsolidatedBalance('USD');
      mainBalanceEl.textContent = formatUSD(balances.USD, false);
      currencyCodeEl.textContent = 'USD';

      if (secondaryBalanceEl && secondaryCodeEl) {
        secondaryBalanceEl.textContent = formatMXN(balances.MXN, false);
        secondaryCodeEl.textContent = `MXN (Total consol: ${formatUSD(totalInUSD, true)})`;
      }
    } else {
      // Modo Dual
      mainBalanceEl.textContent = `${formatMXN(balances.MXN, false)}`;
      currencyCodeEl.textContent = `+ ${formatUSD(balances.USD, false)} USD`;

      if (secondaryBalanceEl && secondaryCodeEl) {
        secondaryBalanceEl.textContent = formatMXN(getTotalConsolidatedBalance('MXN'), false);
        secondaryCodeEl.textContent = 'MXN Valor Combinado';
      }
    }

    // Rendimiento diario
    if (dailyYieldEl) {
      const dailyEarn = getDailyYield();
      dailyYieldEl.textContent = `+${formatMXN(dailyEarn, true)} hoy`;
    }
  }

  /**
   * Cambiar modo de visualización (MXN / USD / DUAL)
   */
  function setDisplayMode(mode) {
    if (['MXN', 'USD', 'DUAL'].includes(mode)) {
      currentDisplayMode = mode;
      renderBalances();
      
      // Actualizar botones de filtro
      document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === mode);
      });
    }
  }

  /**
   * Alternar visibilidad de saldo por privacidad
   */
  function toggleBalanceVisibility() {
    isBalanceHidden = !isBalanceHidden;
    renderBalances();
    const btnText = document.getElementById('privacyBtnText');
    if (btnText) {
      btnText.textContent = isBalanceHidden ? 'Mostrar' : 'Ocultar';
    }
    return isBalanceHidden;
  }

  /**
   * Ejecuta una transferencia o deducción de saldo
   */
  function deductBalance(amount, currency) {
    if (currency === 'MXN') {
      if (balances.MXN < amount) return false;
      balances.MXN -= amount;
    } else if (currency === 'USD') {
      if (balances.USD < amount) return false;
      balances.USD -= amount;
    }
    renderBalances();
    return true;
  }

  /**
   * Ejecuta un depósito o ingreso de saldo
   */
  function addBalance(amount, currency) {
    if (currency === 'MXN') {
      balances.MXN += amount;
    } else if (currency === 'USD') {
      balances.USD += amount;
    }
    renderBalances();
    return true;
  }

  /**
   * Ejecuta un swap entre divisas (MXN <-> USD)
   */
  function exchangeCurrencies(fromCurrency, toCurrency, fromAmount) {
    if (fromAmount <= 0) return { success: false, message: 'El monto debe ser mayor a 0' };

    if (fromCurrency === 'MXN' && toCurrency === 'USD') {
      if (balances.MXN < fromAmount) return { success: false, message: 'Saldo en pesos insuficiente' };
      const receivedUSD = fromAmount / FX_RATE.USD_TO_MXN;
      balances.MXN -= fromAmount;
      balances.USD += receivedUSD;
      renderBalances();
      return { success: true, fromAmount, toAmount: receivedUSD, fromCurrency, toCurrency };
    } 
    
    if (fromCurrency === 'USD' && toCurrency === 'MXN') {
      if (balances.USD < fromAmount) return { success: false, message: 'Saldo en dólares insuficiente' };
      const receivedMXN = fromAmount * FX_RATE.USD_TO_MXN;
      balances.USD -= fromAmount;
      balances.MXN += receivedMXN;
      renderBalances();
      return { success: true, fromAmount, toAmount: receivedMXN, fromCurrency, toCurrency };
    }

    return { success: false, message: 'Divisas inválidas' };
  }

  return {
    getBalances: () => ({ ...balances }),
    getFXRate: () => ({ ...FX_RATE }),
    getDisplayMode: () => currentDisplayMode,
    isBalanceHidden: () => isBalanceHidden,
    formatMXN,
    formatUSD,
    convertMXNtoUSD,
    convertUSDtoMXN,
    getTotalConsolidatedBalance,
    setDisplayMode,
    toggleBalanceVisibility,
    deductBalance,
    addBalance,
    exchangeCurrencies,
    renderBalances
  };
})();
