// ============================================================
// CleanSurface AI
// API + ESP32-S3-CAM + Histórico + Personalização
// ============================================================

const API_URL =
    "https://cleansurface-api.luizinfernando19.workers.dev";

let analiseAtualId = null;
let pollingAtivo = false;
let analiseFinalizada = false;
let tempoLimiteAnalise = null;
let timerPolling = null;


// ============================================================
// PALETAS
// ============================================================

const PALETAS = {

    verde: {
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
        text: "#edffff"
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
    },

    amarelo: {
        primary: "#facc15",
        secondary: "#fde047",
        background: "#171304",
        card: "#211c08",
        text: "#fffbea"
    },

    rosa: {
        primary: "#f472b6",
        secondary: "#f9a8d4",
        background: "#190b14",
        card: "#24101d",
        text: "#fff1f8"
    },

    ciano: {
        primary: "#22d3ee",
        secondary: "#67e8f9",
        background: "#061519",
        card: "#0a1d21",
        text: "#ecfeff"
    },

    azulescuro: {
        primary: "#6366f1",
        secondary: "#818cf8",
        background: "#090b1d",
        card: "#11142d",
        text: "#eef2ff"
    },

    branco: {
        primary: "#ffffff",
        secondary: "#d1d5db",
        background: "#111827",
        card: "#1f2937",
        text: "#f9fafb"
    },

    dourado: {
        primary: "#eab308",
        secondary: "#facc15",
        background: "#151005",
        card: "#211a08",
        text: "#fffbeb"
    },

    turquesa: {
        primary: "#2dd4bf",
        secondary: "#5eead4",
        background: "#061512",
        card: "#0b211d",
        text: "#ecfdf5"
    }

};


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarNavegacao();

        carregarConfiguracoes();

        carregarHistorico();

        carregarPaleta();

        configurarSeletoresDeCor();

        atualizarDashboard();

        verificarAPI();

        restaurarEstadoBotao();

    }
);


// ============================================================
// NAVEGAÇÃO
// ============================================================

function configurarNavegacao() {

    const botoes =
        document.querySelectorAll(
            ".nav-item"
        );

    botoes.forEach(
        botao => {

            botao.addEventListener(
                "click",
                () => {

                    const pagina =
                        botao.dataset.page;

                    if (pagina) {

                        mostrarPagina(
                            pagina
                        );

                    }

                }
            );

        }
    );

}


function mostrarPagina(
    nomePagina
) {

    const paginas =
        document.querySelectorAll(
            ".page"
        );

    const botoes =
        document.querySelectorAll(
            ".nav-item"
        );


    paginas.forEach(
        pagina =>
            pagina.classList.remove(
                "active-page"
            )
    );


    botoes.forEach(
        botao =>
            botao.classList.remove(
                "active"
            )
    );


    const paginaSelecionada =
        document.getElementById(
            nomePagina
        );


    if (paginaSelecionada) {

        paginaSelecionada.classList.add(
            "active-page"
        );

    }


    const botaoSelecionado =
        document.querySelector(
            `.nav-item[data-page="${nomePagina}"]`
        );


    if (botaoSelecionado) {

        botaoSelecionado.classList.add(
            "active"
        );

    }


    const titulo =
        document.getElementById(
            "page-title"
        );


    if (titulo) {

        const titulos = {

            dashboard:
                "Dashboard",

            monitoramento:
                "Monitoramento",

            alertas:
                "Alertas",

            historico:
                "Histórico",

            configuracoes:
                "Configurações"

        };


        titulo.textContent =
            titulos[nomePagina] ||
            "CleanSurface AI";

    }


    if (
        nomePagina ===
        "historico"
    ) {

        carregarHistorico();

    }

}


function showPage(
    nomePagina
) {

    mostrarPagina(
        nomePagina
    );

}


// ============================================================
// VERIFICAR API
// ============================================================

async function verificarAPI() {

    const dispositivo =
        document.getElementById(
            "device-status"
        );


    try {

        const resposta =
            await fetch(
                API_URL,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "API offline"
            );

        }


        const dados =
            await resposta.json();


        console.log(
            "API:",
            dados
        );


        if (dispositivo) {

            dispositivo.textContent =
                "Online";

        }

    }
    catch (erro) {

        console.error(
            "API:",
            erro
        );


        if (dispositivo) {

            dispositivo.textContent =
                "Offline";

        }

    }

}


// ============================================================
// INICIAR / NOVA ANÁLISE
// ============================================================

async function iniciarAnalise() {

    const btn =
        document.getElementById(
            "analisarBtn"
        );

    const status =
        document.getElementById(
            "statusAnalise"
        );

    const emailElemento =
        document.getElementById(
            "email"
        );


    const email =
        emailElemento
            ? emailElemento.value.trim()
            : localStorage.getItem(
                "cleansurface_email"
            ) || "";


    // --------------------------------------------------------
    // VERIFICAR E-MAIL
    // --------------------------------------------------------

    if (!email) {

        if (status) {

            status.textContent =
                "Digite seu e-mail em Configurações antes de iniciar.";

        }

        showPage(
            "configuracoes"
        );

        return;

    }


    localStorage.setItem(
        "cleansurface_email",
        email
    );


    // --------------------------------------------------------
    // PARAR POLLING ANTERIOR
    // --------------------------------------------------------

    pararPolling();

    clearTimeout(
        tempoLimiteAnalise
    );


    // --------------------------------------------------------
    // RESET
    // --------------------------------------------------------

    analiseAtualId =
        null;

    analiseFinalizada =
        false;

    pollingAtivo =
        false;


    // --------------------------------------------------------
    // BOTÃO
    // --------------------------------------------------------

    if (btn) {

        btn.disabled =
            true;

        btn.textContent =
            "⏳ ANALISANDO...";

    }


    if (status) {

        status.textContent =
            "⏳ Solicitando análise...";

    }


    try {

        // ----------------------------------------------------
        // CRIAR NOVA ANÁLISE
        // ----------------------------------------------------

        const resposta =
            await fetch(
                API_URL +
                "/iniciar-analise",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            email: email
                        })
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
            "Nova análise:",
            dados
        );


        if (!dados.analise_id) {

            throw new Error(
                dados.mensagem ||
                "ID da análise não recebido."
            );

        }


        // ----------------------------------------------------
        // SALVAR ID
        // ----------------------------------------------------

        analiseAtualId =
            String(
                dados.analise_id
            );


        localStorage.setItem(
            "cleansurface_analise_atual",
            analiseAtualId
        );


        console.log(
            "ANÁLISE CRIADA:",
            analiseAtualId
        );


        // ----------------------------------------------------
        // LIMPAR MONITORAMENTO
        // ----------------------------------------------------

        limparMonitoramento();


        // ----------------------------------------------------
        // MOSTRAR MONITORAMENTO
        // ----------------------------------------------------

        showPage(
            "monitoramento"
        );


        // ----------------------------------------------------
        // STATUS
        // ----------------------------------------------------

        if (status) {

            status.textContent =
                "📷 Aguardando ESP32-S3-CAM...";

        }


        // ----------------------------------------------------
        // INICIAR POLLING
        // ----------------------------------------------------

        iniciarPolling();


        // ----------------------------------------------------
        // LIMITE DE 30 SEGUNDOS
        // ----------------------------------------------------

        tempoLimiteAnalise =
            setTimeout(
                () => {

                    if (
                        !analiseFinalizada &&
                        analiseAtualId
                    ) {

                        finalizarSemResultado();

                    }

                },
                30000
            );

    }
    catch (erro) {

        console.error(
            "Erro ao iniciar análise:",
            erro
        );


        analiseFinalizada =
            true;

        pollingAtivo =
            false;


        if (status) {

            status.textContent =
                "❌ Não foi possível iniciar a análise.";

        }


        if (btn) {

            btn.disabled =
                false;

            btn.textContent =
                "🔍 INICIAR ANÁLISE";

        }

    }

}


// ============================================================
// POLLING
// ============================================================

function iniciarPolling() {

    pararPolling();


    if (!analiseAtualId) {

        return;

    }


    pollingAtivo =
        true;


    console.log(
        "Polling iniciado para análise:",
        analiseAtualId
    );


    verificarResultado();

}


function pararPolling() {

    pollingAtivo =
        false;


    if (timerPolling) {

        clearTimeout(
            timerPolling
        );

        timerPolling =
            null;

    }

}


// ============================================================
// VERIFICAR RESULTADO
// ============================================================

async function verificarResultado() {

    if (
        !pollingAtivo ||
        !analiseAtualId ||
        analiseFinalizada
    ) {

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
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (resposta.ok) {

            const dados =
                await resposta.json();


            console.log(
                "Resultado:",
                dados
            );


            if (
                dados.disponivel === true &&
                String(
                    dados.analise_id
                ) ===
                String(
                    analiseAtualId
                )
            ) {

                processarResultado(
                    dados
                );

                return;

            }

        }

    }
    catch (erro) {

        console.log(
            "Aguardando resultado do ESP32...",
            erro
        );

    }


    // --------------------------------------------------------
    // CONTINUAR POLLING
    // --------------------------------------------------------

    if (
        pollingAtivo &&
        !analiseFinalizada
    ) {

        timerPolling =
            setTimeout(
                verificarResultado,
                3000
            );

    }

}


// ============================================================
// PROCESSAR RESULTADO REAL
// ============================================================

function processarResultado(
    data
) {

    if (
        analiseFinalizada
    ) {

        return;

    }


    analiseFinalizada =
        true;


    pararPolling();


    clearTimeout(
        tempoLimiteAnalise
    );


    const btn =
        document.getElementById(
            "analisarBtn"
        );

    const status =
        document.getElementById(
            "statusAnalise"
        );


    const valor =
        data.valor ??
        "--";


    const statusResultado =
        data.status ||
        "analisado";


    const detalhe =
        data.detalhe ||
        "Análise realizada pelo ESP32-S3-CAM.";


    // --------------------------------------------------------
    // MONITOR
    // --------------------------------------------------------

    atualizarMonitoramento(
        valor,
        statusResultado,
        detalhe
    );


    // --------------------------------------------------------
    // BADGE
    // --------------------------------------------------------

    const badge =
        document.getElementById(
            "monitorBadge"
        );


    if (badge) {

        const normalizado =
            String(
                statusResultado
            ).toLowerCase();


        if (
            normalizado ===
                "aprovado" ||
            normalizado ===
                "ok" ||
            normalizado ===
                "limpo"
        ) {

            badge.textContent =
                "APROVADO";

            badge.className =
                "badge good";

        }
        else if (
            normalizado ===
                "reprovado" ||
            normalizado ===
                "alerta" ||
            normalizado ===
                "sujo"
        ) {

            badge.textContent =
                "ALERTA";

            badge.className =
                "badge bad";

        }
        else {

            badge.textContent =
                "ANALISADO";

            badge.className =
                "badge waiting";

        }

    }


    // --------------------------------------------------------
    // STATUS PRINCIPAL
    // --------------------------------------------------------

    if (status) {

        status.textContent =
            "✅ Análise concluída.";

    }


    // --------------------------------------------------------
    // BOTÃO NOVA ANÁLISE
    // --------------------------------------------------------

    if (btn) {

        btn.disabled =
            false;

        btn.textContent =
            "🔄 REALIZAR NOVA ANÁLISE";

    }


    // --------------------------------------------------------
    // HISTÓRICO
    // --------------------------------------------------------

    const item = {

        id:
            data.id ||
            analiseAtualId,

        data:
            data.criado_em ||
            new Date().toISOString(),

        analise_id:
            analiseAtualId,

        valor:
            valor,

        status:
            statusResultado,

        detalhe:
            detalhe

    };


    salvarHistorico(
        item
    );


    atualizarDashboard();

    atualizarAlertas();

}


// ============================================================
// FINALIZAR SEM RESULTADO
// ============================================================

async function finalizarSemResultado() {

    if (
        analiseFinalizada
    ) {

        return;

    }


    analiseFinalizada =
        true;


    pararPolling();


    clearTimeout(
        tempoLimiteAnalise
    );


    const btn =
        document.getElementById(
            "analisarBtn"
        );

    const status =
        document.getElementById(
            "statusAnalise"
        );


    // --------------------------------------------------------
    // BOTÃO
    // --------------------------------------------------------

    if (btn) {

        btn.disabled =
            false;

        btn.textContent =
            "🔄 REALIZAR NOVA ANÁLISE";

    }


    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (status) {

        status.textContent =
            "⚠️ Superfície não visualizada.";

    }


    const dispositivo =
        document.getElementById(
            "device-status"
        );


    if (dispositivo) {

        dispositivo.textContent =
            "Sem resultado";

    }


    const valor =
        document.getElementById(
            "reading-value"
        );


    if (valor) {

        valor.textContent =
            "--";

    }


    const statusLeitura =
        document.getElementById(
            "reading-status"
        );


    if (statusLeitura) {

        statusLeitura.textContent =
            "SUPERFÍCIE NÃO VISUALIZADA";

    }


    const detalhe =
        document.getElementById(
            "reading-detail"
        );


    if (detalhe) {

        detalhe.textContent =
            "O ESP32-S3-CAM não enviou nenhum resultado da análise.";

    }


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


    // --------------------------------------------------------
    // HISTÓRICO
    // --------------------------------------------------------

    const item = {

        id:
            "sem-" +
            analiseAtualId +
            "-" +
            Date.now(),

        data:
            new Date().toISOString(),

        analise_id:
            analiseAtualId,

        valor:
            "--",

        status:
            "nao_visualizada",

        detalhe:
            "Superfície não visualizada — nenhum resultado recebido do ESP32-S3-CAM."

    };


    salvarHistorico(
        item
    );


    atualizarDashboard();

    atualizarAlertas();


    // --------------------------------------------------------
    // ENVIAR RESULTADO PARA API
    // --------------------------------------------------------

    try {

        const resposta =
            await fetch(
                API_URL +
                "/resultado",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            analise_id:
                                analiseAtualId,

                            valor:
                                null,

                            status:
                                "nao_visualizada",

                            detalhe:
                                "Superfície não visualizada — nenhum resultado recebido do ESP32-S3-CAM."

                        })
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "HTTP " +
                resposta.status
            );

        }


        if (status) {

            status.textContent =
                "⚠️ Superfície não visualizada. Notificação enviada ao e-mail.";

        }

    }
    catch (erro) {

        console.error(
            "Erro ao enviar resultado:",
            erro
        );


        if (status) {

            status.textContent =
                "⚠️ Superfície não visualizada. Não foi possível confirmar o envio.";

        }

    }

}


// ============================================================
// LIMPAR MONITORAMENTO
// ============================================================

function limparMonitoramento() {

    const valor =
        document.getElementById(
            "reading-value"
        );


    const status =
        document.getElementById(
            "reading-status"
        );


    const detalhe =
        document.getElementById(
            "reading-detail"
        );


    const dispositivo =
        document.getElementById(
            "device-status"
        );


    const ultimo =
        document.getElementById(
            "last-result"
        );


    const badge =
        document.getElementById(
            "monitorBadge"
        );


    if (valor) {

        valor.textContent =
            "--";

    }


    if (status) {

        status.textContent =
            "AGUARDANDO LEITURA";

    }


    if (detalhe) {

        detalhe.textContent =
            "Aguardando a câmera visualizar a superfície.";

    }


    if (dispositivo) {

        dispositivo.textContent =
            "Aguardando";

    }


    if (ultimo) {

        ultimo.textContent =
            "Aguardando análise";

    }


    if (badge) {

        badge.textContent =
            "AGUARDANDO DISPOSITIVO";

        badge.className =
            "badge waiting";

    }

}


// ============================================================
// MONITORAMENTO
// ============================================================

function atualizarMonitoramento(
    valor,
    status,
    detalhe
) {

    const valorElemento =
        document.getElementById(
            "reading-value"
        );


    const statusElemento =
        document.getElementById(
            "reading-status"
        );


    const detalheElemento =
        document.getElementById(
            "reading-detail"
        );


    const ultimoResultado =
        document.getElementById(
            "last-result"
        );


    if (valorElemento) {

        valorElemento.textContent =
            valor;

    }


    if (statusElemento) {

        statusElemento.textContent =
            formatarStatus(
                status
            );

    }


    if (detalheElemento) {

        detalheElemento.textContent =
            detalhe;

    }


    if (ultimoResultado) {

        ultimoResultado.textContent =
            formatarStatus(
                status
            );

    }

}


// ============================================================
// FORMATAR STATUS
// ============================================================

function formatarStatus(
    status
) {

    if (!status) {

        return "Analisado";

    }


    const texto =
        String(
            status
        );


    const normalizado =
        texto.toLowerCase();


    if (
        normalizado ===
            "aprovado" ||
        normalizado ===
            "ok" ||
        normalizado ===
            "limpo"
    ) {

        return "Aprovado";

    }


    if (
        normalizado ===
            "reprovado" ||
        normalizado ===
            "alerta" ||
        normalizado ===
            "sujo"
    ) {

        return "Alerta";

    }


    if (
        normalizado ===
        "nao_visualizada"
    ) {

        return "Não visualizada";

    }


    return texto;

}


// ============================================================
// HISTÓRICO
// ============================================================

const CHAVE_HISTORICO =
    "cleansurface_historico";


function salvarHistorico(
    resultado
) {

    let historico =
        obterHistorico();


    const existe =
        historico.some(
            item =>
                String(
                    item.id
                ) ===
                String(
                    resultado.id
                )
        );


    if (!existe) {

        historico.unshift(
            resultado
        );

    }


    historico =
        historico.slice(
            0,
            100
        );


    localStorage.setItem(
        CHAVE_HISTORICO,
        JSON.stringify(
            historico
        )
    );


    carregarHistorico();

}


function obterHistorico() {

    try {

        const salvo =
            localStorage.getItem(
                CHAVE_HISTORICO
            );


        if (!salvo) {

            return [];

        }


        const dados =
            JSON.parse(
                salvo
            );


        return Array.isArray(
            dados
        )
            ? dados
            : [];

    }
    catch (erro) {

        return [];

    }

}


function carregarHistorico() {

    const historico =
        obterHistorico();


    const tabela =
        document.querySelector(
            ".table-placeholder"
        );


    if (!tabela) {

        return;

    }


    tabela.innerHTML =
        "";


    const cabecalhos = [

        "DATA E HORA",

        "RESULTADO",

        "NÍVEL",

        "STATUS"

    ];


    cabecalhos.forEach(
        texto => {

            const elemento =
                document.createElement(
                    "div"
                );


            elemento.textContent =
                texto;


            tabela.appendChild(
                elemento
            );

        }
    );


    if (
        historico.length ===
        0
    ) {

        const vazio =
            document.createElement(
                "p"
            );


        vazio.textContent =
            "Nenhuma análise registrada ainda.";


        tabela.appendChild(
            vazio
        );


        return;

    }


    historico.forEach(
        item => {

            const data =
                document.createElement(
                    "div"
                );


            data.textContent =
                formatarData(
                    item.data
                );


            const resultado =
                document.createElement(
                    "div"
                );


            resultado.textContent =
                formatarStatus(
                    item.status
                );


            const nivel =
                document.createElement(
                    "div"
                );


            nivel.textContent =
                item.valor ??
                "--";


            const detalhe =
                document.createElement(
                    "div"
                );


            detalhe.textContent =
                item.detalhe ??
                "Registrado";


            tabela.appendChild(
                data
            );


            tabela.appendChild(
                resultado
            );


            tabela.appendChild(
                nivel
            );


            tabela.appendChild(
                detalhe
            );

        }
    );

}


// ============================================================
// FORMATAR DATA
// ============================================================

function formatarData(
    data
) {

    if (!data) {

        return "--";

    }


    const dataObj =
        new Date(
            data
        );


    if (
        isNaN(
            dataObj.getTime()
        )
    ) {

        return String(
            data
        );

    }


    return dataObj.toLocaleString(
        "pt-BR",
        {
            dateStyle:
                "short",

            timeStyle:
                "short"
        }
    );

}


// ============================================================
// DASHBOARD
// ============================================================

function atualizarDashboard() {

    const historico =
        obterHistorico();


    const contador =
        document.getElementById(
            "alert-count"
        );


    if (contador) {

        const alertas =
            historico.filter(
                item => {

                    const status =
                        String(
                            item.status ??
                            ""
                        ).toLowerCase();


                    return (

                        status.includes(
                            "alerta"
                        ) ||

                        status.includes(
                            "reprovado"
                        ) ||

                        status.includes(
                            "sujo"
                        )

                    );

                }
            );


        contador.textContent =
            alertas.length;

    }


    if (
        historico.length >
        0
    ) {

        const ultimo =
            historico[0];


        const elemento =
            document.getElementById(
                "last-result"
            );


        if (elemento) {

            elemento.textContent =
                formatarStatus(
                    ultimo.status
                );

        }

    }

}


// ============================================================
// ALERTAS
// ============================================================

function atualizarAlertas() {

    const historico =
        obterHistorico();


    const alertas =
        historico.filter(
            item => {

                const status =
                    String(
                        item.status ??
                        ""
                    ).toLowerCase();


                return (

                    status.includes(
                        "alerta"
                    ) ||

                    status.includes(
                        "reprovado"
                    ) ||

                    status.includes(
                        "sujo"
                    )

                );

            }
        );


    console.log(
        "Alertas:",
        alertas.length
    );

}


// ============================================================
// CONFIGURAÇÕES
// ============================================================

function saveSettings() {

    const email =
        document.getElementById(
            "email"
        );


    const nivel =
        document.getElementById(
            "nivelAlerta"
        );


    const configuracoes = {

        email:
            email
                ? email.value
                : "",

        nivelAlerta:
            nivel
                ? nivel.value
                : 70

    };


    localStorage.setItem(
        "cleansurface_config",
        JSON.stringify(
            configuracoes
        )
    );


    if (email) {

        localStorage.setItem(
            "cleansurface_email",
            email.value
        );

    }


    const salvo =
        document.getElementById(
            "saved"
        );


    if (salvo) {

        salvo.textContent =
            "✓ Configurações salvas";


        setTimeout(
            () => {

                salvo.textContent =
                    "";

            },
            3000
        );

    }

}


function carregarConfiguracoes() {

    try {

        const salvo =
            localStorage.getItem(
                "cleansurface_config"
            );


        if (!salvo) {

            return;

        }


        const configuracoes =
            JSON.parse(
                salvo
            );


        const email =
            document.getElementById(
                "email"
            );


        const nivel =
            document.getElementById(
                "nivelAlerta"
            );


        if (email) {

            email.value =
                configuracoes.email ||
                "";

        }


        if (nivel) {

            nivel.value =
                configuracoes.nivelAlerta ??
                70;

        }


        if (
            configuracoes.email
        ) {

            localStorage.setItem(
                "cleansurface_email",
                configuracoes.email
            );

        }

    }
    catch (erro) {

        console.error(
            erro
        );

    }

}


function obterConfiguracoes() {

    try {

        const salvo =
            localStorage.getItem(
                "cleansurface_config"
            );


        if (!salvo) {

            return {

                email: "",

                nivelAlerta: 70

            };

        }


        return JSON.parse(
            salvo
        );

    }
    catch (erro) {

        return {

            email: "",

            nivelAlerta: 70

        };

    }

}


// ============================================================
// PERSONALIZAÇÃO
// ============================================================

function aplicarPaleta(
    paleta
) {

    if (!paleta) {

        return;

    }


    document.documentElement.style.setProperty(
        "--primary",
        paleta.primary
    );


    document.documentElement.style.setProperty(
        "--secondary",
        paleta.secondary
    );


    document.documentElement.style.setProperty(
        "--background",
        paleta.background
    );


    document.documentElement.style.setProperty(
        "--card",
        paleta.card
    );


    document.documentElement.style.setProperty(
        "--text",
        paleta.text
    );


    preencherCores(
        paleta
    );


    localStorage.setItem(
        "cleansurface_paleta",
        JSON.stringify(
            paleta
        )
    );

}


function aplicarPreset(
    nome
) {

    const paleta =
        PALETAS[nome];


    if (!paleta) {

        return;

    }


    aplicarPaleta(
        paleta
    );


    const mensagem =
        document.getElementById(
            "paletteSaved"
        );


    if (mensagem) {

        mensagem.textContent =
            "✓ Paleta aplicada";


        setTimeout(
            () => {

                mensagem.textContent =
                    "";

            },
            2500
        );

    }

}


function preencherCores(
    paleta
) {

    if (!paleta) {

        return;

    }


    const mapa = {

        corPrincipal:
            paleta.primary,

        corSecundaria:
            paleta.secondary,

        corFundo:
            paleta.background,

        corCartao:
            paleta.card,

        corTexto:
            paleta.text

    };


    Object.entries(
        mapa
    ).forEach(
        ([id, valor]) => {

            const elemento =
                document.getElementById(
                    id
                );


            if (elemento) {

                elemento.value =
                    valor;

            }

        }
    );


    const hex = {

        hexPrincipal:
            paleta.primary,

        hexSecundaria:
            paleta.secondary,

        hexFundo:
            paleta.background,

        hexCartao:
            paleta.card,

        hexTexto:
            paleta.text

    };


    Object.entries(
        hex
    ).forEach(
        ([id, valor]) => {

            const elemento =
                document.getElementById(
                    id
                );


            if (elemento) {

                elemento.value =
                    valor.toUpperCase();

            }

        }
    );

}


function aplicarCoresPersonalizadas() {

    const paleta = {

        primary:
            obterCor(
                "hexPrincipal",
                "#39e6a3"
            ),

        secondary:
            obterCor(
                "hexSecundaria",
                "#55cba0"
            ),

        background:
            obterCor(
                "hexFundo",
                "#07100f"
            ),

        card:
            obterCor(
                "hexCartao",
                "#0b1917"
            ),

        text:
            obterCor(
                "hexTexto",
                "#edf7f4"
            )

    };


    aplicarPaleta(
        paleta
    );


    const mensagem =
        document.getElementById(
            "paletteSaved"
        );


    if (mensagem) {

        mensagem.textContent =
            "✓ Paleta personalizada aplicada";


        setTimeout(
            () => {

                mensagem.textContent =
                    "";

            },
            3000
        );

    }

}


function obterCor(
    id,
    padrao
) {

    const elemento =
        document.getElementById(
            id
        );


    if (!elemento) {

        return padrao;

    }


    let valor =
        elemento.value.trim();


    if (
        !/^#[0-9A-Fa-f]{6}$/.test(
            valor
        )
    ) {

        valor =
            padrao;


        elemento.value =
            padrao.toUpperCase();

    }


    return valor;

}


// ============================================================
// SELETORES DE COR
// ============================================================

function configurarSeletoresDeCor() {

    const pares = [

        [
            "corPrincipal",
            "hexPrincipal"
        ],

        [
            "corSecundaria",
            "hexSecundaria"
        ],

        [
            "corFundo",
            "hexFundo"
        ],

        [
            "corCartao",
            "hexCartao"
        ],

        [
            "corTexto",
            "hexTexto"
        ]

    ];


    pares.forEach(
        ([colorId, hexId]) => {

            const color =
                document.getElementById(
                    colorId
                );


            const hex =
                document.getElementById(
                    hexId
                );


            if (
                !color ||
                !hex
            ) {

                return;

            }


            color.addEventListener(
                "input",
                () => {

                    hex.value =
                        color.value.toUpperCase();

                }
            );


            hex.addEventListener(
                "input",
                () => {

                    const valor =
                        hex.value.trim();


                    if (
                        /^#[0-9A-Fa-f]{6}$/.test(
                            valor
                        )
                    ) {

                        color.value =
                            valor;

                    }

                }
            );

        }
    );

}


// ============================================================
// CARREGAR PALETA
// ============================================================

function carregarPaleta() {

    try {

        const salva =
            localStorage.getItem(
                "cleansurface_paleta"
            );


        if (!salva) {

            aplicarPaleta(
                PALETAS.verde
            );

            return;

        }


        const paleta =
            JSON.parse(
                salva
            );


        aplicarPaleta(
            paleta
        );

    }
    catch (erro) {

        aplicarPaleta(
            PALETAS.verde
        );

    }

}


// ============================================================
// RESTAURAR PALETA
// ============================================================

function restaurarPaleta() {

    aplicarPaleta(
        PALETAS.verde
    );


    const mensagem =
        document.getElementById(
            "paletteSaved"
        );


    if (mensagem) {

        mensagem.textContent =
            "✓ Paleta original restaurada";


        setTimeout(
            () => {

                mensagem.textContent =
                    "";

            },
            3000
        );

    }

}


// ============================================================
// RESTAURAR ESTADO DO BOTÃO
// ============================================================

function restaurarEstadoBotao() {

    const btn =
        document.getElementById(
            "analisarBtn"
        );


    if (!btn) {

        return;

    }


    btn.disabled =
        false;


    btn.textContent =
        "🔍 INICIAR ANÁLISE";


    const analiseSalva =
        localStorage.getItem(
            "cleansurface_analise_atual"
        );


    if (
        analiseSalva &&
        !analiseFinalizada
    ) {

        analiseAtualId =
            analiseSalva;

    }

}


// ============================================================
// FUNÇÕES GLOBAIS
// ============================================================

window.iniciarAnalise =
    iniciarAnalise;

window.saveSettings =
    saveSettings;

window.showPage =
    showPage;

window.aplicarPreset =
    aplicarPreset;

window.aplicarCoresPersonalizadas =
    aplicarCoresPersonalizadas;

window.restaurarPaleta =
    restaurarPaleta;
