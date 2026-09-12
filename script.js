const API_URL = "https://cleansurface-api.luizinfernando19.workers.dev";

const EMAIL_API =
  "https://script.google.com/macros/s/AKfycbztIf_nTXIvrN3hSTbwtHR_l56JVKWsSYqww5qsgbDYv44uTSXoVgWQEPGvX0GTZbpU/exec";


// ===============================
// NAVEGAÇÃO
// ===============================

function showPage(pageName) {

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active-page");
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });

  const page = document.getElementById(pageName);

  if (page) {
    page.classList.add("active-page");
  }

  const button = document.querySelector(
    `.nav-item[data-page="${pageName}"]`
  );

  if (button) {
    button.classList.add("active");
  }

  const titles = {
    dashboard: "Dashboard",
    monitoramento: "Monitoramento",
    alertas: "Alertas",
    historico: "Histórico",
    configuracoes: "Configurações"
  };

  const title = document.getElementById("page-title");

  if (title) {
    title.textContent = titles[pageName] || "Dashboard";
  }
}


// Configura os botões do menu
document.querySelectorAll(".nav-item").forEach(button => {

  button.addEventListener("click", function () {

    const pageName = this.getAttribute("data-page");

    showPage(pageName);

  });

});


// ===============================
// CONFIGURAÇÕES
// ===============================

const canalNotificacao =
  document.getElementById("canalNotificacao");

const campoWhatsapp =
  document.getElementById("campoWhatsapp");

const campoEmail =
  document.getElementById("campoEmail");

const whatsapp =
  document.getElementById("whatsapp");

const email =
  document.getElementById("email");

const nivelAlerta =
  document.getElementById("nivelAlerta");


// Mostrar/esconder campos
function atualizarCamposNotificacao() {

  if (!canalNotificacao) return;

  const canal = canalNotificacao.value;

  if (canal === "whatsapp") {

    campoWhatsapp.style.display = "block";
    campoEmail.style.display = "none";

  }

  else if (canal === "email") {

    campoWhatsapp.style.display = "none";
    campoEmail.style.display = "block";

  }

  else if (canal === "ambos") {

    campoWhatsapp.style.display = "block";
    campoEmail.style.display = "block";

  }

}


if (canalNotificacao) {

  canalNotificacao.addEventListener(
    "change",
    atualizarCamposNotificacao
  );

}


// ===============================
// CARREGAR CONFIGURAÇÕES
// ===============================

function carregarConfiguracoes() {

  const configuracaoSalva =
    localStorage.getItem("cleansurface_config");

  if (!configuracaoSalva) {

    atualizarCamposNotificacao();

    return;
  }

  try {

    const config =
      JSON.parse(configuracaoSalva);

    if (canalNotificacao && config.canal) {
      canalNotificacao.value = config.canal;
    }

    if (whatsapp && config.whatsapp) {
      whatsapp.value = config.whatsapp;
    }

    if (email && config.email) {
      email.value = config.email;
    }

    if (nivelAlerta && config.nivel) {
      nivelAlerta.value = config.nivel;
    }

  } catch (erro) {

    console.error(
      "Erro ao carregar configurações:",
      erro
    );

  }

  atualizarCamposNotificacao();

}


// ===============================
// SALVAR CONFIGURAÇÕES
// ===============================

function saveSettings() {

  const canal =
    canalNotificacao.value;

  const numeroWhatsapp =
    whatsapp.value.trim();

  const enderecoEmail =
    email.value.trim();

  const nivel =
    nivelAlerta.value;


  // Validação WhatsApp
  if (
    (canal === "whatsapp" || canal === "ambos") &&
    !numeroWhatsapp
  ) {

    alert(
      "Informe o número do WhatsApp."
    );

    return;
  }


  // Validação E-mail
  if (
    (canal === "email" || canal === "ambos") &&
    !enderecoEmail
  ) {

    alert(
      "Informe o e-mail."
    );

    return;
  }


  const configuracao = {

    canal: canal,

    whatsapp: numeroWhatsapp,

    email: enderecoEmail,

    nivel: nivel

  };


  localStorage.setItem(
    "cleansurface_config",
    JSON.stringify(configuracao)
  );


  const saved =
    document.getElementById("saved");

  if (saved) {

    saved.textContent =
      "✓ Configurações salvas!";

    setTimeout(() => {

      saved.textContent = "";

    }, 3000);

  }

}


// ===============================
// INICIAR ANÁLISE
// ===============================

async function iniciarAnalise() {

  const botao =
    document.getElementById("analisarBtn");

  const status =
    document.getElementById("statusAnalise");


  // Recupera configurações
  let config = {};

  try {

    config = JSON.parse(
      localStorage.getItem(
        "cleansurface_config"
      ) || "{}"
    );

  } catch (erro) {

    config = {};

  }


  // Se não houver configuração,
  // abre a página de configurações
  if (!config.canal) {

    alert(
      "Configure primeiro como deseja receber o resultado."
    );

    showPage("configuracoes");

    return;
  }


  // Verifica e-mail quando necessário
  if (
    (config.canal === "email" ||
     config.canal === "ambos") &&
    !config.email
  ) {

    alert(
      "Informe o e-mail nas Configurações."
    );

    showPage("configuracoes");

    return;
  }


  try {

    if (botao) {

      botao.disabled = true;

      botao.textContent =
        "⏳ SOLICITANDO ANÁLISE...";

    }


    if (status) {

      status.textContent =
        "Enviando solicitação para o sistema...";

    }


    // Solicita análise ao Worker
    const resposta =
      await fetch(
        API_URL + "/iniciar-analise",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            canal: config.canal,

            whatsapp: config.whatsapp || "",

            email: config.email || "",

            nivel: config.nivel || 70

          })
        }
      );


    const dados =
      await resposta.json();


    if (!resposta.ok || !dados.sucesso) {

      throw new Error(
        dados.erro ||
        "Não foi possível iniciar a análise."
      );

    }


    if (status) {

      status.textContent =
        "✓ Solicitação enviada. Aguardando ESP32-S3-CAM...";

    }


    const deviceStatus =
      document.getElementById(
        "device-status"
      );

    if (deviceStatus) {

      deviceStatus.textContent =
        "Aguardando ESP32";

    }


    // Começa a procurar resultado
    verificarResultado(
      dados.analise_id,
      config
    );


  } catch (erro) {

    console.error(erro);


    if (status) {

      status.textContent =
        "❌ Erro ao iniciar análise.";

    }

    alert(
      "Erro ao iniciar análise:\n\n" +
      erro.message
    );


    if (botao) {

      botao.disabled = false;

      botao.textContent =
        "🔍 INICIAR ANÁLISE";

    }

  }

}


// ===============================
// VERIFICAR RESULTADO
// ===============================

let verificandoResultado = false;


async function verificarResultado(
  analiseId,
  config
) {

  if (verificandoResultado) return;

  verificandoResultado = true;


  const status =
    document.getElementById(
      "statusAnalise"
    );

  const botao =
    document.getElementById(
      "analisarBtn"
    );


  const intervalo =
    setInterval(async () => {

      try {

        const resposta =
          await fetch(
            API_URL + "/resultado"
          );


        const dados =
          await resposta.json();


        if (
          dados.disponivel &&
          Number(dados.analise_id) ===
          Number(analiseId)
        ) {

          clearInterval(intervalo);

          verificandoResultado = false;


          mostrarResultado(dados);


          // Enviar e-mail
          if (
            (config.canal === "email" ||
             config.canal === "ambos") &&
            config.email
          ) {

            enviarEmail(
              config.email,
              dados
            );

          }


          if (botao) {

            botao.disabled = false;

            botao.textContent =
              "🔍 INICIAR ANÁLISE";

          }

        }

      } catch (erro) {

        console.error(
          "Erro verificando resultado:",
          erro
        );

      }

    }, 3000);

}


// ===============================
// MOSTRAR RESULTADO
// ===============================

function mostrarResultado(dados) {

  const status =
    document.getElementById(
      "statusAnalise"
    );

  const deviceStatus =
    document.getElementById(
      "device-status"
    );

  const lastResult =
    document.getElementById(
      "last-result"
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


  if (status) {

    status.textContent =
      "✓ Análise concluída";

  }


  if (deviceStatus) {

    deviceStatus.textContent =
      "Online";

  }


  if (lastResult) {

    lastResult.textContent =
      dados.valor || "Sem resultado";

  }


  if (readingStatus) {

    readingStatus.textContent =
      dados.status ||
      "Resultado recebido";

  }


  if (readingDetail) {

    readingDetail.textContent =
      dados.detalhe ||
      "Análise concluída pelo ESP32-S3-CAM.";

  }


  if (readingValue) {

    const numero =
      extrairNumero(dados.valor);

    if (numero !== null) {

      readingValue.textContent =
        numero;

    } else {

      readingValue.textContent =
        "--";

    }

  }


  // Abre monitoramento automaticamente
  showPage("monitoramento");

}


// ===============================
// EXTRAIR NÚMERO
// ===============================

function extrairNumero(valor) {

  if (!valor) return null;

  const texto =
    String(valor);

  const encontrado =
    texto.match(
      /(\d+(?:[.,]\d+)?)/
    );

  if (!encontrado) {

    return null;

  }

  return encontrado[1]
    .replace(",", ".");

}


// ===============================
// ENVIAR E-MAIL
// ===============================

async function enviarEmail(
  enderecoEmail,
  dados
) {

  try {

    const resposta =
      await fetch(
        EMAIL_API,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            email: enderecoEmail,

            analise_id:
              dados.analise_id,

            valor:
              dados.valor ||
              "Não informado",

            status:
              dados.status ||
              "Não informado",

            detalhe:
              dados.detalhe ||
              "Nenhum detalhe informado"

          })

        }
      );


    const retorno =
      await resposta.json();


    console.log(
      "E-mail:",
      retorno
    );


  } catch (erro) {

    console.error(
      "Erro ao enviar e-mail:",
      erro
    );

  }

}


// ===============================
// INICIALIZAÇÃO
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    carregarConfiguracoes();

    showPage("dashboard");

  }
);
