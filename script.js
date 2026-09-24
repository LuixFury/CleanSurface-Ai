
// ============================================================
// CleanSurface AI
// API + ESP32-S3-CAM + Histórico + Personalização
// ============================================================

const API_URL =
  "https://cleansurface-api.luizinfernando19.workers.dev";

let analiseAtualId = null;
let verificandoResultado = false;
let pollingESPAtivo = false;
let tempoLimiteAnalise = null;


// ============================================================
// PALETAS
// ============================================================

const PALETAS = {

  original: {
    primary: "#39e6a3",
    secondary: "#55cba0",
    background: "#07100f",
    card: "#0b1917",
    text: "#edf7f4"
  },

  azul: {
    primary: "#38bdf8",
    secondary: "#60a5fa",
    background: "#07111f",
    card: "#0b1728",
    text: "#edf7ff"
  },

  roxo: {
    primary: "#a78bfa",
    secondary: "#c4b5fd",
    background: "#100b1c",
    card: "#171025",
    text: "#f5f3ff"
  },

  vermelho: {
    primary: "#fb7185",
    secondary: "#fda4af",
    background: "#1a090c",
    card: "#241013",
    text: "#fff1f2"
  },

  laranja: {
    primary: "#fb923c",
    secondary: "#fdba74",
    background: "#1b0e06",
    card: "#26140a",
    text: "#fff7ed"
  }

};


// ============================================================
// TÍTULOS
// ============================================================

const titles = {

  dashboard: "Dashboard",
  monitoramento: "Monitoramento",
  alertas: "Alertas",
  historico: "Histórico",
  configuracoes: "Configurações",
  creditos: "Equipe / Créditos"

};


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  configurarNavegacao();

  carregarConfiguracoes();

  carregarPaleta();

  atualizarDashboard();

  criarBotaoNovaAnalise();

  iniciarMonitoramentoESP();

});


// ============================================================
// NAVEGAÇÃO
// ============================================================

function configurarNavegacao() {

  document.querySelectorAll(".nav-item").forEach(btn => {

    btn.addEventListener("click", () => {

      showPage(btn.dataset.page);

    });

  });

}


function showPage(id) {

  document
    .querySelectorAll(".page")
    .forEach(p => p.classList.remove("active-page"));

  const page = document.getElementById(id);

  if (page) {
    page.classList.add("active-page");
  }

  document
    .querySelectorAll(".nav-item")
    .forEach(b => {

      b.classList.toggle(
        "active",
        b.dataset.page === id
      );

    });

  const title =
    document.getElementById("page-title");

  if (title) {

    title.textContent =
      titles[id] || "CleanSurface AI";

  }

}


// ============================================================
// BOTÃO NOVA ANÁLISE
// ============================================================

function criarBotaoNovaAnalise() {

  const analisarBtn =
    document.getElementById("analisarBtn");

  if (!analisarBtn) return;

  if (document.getElementById("novaAnaliseBtn")) {
    return;
  }

  const botao =
    document.createElement("button");

  botao.id = "novaAnaliseBtn";

  botao.type = "button";

  botao.textContent =
    "🔄 NOVA ANÁLISE";

  botao.style.marginLeft = "10px";

  botao.style.display = "none";

  botao.addEventListener(
    "click",
    novaAnalise
  );

  analisarBtn.insertAdjacentElement(
    "afterend",
    botao
  );

}


// ============================================================
// MOSTRAR / ESCONDER BOTÃO NOVA ANÁLISE
// ============================================================

function mostrarBotaoNovaAnalise(mostrar) {

  const botao =
    document.getElementById("novaAnaliseBtn");

  if (!botao) return;

  botao.style.display =
    mostrar ? "inline-block" : "none";

}


// ============================================================
// INICIAR ANÁLISE
// ============================================================

async function iniciarAnalise() {

  const botao =
    document.getElementById("analisarBtn");

  const status =
    document.getElementById("statusAnalise");

  const email =
    document.getElementById("email")?.value.trim() ||
    localStorage.getItem("cleansurface_email") ||
    "";


  if (!email) {

    if (status) {

      status.textContent =
        "Digite seu e-mail em Configurações antes de iniciar.";

    }

    showPage("configuracoes");

    return;
  }


  // Cancela qualquer polling anterior

  verificandoResultado = false;

  clearTimeout(tempoLimiteAnalise);


  localStorage.setItem(
    "cleansurface_email",
    email
  );


  if (botao) {
    botao.disabled = true;
  }

  mostrarBotaoNovaAnalise(false);


  if (status) {

    status.textContent =
      "⏳ Solicitando análise...";

  }


  try {

    const resposta =
      await fetch(
        API_URL + "/iniciar-analise",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email
          })
        }
      );


    if (!resposta.ok) {

      throw new Error(
        "HTTP " + resposta.status
      );

    }


    const dados =
      await resposta.json();


    if (!dados.analise_id) {

      throw new Error(
        dados.mensagem ||
        "A API não retornou o ID da análise."
      );

    }


    // Novo ID

    analiseAtualId =
      String(dados.analise_id);


    localStorage.setItem(
      "cleansurface_analise_atual",
      analiseAtualId
    );


    // Reset da tela

    if (status) {

      status.textContent =
        "📷 Aguardando ESP32-S3-CAM...";

    }


    atualizarStatusDispositivo(
      "🟡 Aguardando análise"
    );


    const readingValue =
      document.getElementById(
        "reading-value"
      );

    const readingStatus =
      document.getElementById(
        "reading-status"
      );

    const readingDetail =
      document.getElementById(
        "reading-detail"
      );


    if (readingValue) {

      readingValue.textContent =
        "--";

    }


    if (readingStatus) {

      readingStatus.textContent =
        "AGUARDANDO LEITURA";

    }


    if (readingDetail) {

      readingDetail.textContent =
        "Aguardando a câmera visualizar a superfície.";

    }


    const badge =
      document.getElementById(
        "monitorBadge"
      );


    if (badge) {

      badge.textContent =
        "AGUARDANDO DISPOSITIVO";

      badge.className =
        "badge waiting";

    }


    showPage("monitoramento");


    // Começa a procurar o resultado

    verificandoResultado = true;

    verificarResultado();


    // Tempo máximo da análise

    tempoLimiteAnalise =
      setTimeout(() => {

        if (verificandoResultado) {

          finalizarSemResultado();

        }

      }, 30000);


  } catch (erro) {

    console.error(erro);


    if (status) {

      status.textContent =
        "❌ Não foi possível iniciar a análise.";

    }


    if (botao) {

      botao.disabled = false;

    }

  }

}


// ============================================================
// POLLING DO RESULTADO
// ============================================================

function iniciarPolling() {

  if (verificandoResultado) {
    return;
  }

  verificandoResultado = true;

  verificarResultado();

}


async function verificarResultado() {

  if (!analiseAtualId) {

    verificandoResultado = false;

    return;

  }


  if (!verificandoResultado) {
    return;
  }


  try {

    const resposta =
      await fetch(
        API_URL +
        "/resultado?analise_id=" +
        encodeURIComponent(
          analiseAtualId
        ),

        {
          cache: "no-store"
        }
      );


    if (resposta.ok) {

      const dados =
        await resposta.json();


      console.log(
        "Resultado recebido da API:",
        dados
      );


      if (
        dados.disponivel === true &&
        String(dados.analise_id) ===
        String(analiseAtualId)
      ) {

        processarResultado(dados);

        verificandoResultado = false;

        clearTimeout(
          tempoLimiteAnalise
        );

        return;

      }

    }

  } catch (erro) {

    console.log(
      "Aguardando resultado do ESP32...",
      erro
    );

  }


  if (!verificandoResultado) {
    return;
  }


  // Verifica limite de tempo

  if (
    tempoLimiteAnalise &&
    Date.now() >= tempoLimiteAnalise
  ) {

    finalizarSemResultado();

    return;

  }


  setTimeout(
    verificarResultado,
    3000
  );

}


// ============================================================
// PROCESSAR RESULTADO REAL
// ============================================================

function processarResultado(dados) {

  verificandoResultado = false;

  clearTimeout(
    tempoLimiteAnalise
  );


  const botao =
    document.getElementById(
      "analisarBtn"
    );

  const status =
    document.getElementById(
      "statusAnalise"
    );


  if (botao) {

    botao.disabled = false;

  }


  if (status) {

    status.textContent =
      "✅ Análise concluída.";

  }


  mostrarBotaoNovaAnalise(true);


  const valor =
    dados.valor ??
    dados.resultado ??
    "--";


  const detalhe =
    dados.detalhe ??
    "Resultado recebido do ESP32-S3-CAM.";


  const situacao =
    dados.status ??
    "concluido";


  const readingValue =
    document.getElementById(
      "reading-value"
    );

  const readingStatus =
    document.getElementById(
      "reading-status"
    );

  const readingDetail =
    document.getElementById(
      "reading-detail"
    );


  if (readingValue) {

    readingValue.textContent =
      valor;

  }


  if (readingStatus) {

    readingStatus.textContent =
      String(situacao)
        .toUpperCase();

  }


  if (readingDetail) {

    readingDetail.textContent =
      detalhe;

  }


  atualizarStatusDispositivo(
    "🟢 Conectado"
  );


  const last =
    document.getElementById(
      "last-result"
    );


  if (last) {

    last.textContent =
      valor;

  }


  salvarHistorico({

    analise_id:
      analiseAtualId,

    valor:
      valor,

    status:
      situacao,

    detalhe:
      detalhe,

    data:
      new Date()
        .toLocaleString("pt-BR")

  });


  atualizarHistorico();

  atualizarDashboard();

}


// ============================================================
// FINALIZAR SEM RESULTADO
// ============================================================

function finalizarSemResultado() {

  verificandoResultado = false;

  clearTimeout(
    tempoLimiteAnalise
  );


  const botao =
    document.getElementById(
      "analisarBtn"
    );

  const status =
    document.getElementById(
      "statusAnalise"
    );


  if (botao) {

    botao.disabled = false;

  }


  if (status) {

    status.textContent =
      "⚠️ Superfície não visualizada.";

  }


  mostrarBotaoNovaAnalise(true);


  const readingValue =
    document.getElementById(
      "reading-value"
    );

  const readingStatus =
    document.getElementById(
      "reading-status"
    );

  const readingDetail =
    document.getElementById(
      "reading-detail"
    );


  if (readingValue) {

    readingValue.textContent =
      "--";

  }


  if (readingStatus) {

    readingStatus.textContent =
      "SUPERFÍCIE NÃO VISUALIZADA";

  }


  if (readingDetail) {

    readingDetail.textContent =
      "O ESP32-S3-CAM não enviou nenhum resultado.";

  }


  atualizarStatusDispositivo(
    "🔴 Sem resultado"
  );


  const badge =
    document.getElementById(
      "monitorBadge"
    );


  if (badge) {

    badge.textContent =
      "SEM RESULTADO";

    badge.className =
      "badge bad";

  }


  salvarHistorico({

    analise_id:
      analiseAtualId,

    valor:
      "--",

    status:
      "nao_visualizada",

    detalhe:
      "Superfície não visualizada — nenhum resultado recebido do ESP32-S3-CAM.",

    data:
      new Date()
        .toLocaleString("pt-BR")

  });


  atualizarHistorico();

  atualizarDashboard();

}


// ============================================================
// NOVA ANÁLISE / REINICIAR
// ============================================================

function novaAnalise() {

  console.log(
    "Preparando nova análise..."
  );


  // Cancela análise anterior

  verificandoResultado = false;

  clearTimeout(
    tempoLimiteAnalise
  );


  analiseAtualId = null;


  localStorage.removeItem(
    "cleansurface_analise_atual"
  );


  const botao =
    document.getElementById(
      "analisarBtn"
    );

  const status =
    document.getElementById(
      "statusAnalise"
    );


  if (botao) {

    botao.disabled = false;

  }


  mostrarBotaoNovaAnalise(false);


  if (status) {

    status.textContent =
      "Pronto para uma nova análise.";

  }


  const readingValue =
    document.getElementById(
      "reading-value"
    );

  const readingStatus =
    document.getElementById(
      "reading-status"
    );

  const readingDetail =
    document.getElementById(
      "reading-detail"
    );


  if (readingValue) {

    readingValue.textContent =
      "--";

  }


  if (readingStatus) {

    readingStatus.textContent =
      "AGUARDANDO LEITURA";

  }


  if (readingDetail) {

    readingDetail.textContent =
      "Clique em INICIAR ANÁLISE para começar.";

  }


  const badge =
    document.getElementById(
      "monitorBadge"
    );


  if (badge) {

    badge.textContent =
      "PRONTO PARA NOVA ANÁLISE";

    badge.className =
      "badge waiting";

  }


  showPage(
    "monitoramento"
  );

}


// ============================================================
// STATUS DO DISPOSITIVO
// ============================================================

function atualizarStatusDispositivo(texto) {

  const el =
    document.getElementById(
      "device-status"
    );


  if (el) {

    el.textContent =
      texto;

  }

}


// ============================================================
// MONITORAMENTO REAL DO ESP32
// ============================================================

function iniciarMonitoramentoESP() {

  if (pollingESPAtivo) {
    return;
  }


  pollingESPAtivo = true;


  atualizarStatusESP();


  setInterval(
    atualizarStatusESP,
    5000
  );

}


async function atualizarStatusESP() {

  try {

    const resposta =
      await fetch(
        API_URL + "/esp/status",
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!resposta.ok) {

      throw new Error(
        "HTTP " +
        resposta.status
      );

    }


    const dados =
      await resposta.json();


    console.log(
      "Status ESP32:",
      dados
    );


    if (dados.conectado === true) {

      mostrarStatusConexao(
        true
      );

    } else {

      mostrarStatusConexao(
        false
      );

    }


  } catch (erro) {

    console.log(
      "Não foi possível consultar o ESP32.",
      erro
    );


    mostrarStatusConexao(
      false
    );

  }

}


// ============================================================
// MOSTRAR STATUS DE CONEXÃO
// ============================================================

function mostrarStatusConexao(conectado) {

  const device =
    document.getElementById(
      "device-status"
    );


  if (device) {

    if (conectado) {

      device.textContent =
        "🟢 Conectado";

    } else {

      device.textContent =
        "🔴 Desconectado";

    }

  }


  // Cria indicador adicional se não existir

  let indicador =
    document.getElementById(
      "espConnectionStatus"
    );


  if (!indicador) {

    const referencia =
      document.getElementById(
        "device-status"
      );

    if (!referencia) {
      return;
    }


    indicador =
      document.createElement(
        "span"
      );


    indicador.id =
      "espConnectionStatus";


    indicador.style.display =
      "inline-block";

    indicador.style.marginLeft =
      "10px";

    indicador.style.fontWeight =
      "600";


    referencia.insertAdjacentElement(
      "afterend",
      indicador
    );

  }


  if (conectado) {

    indicador.textContent =
      "🟢 ESP32 ONLINE";

    indicador.style.opacity =
      "1";

  } else {

    indicador.textContent =
      "🔴 ESP32 OFFLINE";

    indicador.style.opacity =
      "0.8";

  }

}


// ============================================================
// CONFIGURAÇÕES
// ============================================================

function saveSettings() {

  const email =
    document
      .getElementById("email")
      ?.value
      .trim() || "";


  const nivel =
    document
      .getElementById("nivelAlerta")
      ?.value || "70";


  localStorage.setItem(
    "cleansurface_email",
    email
  );


  localStorage.setItem(
    "cleansurface_nivel",
    nivel
  );


  const saved =
    document.getElementById(
      "saved"
    );


  if (saved) {

    saved.textContent =
      "✓ Configurações salvas.";

  }

}


function carregarConfiguracoes() {

  const email =
    localStorage.getItem(
      "cleansurface_email"
    ) || "";


  const nivel =
    localStorage.getItem(
      "cleansurface_nivel"
    ) || "70";


  const emailEl =
    document.getElementById(
      "email"
    );


  const nivelEl =
    document.getElementById(
      "nivelAlerta"
    );


  if (emailEl) {

    emailEl.value =
      email;

  }


  if (nivelEl) {

    nivelEl.value =
      nivel;

  }


  const atual =
    localStorage.getItem(
      "cleansurface_analise_atual"
    );


  if (atual) {

    analiseAtualId =
      atual;

  }

}


// ============================================================
// HISTÓRICO
// ============================================================

function salvarHistorico(item) {

  const lista =
    JSON.parse(
      localStorage.getItem(
        "cleansurface_historico"
      ) || "[]"
    );


  lista.unshift(
    item
  );


  localStorage.setItem(
    "cleansurface_historico",
    JSON.stringify(
      lista.slice(0, 50)
    )
  );

}


function carregarHistorico() {

  atualizarHistorico();

}


function atualizarHistorico() {

  const box =
    document.querySelector(
      ".table-placeholder"
    );


  if (!box) {
    return;
  }


  const lista =
    JSON.parse(
      localStorage.getItem(
        "cleansurface_historico"
      ) || "[]"
    );


  box.innerHTML = `

    <div>DATA E HORA</div>

    <div>RESULTADO</div>

    <div>NÍVEL</div>

    <div>STATUS</div>

  `;


  if (!lista.length) {

    box.innerHTML +=
      `<p>Nenhuma análise registrada ainda.</p>`;

    return;

  }


  lista.forEach(item => {

    box.innerHTML += `

      <div>
        ${escapeHtml(item.data)}
      </div>

      <div>
        ${escapeHtml(
          String(item.valor)
        )}
      </div>

      <div>
        --
      </div>

      <div>
        ${escapeHtml(
          String(item.status)
        )}
      </div>

    `;

  });

}


// ============================================================
// DASHBOARD
// ============================================================

function atualizarDashboard() {

  atualizarHistorico();


  const lista =
    JSON.parse(
      localStorage.getItem(
        "cleansurface_historico"
      ) || "[]"
    );


  const alertas =
    lista.filter(x => {

      const s =
        String(
          x.status || ""
        ).toLowerCase();


      return (
        s.includes("alert") ||
        s.includes("reprov") ||
        s.includes("contamin")
      );

    });


  const alertCount =
    document.getElementById(
      "alert-count"
    );


  if (alertCount) {

    alertCount.textContent =
      alertas.length;

  }


  if (lista.length) {

    const last =
      document.getElementById(
        "last-result"
      );


    if (last) {

      last.textContent =
        lista[0].valor;

    }

  }

}


// ============================================================
// SEGURANÇA HTML
// ============================================================

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// ============================================================
// PALETAS
// ============================================================

function aplicarPreset(nome) {

  const paleta =
    PALETAS[nome];


  if (!paleta) {
    return;
  }


  aplicarVariaveis(
    paleta
  );


  preencherControles(
    paleta
  );


  localStorage.setItem(
    "cleansurface_paleta",
    JSON.stringify(
      paleta
    )
  );


  const saved =
    document.getElementById(
      "paletteSaved"
    );


  if (saved) {

    saved.textContent =
      "✓ Paleta aplicada.";

  }

}


function aplicarVariaveis(paleta) {

  const root =
    document.documentElement;


  root.style.setProperty(
    "--primary",
    paleta.primary
  );


  root.style.setProperty(
    "--secondary",
    paleta.secondary
  );


  root.style.setProperty(
    "--background",
    paleta.background
  );


  root.style.setProperty(
    "--card",
    paleta.card
  );


  root.style.setProperty(
    "--text",
    paleta.text
  );

}


function preencherControles(p) {

  const mapa = {

    corPrincipal:
      ["primary", "hexPrincipal"],

    corSecundaria:
      ["secondary", "hexSecundaria"],

    corFundo:
      ["background", "hexFundo"],

    corCartao:
      ["card", "hexCartao"],

    corTexto:
      ["text", "hexTexto"]

  };


  Object.entries(mapa)
    .forEach(
      ([id, [chave, textId]]) => {

        const color =
          document.getElementById(
            id
          );


        const text =
          document.getElementById(
            textId
          );


        if (color) {

          color.value =
            p[chave];

        }


        if (text) {

          text.value =
            p[chave]
              .toUpperCase();

        }

      }
    );

}


function lerCor(
  id,
  hexId,
  fallback
) {

  const color =
    document.getElementById(
      id
    )?.value;


  const text =
    document.getElementById(
      hexId
    )?.value
    .trim();


  if (
    /^#[0-9A-Fa-f]{6}$/
      .test(text || "")
  ) {

    return text;

  }


  if (
    /^#[0-9A-Fa-f]{6}$/
      .test(color || "")
  ) {

    return color;

  }


  return fallback;

}


function aplicarCoresPersonalizadas() {

  const paleta = {

    primary:
      lerCor(
        "corPrincipal",
        "hexPrincipal",
        "#39e6a3"
      ),

    secondary:
      lerCor(
        "corSecundaria",
        "hexSecundaria",
        "#55cba0"
      ),

    background:
      lerCor(
        "corFundo",
        "hexFundo",
        "#07100f"
      ),

    card:
      lerCor(
        "corCartao",
        "hexCartao",
        "#0b1917"
      ),

    text:
      lerCor(
        "corTexto",
        "hexTexto",
        "#edf7f4"
      )

  };


  aplicarVariaveis(
    paleta
  );


  preencherControles(
    paleta
  );


  localStorage.setItem(
    "cleansurface_paleta",
    JSON.stringify(
      paleta
    )
  );


  const saved =
    document.getElementById(
      "paletteSaved"
    );


  if (saved) {

    saved.textContent =
      "✓ Cores personalizadas aplicadas.";

  }

}


function restaurarPaleta() {

  aplicarPreset(
    "original"
  );

}


function carregarPaleta() {

  try {

    const salva =
      JSON.parse(
        localStorage.getItem(
          "cleansurface_paleta"
        ) || "null"
      );


    if (salva) {

      aplicarVariaveis(
        salva
      );


      preencherControles(
        salva
      );

    }

  } catch (e) {

    console.log(
      "Paleta padrão utilizada."
    );

  }

}
