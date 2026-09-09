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


// ===============================
// NAVEGAÇÃO
// ===============================

function showPage(id) {

    const pagina = document.getElementById(id);

    if (!pagina) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    pagina.classList.add("active-page");

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === id
        );
    });

    const titulo = document.getElementById("page-title");

    if (titulo) {
        titulo.textContent = titles[id] || "CleanSurface AI";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ===============================
// CONFIGURAÇÕES DE NOTIFICAÇÃO
// ===============================

function atualizarCamposNotificacao() {

    const canal = document.getElementById("canalNotificacao");

    const campoWhatsapp = document.getElementById("campoWhatsapp");
    const campoEmail = document.getElementById("campoEmail");

    if (!canal) return;

    if (canal.value === "whatsapp") {

        campoWhatsapp.style.display = "flex";
        campoEmail.style.display = "none";

    }

    else if (canal.value === "email") {

        campoWhatsapp.style.display = "none";
        campoEmail.style.display = "flex";

    }

    else {

        campoWhatsapp.style.display = "flex";
        campoEmail.style.display = "flex";

    }
}


function salvarConfiguracoesLocais() {

    const canal =
        document.getElementById("canalNotificacao")?.value || "whatsapp";

    const whatsapp =
        document.getElementById("whatsapp")?.value || "";

    const email =
        document.getElementById("email")?.value || "";

    const nivel =
        document.getElementById("nivelAlerta")?.value || "70";

    const configuracoes = {
        canal: canal,
        whatsapp: whatsapp,
        email: email,
        nivel: nivel
    };

    localStorage.setItem(
        "cleansurface_config",
        JSON.stringify(configuracoes)
    );
}


function carregarConfiguracoes() {

    const dados =
        localStorage.getItem("cleansurface_config");

    if (!dados) return;

    try {

        const configuracoes = JSON.parse(dados);

        const canal =
            document.getElementById("canalNotificacao");

        const whatsapp =
            document.getElementById("whatsapp");

        const email =
            document.getElementById("email");

        const nivel =
            document.getElementById("nivelAlerta");

        if (canal && configuracoes.canal) {
            canal.value = configuracoes.canal;
        }

        if (whatsapp) {
            whatsapp.value = configuracoes.whatsapp || "";
        }

        if (email) {
            email.value = configuracoes.email || "";
        }

        if (nivel) {
            nivel.value = configuracoes.nivel || "70";
        }

        atualizarCamposNotificacao();

    } catch (erro) {

        console.error(
            "Erro ao carregar configurações:",
            erro
        );

    }
}


function saveSettings() {

    salvarConfiguracoesLocais();

    const saved =
        document.getElementById("saved");

    if (saved) {

        saved.textContent =
            "✓ Configurações salvas.";

        setTimeout(() => {

            saved.textContent = "";

        }, 3000);
    }
}


// ===============================
// INICIAR ANÁLISE
// ===============================

async function iniciarAnalise() {

    if (analisando) return;

    analisando = true;

    const botao =
        document.getElementById("analisarBtn");

    const status =
        document.getElementById("statusAnalise");


    // Pega configurações

    const dadosSalvos =
        localStorage.getItem("cleansurface_config");

    let configuracoes = {
        canal: "whatsapp",
        whatsapp: "",
        email: "",
        nivel: "70"
    };

    if (dadosSalvos) {

        try {

            configuracoes =
                JSON.parse(dadosSalvos);

        } catch (erro) {

            console.error(erro);

        }
    }


    // Verifica WhatsApp

    if (
        (configuracoes.canal === "whatsapp" ||
         configuracoes.canal === "ambos") &&
        !configuracoes.whatsapp
    ) {

        alert(
            "Informe o número do WhatsApp em Configurações antes de iniciar a análise."
        );

        showPage("configuracoes");

        liberarBotao();

        return;
    }


    // Verifica e-mail

    if (
        (configuracoes.canal === "email" ||
         configuracoes.canal === "ambos") &&
        !configuracoes.email
    ) {

        alert(
            "Informe o e-mail em Configurações antes de iniciar a análise."
        );

        showPage("configuracoes");

        liberarBotao();

        return;
    }


    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "⏳ ANALISANDO...";

    }


    if (status) {

        status.textContent =
            "Solicitando análise ao ESP32...";

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

                    canal: configuracoes.canal,

                    whatsapp: configuracoes.whatsapp,

                    email: configuracoes.email,

                    nivel: configuracoes.nivel

                })
            }
        );


        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP " + resposta.status
            );

        }


        const dados =
            await resposta.json();


        console.log(
            "Resposta da API:",
            dados
        );


        if (
            !dados.sucesso ||
            !dados.analise_id
        ) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível iniciar a análise."
            );

        }


        analiseAtualId =
            dados.analise_id;


        atualizarStatusDispositivo(
            "Aguardando análise"
        );


        if (status) {

            status.textContent =
                "Análise solicitada. Aguardando ESP32...";

        }


        showPage("monitoramento");

        iniciarConsultaResultado();


    } catch (erro) {

        console.error(
            "Erro ao iniciar análise:",
            erro
        );


        if (status) {

            status.textContent =
                "❌ Erro ao iniciar análise.";

        }


        atualizarStatusDispositivo(
            "Erro"
        );


        liberarBotao();

    }

}


// ===============================
// CONSULTAR RESULTADO
// ===============================

function iniciarConsultaResultado() {

    if (consultaResultado) {

        clearInterval(
            consultaResultado
        );

    }


    verificarResultado();


    consultaResultado =
        setInterval(
            verificarResultado,
            3000
        );
}


async function verificarResultado() {

    try {

        const resposta =
            await fetch(
                API_URL + "/resultado",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP " +
                resposta.status
            );

        }


        const dados =
            await resposta.json();


        console.log(
            "Resultado:",
            dados
        );


        if (!dados.disponivel) {

            atualizarStatusDispositivo(
                "Aguardando ESP32"
            );

            return;

        }


        if (
            analiseAtualId !== null &&
            Number(dados.analise_id) !==
            Number(analiseAtualId)
        ) {

            return;

        }


        receberResultado(dados);


    } catch (erro) {

        console.error(
            "Erro ao consultar resultado:",
            erro
        );

    }

}


// ===============================
// RECEBER RESULTADO
// ===============================

function receberResultado(dados) {

    if (consultaResultado) {

        clearInterval(
            consultaResultado
        );

        consultaResultado = null;

    }


    analisando = false;


    const valor =
        dados.valor ||
        "Sem resultado";


    const status =
        dados.status ||
        "Analisado";


    const detalhe =
        dados.detalhe ||
        "Análise concluída pelo ESP32-S3-CAM.";


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


    if (readingValue) {

        if (!isNaN(parseFloat(valor))) {

            readingValue.textContent =
                parseFloat(valor).toFixed(1);

        } else {

            readingValue.textContent =
                "✓";

        }

    }


    if (readingStatus) {

        readingStatus.textContent =
            valor;

    }


    if (readingDetail) {

        readingDetail.textContent =
            detalhe;

    }


    const lastResult =
        document.getElementById(
            "last-result"
        );


    if (lastResult) {

        lastResult.textContent =
            valor;

    }


    atualizarStatusDispositivo(
        "Online"
    );


    const statusAnalise =
        document.getElementById(
            "statusAnalise"
        );


    if (statusAnalise) {

        statusAnalise.textContent =
            "✓ Análise concluída.";

    }


    liberarBotao();

}


// ===============================
// STATUS
// ===============================

function atualizarStatusDispositivo(texto) {

    const elemento =
        document.getElementById(
            "device-status"
        );

    if (elemento) {

        elemento.textContent =
            texto;

    }

}


// ===============================
// LIBERAR BOTÃO
// ===============================

function liberarBotao() {

    analisando = false;


    const botao =
        document.getElementById(
            "analisarBtn"
        );


    if (botao) {

        botao.disabled = false;

        botao.textContent =
            "🔍 INICIAR ANÁLISE";

    }

}


// ===============================
// INICIALIZAÇÃO
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .querySelectorAll(".nav-item")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const pagina =
                            this.dataset.page;

                        if (pagina) {

                            showPage(pagina);

                        }

                    }
                );

            });


        const canal =
            document.getElementById(
                "canalNotificacao"
            );


        if (canal) {

            canal.addEventListener(
                "change",
                atualizarCamposNotificacao
            );

        }


        carregarConfiguracoes();

        atualizarCamposNotificacao();

        showPage("dashboard");

        atualizarStatusDispositivo(
            "Aguardando"
        );

    }
);

