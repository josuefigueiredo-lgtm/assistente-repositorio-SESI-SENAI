const form = document.getElementById("formRoteiro");

const btnGerar = document.getElementById("btnGerar");

const mensagem = document.getElementById("mensagem");

const dataInicio = document.getElementById("dataInicio");

const dataFim = document.getElementById("dataFim");


// ======================================================
// FORMATAR DATA
// ======================================================

function formatarData(data) {

    const partes = data.split("-");

    const mes = Number(partes[1]);

    const dia = Number(partes[2]);

    const meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro"
    ];

    return `${dia} de ${meses[mes - 1]}`;
}


// ======================================================
// VALIDAR INTERVALO DE DATAS
// ======================================================

dataInicio.addEventListener(
    "change",
    function () {

        if (dataInicio.value) {
            dataFim.min = dataInicio.value;
        }

        if (
            dataFim.value &&
            dataFim.value < dataInicio.value
        ) {

            dataFim.value = "";

        }

    }
);


// ======================================================
// ENVIO DO FORMULÁRIO
// ======================================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // --------------------------------------------------
        // PEGAR OS DADOS
        // --------------------------------------------------

        const docente =
            document.getElementById("docente").value.trim();

        const unidade =
            document.getElementById("unidade").value.trim();

        const curso =
            document.getElementById("curso").value;

        const turma =
            document.getElementById("turma").value.trim();

        const conteudo =
            document.getElementById("conteudo").value.trim();

        const atividade =
            document.getElementById("atividade").value.trim();


        // --------------------------------------------------
        // VALIDAR DATAS
        // --------------------------------------------------

        if (
            !dataInicio.value ||
            !dataFim.value
        ) {

            mensagem.textContent =
                "Informe a data inicial e a data final.";

            return;

        }


        if (
            dataFim.value < dataInicio.value
        ) {

            mensagem.textContent =
                "A data final não pode ser anterior à data inicial.";

            return;

        }


        // --------------------------------------------------
        // FORMATAR DATA
        // --------------------------------------------------

        const inicioFormatado =
            formatarData(dataInicio.value);

        const fimFormatado =
            formatarData(dataFim.value);

        const intervalo =
            `${inicioFormatado} até ${fimFormatado}`;


        // --------------------------------------------------
        // MONTAR OBJETO
        // --------------------------------------------------

        const dados = {

            docente: docente,

            unidade_curricular: unidade,

            curso: curso,

            turma: turma,

            dataInicio: dataInicio.value,

            dataFim: dataFim.value,

            conteudo: conteudo,

            atividade: atividade

        };


        // --------------------------------------------------
        // ALTERAR BOTÃO
        // --------------------------------------------------

        btnGerar.disabled = true;

        btnGerar.textContent =
            "Gerando roteiro...";


        // --------------------------------------------------
        // MENSAGEM INICIAL
        // --------------------------------------------------

        mensagem.textContent =
            `Preparando roteiro para ${intervalo}...`;


        try {

            // --------------------------------------------------
            // ETAPA 1
            // --------------------------------------------------

            mensagem.textContent =
                "📚 Consultando o plano de curso...";


            // --------------------------------------------------
            // ENVIAR PARA O NODE
            // --------------------------------------------------

            const resposta =
                await fetch(
                    "/gerar",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(dados)

                    }
                );


            // --------------------------------------------------
            // VERIFICAR ERRO
            // --------------------------------------------------

            if (!resposta.ok) {

                const textoErro =
                    await resposta.text();

                console.error(
                    "RESPOSTA DO SERVIDOR:",
                    textoErro
                );

                throw new Error(
                    textoErro ||
                    `Erro HTTP ${resposta.status}`
                );

            }


            // --------------------------------------------------
            // ETAPA 2
            // --------------------------------------------------

            mensagem.textContent =
                "🤖 Elaborando o roteiro pedagógico...";


            // --------------------------------------------------
            // RECEBER ARQUIVO
            // --------------------------------------------------

            const arquivo =
                await resposta.blob();


            // --------------------------------------------------
            // ETAPA 3
            // --------------------------------------------------

            mensagem.textContent =
                "📄 Preparando o documento...";


            // --------------------------------------------------
            // CRIAR DOWNLOAD
            // --------------------------------------------------

            const url =
                window.URL.createObjectURL(
                    arquivo
                );


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                "roteiro_estudo_semanal.docx";


            document.body.appendChild(link);

            link.click();

            link.remove();


            window.URL.revokeObjectURL(
                url
            );


            // --------------------------------------------------
            // SUCESSO
            // --------------------------------------------------

            mensagem.textContent =
                "✅ Roteiro gerado com sucesso! O download foi iniciado.";


        } catch (erro) {

            console.error(
                "ERRO:",
                erro
            );


            mensagem.textContent =
                "❌ Não foi possível gerar o roteiro. Verifique o servidor e tente novamente.";


        } finally {

            // --------------------------------------------------
            // RESTAURAR BOTÃO
            // --------------------------------------------------

            btnGerar.disabled = false;

            btnGerar.textContent =
                "Gerar roteiro";

        }

    }
);