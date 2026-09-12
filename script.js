const API_URL = "https://cleansurface-api.luizinfernando19.workers.dev";

let analiseAtual = null;
let intervaloResultado = null;


// ===============================
// NAVEGAÇÃO
// ===============================

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");

const titulos = {
    dashboard: "Dashboard",
    monitoramento: "Monitoramento",
    alertas: "Alertas",
    historico: "Histórico",
    configuracoes: "Configurações"
};

navItems.forEach(item => {

    item.addEventListener("click", () => {

        const pagina = item.dataset.page;

        navItems.forEach(nav => nav.classList.remove("active"));
        item.classList.add("active");

        pages.forEach(page => {
            page.classList.remove("active");
        });

        const paginaSelecionada = document.getElementById(pagina);

        if (paginaSelecionada) {
            paginaSelecionada.classList.add("active");
        }

        if (pageTitle) {
            pageTitle.textContent = titulos[pagina] || "Dashboard";
        }

    });

});


// ===============================
// ELEMENTOS
// ===============================

const canalNotificacao = document.getElementById("canalNotificacao");
const campoWhatsapp = document.getElementById("campoWhatsapp");
const campoEmail = document.getElementById("campoEmail");

const whatsappInput = document.getElementById("whatsapp");
const emailInput = document.getElementById("email");
const nivelAlertaInput = document.getElementById("nivelAlerta");

const iniciarBtn = document.getElementById("iniciarAnalise");

const deviceStatus = document.getElementById("device-status");
const lastResult = document.getElementById("last-result");
const alertCount = document.getElementById("alert-count");

const readingValue = document.getElementById("reading-value");
const readingStatus = document.getElementById("reading-status");
const readingDetail = document.getElementById("reading-detail");

const savedMessage = document.getElementById("saved");


// ===============================
// CONFIGURAÇÃO
// ===============================

function carregarConfiguracao() {

    const configSalva =
        localStorage.getItem("cleansurface_config");

    if (!configSalva) return;

    try {

        const config = JSON.parse(configSalva);

        if (canalNotificacao && config.canal) {
            canalNotificacao.value = config.canal;
        }

        if (whatsappInput && config.whatsapp) {
            whatsappInput.value = config.whatsapp;
        }

        if (emailInput && config.email) {
            emailInput.value = config.email;
        }

        if (nivelAlertaInput && config.nivel !== undefined) {
            nivelAlertaInput.value = config.nivel;
        }

        atualizarCamposNotificacao();

    } catch (erro) {

        console.error(
            "Erro ao carregar configuração:",
            erro
        );

    }

}


function atualizarCamposNotificacao() {

    if (!canalNotificacao) return;

    const canal = canalNotificacao.value;

    if (campoWhatsapp) {
        campoWhatsapp.style.display =
            canal === "whatsapp" || canal === "ambos"
                ? "block"
                : "none";
    }

    if (campoEmail) {
        campoEmail.style.display =
            canal === "email" || canal === "ambos"
                ? "block"
                : "none";
    }

}


if (canalNotificacao) {

    canalNotificacao.addEventListener(
        "change",
        atualizarCamposNotificacao
    );

}


function salvarConfiguracao() {

    const config = {

        canal:
            canalNotificacao
                ? canalNotificacao.value
                : "email",

        whatsapp:
            whatsappInput
                ? whatsappInput.value.trim()
                : "",

        email:
            emailInput
                ? emailInput.value.trim()
                : "",

        nivel:
            nivelAlertaInput
                ? Number(nivelAlertaInput.value)
                : 70

    };

    localStorage.setItem(
        "cleansurface_config",
        JSON.stringify(config)
    );

    if (savedMessage) {

        savedMessage.textContent =
            "Configurações salvas com sucesso.";

        savedMessage.style.display = "block";

        setTimeout(() => {
            savedMessage.style.display = "none";
        }, 3000);

    }

}


const botoesSalvar =
    document.querySelectorAll(
        '[data-action="salvar"], #salvarConfiguracao, .save-btn'
    );

botoesSalvar.forEach(botao => {

    botao.addEventListener(
        "click",
        salvarConfiguracao
    );

});


// ===============================
// PEGAR E-MAIL
// ===============================

function obterEmail() {

    if (!emailInput) return "";

    return emailInput.value.trim();

}


// ===============================
// INICIAR ANÁLISE
// ===============================

async function iniciarAnalise() {

    const email = obterEmail();

    if (!email) {

        alert(
            "Digite um e-mail para receber o resultado da análise."
        );

        if (emailInput) {
            emailInput.focus();
        }

        return;

    }


    // Validação simples
    if (!email.includes("@") || !email.includes(".")) {

        alert(
            "Digite um e-mail válido."
        );

        emailInput.focus();

        return;

    }


    if (iniciarBtn) {

        iniciarBtn.disabled = true;

        iniciarBtn.textContent =
            "⏳ SOLICITANDO ANÁLISE...";

    }


    if (deviceStatus) {
        deviceStatus.textContent =
            "Aguardando ESP32-S3-CAM";
    }


    try {

        const resposta = await fetch(
            API_URL + "/iniciar-analise",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email: email,

                    canal:
                        canalNotificacao
                            ? canalNotificacao.value
                            : "email",

                    whatsapp:
                        whatsappInput
                            ? whatsappInput.value.trim()
                            : "",

                    nivel:
                        nivelAlertaInput
                            ? Number(nivelAlertaInput.value)
                            : 70

                })

            }
        );


        const dados = await resposta.json();


        if (!resposta.ok || !dados.sucesso) {

            throw new Error(
                dados.erro ||
                dados.mensagem ||
                "Erro ao iniciar análise."
            );

        }


        analiseAtual = dados.analise_id;


        if (deviceStatus) {
            deviceStatus.textContent =
                "Análise aguardando ESP32";
        }


        if (lastResult) {
            lastResult.textContent =
                "Aguardando resultado...";
        }


        if (readingValue) {
            readingValue.textContent =
                "Aguardando...";
        }


        if (readingStatus) {
            readingStatus.textContent =
                "Processando";
        }


        if (readingDetail) {
            readingDetail.textContent =
                "O ESP32-S3-CAM realizará a análise.";
        }


        iniciarMonitoramentoResultado();

    } catch (erro) {

        console.error(erro);

        alert(
            "Não foi possível iniciar a análise:\n\n" +
            erro.message
        );

        if (deviceStatus) {
            deviceStatus.textContent =
                "Erro de conexão";
        }

    } finally {

        if (iniciarBtn) {

            iniciarBtn.disabled = false;

            iniciarBtn.textContent =
                "🔍 INICIAR ANÁLISE";

        }

    }

}


if (iniciarBtn) {

    iniciarBtn.addEventListener(
        "click",
        iniciarAnalise
    );

}


// ===============================
// VERIFICAR RESULTADO
// ===============================

function iniciarMonitoramentoResultado() {

    if (intervaloResultado) {
        clearInterval(intervaloResultado);
    }

    verificarResultado();

    intervaloResultado =
        setInterval(
            verificarResultado,
            3000
        );

}


async function verificarResultado() {

    try {

        const resposta = await fetch(
            API_URL + "/resultado",
            {
                method: "GET",
                cache: "no-store"
            }
        );


        if (!resposta.ok) {
            return;
        }


        const dados = await resposta.json();


        if (!dados.disponivel) {
            return;
        }


        // Se estamos esperando uma análise específica,
        // ignoramos resultados antigos.
        if (
            analiseAtual !== null &&
            Number(dados.analise_id) !==
            Number(analiseAtual)
        ) {
            return;
        }


        mostrarResultado(dados);


        if (intervaloResultado) {

            clearInterval(intervaloResultado);

            intervaloResultado = null;

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

function mostrarResultado(dados) {

    const valor =
        dados.valor || "Não informado";

    const status =
        dados.status || "Não informado";

    const detalhe =
        dados.detalhe || "Sem detalhes";


    if (lastResult) {
        lastResult.textContent = valor;
    }


    if (readingValue) {
        readingValue.textContent = valor;
    }


    if (readingStatus) {
        readingStatus.textContent = status;
    }


    if (readingDetail) {
        readingDetail.textContent = detalhe;
    }


    if (deviceStatus) {
        deviceStatus.textContent =
            "Análise concluída";
    }


    console.log(
        "Resultado recebido:",
        dados
    );

}


// ===============================
// INICIALIZAÇÃO
// ===============================

carregarConfiguracao();
atualizarCamposNotificacao();
