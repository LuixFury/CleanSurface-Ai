const API_URL =
  "https://cleansurface-api.luizinfernando19.workers.dev";

let analiseAtualId = null;
let pollingAtivo = false;
let analiseFinalizada = false;
let tempoLimiteAnalise = null;


// ===============================
// INICIAR ANÁLISE
// ===============================

async function iniciarAnalise() {

  const btn = document.getElementById("analisarBtn");
  const status = document.getElementById("statusAnalise");

  const email =
    document.getElementById("email")?.value.trim() ||
    localStorage.getItem("cleansurface_email") ||
    "";

  if (!email) {
    status.textContent =
      "Digite seu e-mail em Configurações antes de iniciar.";

    if (typeof showPage === "function") {
      showPage("configuracoes");
    }

    return;
  }

  localStorage.setItem("cleansurface_email", email);

  // Cancela análise anterior
  pollingAtivo = false;
  analiseFinalizada = false;

  clearTimeout(tempoLimiteAnalise);

  btn.disabled = true;

  status.textContent = "⏳ Solicitando análise...";

  try {

    const resposta = await fetch(
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
      throw new Error("HTTP " + resposta.status);
    }

    const data = await resposta.json();

    if (!data.analise_id) {
      throw new Error(
        data.mensagem || "ID da análise não recebido."
      );
    }

    // Novo ID
    analiseAtualId = String(data.analise_id);

    localStorage.setItem(
      "cleansurface_analise_atual",
      analiseAtualId
    );

    // Reset da tela
    status.textContent =
      "📷 Aguardando ESP32-S3-CAM...";

    const device = document.getElementById("device-status");

    if (device) {
      device.textContent = "Aguardando";
    }

    const readingValue =
      document.getElementById("reading-value");

    const readingStatus =
      document.getElementById("reading-status");

    const readingDetail =
      document.getElementById("reading-detail");

    if (readingValue) {
      readingValue.textContent = "--";
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
      document.getElementById("monitorBadge");

    if (badge) {
      badge.textContent =
        "AGUARDANDO DISPOSITIVO";

      badge.className =
        "badge waiting";
    }

    if (typeof showPage === "function") {
      showPage("monitoramento");
    }

    // Começa a procurar o resultado
    pollingAtivo = true;

    verificarResultado();

    // Limite de 30 segundos
    tempoLimiteAnalise = setTimeout(() => {

      if (!analiseFinalizada) {
        finalizarSemResultado();
      }

    }, 30000);

  } catch (erro) {

    console.error(erro);

    status.textContent =
      "❌ Não foi possível iniciar a análise.";

    btn.disabled = false;
  }
}


// ===============================
// VERIFICAR RESULTADO
// ===============================

async function verificarResultado() {

  if (!pollingAtivo || !analiseAtualId) {
    return;
  }

  if (analiseFinalizada) {
    return;
  }

  try {

    const resposta = await fetch(
      API_URL +
      "/resultado?analise_id=" +
      encodeURIComponent(analiseAtualId),
      {
        method: "GET",
        cache: "no-store"
      }
    );

    if (resposta.ok) {

      const data = await resposta.json();

      console.log("Resposta da API:", data);

      if (
        data.disponivel === true &&
        String(data.analise_id) ===
        String(analiseAtualId)
      ) {

        processarResultado(data);

        pollingAtivo = false;

        clearTimeout(tempoLimiteAnalise);

        return;
      }
    }

  } catch (erro) {

    console.log(
      "Aguardando resultado do ESP32...",
      erro
    );
  }

  // Continua procurando
  if (
    pollingAtivo &&
    !analiseFinalizada
  ) {

    setTimeout(
      verificarResultado,
      3000
    );
  }
}


// ===============================
// SEM RESULTADO
// ===============================

async function finalizarSemResultado() {

  if (analiseFinalizada) {
    return;
  }

  analiseFinalizada = true;
  pollingAtivo = false;

  clearTimeout(tempoLimiteAnalise);

  const btn =
    document.getElementById("analisarBtn");

  const status =
    document.getElementById("statusAnalise");

  if (btn) {
    btn.disabled = false;
  }

  if (status) {
    status.textContent =
      "⚠️ Superfície não visualizada.";
  }

  const device =
    document.getElementById("device-status");

  if (device) {
    device.textContent =
      "Sem resultado";
  }

  const readingValue =
    document.getElementById("reading-value");

  const readingStatus =
    document.getElementById("reading-status");

  const readingDetail =
    document.getElementById("reading-detail");

  if (readingValue) {
    readingValue.textContent = "--";
  }

  if (readingStatus) {
    readingStatus.textContent =
      "SUPERFÍCIE NÃO VISUALIZADA";
  }

  if (readingDetail) {
    readingDetail.textContent =
      "O ESP32-S3-CAM não enviou nenhum resultado.";
  }

  const badge =
    document.getElementById("monitorBadge");

  if (badge) {

    badge.textContent =
      "SEM RESULTADO";

    badge.className =
      "badge bad";
  }

  console.log(
    "Análise " +
    analiseAtualId +
    " terminou sem resultado."
  );
}


// ===============================
// PROCESSAR RESULTADO
// ===============================

function processarResultado(data) {

  if (analiseFinalizada) {
    return;
  }

  analiseFinalizada = true;
  pollingAtivo = false;

  clearTimeout(tempoLimiteAnalise);

  const btn =
    document.getElementById("analisarBtn");

  if (btn) {
    btn.disabled = false;
  }

  console.log(
    "Resultado recebido:",
    data
  );

  const valor =
    data.valor ??
    data.resultado ??
    data.confidence ??
    "--";

  const statusResultado =
    data.status ??
    "desconhecido";

  const detalhe =
    data.detalhe ??
    data.mensagem ??
    "";

  const readingValue =
    document.getElementById("reading-value");

  const readingStatus =
    document.getElementById("reading-status");

  const readingDetail =
    document.getElementById("reading-detail");

  const device =
    document.getElementById("device-status");

  const badge =
    document.getElementById("monitorBadge");

  if (readingValue) {

    if (
      typeof valor === "number"
    ) {

      readingValue.textContent =
        valor.toFixed(2) + "%";

    } else {

      readingValue.textContent =
        valor;
    }
  }

  if (readingStatus) {

    readingStatus.textContent =
      String(statusResultado)
        .toUpperCase();
  }

  if (readingDetail) {

    readingDetail.textContent =
      detalhe;
  }

  if (device) {
    device.textContent =
      "Conectado";
  }

  if (badge) {

    badge.textContent =
      "ANÁLISE CONCLUÍDA";

    badge.className =
      "badge good";
  }

  console.log(
    "Análise concluída:",
    analiseAtualId
  );
}


// ===============================
// NOVA ANÁLISE
// ===============================

function novaAnalise() {

  analiseFinalizada = false;
  pollingAtivo = false;

  clearTimeout(tempoLimiteAnalise);

  analiseAtualId = null;

  const btn =
    document.getElementById("analisarBtn");

  if (btn) {
    btn.disabled = false;
  }

  const status =
    document.getElementById("statusAnalise");

  if (status) {
    status.textContent =
      "Pronto para uma nova análise.";
  }

  const readingValue =
    document.getElementById("reading-value");

  const readingStatus =
    document.getElementById("reading-status");

  const readingDetail =
    document.getElementById("reading-detail");

  if (readingValue) {
    readingValue.textContent = "--";
  }

  if (readingStatus) {
    readingStatus.textContent =
      "AGUARDANDO LEITURA";
  }

  if (readingDetail) {
    readingDetail.textContent =
      "Clique em INICIAR ANÁLISE.";
  }
}
