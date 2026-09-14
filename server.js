const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORTA = process.env.PORT || 3000;

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


// Permitir receber JSON do navegador
app.use(express.json());


// Servir os arquivos da pasta public
app.use(express.static(
    path.join(__dirname, "public")
));


// ======================================================
// FUNÇÃO PARA NORMALIZAR TEXTO
// ======================================================

function normalizarTexto(texto) {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[-–—]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


// ======================================================
// ENCONTRAR UNIDADE CURRICULAR NO PDF
// ======================================================

function encontrarUnidadeCurricular(textoPDF, unidade) {

    const textoNormalizado =
        normalizarTexto(textoPDF);

    const unidadeNormalizada =
        normalizarTexto(unidade);


    // --------------------------------------------------
    // 1. TENTATIVA: TEXTO COMPLETO
    // --------------------------------------------------

    let posicao =
        textoNormalizado.indexOf(
            unidadeNormalizada
        );


    if (posicao !== -1) {

        return posicao;

    }


    // --------------------------------------------------
    // 2. TENTATIVA: SEM ESPAÇOS
    // --------------------------------------------------

    const textoSemEspacos =
        textoNormalizado.replace(/\s/g, "");

    const unidadeSemEspacos =
        unidadeNormalizada.replace(/\s/g, "");


    const posicaoSemEspacos =
        textoSemEspacos.indexOf(
            unidadeSemEspacos
        );


    if (posicaoSemEspacos !== -1) {

        return posicaoSemEspacos;

    }


    // --------------------------------------------------
    // 3. TENTATIVA: PALAVRAS PRINCIPAIS
    // --------------------------------------------------

    const palavras =
        unidadeNormalizada
            .split(" ")
            .filter(palavra =>
                palavra.length >= 4
            );


    for (const palavra of palavras) {

        const pos =
            textoNormalizado.indexOf(palavra);

        if (pos !== -1) {

            return pos;

        }

    }


    return -1;

}


// ======================================================
// EXTRAIR TRECHO RELEVANTE DO PDF
// ======================================================

function extrairTrecho(textoPDF, unidade) {

    const textoNormalizado =
        normalizarTexto(textoPDF);

    const unidadeNormalizada =
        normalizarTexto(unidade);


    let posicao =
        encontrarUnidadeCurricular(
            textoPDF,
            unidade
        );


    if (posicao === -1) {

        return textoPDF.substring(
            0,
            20000
        );

    }


    // Procurar novamente no texto normalizado
    posicao =
        textoNormalizado.indexOf(
            unidadeNormalizada
        );


    if (posicao === -1) {

        posicao = 0;

    }


    const inicio =
        Math.max(
            0,
            posicao - 5000
        );


    const fim =
        Math.min(
            textoPDF.length,
            posicao + 15000
        );


    return textoPDF.substring(
        inicio,
        fim
    );

}


// ======================================================
// ESCOLHER PLANO DE CURSO
// ======================================================

function selecionarPDF(curso) {

    const cursoNormalizado =
        normalizarTexto(curso);


    if (
        cursoNormalizado.includes("informatica")
    ) {

        return path.join(
            __dirname,
            "referencias",
            "informatica",
            "plano_de_curso.pdf"
        );

    }


    if (
        cursoNormalizado.includes("biotecnologia")
    ) {

        return path.join(
            __dirname,
            "referencias",
            "biotecnologia",
            "plano_de_curso.pdf"
        );

    }


    return null;

}


// ======================================================
// GERAR ROTEIRO COM IA
// ======================================================
async function gerarDesenvolvimento(dados, trechoPDF) {

    const prompt = `

Você é um Assistente Pedagógico especializado na metodologia SENAI.

Sua única função é TRANSFORMAR a descrição fornecida pelo docente
em uma redação pedagógica curta, profissional e objetiva.

IMPORTANTE:

NÃO ELABORE UMA AULA.

NÃO PLANEJE UMA AULA.

NÃO COMPLETE A AULA.

NÃO CRIE UMA ATIVIDADE NOVA.

NÃO AMPLIE A DESCRIÇÃO DO DOCENTE.

A descrição do docente é o LIMITE da resposta.

Você deve apenas interpretar o que o professor informou,
organizar as ideias e melhorar a redação.

========================================
DADOS DO DOCENTE
========================================

Docente: ${dados.docente}

Unidade Curricular: ${dados.unidade_curricular}

Curso: ${dados.curso}

Turma: ${dados.turma}

Período: ${dados.data}

Conteúdo informado pelo docente:
${dados.conteudo}

Atividade informada pelo docente:
${dados.atividade}

========================================
PLANO DE CURSO
========================================

O trecho abaixo serve SOMENTE para verificar a nomenclatura
do conteúdo e manter a coerência com a Unidade Curricular.

NÃO utilize o Plano de Curso para criar novas atividades,
etapas, conteúdos, metodologias ou procedimentos.

${trechoPDF}

========================================
REGRAS
========================================

1. O conteúdo informado pelo docente tem prioridade absoluta.

2. A atividade informada pelo docente tem prioridade absoluta.

3. Apenas melhore a redação do que foi informado.

4. Não invente informações.

5. Não acrescente conteúdos técnicos que não foram informados.

6. Não acrescente etapas de execução.

7. Não acrescente exercícios.

8. Não acrescente avaliações.

9. Não acrescente apresentação de trabalhos.

10. Não acrescente trabalho em grupo ou dupla.

11. Não acrescente situação-problema.

12. Não acrescente resolução de problemas.

13. Não acrescente protagonismo do estudante.

14. Não acrescente mundo do trabalho.

15. Não acrescente demonstrações.

16. Não acrescente experimentação.

17. Não acrescente procedimentos pedagógicos que não foram informados.

18. Não transforme uma descrição curta em uma aula detalhada.

19. Não utilize informações do Plano de Curso para aumentar a atividade.

20. Se o professor fornecer poucas informações, a resposta deve
também conter poucas informações.

========================================
ESTRATÉGIA
========================================

Escreva uma frase curta descrevendo a forma como o professor
indicou que a aula será conduzida.

Se o professor não informar uma metodologia específica,
não invente uma.

Pode utilizar expressões como "aula expositiva e dialogada"
somente quando forem coerentes com a descrição fornecida.

========================================
ATIVIDADE EM SALA
========================================

Escreva uma frase curta descrevendo a principal ação dos estudantes.

Não transforme a atividade em uma lista de tarefas.

Não acrescente ações que não foram informadas.

========================================
FORMATO OBRIGATÓRIO
========================================

**Estratégia:**

[uma frase curta]

**Atividade em sala:**

[uma frase curta]

========================================
EXEMPLO
========================================

Entrada do professor:

"Vou finalizar o HTML e iniciar o assunto CSS."

Resposta esperada:

**Estratégia:**

Aula expositiva e dialogada voltada para a finalização da estruturação em HTML e introdução aos conceitos de CSS.

**Atividade em sala:**

Desenvolvimento prático para conclusão da estrutura em HTML e aplicação inicial de estilos utilizando CSS.

NÃO acrescente seletores, cores, fontes, margens, espaçamentos,
Flexbox, Grid, responsividade, situação-problema, exercícios,
avaliação, apresentação ou qualquer outra informação não mencionada.

========================================

RETORNE SOMENTE A ESTRATÉGIA E A ATIVIDADE EM SALA.

`;

    const resposta =
        await client.responses.create({

            model: "gpt-5.6-luna",

            input: prompt

        });

    return resposta.output_text
    .replace(/\*\*/g, "")
    .trim();
}
// ======================================================
// ROTA PRINCIPAL
// ======================================================

app.post(
    "/gerar",
    async (req, res) => {

        try {

            console.log("\n======================================");
            console.log("NOVA SOLICITAÇÃO");
            console.log("======================================");


            const dados = req.body;


            // --------------------------------------------------
            // VALIDAR DADOS
            // --------------------------------------------------

            if (!dados) {

                return res.status(400).json({

                    sucesso: false,

                    erro: "Nenhum dado foi recebido."

                });

            }


            if (
                !dados.docente ||
                !dados.unidade_curricular ||
                !dados.curso ||
                !dados.turma ||
                !dados.dataInicio ||
                !dados.dataFim ||
                !dados.conteudo ||
                !dados.atividade
            ) {

                return res.status(400).json({

                    sucesso: false,

                    erro: "Preencha todos os campos."

                });

            }


            // --------------------------------------------------
            // FORMATAR DATA
            // --------------------------------------------------

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


            function formatarData(data) {

                const partes =
                    data.split("-");

                const dia =
                    Number(partes[2]);

                const mes =
                    Number(partes[1]);


                return `${dia} de ${meses[mes - 1]}`;

            }


            const dataInicio =
                formatarData(
                    dados.dataInicio
                );


            const dataFim =
                formatarData(
                    dados.dataFim
                );
                console.log(dataFim, dataInicio)
let intervalo = dataInicio;
                if (dataInicio==dataFim){
                    intervalo = `${dataInicio}`;
                } else {
                    intervalo = `${dataInicio} até ${dataFim}`;
}
console.log(intervalo)
            // --------------------------------------------------
            // ESCOLHER PDF
            // --------------------------------------------------

            const caminhoPDF =
                selecionarPDF(
                    dados.curso
                );


            if (!caminhoPDF) {

                return res.status(400).json({

                    sucesso: false,

                    erro:
                        "Não foi encontrado um plano de curso para esse curso."

                });

            }


            console.log(
                "Plano selecionado:",
                caminhoPDF
            );


            // --------------------------------------------------
            // LER PDF
            // --------------------------------------------------

            const arquivoPDF =
                fs.readFileSync(
                    caminhoPDF
                );


            const { PDFParse } =
                require("pdf-parse");


            const parser =
                new PDFParse({

                    data: arquivoPDF

                });


            const resultadoPDF =
                await parser.getText();


            const textoPDF =
                resultadoPDF.text;


            console.log(
                "PDF lido com sucesso."
            );


            // --------------------------------------------------
            // EXTRAIR TRECHO DA UC
            // --------------------------------------------------

            const trechoPDF =
                extrairTrecho(
                    textoPDF,
                    dados.unidade_curricular
                );


            console.log(
                "Trecho relevante extraído."
            );


            // --------------------------------------------------
            // DADOS PARA A IA
            // --------------------------------------------------

            const dadosIA = {

                docente:
                    dados.docente,

                unidade_curricular:
                    dados.unidade_curricular,

                curso:
                    dados.curso,

                turma:
                    dados.turma,

                data:
                    intervalo,

                conteudo:
                    dados.conteudo,

                atividade:
                    dados.atividade

            };


            // --------------------------------------------------
            // CHAMAR IA
            // --------------------------------------------------

            console.log(
                "Gerando desenvolvimento com IA..."
            );


            const desenvolvimento =
                await gerarDesenvolvimento(
                    dadosIA,
                    trechoPDF
                );


            console.log(
                "Desenvolvimento gerado."
            );


            // --------------------------------------------------
            // CHAMAR API FLASK
            // --------------------------------------------------

            console.log(
                "Enviando dados para API Flask..."
            );


            const respostaWord =
                await fetch(
                    "http://127.0.0.1:5000/gerar-pdf",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                data:
                                    intervalo,

                                unidade_curricular:
                                    dados.unidade_curricular,

                                docente:
                                    dados.docente,

                                curso:
                                    dados.curso,

                                turma:
                                    dados.turma,

                                conteudo:
                                    dados.conteudo,

                                desenvolvimento:
                                    desenvolvimento

                            })

                    }
                );


            if (!respostaWord.ok) {

                const erro =
                    await respostaWord.text();

                console.log(
                    "Erro da API Flask:",
                    erro
                );


                return res.status(500).json({

                    sucesso: false,

                    erro:
                        "Erro ao gerar o documento Word."

                });

            }


            // --------------------------------------------------
            // RECEBER WORD
            // --------------------------------------------------

            const buffer =
                Buffer.from(
                    await respostaWord.arrayBuffer()
                );


            console.log(
                "Documento recebido da API Flask."
            );


            // --------------------------------------------------
            // ENVIAR WORD PARA O NAVEGADOR
            // --------------------------------------------------

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );


            res.setHeader(
                "Content-Disposition",
                'attachment; filename="roteiro_estudo_semanal.docx"'
            );


            res.send(buffer);


            console.log(
                "Documento enviado para o navegador."
            );


            console.log(
                "======================================\n"
            );


        } catch (erro) {

            console.log(
                "\nERRO:"
            );

            console.log(
                erro
            );


            res.status(500).json({

                sucesso: false,

                erro:
                    erro.message ||
                    "Erro interno do servidor."

            });

        }

    }
);


// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(
    PORTA,
    () => {

        console.log(
            "======================================"
        );

        console.log(
            "ASSISTENTE PEDAGÓGICO"
        );

        console.log(
            "======================================"
        );

        console.log(
            `Servidor rodando em http://localhost:${PORTA}`
        );

        console.log(
            "======================================"
        );

    }
);