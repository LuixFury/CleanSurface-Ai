const API_BASE = "https://cleansurface-api.luizinfernando19.workers.dev";

const titles = {
  dashboard: "Dashboard",
  monitoramento: "Monitoramento",
  alertas: "Alertas",
  historico: "Histórico",
  configuracoes: "Configurações",
  creditos: "Créditos"
};

// ===============================
// NAVEGAÇÃO
// ===============================

function showPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active-page");
  });

  const pagina = document.getElementById(id);

  if (pagina) {
    pagina.classList.add("active-page");
  }

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === id);
  });

  const titulo = document.getElementById("page-title");

  if (titulo) {
    titulo.textContent = titles[id] || "CleanSurface AI";
  }
}

// ===============================
// CONFIGURAÇÕES
// ===============================

function carregarConfiguracoes() {
  try {
    const dados = localStorage.getItem("cleansurface_config");

    if (!dados) return;

    const config = JSON.parse(dados);

    const email = document.getElementById("email");
    const nivel = document.getElementById("nivelAlerta");

    if (email && config.email) {
      email.value = config.email;
    }

    if (nivel && config.nivel_alerta !== undefined) {
      nivel.value = config.nivel_alerta;
    }
  } catch (erro) {
    console.error("Erro ao carregar configurações:", erro);
  }
}

function saveSettings() {
  const email = document.getElementById("email");
  const nivel = document.getElementById("nivelAlerta");
  const saved = document.getElementById("saved");

  const emailValue = email ? email.value.trim() : "";
  const nivelValue = nivel ? Number(nivel.value) : 70;

  if (emailValue && !emailValue.includes("@")) {
    if (saved) {
      saved.textContent = "❌ Digite um e-mail válido.";
    }
    return;
  }

  const config = {
    email: emailValue,
    nivel_alerta: nivelValue
  };

  localStorage.setItem(
    "cleansurface_config",
    JSON.stringify(config)
  );

  if (saved) {
    saved.textContent = "✓ Configurações salvas.";
  }
}

// ===============================
// ATUALIZAÇÃO DA INTERFACE
// ===============================

function atualizarStatus(texto) {
  const elemento = document.getElementById("statusAnalise");

  if (elemento) {
    elemento.textContent = texto;
  }
}

function atualizarDispositivo(texto) {
  const elemento = document.getElementById("device-status");

  if (elemento) {
    elemento.textContent = texto;
  }
}

function atualizarResultado(resultado) {
  if (!resultado) return;

  const valor = resultado.valor || "—";
  const status = resultado.status || "—";
  const detalhe = resultado.detalhe || "";

  const readingValue = document.getElementById("reading-value");
  const readingStatus = document.getElementById("reading-status");
  const readingDetail = document.getElementById("reading-detail");
  const lastResult = document.getElementById("last-result");

  if (readingValue) {
    readingValue.textContent = valor;
  }

  if (readingStatus) {
    readingStatus.textContent = status;
  }

  if (readingDetail) {
    readingDetail.textContent = detalhe;
  }

  if (lastResult) {
    lastResult.textContent = valor;
  }

  const alertCount = document.getElementById("alert-count");

  if (alertCount) {
    if (status.toUpperCase() === "APROVADO") {
      alertCount.textContent = "0";
    } else {
      alertCount.textContent = "1";
    }
  }
}

// ===============================
// PEGAR RESULTADO DA API
// ===============================

async function buscarResultado(analiseId) {
  try {
    const resposta = await fetch(
      `${API_BASE}/resultado?analise_id=${encodeURIComponent(analiseId)}`,
      {
        method: "GET",
        cache: "no-store"
      }
    );

    if (!resposta.ok) {
      throw new Error("Erro HTTP " + resposta.status);
    }

    const dados = await resposta.json();

    /*
      A API pode retornar o resultado diretamente
      ou dentro de "resultado".
    */

    let resultado = dados.resultado || dados;

    if (
      resultado &&
      resultado.analise_id &&
      Number(resultado.analise_id) !== Number(analiseId)
    ) {
      return null;
    }

    if (!resultado || !resultado.status) {
      return null;
    }

    return resultado;

  } catch (erro) {
    console.error("Erro ao buscar resultado:", erro);
    return null;
  }
}

// ===============================
// ESPERAR RESULTADO
// ===============================

async function esperarResultado(analiseId) {
  const maxTentativas = 20;

  for (let tentativa = 0; tentativa < maxTentativas; tentativa++) {

    const resultado = await buscarResultado(analiseId);

    if (resultado) {
      atualizarResultado(resultado);

      atualizarStatus(
        "⚠️ Demonstração concluída. Resultado recebido pela API."
      );

      atualizarDispositivo("API online");

      return resultado;
    }

    await new Promise(resolve => {
      setTimeout(resolve, 3000);
    });
  }

  atualizarStatus(
    "⏳ A análise ainda está aguardando resultado."
  );

  atualizarDispositivo("Aguardando resultado");

  return null;
}

// ===============================
// INICIAR ANÁLISE
// ===============================

async function iniciarAnalise() {

  const botao = document.getElementById("analisarBtn");

  const emailInput = document.getElementById("email");
  const nivelInput = document.getElementById("nivelAlerta");

  const email = emailInput
    ? emailInput.value.trim()
    : "";

  const nivelAlerta = nivelInput
    ? Number(nivelInput.value)
    : 70;

  if (!email) {
    atualizarStatus(
      "❌ Informe seu e-mail nas configurações antes de iniciar."
    );

    showPage("configuracoes");
    return;
  }

  if (!email.includes("@")) {
    atualizarStatus(
      "❌ Informe um e-mail válido."
    );

    showPage("configuracoes");
    return;
  }

  if (botao) {
    botao.disabled = true;
    botao.textContent = "⏳ ANALISANDO...";
  }

  atualizarStatus(
    "🔍 Solicitando análise..."
  );

  atualizarDispositivo(
    "Conectando à API..."
  );

  try {

    const resposta = await fetch(
      `${API_BASE}/iniciar-analise`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email: email,
          nivel_alerta: nivelAlerta,
          canal: "email"
        })
      }
    );

    if (!resposta.ok) {
      throw new Error(
        "Erro HTTP " + resposta.status
      );
    }

    const dados = await resposta.json();

    console.log(
      "Resposta /iniciar-analise:",
      dados
    );

    if (!dados.analise_id) {
      throw new Error(
        "A API não retornou o ID da análise."
      );
    }

    const analiseId = dados.analise_id;

    atualizarStatus(
      `🔍 Análise #${analiseId} iniciada.`
    );

    atualizarDispositivo(
      "Aguardando resultado..."
    );

    await esperarResultado(analiseId);

  } catch (erro) {

    console.error(
      "Erro ao iniciar análise:",
      erro
    );

    atualizarStatus(
      "❌ Erro ao conectar com a API."
    );

    atualizarDispositivo(
      "Erro de conexão"
    );

  } finally {

    if (botao) {
      botao.disabled = false;
      botao.textContent = "🔍 INICIAR ANÁLISE";
    }
  }
}

// ===============================
// INICIALIZAÇÃO
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    // Navegação
    document.querySelectorAll(".nav-item").forEach(btn => {

      btn.addEventListener(
        "click",
        () => {
          showPage(btn.dataset.page);
        }
      );

    });

    // Botão de análise
    const botao = document.getElementById(
      "analisarBtn"
    );

    if (botao) {

      botao.addEventListener(
        "click",
        iniciarAnalise
      );

    } else {

      console.warn(
        "Botão #analisarBtn não encontrado."
      );

    }

    // Configurações
    carregarConfiguracoes();

    // Estado inicial
    atualizarDispositivo(
      "API online"
    );

    atualizarStatus(
      "Pronto para iniciar análise."
    );

  }
);
