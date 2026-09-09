// ======================================================
// CLEANSURFACE AI - SCRIPT PRINCIPAL
// Navegação + API + Análise
// ======================================================

const API_URL = "https://cleansurface-api.luizinfernando19.workers.dev";

const titles = {
    dashboard: "Dashboard",
    monitoramento: "Monitoramento",
    alertas: "Alertas",
    historico: "Histórico",
    configuracoes: "Configurações"
};

let analiseAtualId = null;
let consultaResultado = null;
let analisando = false;


// ======================================================
// NAVEGAÇÃO DO SITE
// ======================================================

function showPage(id) {

    const pagina = document.getElementById(id);

    if (!pagina) {
        console.error("Página não encontrada:", id);
        return;
    }

    // Esconde todas as páginas
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    // Mostra a página escolhida
    pagina.classList.add("active-page");

    // Atualiza botão ativo
    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === id
        );
    });

    // Atualiza título
    const titulo = document.getElementById("page-title");

    if (titulo) {
        titulo.textContent = titles[id] || "CleanSurface AI";
    }

    // Volta para o topo
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ======================================================
// CONFIGURAÇÃO DOS BOTÕES DO MENU
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".nav-item").forEach(button => {

        button.addEventListener("click", function () {

            const pagina = this.dataset.page;

            if (pagina) {
                showPage(pagina);
            }

        });

    });

});


// ======================================================
// CONFIGURAÇÕES
// ======================================================

function saveSettings() {

    const saved = document.getElementById("saved");

    if (saved) {
        saved.textContent = "✓ Configurações salvas.";
    }

}


// ======================================================
// INICIAR ANÁLISE
// ======================================================

async function iniciarAnalise() {

    if (analisando) {
        return;
    }

    analisando = true;

    const botao = document.getElementById("analisarBtn");
    const status = document.getElementById("statusAnalise");

    if (botao) {
        botao.disabled = true;
        botao.textContent = "⏳ ANALISANDO...";
    }

    if (status) {
        status.textContent = "Solicitando análise ao ESP32...";
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
            throw new Error(
                "Erro HTTP " + resposta.status
            );
        }

        const dados = await resposta.json();

        console.log("Resposta /iniciar-analise:", dados);

        if (!dados.sucesso || !dados.analise_id) {
            throw new Error(
                dados.mensagem || "Não foi possível iniciar a análise."
            );
        }

        analiseAtualId = dados.analise_id;

        // Atualiza interface
        atualizarStatusDispositivo("Aguardando análise");

        if (status) {
            status.textContent =
                "Análise solicitada. Aguardando ESP32...";
        }

        // Abre monitoramento automaticamente
        showPage("monitoramento");

        // Começa a procurar o resultado
        iniciarConsultaResultado();

    } catch (erro) {

        console.error("Erro ao iniciar análise:", erro);

        if (status) {
            status.textContent =
                "❌ Erro ao iniciar análise.";
        }

        atualizarStatusDispositivo("Erro");

        liberarBotao();

    }

}


// ======================================================
// CONSULTA DO RESULTADO
// ======================================================

function iniciarConsultaResultado() {

    // Cancela consulta anterior
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


// ======================================================
// VERIFICAR RESULTADO NA API
// ======================================================

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
            throw new Error(
                "Erro HTTP " + resposta.status
            );
        }

        const dados = await resposta.json();

        console.log("Resposta /resultado:", dados);

        // Ainda não existe resultado
        if (!dados.disponivel) {

            atualizarStatusDispositivo(
                "Aguardando ESP32"
            );

            return;
        }

        // Se temos uma análise atual,
        // ignoramos resultados de análises anteriores
        if (
            analiseAtualId !== null &&
            Number(dados.analise_id) !== Number(analiseAtualId)
        ) {
            console.log(
                "Resultado pertence a outra análise."
            );

            return;
        }

        // Resultado encontrado
        receberResultado(dados);

    } catch (erro) {

        console.error(
            "Erro ao consultar resultado:",
            erro
        );

    }

}


// ======================================================
// RECEBER RESULTADO
// ======================================================

function receberResultado(dados) {

    console.log("RESULTADO RECEBIDO:", dados);

    // Para de consultar
    if (consultaResultado) {
        clearInterval(consultaResultado);
        consultaResultado = null;
    }

    analisando = false;

    // --------------------------------------------------
    // Valores recebidos
    // --------------------------------------------------

    const valor = dados.valor || "Sem resultado";
    const status = dados.status || "Analisado";
    const detalhe =
        dados.detalhe ||
        "Análise concluída pelo ESP32-S3-CAM.";

    // --------------------------------------------------
    // Monitoramento
    // --------------------------------------------------

    const readingValue =
        document.getElementById("reading-value");

    const readingStatus =
        document.getElementById("reading-status");

    const readingDetail =
        document.getElementById("reading-detail");

    if (readingValue) {

        // Caso o valor seja numérico
        if (!isNaN(parseFloat(valor))) {
            readingValue.textContent =
                parseFloat(valor).toFixed(1);
        } else {
            readingValue.textContent = "✓";
        }

    }

    if (readingStatus) {
        readingStatus.textContent = valor;
    }

    if (readingDetail) {
        readingDetail.textContent = detalhe;
    }

    // --------------------------------------------------
    // Dashboard
    // --------------------------------------------------

    const lastResult =
        document.getElementById("last-result");

    if (lastResult) {
        lastResult.textContent = valor;
    }

    atualizarStatusDispositivo("Online");

    // --------------------------------------------------
    // Status da análise
    // --------------------------------------------------

    const statusAnalise =
        document.getElementById("statusAnalise");

    if (statusAnalise) {
        statusAnalise.textContent =
            "✓ Análise concluída.";
    }

    // --------------------------------------------------
    // Botão
    // --------------------------------------------------

    liberarBotao();

}


// ======================================================
// ATUALIZAR STATUS DO DISPOSITIVO
// ======================================================

function atualizarStatusDispositivo(texto) {

    const deviceStatus =
        document.getElementById("device-status");

    if (deviceStatus) {
        deviceStatus.textContent = texto;
    }

}


// ======================================================
// LIBERAR BOTÃO
// ======================================================

function liberarBotao() {

    analisando = false;

    const botao =
        document.getElementById("analisarBtn");

    if (botao) {
        botao.disabled = false;
        botao.textContent = "🔍 INICIAR ANÁLISE";
    }

}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // Garante que o Dashboard começa aberto
    showPage("dashboard");

    // Estado inicial
    atualizarStatusDispositivo("Aguardando");

});
