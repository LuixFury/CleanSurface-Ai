// ========================================
// CleanSurface AI
// ========================================


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
// BOTÃO INICIAR ANÁLISE
// ========================================

function iniciarAnalise() {

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


    // Muda o botão

    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "⏳ ANALISANDO...";

    }


    // Mostra que está aguardando o ESP32

    if (status) {

        status.textContent =
            "Aguardando o ESP32-S3-CAM...";

    }


    if (deviceStatus) {

        deviceStatus.textContent =
            "Solicitando análise";

    }


    // Abre o monitoramento

    showPage("monitoramento");


    if (readingStatus) {

        readingStatus.textContent =
            "Análise em andamento";

    }


    if (readingDetail) {

        readingDetail.textContent =
            "Aguardando resultado do ESP32-S3-CAM.";

    }


    /*
    ========================================
    IMPORTANTE

    Nenhum resultado é inventado aqui.

    O resultado será colocado nesta função
    quando o ESP32 enviar os dados reais.
    ========================================
    */

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


    // Reativa o botão

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


    // Resultado recebido

    if (dados.valor !== undefined && readingValue) {

        readingValue.textContent =
            dados.valor;

    }


    if (dados.status && readingStatus) {

        readingStatus.textContent =
            dados.status;

    }


    if (dados.detalhe && readingDetail) {

        readingDetail.textContent =
            dados.detalhe;

    }


    if (dados.valor !== undefined && lastResult) {

        lastResult.textContent =
            dados.valor + "%";

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
