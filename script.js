const API_URL =
  "https://cleansurface-api.luizinfernando19.workers.dev";

let consultaResultado = null;


// ===============================
// INICIAR ANÁLISE
// ===============================

async function iniciarAnalise() {

  const botao = document.getElementById("analisarBtn");
  const status = document.getElementById("statusAnalise");

  if (botao) {
    botao.disabled = true;
    botao.textContent = "⏳ ENVIANDO...";
  }

  if (status) {
    status.textContent = "Enviando solicitação...";
  }

  try {

    const resposta = await fetch(
      API_URL + "/iniciar-analise",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (!resposta.ok) {
      throw new Error("Erro HTTP: " + resposta.status);
    }

    const dados = await resposta.json();

    console.log("Análise criada:", dados);

    if (dados.sucesso) {

      if (status) {
        status.textContent =
          "⏳ Aguardando ESP32-S3-CAM";
      }

      iniciarConsultaResultado();

    } else {

      if (status) {
        status.textContent =
          "❌ Não foi possível iniciar a análise.";
      }

    }

  } catch (erro) {

    console.error("Erro:", erro);

    if (status) {
      status.textContent =
        "❌ Erro de conexão com a API.";
    }

    if (botao) {
      botao.disabled = false;
      botao.textContent = "🔍 INICIAR ANÁLISE";
    }
  }
}


// ===============================
// CONSULTAR RESULTADO
// ===============================

function iniciarConsultaResultado() {

  // Evita criar vários timers
  if (consultaResultado) {
    clearInterval(consultaResultado);
  }

  // Verifica imediatamente
  verificarResultado();

  // Depois verifica a cada 3 segundos
  consultaResultado = setInterval(
    verificarResultado,
    3000
  );
}


async function verificarResultado() {

  try {

    const resposta = await fetch(
      API_URL + "/resultado"
    );

    if (!resposta.ok) {
      throw new Error("Erro HTTP: " + resposta.status);
    }

    const dados = await resposta.json();

    console.log("Resultado recebido:", dados);

    // Ainda não existe resultado
    if (!dados.disponivel) {
      return;
    }

    // Resultado encontrado
    receberResultado(dados);

    // Para de consultar
    if (consultaResultado) {
      clearInterval(consultaResultado);
      consultaResultado = null;
    }

  } catch (erro) {

    console.error(
      "Erro ao consultar resultado:",
      erro
    );

  }
}


// ===============================
// MOSTRAR RESULTADO
// ===============================

function receberResultado(dados) {

  const statusAnalise =
    document.getElementById("statusAnalise");

  const resultado =
    document.getElementById("last-result");

  const readingValue =
    document.getElementById("reading-value");

  const readingStatus =
    document.getElementById("reading-status");

  const readingDetail =
    document.getElementById("reading-detail");

  const botao =
    document.getElementById("analisarBtn");


  // Status principal
  if (statusAnalise) {
    statusAnalise.textContent =
      "✅ Análise concluída";
  }


  // Último resultado
  if (resultado) {
    resultado.textContent =
      dados.valor || "Resultado recebido";
  }


  // Valor da análise
  if (readingValue) {
    readingValue.textContent =
      dados.valor || "--";
  }


  // Status
  if (readingStatus) {
    readingStatus.textContent =
      dados.status || "--";
  }


  // Detalhes
  if (readingDetail) {
    readingDetail.textContent =
      dados.detalhe || "--";
  }


  // Libera o botão novamente
  if (botao) {
    botao.disabled = false;
    botao.textContent =
      "🔍 INICIAR ANÁLISE";
  }

  console.log(
    "Análise exibida no site:",
    dados
  );
}


// ===============================
// NAVEGAÇÃO DO MENU
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const links =
      document.querySelectorAll(
        ".sidebar a, .menu-item"
      );

    links.forEach(function (link) {

      link.addEventListener(
        "click",
        function (event) {

          const destino =
            link.getAttribute("href");

          if (
            destino &&
            destino.startsWith("#")
          ) {

            event.preventDefault();

            const elemento =
              document.querySelector(destino);

            if (elemento) {

              elemento.scrollIntoView({
                behavior: "smooth"
              });

            }
          }

        }
      );

    });

  }
);


// ===============================
// CONFIGURAÇÕES
// ===============================

function saveSettings() {

  const mensagem =
    document.getElementById(
      "settings-message"
    );

  if (mensagem) {

    mensagem.textContent =
      "✅ Configurações salvas.";

    setTimeout(function () {

      mensagem.textContent = "";

    }, 3000);

  }

}
