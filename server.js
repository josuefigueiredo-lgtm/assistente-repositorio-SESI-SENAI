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

// URL da API Flask
const FLASK_API_URL =
    process.env.FLASK_API_URL ||
    "http://127.0.0.1:5000";

// Permitir receber JSON do navegador
app.use(express.json());

// Servir os arquivos da pasta public
app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

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

function encontrarUnidadeCurricular(
    textoPDF,
    unidade
) {
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
            .filter(
                palavra =>
                    palavra.length >= 4
            );

    for (const palavra of palavras) {

        const pos =
            textoNormalizado.indexOf(
                palavra
            );

        if (pos !== -1) {
            return pos;
        }
    }

    return -1;
}

// ======================================================
// EXTRAIR TRECHO RELEVANTE DO PDF
// ======================================================

function extrairTrecho(
    textoPDF,
    unidade
) {
    const textoNormalizado =
        normalizarTexto(textoPDF);

    const unidadeNormalizada =
        normalizarTexto(unidade);

    let posicao =
        encontrarUnidadeCurricular(
            textoPDF,
            unidade
        );

    // --------------------------------------------------
    // SE NÃO ENCONTRAR A UC
    // --------------------------------------------------

    if (posicao === -1) {

        return textoPDF.substring(
            0,
            1500
        );
    }

    // --------------------------------------------------
    // PROCURAR NOVAMENTE NO TEXTO NORMALIZADO
    // --------------------------------------------------

    posicao =
        textoNormalizado.indexOf(
            unidadeNormalizada
        );

    if (posicao === -1) {
        posicao = 0;
    }

    // --------------------------------------------------
    // TRECHO REDUZIDO
    // --------------------------------------------------

    const inicio =
        Math.max(
            0,
            posicao - 500
        );

    const fim =
        Math.min(
            textoPDF.length,
            posicao + 1000
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
        cursoNormalizado.includes(
            "informatica"
        )
    ) {

        return path.join(
            __dirname,
            "referencias",
            "informatica",
            "plano_de_curso.pdf"
        );
    }

    if (
        cursoNormalizado.includes(
            "biotecnologia"
        )
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

async function gerarDesenvolvimento(
    dados,
    trechoPDF
) {

    const prompt = `
Você é um Assistente Pedagógico especializado na metodologia SENAI.

Transforme somente as informações fornecidas pelo docente em uma redação pedagógica curta, profissional e objetiva.

Não invente informações.
Não crie conteúdos, atividades, etapas, avaliações ou metodologias que não estejam nas informações fornecidas.
Não amplie a descrição do docente.
O conteúdo e a atividade informados pelo docente têm prioridade.

Docente: ${dados.docente}
Unidade Curricular: ${dados.unidade_curricular}
Curso: ${dados.curso}
Turma: ${dados.turma}
Período: ${dados.data}

Conteúdo:
${dados.conteudo}

Atividade:
${dados.atividade}

Plano de curso:
${trechoPDF}

Use o plano de curso somente para verificar a nomenclatura e manter coerência com a Unidade Curricular.

Responda somente neste formato:

Estratégia: uma frase curta sobre como a aula será conduzida.

Atividade em sala: uma frase curta sobre a ação dos estudantes.

Não utilize Markdown.
Não utilize asteriscos.
Não explique a resposta.
Retorne somente a Estratégia e a Atividade em sala.
`;

    const resposta =
        await client.responses.create({

            model: "gpt-5.6-luna",

            input: prompt,

            max_output_tokens: 200
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

            console.log(
                "\n======================================"
            );

            console.log(
                "NOVA SOLICITAÇÃO"
            );

            console.log(
                "======================================"
            );

            const dados = req.body;

            // --------------------------------------------------
            // VALIDAR DADOS
            // --------------------------------------------------

            if (!dados) {

                return res.status(400).json({
                    sucesso: false,
                    erro:
                        "Nenhum dado foi recebido."
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
                    erro:
                        "Preencha todos os campos."
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

            console.log(
                "Data inicial:",
                dataInicio
            );

            console.log(
                "Data final:",
                dataFim
            );

            let intervalo = dataInicio;

            if (dataInicio === dataFim) {

                intervalo =
                    `${dataInicio}`;

            } else {

                intervalo =
                    `${dataInicio} até ${dataFim}`;
            }

            console.log(
                "Período:",
                intervalo
            );

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

            console.log(
                "Tamanho do trecho:",
                trechoPDF.length,
                "caracteres"
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
                "Desenvolvimento gerado:"
            );

            console.log(
                desenvolvimento
            );

            // --------------------------------------------------
            // CHAMAR API FLASK
            // --------------------------------------------------

            console.log(
                "Enviando dados para API Flask..."
            );

            console.log(
                "URL da API Flask:",
                FLASK_API_URL
            );

            const respostaWord =
                await fetch(
                    `${FLASK_API_URL}/gerar-pdf`,
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

            // --------------------------------------------------
            // VERIFICAR RESPOSTA FLASK
            // --------------------------------------------------

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

            // --------------------------------------------------
            // TRATAMENTO ESPECÍFICO DO RATE LIMIT
            // --------------------------------------------------

            if (
                erro.code ===
                "rate_limit_exceeded"
            ) {

                return res.status(429).json({
                    sucesso: false,
                    erro:
                        "A API atingiu o limite de requisições. Aguarde alguns minutos e tente novamente."
                });
            }

            return res.status(500).json({
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
            `Servidor rodando na porta ${PORTA}`
        );

        console.log(
            "======================================"
        );
    }
);