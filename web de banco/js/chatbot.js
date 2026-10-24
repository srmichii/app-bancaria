/**
 * MIAUBANK - VIRTUAL ASSISTANT & MASCOT (MIAUBOT)
 * Asistente Bancario Determinista (Sin IA activa, con arquitectura lista para futura integración).
 * Mascota Oficial: Mini Gato Banquero estilo Anime.
 */

const MiauBot = (() => {
  let isOpen = false;
  let isTyping = false;

  /**
   * =========================================================================
   * CONFIGURACIÓN DE FUTURA INTEGRACIÓN CON IA (DESACTIVADA POR DEFECTO)
   * =========================================================================
   * El asistente funciona actualmente 100% mediante reglas deterministas,
   * catálogo de preguntas frecuentes y búsqueda por palabras clave.
   * Si en el futuro se implementa una API de IA (OpenAI, Gemini, Ollama, etc.),
   * solo debes cambiar `enabled: true` y configurar `apiEndpoint` y `apiKey`.
   */
  const AI_INTEGRATION_CONFIG = {
    enabled: false,           // 'false': Modo reglas deterministas sin IA. 'true': Habilita llamada a proveedor IA.
    provider: "gemini",       // 'gemini' | 'openai' | 'custom'
    apiEndpoint: null,        // Ejemplo: "https://api.tudominio.com/v1/chat"
    apiKey: null,             // Llave de autenticación futura
    temperature: 0.3,
    maxTokens: 500
  };

  /**
   * Conector preparado para futura API de IA
   */
  async function queryFutureAIProvider(userPrompt, bankingContext) {
    if (!AI_INTEGRATION_CONFIG.enabled || !AI_INTEGRATION_CONFIG.apiEndpoint) {
      return null;
    }
    try {
      const response = await fetch(AI_INTEGRATION_CONFIG.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AI_INTEGRATION_CONFIG.apiKey || ""}`
        },
        body: JSON.stringify({
          prompt: userPrompt,
          context: bankingContext,
          temperature: AI_INTEGRATION_CONFIG.temperature
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.reply || null;
    } catch (err) {
      console.warn("Fallo en conector de IA futura, usando fallback determinista:", err);
      return null;
    }
  }

  /**
   * =========================================================================
   * BASE DE CONOCIMIENTOS DETERMINISTA COMPLETA (40+ PREGUNTAS Y RESPUESTAS)
   * =========================================================================
   */
  const KNOWLEDGE_CATEGORIES = [
    { id: "spei", name: "💸 SPEI y Transferencias", icon: "💸" },
    { id: "cuentas", name: "💰 Saldos y Cuentas", icon: "💰" },
    { id: "depositos", name: "🔢 CLABE y Depósitos", icon: "🔢" },
    { id: "tarjetas", name: "💳 Tarjetas y CVV", icon: "💳" },
    { id: "rendimiento", name: "📈 Rendimiento 14.25%", icon: "📈" },
    { id: "divisas", name: "💱 Divisas y Dólares", icon: "💱" },
    { id: "servicios", name: "🧾 Pago de Servicios", icon: "🧾" },
    { id: "seguridad", name: "🛡️ Seguridad y Face ID", icon: "🛡️" },
    { id: "banco", name: "🏛️ MIAUBANK y Soporte", icon: "🏛️" }
  ];

  const BANKING_FAQS = [
    // --- 1. SPEI Y TRANSFERENCIAS ---
    {
      category: "spei",
      question: "¿Cómo transfiero dinero por SPEI?",
      keywords: ["transferir", "transferencia", "como transfiero", "spei", "mandar dinero", "enviar dinero"],
      answer: `Para transferir vía <strong>SPEI</strong>:<br>
        1. Pulsa el botón <strong>"Transferir (SPEI)"</strong> en el panel de acciones rápidas.<br>
        2. Elige un contacto frecuente o escribe la <strong>CLABE de 18 dígitos</strong> del beneficiario.<br>
        3. Escribe el monto en pesos (MXN) o dólares (USD Wire) y el concepto.<br>
        4. Se liquida en segundos y sin comisión. Al finalizar puedes descargar tu comprobante CEP Banxico oficial.`,
      actions: [{ label: "🚀 Abrir Transferencias SPEI", action: "App.openModal('transferModal')" }]
    },
    {
      category: "spei",
      question: "¿Qué comisiones cobra MIAUBANK por transferencias SPEI?",
      keywords: ["comision spei", "comisiones", "cuanto cobran por transferir", "costo transferencia", "gratis spei"],
      answer: `<strong>$0.00 MXN</strong>. En MIAUBANK todas las transferencias interbancarias SPEI son <strong>100% gratuitas e ilimitadas</strong>, tanto para personas físicas como cuentas empresariales.`,
      actions: [{ label: "🚀 Hacer una transferencia", action: "App.openModal('transferModal')" }]
    },
    {
      category: "spei",
      question: "¿En qué horario puedo transferir por SPEI?",
      keywords: ["horario spei", "a que hora transferir", "dias habiles", "24 7", "fin de semana spei"],
      answer: `El SPEI en MIAUBANK opera con conexión directa <strong>24 horas al día, 7 días a la semana, los 365 días del año</strong>. Puedes transferir en la madrugada, días festivos o fines de semana con acreditación instantánea.`
    },
    {
      category: "spei",
      question: "¿Qué es la Clave de Rastreo Banxico y el comprobante CEP?",
      keywords: ["clave de rastreo", "banxico", "cep", "comprobante", "recibo spei", "ver comprobante"],
      answer: `El <strong>CEP (Comprobante Electrónico de Pago)</strong> es el documento oficial emitido por Banco de México con sello digital que avala la entrega del dinero. Contiene una <strong>clave de rastreo numérica</strong> de 26 dígitos con la que puedes consultar la operación en el portal Banxico (banxico.org.mx/cep).`,
      actions: [{ label: "📊 Ver mis Movimientos y CEP", action: "window.scrollTo({top: 450, behavior: 'smooth'})" }]
    },
    {
      category: "spei",
      question: "¿Cuánto tarda en llegar una transferencia?",
      keywords: ["cuanto tarda", "tiempo transferencia", "cuanto demora", "cuando cae"],
      answer: `La liquidación por SPEI se procesa en un promedio de <strong>3 a 8 segundos</strong>. En casos excepcionales de validación interbancaria Banxico puede demorar hasta 5 minutos.`
    },
    {
      category: "spei",
      question: "¿Puedo cancelar una transferencia SPEI ya enviada?",
      keywords: ["cancelar transferencia", "revertir spei", "me equivoque de cuenta"],
      answer: `Debido a que el SPEI liquida en tiempo real de forma irrevocable entre bancos, <strong>no se puede cancelar una vez enviada</strong>. Te recomendamos verificar dos veces la CLABE y el banco destino antes de autorizar.`
    },

    // --- 2. SALDOS Y CUENTAS ---
    {
      category: "cuentas",
      question: "¿Cuál es mi saldo actual disponible?",
      keywords: ["saldo", "cuanto dinero tengo", "mis fondos", "balance", "cuanto tengo", "patrimonio"],
      dynamic: true,
      getDynamicAnswer: () => {
        let mxn = "$184,520.50 MXN";
        let usd = "$9,850.00 USD";
        if (typeof CurrencyEngine !== "undefined" && CurrencyEngine.getBalances) {
          const b = CurrencyEngine.getBalances();
          mxn = CurrencyEngine.formatMXN(b.MXN);
          usd = CurrencyEngine.formatUSD(b.USD);
        }
        return `Tu patrimonio disponible en MIAUBANK es:<br>
          • <strong>Pesos Mexicanos:</strong> ${mxn}<br>
          • <strong>Dólares Estadounidenses:</strong> ${usd}<br><br>
          Ambas cuentas están centralizadas y protegidas bajo tu titularidad.`;
      },
      actions: [
        { label: "👁️ Ocultar / Mostrar Saldo", action: "CurrencyEngine.toggleBalanceVisibility()" },
        { label: "💱 Cambiar Divisas", action: "App.openModal('fxModal')" }
      ]
    },
    {
      category: "cuentas",
      question: "¿Cómo oculto mi saldo por privacidad cuando estoy en público?",
      keywords: ["ocultar saldo", "privacidad saldo", "modo discreto", "tapar saldo", "no vean mi dinero"],
      answer: `En la tarjeta de saldo superior, toca el botón con el icono de ojo <strong>"Ocultar"</strong>. Tus cifras se reemplazarán por puntos discretos (••••••••) para evitar miradas curiosas.`,
      actions: [{ label: "👁️ Probar Alternar Saldo", action: "CurrencyEngine.toggleBalanceVisibility()" }]
    },
    {
      category: "cuentas",
      question: "¿Quién es el titular de esta cuenta?",
      keywords: ["titular", "quien es el dueno", "nombre cuenta", "alejandro tapia"],
      answer: `El titular registrado y verificado con Face ID es <strong>Alejandro Tapia</strong>, cliente de Banca Privada MIAUBANK.`
    },
    {
      category: "cuentas",
      question: "¿Qué es el Modo Dual de divisas?",
      keywords: ["modo dual", "dual", "ver pesos y dolares", "moneda selector"],
      answer: `El <strong>Modo Dual</strong> (disponible en la pastilla superior de divisas) te permite visualizar en pantalla tus cuentas en Pesos (MXN) y Dólares (USD) simultáneamente sin tener que cambiar de pantalla.`,
      actions: [{ label: "🌐 Activar Modo Dual", action: "CurrencyEngine.setDisplayMode('DUAL')" }]
    },

    // --- 3. CLABE Y DEPÓSITOS ---
    {
      category: "depositos",
      question: "¿Cuál es mi CLABE interbancaria para recibir transferencias?",
      keywords: ["clabe", "mi clabe", "numero de clabe", "cuenta para que me depositen", "recibir dinero"],
      answer: `Tu CLABE Interbancaria única es:<br>
        <div style="font-family: var(--font-mono); font-size: 1.15rem; color: var(--cool-cyan); font-weight: 800; background: rgba(56,189,248,0.1); padding: 8px 12px; border-radius: 8px; margin: 8px 0; border: 1px dashed var(--cool-cyan);">646 180 1570 2394 8123</div>
        • Banco Receptor: <strong>STP (Sistema de Transferencias y Pagos) / MIAUBANK</strong><br>
        • Titular: <strong>Alejandro Tapia</strong>`,
      actions: [{ label: "📋 Copiar CLABE al Portapapeles", action: "CardSecurityEngine.copyCLABE()" }]
    },
    {
      category: "depositos",
      question: "¿Cómo deposito dinero en efectivo a mi cuenta?",
      keywords: ["deposito efectivo", "depositar efectivo", "oxxo pay", "oxxo", "meter efectivo"],
      answer: `Puedes ingresar dinero en efectivo en más de 20,000 tiendas <strong>OXXO</strong> en todo México:<br>
        1. Toca <strong>"Ingresar Dinero"</strong> en el panel de acciones.<br>
        2. Muestra al cajero el código de barras OXXO Pay (<code>9384 1029 4812 0041</code>).<br>
        3. Paga el monto deseado. El dinero se acredita de forma inmediata en tu saldo.`,
      actions: [{ label: "🏪 Ver Código de Depósito OXXO", action: "App.openModal('depositModal')" }]
    },
    {
      category: "depositos",
      question: "¿Hay límite de depósito mensual?",
      keywords: ["limite deposito", "cuanto puedo depositar", "tope de dinero", "nivel cuenta"],
      answer: `Al ser cuenta de <strong>Banca Privada Nivel 4</strong> verificada biométricamente, no tienes límite restrictivo de transferencias interbancarias SPEI mensuales.`
    },

    // --- 4. TARJETAS Y CVV ---
    {
      category: "tarjetas",
      question: "¿Cuál es la diferencia entre la tarjeta Titanium Black y la Aurora Virtual?",
      keywords: ["diferencia tarjetas", "titanium black", "aurora virtual", "tarjeta fisica", "tarjeta virtual"],
      answer: `• <strong>Titanium Black (Física):</strong> Tarjeta metálica premium sin números impresos, con chip EMV y contactless para compras en terminales físicas.<br>
        • <strong>Aurora (Virtual):</strong> Tarjeta 100% digital con <strong>CVV dinámico</strong> que expira cada 5 minutos, diseñada para compras en internet y suscripciones de streaming sin riesgo de clonación.`,
      actions: [{ label: "💳 Ver Tarjetas", action: "CardSecurityEngine.switchCard('virtual')" }]
    },
    {
      category: "tarjetas",
      question: "¿Cómo congelo o apago mi tarjeta para evitar cargos?",
      keywords: ["congelar tarjeta", "bloquear tarjeta", "apagar tarjeta", "descongelar", "pausar tarjeta"],
      answer: `Puedes congelar tu tarjeta al instante con el switch ubicado en el módulo de tarjetas. Cuando está congelada, se rechaza de inmediato cualquier intento de cobro hasta que decidas desbloquearla.`,
      actions: [{ label: "❄️ Congelar / Descongelar Ahora", action: "CardSecurityEngine.toggleLockCard()" }]
    },
    {
      category: "tarjetas",
      question: "¿Dónde veo mi número de tarjeta completo y CVV?",
      keywords: ["ver tarjeta", "ver cvv", "datos tarjeta", "revelar datos", "cvv dinamico"],
      answer: `Toca el botón <strong>"Ver datos y CVV"</strong> sobre la tarjeta. Tras una rápida autenticación simulada por <strong>Face ID</strong>, se revelarán los 16 dígitos y el código de seguridad dinámico durante 5 minutos.`,
      actions: [{ label: "👁️ Revelar Datos con Face ID", action: "CardSecurityEngine.requestRevealDetails()" }]
    },
    {
      category: "tarjetas",
      question: "¿Las tarjetas son compatibles con Apple Pay y Google Wallet?",
      keywords: ["apple pay", "google wallet", "contactless", "pagar con celular", "nfc"],
      answer: `Sí. Ambas tarjetas cuentan con tecnología contactless NFC y soporte directo para agregarse a la app Wallet de iPhone / Apple Watch y dispositivos Android.`
    },
    {
      category: "tarjetas",
      question: "¿Qué hago en caso de robo o extravío de mi tarjeta física?",
      keywords: ["robo tarjeta", "perdi mi tarjeta", "extravio", "me la robaron"],
      answer: `1. <strong>Congela la tarjeta de inmediato</strong> desde la web para prevenir cualquier uso.<br>
        2. Puedes seguir utilizando con normalidad tu <strong>Aurora Virtual</strong> para compras en línea mientras solicitas la reposición de tu Titanium física.`
    },

    // --- 5. RENDIMIENTO Y AHORRO ---
    {
      category: "rendimiento",
      question: "¿Cómo funciona el rendimiento del 14.25% anual?",
      keywords: ["rendimiento", "14.25", "tasa anual", "intereses", "ganancias", "cajita", "inversion"],
      answer: `MIAUBANK genera <strong>14.25% de rendimiento anual a la vista</strong> sobre todo tu saldo en pesos mexicanos (MXN).<br><br>
        • Los rendimientos se calculan y <strong>abonan diariamente</strong> de forma automática.<br>
        • Tu dinero está disponible 24/7 sin plazos forzosos ni penalizaciones por retiro.`
    },
    {
      category: "rendimiento",
      question: "¿Qué son las Bóvedas de Ahorro y Metas?",
      keywords: ["bovedas de ahorro", "metas", "apartados", "fondo emergencia", "tokio"],
      answer: `Las Bóvedas te permiten apartar dinero de tu saldo principal para no gastarlo por error, sin dejar de ganar rendimiento:<br>
        • <strong>Fondo de Emergencia:</strong> Meta $100,000 MXN con rendimiento activo.<br>
        • <strong>Viaje a Tokio 2027:</strong> Meta $5,000 USD protegida en moneda extranjera.`,
      actions: [{ label: "🎯 Agregar $1,000 a Fondo Emergencia", action: "App.depositToVault('Fondo Emergencia', 1000)" }]
    },
    {
      category: "rendimiento",
      question: "¿Mi dinero está protegido por el IPAB?",
      keywords: ["ipab", "proteccion seguro", "protegido", "udis", "garantia"],
      answer: `Sí. Tus depósitos en MIAUBANK cuentan con la protección del <strong>IPAB (Instituto para la Protección al Ahorro Bancario)</strong> hasta por <strong>400,000 UDIs</strong> (más de 3.2 millones de pesos mexicanos).`
    },

    // --- 6. DIVISAS Y DÓLARES ---
    {
      category: "divisas",
      question: "¿Cómo cambio pesos mexicanos a dólares estadounidenses (FX)?",
      keywords: ["cambiar dolares", "comprar dolares", "fx", "divisas", "tipo de cambio", "dolar"],
      answer: `Toca el botón <strong>"Cambiar MXN / USD"</strong> en las acciones rápidas. Ingresa la cantidad deseada y verás la cotización en vivo Banxico Fix sin comisiones ocultas. La conversión se acredita en tu saldo en dólares en un segundo.`,
      actions: [{ label: "💱 Abrir Conversor de Divisas", action: "App.openModal('fxModal')" }]
    },
    {
      category: "divisas",
      question: "¿Cuál es la cotización del dólar hoy?",
      keywords: ["precio dolar", "cotizacion dolar", "tipo de cambio fix", "banxico tasa"],
      answer: `El tipo de cambio referencial es de <strong>$1 USD = $17.8540 MXN</strong> con un spread institucional preferencial de tan solo 0.3%. Puedes revisarlo siempre en la barra superior en vivo.`
    },
    {
      category: "divisas",
      question: "¿Puedo recibir transferencias internacionales en dólares (Wire)?",
      keywords: ["transferencia internacional", "swift", "wire", "recibir dolares usa"],
      answer: `Sí. Tu sub-cuenta en dólares acepta transferencias Wire internacionales de cuentas en EE.UU. y el extranjero sin conversión forzosa a pesos.`
    },

    // --- 7. PAGO DE SERVICIOS ---
    {
      category: "servicios",
      question: "¿Qué servicios puedo pagar desde la banca?",
      keywords: ["pagar servicios", "servicios", "cfe", "luz", "telmex", "tag pase", "agua"],
      answer: `Puedes pagar los siguientes servicios en un clic:<br>
        • <strong>CFE:</strong> Comisión Federal de Electricidad.<br>
        • <strong>Telmex:</strong> Recibo Infinitum Fibra.<br>
        • <strong>Tag PASE:</strong> Recarga inmediata para casetas y autopistas urbanas.<br>
        • <strong>SACMEX:</strong> Agua de la Ciudad de México.<br><br>
        Todos se aplican de inmediato con recibo digital deducible.`,
      actions: [{ label: "🧾 Abrir Pago de Servicios", action: "App.openModal('servicesModal')" }]
    },

    // --- 8. SEGURIDAD Y SOPORTE ---
    {
      category: "seguridad",
      question: "¿Cómo funciona la seguridad biométrica Face ID?",
      keywords: ["face id", "biometrico", "seguridad cuenta", "rostro"],
      answer: `MIAUBANK utiliza autenticación biométrica de última generación. Operaciones críticas como visualizar el CVV dinámico o transferencias de alto valor solicitan confirmación facial instantánea.`
    },
    {
      category: "banco",
      question: "¿Dónde están las oficinas de MIAUBANK y cómo contacto a soporte?",
      keywords: ["oficinas", "sucursal", "contacto", "telefono", "soporte", "donde estan"],
      answer: `MIAUBANK es una banca privada 100% digital. Nuestra sede corporativa y salón de atención privada se encuentra en <strong>Av. Masaryk, Polanco, Ciudad de México</strong>. Para soporte directo cuentas con tu asesor personal y este asistente 24/7.`
    }
  ];

  /**
   * Normalización para comparación de texto
   */
  function normalizeText(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?¡!.,;:()\-_'"]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  /**
   * Motor de Búsqueda Determinista (Sin IA)
   */
  function findBestFaqMatch(userQuery) {
    const cleanQuery = normalizeText(userQuery);
    if (!cleanQuery) return null;

    // 1. Saludos
    if (/^(hola|buen(os|as)? (dias|tardes|noches)|hey|que tal|saludos)/.test(cleanQuery)) {
      return {
        answer: `¡Hola, Alejandro! 🐱👔 Soy <strong>MiauBot</strong>, la mascota y asesor bancario oficial de <strong>MIAUBANK</strong>.<br><br>
        Estoy programado para resolver al instante todas tus dudas sobre transferencias SPEI, CLABE, tus tarjetas Titanium y Aurora, rendimientos al 14.25%, divisas y pago de servicios.<br><br>
        ¿Sobre qué tema te gustaría consultar hoy?`,
        actions: [
          { label: "📚 Explorar Categorías", action: () => showCategoryMenu() },
          { label: "💰 Ver mi Saldo Actual", action: () => askQuestion("¿Cuál es mi saldo actual disponible?") }
        ]
      };
    }

    // 2. Agradecimientos y despedidas
    if (/^(gracias|muchas gracias|adios|bye|hasta luego|listo|perfecto|ok)/.test(cleanQuery)) {
      return {
        answer: `¡Un placer atenderte, Alejandro! 🐾 Recuerda que tu banca digital MIAUBANK está blindada y activa 24/7. ¡Que tengas un excelente día!`,
        actions: []
      };
    }

    // 3. Solicitud explícita de ver categorías o menú
    if (cleanQuery === "menu" || cleanQuery === "temas" || cleanQuery === "categorias" || cleanQuery === "ayuda" || cleanQuery.includes("que puedes hacer")) {
      return {
        answer: `Aquí tienes los temas principales sobre los que puedo informarte de inmediato:`,
        actions: KNOWLEDGE_CATEGORIES.map(cat => ({
          label: `${cat.name}`,
          action: () => showCategoryQuestions(cat.id)
        }))
      };
    }

    // 4. Búsqueda por coincidencia de palabras clave y similitud
    const queryTokens = cleanQuery.split(" ").filter(t => t.length > 2);
    let bestMatch = null;
    let highestScore = 0;

    for (const faq of BANKING_FAQS) {
      let score = 0;
      const normalizedQuestion = normalizeText(faq.question);

      // Coincidencia exacta o contenida
      if (cleanQuery.includes(normalizedQuestion) || normalizedQuestion.includes(cleanQuery)) {
        score += 20;
      }

      // Coincidencia con palabras clave definidas
      for (const kw of faq.keywords) {
        const normKw = normalizeText(kw);
        if (cleanQuery.includes(normKw)) {
          score += 8;
        }
      }

      // Coincidencia individual de palabras
      for (const token of queryTokens) {
        if (normalizedQuestion.includes(token)) score += 3;
        for (const kw of faq.keywords) {
          if (normalizeText(kw).includes(token)) score += 2;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }

    // Si encontramos una coincidencia con puntaje suficiente (> 5)
    if (bestMatch && highestScore >= 5) {
      let answerText = bestMatch.dynamic && bestMatch.getDynamicAnswer 
        ? bestMatch.getDynamicAnswer() 
        : bestMatch.answer;

      return {
        answer: answerText,
        actions: bestMatch.actions || []
      };
    }

    // 5. Fallback determinista amigable con opciones para no dejar al usuario varado
    return {
      answer: `No encontré una respuesta exacta para "<em>${escapeHTML(userQuery)}</em>", pero tengo información completa y verificada sobre cada sección del banco. Puedes tocar cualquiera de estos temas:`,
      actions: [
        { label: "💸 Transferencias SPEI", action: () => showCategoryQuestions("spei") },
        { label: "💳 Tarjetas y CVV", action: () => showCategoryQuestions("tarjetas") },
        { label: "🔢 CLABE y Depósitos", action: () => showCategoryQuestions("depositos") },
        { label: "📈 Rendimiento 14.25%", action: () => showCategoryQuestions("rendimiento") },
        { label: "💱 Divisas MXN/USD", action: () => showCategoryQuestions("divisas") }
      ]
    };
  }

  /**
   * Muestra las preguntas disponibles dentro de una categoría
   */
  function showCategoryQuestions(categoryId) {
    const category = KNOWLEDGE_CATEGORIES.find(c => c.id === categoryId);
    const faqs = BANKING_FAQS.filter(f => f.category === categoryId);

    if (!category || faqs.length === 0) return;

    addMessage("bot", `Preguntas frecuentes sobre <strong>${category.name}</strong>:`, faqs.map(f => ({
      label: f.question,
      action: () => askQuestion(f.question)
    })));
  }

  /**
   * Muestra el menú de todas las categorías disponibles
   */
  function showCategoryMenu() {
    addMessage("bot", `Selecciona un tema para ver sus preguntas frecuentes:`, KNOWLEDGE_CATEGORIES.map(c => ({
      label: `${c.icon} ${c.name}`,
      action: () => showCategoryQuestions(c.id)
    })));
  }

  /**
   * Agrega un mensaje a la conversación visual
   */
  function addMessage(sender, htmlContent, actions = []) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const timeStr = getFormattedTime();
    const msgEl = document.createElement("div");
    msgEl.className = `chat-msg ${sender}`;

    // Si es del bot, incluimos la mascota mini anime
    let avatarHtml = "";
    if (sender === "bot") {
      avatarHtml = `
        <div class="chat-msg-mascot-avatar" title="MiauBot">
          <img src="img/mascot.png" alt="Mascota MiauBot" class="mascot-img-thumb">
        </div>
      `;
    }

    msgEl.innerHTML = `
      <div class="chat-msg-row">
        ${avatarHtml}
        <div class="chat-bubble">
          ${htmlContent}
        </div>
      </div>
      <div class="chat-time">${timeStr}</div>
    `;

    // Vincular botones de acción interactivos
    if (actions && actions.length > 0) {
      const group = document.createElement("div");
      group.className = "chat-action-btn-group";
      actions.forEach(a => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-action-btn";
        btn.innerHTML = `
          <span>${a.label}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        `;
        btn.addEventListener("click", () => {
          if (typeof a.action === "function") {
            a.action();
          } else if (typeof a.action === "string") {
            try {
              new Function(a.action)();
            } catch (err) {
              console.error("Error al ejecutar acción del bot:", err);
            }
          }
        });
        group.appendChild(btn);
      });
      const bubble = msgEl.querySelector(".chat-bubble");
      if (bubble) bubble.appendChild(group);
    }

    container.appendChild(msgEl);
    scrollToBottom();
  }

  /**
   * Indicador visual de procesamiento (typing dots)
   */
  function setTyping(show) {
    isTyping = show;
    const container = document.getElementById("chatMessages");
    const existing = document.getElementById("chatTypingIndicator");

    if (show) {
      if (!existing && container) {
        const typingEl = document.createElement("div");
        typingEl.id = "chatTypingIndicator";
        typingEl.className = "chat-typing-row";
        typingEl.innerHTML = `
          <div class="chat-msg-mascot-avatar">
            <img src="img/mascot.png" alt="MiauBot" class="mascot-img-thumb">
          </div>
          <div class="chat-typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        `;
        container.appendChild(typingEl);
        scrollToBottom();
      }
    } else {
      if (existing) existing.remove();
    }
  }

  function scrollToBottom() {
    const container = document.getElementById("chatMessages");
    if (container) container.scrollTop = container.scrollHeight;
  }

  /**
   * Abrir / Cerrar ventana del bot
   */
  function toggleChat(forceOpen = null) {
    const windowEl = document.getElementById("chatbotWindow");
    const launcherEl = document.getElementById("chatbotLauncher");

    if (forceOpen !== null) {
      isOpen = forceOpen;
    } else {
      isOpen = !isOpen;
    }

    if (isOpen) {
      windowEl.classList.add("open");
      launcherEl.classList.add("active");
      const inputEl = document.getElementById("chatInput");
      if (inputEl) setTimeout(() => inputEl.focus(), 300);
      scrollToBottom();
    } else {
      windowEl.classList.remove("open");
      launcherEl.classList.remove("active");
    }
  }

  /**
   * Procesamiento de mensaje del usuario
   */
  async function handleSendMessage(text) {
    const query = text.trim();
    if (!query || isTyping) return;

    // 1. Mostrar mensaje del usuario
    addMessage("user", escapeHTML(query));

    const inputEl = document.getElementById("chatInput");
    if (inputEl) inputEl.value = "";

    setTyping(true);

    // Si en el futuro se activa la IA, se consulta aquí; de lo contrario, se usa el motor de reglas determinista
    if (AI_INTEGRATION_CONFIG.enabled) {
      const aiReply = await queryFutureAIProvider(query, "MIAUBANK banca privada");
      if (aiReply) {
        setTyping(false);
        addMessage("bot", aiReply);
        return;
      }
    }

    // Simulación de respuesta determinista rápida (350ms)
    setTimeout(() => {
      setTyping(false);
      const match = findBestFaqMatch(query);
      addMessage("bot", match.answer, match.actions);
    }, 380);
  }

  function askQuestion(query) {
    if (!isOpen) toggleChat(true);
    handleSendMessage(query);
  }

  /**
   * Restablece el chat con tarjeta de bienvenida y la mascota anime
   */
  function clearChat() {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    container.innerHTML = "";

    // Tarjeta de bienvenida con mascota oficial anime
    const welcomeHtml = `
      <div class="chat-mascot-welcome-card">
        <div class="mascot-badge-banner">
          <img src="img/mascot.png" alt="Mascota MiauBot Banquero" class="mascot-full-preview">
          <div class="mascot-welcome-text">
            <div class="mascot-name-tag">MiauBot · Banquero Privado</div>
            <div class="mascot-motto">Mascota oficial de MIAUBANK</div>
          </div>
        </div>
        <p style="margin-top: 10px; font-size: 0.85rem; line-height: 1.45;">
          ¡Bienvenido, Alejandro! 🐱👔 Estoy aquí para asistirte con respuestas inmediatas sobre todas las funciones de tu cuenta privada.
        </p>
      </div>
    `;

    addMessage("bot", welcomeHtml, [
      { label: "📚 Explorar Todos los Temas", action: () => showCategoryMenu() },
      { label: "💳 ¿Cómo transferir (SPEI)?", action: () => askQuestion("¿Cómo transfiero dinero por SPEI?") },
      { label: "🔢 Mi CLABE Interbancaria", action: () => askQuestion("¿Cuál es mi CLABE interbancaria?") }
    ]);
  }

  /**
   * Renderiza los chips de sugerencias rápidas
   */
  function renderSuggestions() {
    const scrollContainer = document.getElementById("chatSuggestionsScroll");
    if (!scrollContainer) return;
    scrollContainer.innerHTML = "";

    const chips = [
      { label: "📚 Todos los Temas", action: () => showCategoryMenu() },
      { label: "💸 ¿Cómo transferir SPEI?", action: () => askQuestion("¿Cómo transfiero dinero por SPEI?") },
      { label: "🔢 Mi CLABE", action: () => askQuestion("¿Cuál es mi CLABE interbancaria?") },
      { label: "💰 Mi Saldo Actual", action: () => askQuestion("¿Cuál es mi saldo actual disponible?") },
      { label: "🔒 Congelar Tarjeta", action: () => askQuestion("¿Cómo congelo o apago mi tarjeta?") },
      { label: "📈 Rendimiento 14.25%", action: () => askQuestion("¿Cómo funciona el rendimiento del 14.25% anual?") },
      { label: "💱 Cambiar a Dólares", action: () => askQuestion("¿Cómo cambio pesos mexicanos a dólares estadounidenses (FX)?") },
      { label: "🧾 Pagar Servicios", action: () => askQuestion("¿Qué servicios puedo pagar desde la banca?") },
      { label: "🏪 Depósitos en OXXO", action: () => askQuestion("¿Cómo deposito dinero en efectivo a mi cuenta?") }
    ];

    chips.forEach(c => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chat-suggestion-chip";
      chip.textContent = c.label;
      chip.addEventListener("click", c.action);
      scrollContainer.appendChild(chip);
    });
  }

  function init() {
    renderSuggestions();
    clearChat();

    const form = document.getElementById("chatbotForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("chatInput");
        if (input) handleSendMessage(input.value);
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        toggleChat(false);
      }
    });
  }

  return {
    init,
    toggleChat,
    askQuestion,
    clearChat,
    showCategoryMenu,
    showCategoryQuestions,
    AI_INTEGRATION_CONFIG
  };
})();

window.MiauBot = MiauBot;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", MiauBot.init);
} else {
  MiauBot.init();
}
