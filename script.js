// ========================================
// CleanSurface AI
// Sistema principal
// ========================================


// ========================================
// NAVEGAÇÃO
// ========================================

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");


navItems.forEach(item => {

    item.addEventListener("click", () => {

        const pageName = item.dataset.page;

        showPage(pageName);

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

function iniciarAnalise() {

    const botao =
        document.getElementById("analisarBtn");

    const status =
        document.getElementById("statusAnalise");


    if (!botao) return;


    botao.disabled = true;

    botao.textContent =
        "⏳ ANALISANDO...";


    if (status) {

        status.textContent =
            "O CleanSurface AI está realizando a análise...";

    }


    // Mostra a tela de monitoramento

    showPage("monitoramento");


    const deviceStatus =
        document.getElementById("device-status");

    if (deviceStatus) {

        deviceStatus.textContent =
            "Analisando";

    }


    const readingStatus =
        document.getElementById("reading-status");

    const readingDetail =
        document.getElementById("reading-detail");


    if (readingStatus) {

        readingStatus.textContent =
            "Analisando superfície...";

    }


    if (readingDetail) {

        readingDetail.textContent =
            "Aguardando resultado do ESP32-S3-CAM.";

    }


    /*
    ========================================
    SIMULAÇÃO TEMPORÁRIA

    Depois vamos substituir esta parte
    pela comunicação real com o ESP32.
    ========================================
    */


    setTimeout(() => {

        finalizarAnalise(92);

    }, 3000);

}


// ========================================
// FINALIZAR ANÁLISE
// ========================================

function finalizarAnalise(valor) {

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


    // Resultado

    if (readingValue) {

        readingValue.textContent =
            valor;

    }


    if (readingStatus) {

        readingStatus.textContent =
            "Superfície limpa";

    }


    if (readingDetail) {

        readingDetail.textContent =
            "Análise concluída com sucesso.";

    }


    if (lastResult) {

        lastResult.textContent =
            valor + "%";

    }


    if (deviceStatus) {

        deviceStatus.textContent =
            "Online";

    }


    if (botao) {

        botao.disabled = false;

        botao.textContent =
            "🔍 INICIAR ANÁLISE";

    }


    if (status) {

        status.textContent =
            "Análise concluída.";

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
