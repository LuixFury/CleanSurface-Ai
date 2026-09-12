// ============================================================
// CleanSurface AI - script.js
// Integração com API + ESP32-S3-CAM
// ============================================================

const API_URL = "https://cleansurface-api.luizinfernando19.workers.dev";

let analiseAtualId = null;
let verificandoResultado = false;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    configurarNavegacao();
    carregarConfiguracoes();
    carregarHistorico();
    atualizarDashboard();
    verificarAPI();
});


// ============================================================
// NAVEGAÇÃO
// ============================================================

function configurarNavegacao() {
    const botoes = document.querySelectorAll(".nav-item");

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            const pagina = botao.dataset.page;

            if (pagina) {
                mostrarPagina(pagina);
            }
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

    const paginaSelecionada = document.getElementById(nomePagina);

    if (paginaSelecionada) {
        paginaSelecionada.classList.add("active-page");
    }

    const botaoSelecionado =
        document.querySelector(`.nav-item[data-page="${nomePagina}"]`);

    if (botaoSelecionado) {
        botaoSelecionado.classList.add("active");
    }

    const titulo = document.getElementById("page-title");

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

    if (nomePagina === "historico") {
        carregarHistorico();
    }
}

function showPage(nomePagina) {
    mostrarPagina(nomePagina);
}


// ============================================================
// VERIFICAR API
// ============================================================

async function verificarAPI() {
    const dispositivo = document.getElementById("device-status");

    try {
        const resposta = await fetch(API_URL, {
            method: "GET",
            cache: "no-store"
        });

        if (!resposta.ok) {
            throw new Error("API offline");
        }

        const dados = await resposta.json();

        console.log("API CleanSurface AI:", dados);

        if (dispositivo) {
            dispositivo.textContent = "Online";
        }

    } catch (erro) {
        console.error("API:", erro);

        if (dispositivo) {
            dispositivo.textContent = "Offline";
        }
    }
}


// ============================================================
// INICIAR ANÁLISE
// ============================================================

async function iniciarAnalise() {

    const botao = document.getElementById("analisarBtn");
    const status = document.getElementById("statusAnalise");
    const dispositivo = document.getElementById("device-status");

    if (verificandoResultado) {
        return;
    }

    if (botao) {
        botao.disabled = true;
        botao.innerHTML = "⏳ SOLICITANDO ANÁLISE...";
    }

    if (status) {
        status.textContent =
            "Solicitando análise ao ESP32-S3-CAM...";
    }

    if (dispositivo) {
        dispositivo.textContent = "Solicitando...";
    }

    try {

        const configuracoes =
            obterConfiguracoes();

        const resposta = await fetch(
            `${API_URL}/iniciar-analise`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: configuracoes.email || ""
                }),

                cache: "no-store"
            }
        );

        if (!resposta.ok) {
            throw new Error(
                `Erro HTTP ${resposta.status}`
            );
        }

        const dados = await resposta.json();

        console.log(
            "Análise criada:",
            dados
        );

        if (!dados.sucesso) {
            throw new Error(
                dados.mensagem ||
                "Não foi possível iniciar a análise."
            );
        }

        analiseAtualId =
            dados.analise_id;

        if (status) {
            status.textContent =
                "Análise solicitada. Aguardando ESP32-S3-CAM...";
        }

        if (dispositivo) {
            dispositivo.textContent =
                "Aguardando ESP32";
        }

        // Começa a procurar o resultado
        aguardarResultado();

    } catch (erro) {

        console.error(
            "Erro ao iniciar análise:",
            erro
        );

        if (status) {
            status.textContent =
                "❌ Não foi possível iniciar a análise.";
        }

        if (dispositivo) {
            dispositivo.textContent =
                "Offline";
        }

    } finally {

        if (botao) {
            botao.disabled = false;
            botao.innerHTML =
                "🔍 INICIAR ANÁLISE";
        }
    }
}


// ============================================================
// AGUARDAR RESULTADO DO ESP32
// ============================================================

async function aguardarResultado() {

    if (verificandoResultado) {
        return;
    }

    if (!analiseAtualId) {
        console.error(
            "Nenhum analise_id disponível."
        );
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
            "Aguardando ESP32";
    }

    let tentativas = 0;

    const limiteTentativas = 40;

    const intervalo = setInterval(
        async () => {

            tentativas++;

            try {

                const resposta =
                    await fetch(
                        `${API_URL}/resultado?analise_id=${analiseAtualId}`,
                        {
                            method: "GET",
                            headers: {
                                "Accept":
                                    "application/json"
                            },
                            cache: "no-store"
                        }
                    );

                if (!resposta.ok) {
                    throw new Error(
                        `HTTP ${resposta.status}`
                    );
                }

                const dados =
                    await resposta.json();

                console.log(
                    "Consulta resultado:",
                    dados
                );

                // Ainda não existe resultado
                if (
                    dados.disponivel !== true
                ) {

                    if (status) {
                        status.textContent =
                            "Aguardando análise do ESP32-S3-CAM...";
                    }

                    return;
                }

                // Confirma que o resultado pertence
                // à análise atual
                if (
                    String(dados.analise_id) !==
                    String(analiseAtualId)
                ) {

                    console.log(
                        "Resultado antigo ignorado:",
                        dados.analise_id
                    );

                    return;
                }

                // RESULTADO ENCONTRADO

                clearInterval(intervalo);

                verificandoResultado = false;

                processarResultado(dados);

            } catch (erro) {

                console.log(
                    "Aguardando resultado...",
                    erro.message
                );
            }

            // Timeout
            if (
                tentativas >=
                limiteTentativas
            ) {

                clearInterval(intervalo);

                verificandoResultado = false;

                if (status) {
                    status.textContent =
                        "⏳ Análise ainda não concluída. O ESP32 pode estar processando.";
                }

                if (dispositivo) {
                    dispositivo.textContent =
                        "Aguardando";
                }
            }

        },
        3000
    );
}


// ============================================================
// PROCESSAR RESULTADO
// ============================================================

function processarResultado(dados) {

    console.log(
        "Resultado final:",
        dados
    );

    const valor =
        dados.valor ??
        "--";

    const resultadoStatus =
        dados.status ??
        "Analisado";

    const detalhe =
        dados.detalhe ??
        "Resultado recebido pelo CleanSurface AI.";

    // Atualiza monitoramento
    atualizarMonitoramento(
        valor,
        resultadoStatus,
        detalhe
    );

    // Salva histórico local
    salvarHistorico({

        id:
            dados.analise_id ??
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

    const status =
        document.getElementById(
            "statusAnalise"
        );

    const dispositivo =
        document.getElementById(
            "device-status"
        );

    if (status) {
        status.textContent =
            "✅ Análise concluída.";
    }

    if (dispositivo) {
        dispositivo.textContent =
            "Online";
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

    const dispositivo =
        document.getElementById(
            "device-status"
        );

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

    let historico =
        obterHistorico();

    const existe =
        historico.some(
            item =>
                String(item.id) ===
                String(resultado.id)
        );

    if (!existe) {
        historico.unshift(
            resultado
        );
    }

    historico =
        historico.slice(0, 100);

    localStorage.setItem(
        CHAVE_HISTORICO,
        JSON.stringify(historico)
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
            JSON.parse(salvo);

        if (!Array.isArray(dados)) {
            return [];
        }

        return dados;

    } catch (erro) {

        console.error(
            "Erro ao ler histórico:",
            erro
        );

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

    tabela.innerHTML = "";

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


    if (historico.length === 0) {

        const vazio =
            document.createElement("p");

        vazio.textContent =
            "Nenhuma análise registrada ainda.";

        tabela.appendChild(
            vazio
        );

        return;
    }


    historico.forEach(item => {

        const data =
            document.createElement("div");

        data.textContent =
            formatarData(
                item.data
            );


        const resultado =
            document.createElement("div");

        resultado.textContent =
            formatarStatus(
                item.status
            );


        const nivel =
            document.createElement("div");

        nivel.textContent =
            item.valor ??
            "--";


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
// DATA
// ============================================================

function formatarData(data) {

    if (!data) {
        return "--";
    }

    const dataObj =
        new Date(data);

    if (
        isNaN(
            dataObj.getTime()
        )
    ) {
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
            historico.filter(item => {

                const status =
                    String(
                        item.status ?? ""
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
            });

        contador.textContent =
            alertas.length;
    }


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


    if (salvo) {

        salvo.textContent =
            "✓ Configurações salvas";

        setTimeout(() => {

            salvo.textContent = "";

        }, 3000);
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
                configuracoes.email ||
                "";
        }


        if (nivel) {

            nivel.value =
                configuracoes.nivelAlerta ??
                70;
        }

    } catch (erro) {

        console.error(
            "Erro ao carregar configurações:",
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

    } catch (erro) {

        return {
            email: "",
            nivelAlerta: 70
        };
    }
}


// ============================================================
// DISPONIBILIZAR FUNÇÕES PARA O HTML
// ============================================================

window.iniciarAnalise =
    iniciarAnalise;

window.saveSettings =
    saveSettings;

window.showPage =
    showPage;
