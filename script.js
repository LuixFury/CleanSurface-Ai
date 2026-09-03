// ========================================
// CleanSurface AI
// ========================================

const API_URL =
    "https://cleansurface-api.luizinfernando19.workers.dev";

// ========================================
// NAVEGAÇÃO
// ========================================

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");

navItems.forEach(item => {
    item.addEventListener("click", () => {
        showPage(item.dataset.page);
    });
});

function showPage(pageName) {

    pages.forEach(page => {
        page.classList.remove("active-page");
    });

    navItems.forEach(item => {
        item.classList.remove("active");
    });

    const page = document.getElementById(pageName);

    const button = document.querySelector(
        `.nav-item[data-page="${pageName}"]`
    );

    if (page) {
        page.classList.add("active-page");
    }

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

    if (pageTitle) {
        pageTitle.textContent =
            titles[pageName] || "CleanSurface AI";
    }
}

// ========================================
// INICIAR ANÁLISE
// ========================================

async function iniciarAnalise() {

    const botao =
        document.getElementById("analisarBtn");

    const status =
        document.getElementById("statusAnalise");

    const deviceStatus =
        document.getElementById("device-status");

    const readingStatus =
        document.getElementById("reading-status");

    const readingDetail =
        document.getElementById("reading-detail");

    if (botao) {
        botao.disabled = true;
        botao.textContent =
            "⏳ SOLICITANDO...";
    }

    if (status) {
        status.textContent =
            "Enviando solicitação...";
    }

    if (deviceStatus) {
        deviceStatus.textContent =
            "Conectando...";
    }

    showPage("monitoramento");

    if (readingStatus) {
        readingStatus.textContent =
            "Solicitando análise";
    }

    if (readingDetail) {
        readingDetail.textContent =
            "Entrando em contato com o servidor CleanSurface AI...";
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

        const dados = await resposta.json();

        console.log("Resposta da API:", dados);

        if (!resposta.ok) {
            throw new Error(
                "Erro HTTP " + resposta.status
            );
        }

        if (status) {
            status.textContent =
                "Solicitação enviada.";
        }

        if (deviceStatus) {
            deviceStatus.textContent =
                "Aguardando ESP32";
        }

        if (readingStatus) {
            readingStatus.textContent =
                "Aguardando ESP32-S3-CAM";
        }

        if (readingDetail) {
            readingDetail.textContent =
                dados.mensagem ||
                "Aguardando resultado do dispositivo.";
        }

        if (botao) {
            botao.disabled = false;
            botao.textContent =
                "🔍 INICIAR ANÁLISE";
        }

    } catch (erro) {

        console.error(
            "Erro ao iniciar análise:",
            erro
        );

        if (status) {
            status.textContent =
                "Erro ao conectar com o servidor.";
        }

        if (deviceStatus) {
            deviceStatus.textContent =
                "Offline";
        }

        if (readingStatus) {
            readingStatus.textContent =
                "Erro de conexão";
        }

        if (readingDetail) {
            readingDetail.textContent =
                "Não foi possível entrar em contato com a API.";
        }

        if (botao) {
            botao.disabled = false;
            botao.textContent =
                "🔍 TENTAR NOVAMENTE";
        }
    }
}

// ========================================
// RECEBER RESULTADO DO ESP32
// ========================================

function receberResultado(dados) {

    const botao =
        document.getElementById("analisarBtn");

    const status =
        document.getElementById("statusAnalise");

    const deviceStatus =
        document.getElementById("device-status");

    const lastResult =
        document.getElementById("last-result");

    const readingValue =
        document.getElementById("reading-value");

    const readingStatus =
        document.getElementById("reading-status");

    const readingDetail =
        document.getElementById("reading-detail");

    if (botao) {
        botao.disabled = false;
        botao.textContent =
            "🔍 INICIAR ANÁLISE";
    }

    if (status) {
        status.textContent =
            "Análise concluída.";
    }

    if (deviceStatus) {
        deviceStatus.textContent =
            "Online";
    }

    if (dados.valor !== undefined) {

        if (readingValue) {
            readingValue.textContent =
                dados.valor;
        }

        if (lastResult) {
            lastResult.textContent =
                dados.valor + "%";
        }
    }

    if (dados.status && readingStatus) {
        readingStatus.textContent =
            dados.status;
    }

    if (dados.detalhe && readingDetail) {
        readingDetail.textContent =
            dados.detalhe;
    }
}

// ========================================
// CONFIGURAÇÕES
// ========================================

function saveSettings() {

    const saved =
        document.getElementById("saved");

    if (saved) {
        saved.textContent =
            "✓ Configurações salvas!";
    }

    setTimeout(() => {

        if (saved) {
            saved.textContent = "";
        }

    }, 3000);
}

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        showPage("dashboard");
    }
);
