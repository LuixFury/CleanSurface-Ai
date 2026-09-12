// ============================================================
// CleanSurface AI - script.js
// ============================================================

const API_URL = "https://cleansurface-api.luizinfernando19.workers.dev";


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    configurarNavegacao();

    carregarConfiguracoes();

    carregarHistorico();

    atualizarDashboard();

});


// ============================================================
// NAVEGAÇÃO
// ============================================================

function configurarNavegacao() {

    const botoes = document.querySelectorAll(".nav-item");

    botoes.forEach(botao => {

        botao.addEventListener("click", () => {

            const pagina = botao.dataset.page;

            mostrarPagina(pagina);

        });

    });

}


function mostrarPagina(nomePagina) {

    const paginas = document.querySelectorAll(".page");
    const botoes = document.querySelectorAll(".nav-item");

    paginas.forEach(pagina => {

        pagina.classList.remove("active-page");

    });


    botoes.forEach(botao => {

        botao.classList.remove("active");

    });


    const paginaSelecionada =
        document.getElementById(nomePagina);

    if (paginaSelecionada) {

        paginaSelecionada.classList.add("active-page");

    }


    const botaoSelecionado =
        document.querySelector(
            `.nav-item[data-page="${nomePagina}"]`
        );

    if (botaoSelecionado) {

        botaoSelecionado.classList.add("active");

    }


    const titulo =
        document.getElementById("page-title");

    if (titulo) {

        const titulos = {

            dashboard: "Dashboard",

            monitoramento: "Monitoramento",

            alertas: "Alertas",

            historico: "Histórico",

            configuracoes: "Configurações",

            creditos: "Equipe / Créditos"

        };

        titulo.textContent =
            titulos[nomePagina] || "CleanSurface AI";

    }


    // Sempre atualiza o histórico ao abrir a página

    if (nomePagina === "historico") {

        carregarHistorico();

    }

}


// Compatibilidade caso algum botão antigo use showPage()

function showPage(nomePagina) {

    mostrarPagina(nomePagina);

}


// ============================================================
// INICIAR ANÁLISE
// ============================================================

async function iniciarAnalise() {

    const botao =
        document.getElementById("analisarBtn");

    const status =
        document.getElementById("statusAnalise");

    const dispositivo =
        document.getElementById("device-status");


    if (botao) {

        botao.disabled = true;

        botao.innerHTML =
            "⏳ SOLICITANDO ANÁLISE...";

    }


    if (status) {

        status.textContent =
            "Solicitando análise ao sistema...";

    }


    if (dispositivo) {

        dispositivo.textContent =
            "Conectando...";

    }


    try {

        const resposta =
            await fetch(`${API_URL}/analise`, {

                method: "GET",

                headers: {

                    "Accept": "application/json"

                }

            });


        if (!resposta.ok) {

            throw new Error(
                `Erro HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        console.log(
            "Resposta da API:",
            dados
        );


        if (status) {

            status.textContent =
                dados.mensagem ||
                "Análise solicitada. Aguardando ESP32-S3-CAM...";

        }


        if (dispositivo) {

            dispositivo.textContent =
                "Aguardando ESP32";

        }


        // Começa a procurar um resultado

        aguardarResultado();

    }

    catch (erro) {

        console.error(
            "Erro ao iniciar análise:",
            erro
        );


        if (status) {

            status.textContent =
                "❌ Não foi possível conectar à API.";

        }


        if (dispositivo) {

            dispositivo.textContent =
                "Offline";

        }

    }

    finally {

        if (botao) {

            botao.disabled = false;

            botao.innerHTML =
                "🔍 INICIAR ANÁLISE";

        }

    }

}


// ============================================================
// AGUARDAR RESULTADO
// ============================================================

let verificandoResultado = false;


async function aguardarResultado() {

    if (verificandoResultado) {

        return;

    }


    verificandoResultado = true;


    const status =
        document.getElementById("statusAnalise");


    const dispositivo =
        document.getElementById("device-status");


    if (status) {

        status.textContent =
            "Aguardando resultado do ESP32-S3-CAM...";

    }


    if (dispositivo) {

        dispositivo.textContent =
            "Aguardando resultado";

    }


    /*
       Tentamos verificar o endpoint de resultado.

       Caso a API ainda não disponibilize uma consulta GET,
       o erro é ignorado e o sistema continua funcionando.
    */

    let tentativas = 0;

    const limiteTentativas = 20;


    const intervalo = setInterval(async () => {

        tentativas++;


        try {

            const resposta =
                await fetch(`${API_URL}/resultado`, {

                    method: "GET",

                    headers: {

                        "Accept": "application/json"

                    },

                    cache: "no-store"

                });


            if (!resposta.ok) {

                throw new Error(
                    `HTTP ${resposta.status}`
                );

            }


            const dados =
                await resposta.json();


            console.log(
                "Resultado recebido:",
                dados
            );


            if (dados && temResultado(dados)) {

                clearInterval(intervalo);

                verificandoResultado = false;

                processarResultado(dados);

                return;

            }

        }

        catch (erro) {

            console.log(
                "Aguardando resultado...",
                erro.message
            );

        }


        if (tentativas >= limiteTentativas) {

            clearInterval(intervalo);

            verificandoResultado = false;


            if (status) {

                status.textContent =
                    "Análise solicitada. Aguardando ESP32-S3-CAM.";

            }


            if (dispositivo) {

                dispositivo.textContent =
                    "Aguardando";

            }

        }

    }, 3000);

}


// ============================================================
// VERIFICAR SE EXISTE RESULTADO
// ============================================================

function temResultado(dados) {

    if (!dados) {

        return false;

    }


    return (

        dados.valor !== undefined ||

        dados.resultado !== undefined ||

        dados.status !== undefined ||

        dados.detalhe !== undefined ||

        dados.mensagem !== undefined

    );

}


// ============================================================
// PROCESSAR RESULTADO
// ============================================================

function processarResultado(dados) {

    console.log(
        "Processando resultado:",
        dados
    );


    const valor =
        dados.valor ??
        dados.resultado ??
        dados.nivel ??
        "--";


    const resultadoStatus =
        dados.status ??
        dados.resultado_status ??
        "Analisado";


    const detalhe =
        dados.detalhe ??
        dados.mensagem ??
        "Resultado recebido pelo CleanSurface AI.";


    atualizarMonitoramento(
        valor,
        resultadoStatus,
        detalhe
    );


    salvarHistorico({

        id:
            dados.id ??
            Date.now(),

        data:
            dados.criado_em ??
            new Date().toISOString(),

        valor:
            valor,

        status:
            resultadoStatus,

        detalhe:
            detalhe

    });


    atualizarDashboard();

}


// ============================================================
// ATUALIZAR MONITORAMENTO
// ============================================================

function atualizarMonitoramento(
    valor,
    status,
    detalhe
) {

    const valorElemento =
        document.getElementById("reading-value");


    const statusElemento =
        document.getElementById("reading-status");


    const detalheElemento =
        document.getElementById("reading-detail");


    const ultimoResultado =
        document.getElementById("last-result");


    const dispositivo =
        document.getElementById("device-status");


    if (valorElemento) {

        valorElemento.textContent =
            valor;

    }


    if (statusElemento) {

        statusElemento.textContent =
            formatarStatus(status);

    }


    if (detalheElemento) {

        detalheElemento.textContent =
            detalhe;

    }


    if (ultimoResultado) {

        ultimoResultado.textContent =
            formatarStatus(status);

    }


    if (dispositivo) {

        dispositivo.textContent =
            "Online";

    }

}


// ============================================================
// FORMATAR STATUS
// ============================================================

function formatarStatus(status) {

    if (!status) {

        return "Analisado";

    }


    const texto =
        String(status);


    const normalizado =
        texto.toLowerCase();


    if (
        normalizado === "aprovado" ||
        normalizado === "ok" ||
        normalizado === "limpo"
    ) {

        return "Aprovado";

    }


    if (
        normalizado === "reprovado" ||
        normalizado === "alerta" ||
        normalizado === "sujo"
    ) {

        return "Alerta";

    }


    return texto;

}


// ============================================================
// HISTÓRICO
// ============================================================

const CHAVE_HISTORICO =
    "cleansurface_historico";


function salvarHistorico(resultado) {

    let historico = obterHistorico();


    /*
       Evita duplicar exatamente o mesmo registro.
    */

    const existe =
        historico.some(item =>

            String(item.id) ===
            String(resultado.id)

        );


    if (!existe) {

        historico.unshift(resultado);

    }


    /*
       Mantém os últimos 100 registros.
    */

    historico =
        historico.slice(0, 100);


    localStorage.setItem(

        CHAVE_HISTORICO,

        JSON.stringify(historico)

    );


    carregarHistorico();

}


// ============================================================
// OBTER HISTÓRICO
// ============================================================

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
            JSON.parse(salvo);


        if (!Array.isArray(dados)) {

            return [];

        }


        return dados;

    }

    catch (erro) {

        console.error(
            "Erro ao ler histórico:",
            erro
        );


        return [];

    }

}


// ============================================================
// CARREGAR HISTÓRICO NA TELA
// ============================================================

function carregarHistorico() {

    const historico =
        obterHistorico();


    /*
       Procuramos a área existente no index.html.
    */

    const tabela =
        document.querySelector(
            ".table-placeholder"
        );


    if (!tabela) {

        return;

    }


    /*
       Limpa o conteúdo antigo.
    */

    tabela.innerHTML = "";


    // Cabeçalho

    const cabecalhoData =
        document.createElement("div");

    cabecalhoData.textContent =
        "DATA E HORA";


    const cabecalhoResultado =
        document.createElement("div");

    cabecalhoResultado.textContent =
        "RESULTADO";


    const cabecalhoNivel =
        document.createElement("div");

    cabecalhoNivel.textContent =
        "NÍVEL";


    const cabecalhoStatus =
        document.createElement("div");

    cabecalhoStatus.textContent =
        "STATUS";


    tabela.appendChild(
        cabecalhoData
    );

    tabela.appendChild(
        cabecalhoResultado
    );

    tabela.appendChild(
        cabecalhoNivel
    );

    tabela.appendChild(
        cabecalhoStatus
    );


    // Nenhum registro

    if (historico.length === 0) {

        const vazio =
            document.createElement("p");

        vazio.textContent =
            "Nenhuma análise registrada ainda.";

        tabela.appendChild(vazio);

        return;

    }


    // Registros

    historico.forEach(item => {

        const data =
            document.createElement("div");

        data.textContent =
            formatarData(item.data);


        const resultado =
            document.createElement("div");

        resultado.textContent =
            formatarStatus(
                item.status
            );


        const nivel =
            document.createElement("div");

        nivel.textContent =
            item.valor ?? "--";


        const status =
            document.createElement("div");

        status.textContent =
            item.detalhe ??
            "Registrado";


        tabela.appendChild(data);

        tabela.appendChild(resultado);

        tabela.appendChild(nivel);

        tabela.appendChild(status);

    });

}


// ============================================================
// FORMATAR DATA
// ============================================================

function formatarData(data) {

    if (!data) {

        return "--";

    }


    const dataObj =
        new Date(data);


    if (isNaN(dataObj.getTime())) {

        return String(data);

    }


    return dataObj.toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


// ============================================================
// ATUALIZAR DASHBOARD
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
            historico.filter(item => {

                const status =
                    String(
                        item.status ?? ""
                    ).toLowerCase();


                return (

                    status.includes("alerta") ||

                    status.includes("reprovado") ||

                    status.includes("sujo")

                );

            });


        contador.textContent =
            alertas.length;

    }


    // Último resultado

    if (historico.length > 0) {

        const ultimo =
            historico[0];


        const ultimoElemento =
            document.getElementById(
                "last-result"
            );


        if (ultimoElemento) {

            ultimoElemento.textContent =
                formatarStatus(
                    ultimo.status
                );

        }

    }

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


    const salvo =
        document.getElementById(
            "saved"
        );


    const configuracoes = {

        email:
            email ?
            email.value :
            "",

        nivelAlerta:
            nivel ?
            nivel.value :
            70

    };


    localStorage.setItem(

        "cleansurface_config",

        JSON.stringify(configuracoes)

    );


    if (salvo) {

        salvo.textContent =
            "✓ Configurações salvas";

        setTimeout(() => {

            salvo.textContent = "";

        }, 3000);

    }

}


// ============================================================
// CARREGAR CONFIGURAÇÕES
// ============================================================

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
            JSON.parse(salvo);


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
                configuracoes.email || "";

        }


        if (nivel) {

            nivel.value =
                configuracoes.nivelAlerta ?? 70;

        }

    }

    catch (erro) {

        console.error(
            "Erro ao carregar configurações:",
            erro
        );

    }

}


// ============================================================
// ATALHOS
// ============================================================

window.iniciarAnalise =
    iniciarAnalise;


window.saveSettings =
    saveSettings;


window.showPage =
    showPage;
