const criarLista = document.getElementById("criarLista");
const quantidadeInput = document.getElementById("quantidade");
const listaAlunos = document.getElementById("listaAlunos");
const areaTabela = document.getElementById("areaTabela");
const novaLista = document.getElementById("novaLista");
const exportar = document.getElementById("exportar");


/* =========================================
   CRIAR LISTA DE ALUNOS
========================================= */

criarLista.addEventListener("click", function () {

    const quantidade = parseInt(quantidadeInput.value);

    if (!quantidade || quantidade < 1) {
        alert("Informe uma quantidade válida de alunos.");
        return;
    }

    listaAlunos.innerHTML = "";

    for (let i = 1; i <= quantidade; i++) {

        const linha = document.createElement("tr");

        linha.innerHTML = `

            <td>${i}</td>

            <td>
                <input
                    type="text"
                    class="nome"
                    placeholder="Nome do aluno"
                >
            </td>

            <td>
                <input
                    type="number"
                    class="media"
                    min="0"
                    max="10"
                    step="0.01"
                    placeholder="0,00"
                >
            </td>

            <td>
                <select class="fez-paralela">

                    <option value="nao">
                        Não
                    </option>

                    <option value="sim">
                        Sim
                    </option>

                </select>
            </td>

            <td>
                <input
                    type="number"
                    class="paralela"
                    min="0"
                    max="10"
                    step="0.01"
                    placeholder="0,00"
                    disabled
                >
            </td>

            <td class="resultado">
                Aguardando dados
            </td>

        `;

        listaAlunos.appendChild(linha);

        configurarLinha(linha);
    }

    areaTabela.style.display = "block";
});


/* =========================================
   CONFIGURAR CADA LINHA
========================================= */

function configurarLinha(linha) {

    const media = linha.querySelector(".media");
    const fezParalela = linha.querySelector(".fez-paralela");
    const paralela = linha.querySelector(".paralela");

    fezParalela.addEventListener("change", function () {

        if (fezParalela.value === "sim") {

            paralela.disabled = false;

        } else {

            paralela.disabled = true;
            paralela.value = "";

        }

        calcular(linha);
    });

    media.addEventListener("input", function () {
        calcular(linha);
    });

    paralela.addEventListener("input", function () {
        calcular(linha);
    });
}


/* =========================================
   CÁLCULO DA AVALIAÇÃO FINAL
========================================= */

function calcular(linha) {

    const mediaInput = linha.querySelector(".media");
    const paralelaInput = linha.querySelector(".paralela");
    const fezParalela = linha.querySelector(".fez-paralela").value;
    const resultado = linha.querySelector(".resultado");

    const media = parseFloat(mediaInput.value);
    const paralela = parseFloat(paralelaInput.value);


    /* =========================================
       MÉDIA NÃO INFORMADA
    ========================================= */

    if (isNaN(media)) {

        resultado.textContent = "Aguardando dados";

        return;
    }


    /* =========================================
       MÉDIA MAIOR QUE 6
    ========================================= */

    if (media > 6) {

        resultado.textContent =
            "Não faz avaliação final";

        return;
    }


    /* =========================================
       MÉDIA MENOR QUE 1,666
    ========================================= */

    if (media < 1.666) {

        /*
            Se ainda não fez a paralela,
            precisa realizar a paralela.
        */

        if (fezParalela === "nao") {

            resultado.textContent =
                "Deve fazer a paralela";

            return;
        }


        /*
            Fez a paralela, mas não informou
            a nota.
        */

        if (isNaN(paralela)) {

            resultado.textContent =
                "Informe a nota da paralela";

            return;
        }


        /*
            Paralela abaixo de 1,666:
            sem direito à avaliação final.
        */

        if (paralela < 1.666) {

            resultado.textContent =
                "Sem direito à avaliação final";

            return;
        }
    }


    /* =========================================
       DEFINIR A MÉDIA QUE SERÁ UTILIZADA
    ========================================= */

    let mediaBase = media;


    if (fezParalela === "sim") {

        /*
            Se marcou que fez paralela,
            mas não informou a nota.
        */

        if (isNaN(paralela)) {

            resultado.textContent =
                "Informe a nota da paralela";

            return;
        }


        /*
            Se alcançou 6 ou mais na paralela,
            não precisa fazer avaliação final.
        */

        if (paralela >= 6) {

            resultado.textContent =
                "Não faz avaliação final";

            return;
        }


        /*
            A paralela só substitui a média
            se for MAIOR que a Média Final.
        */

        if (paralela > media) {

            mediaBase = paralela;
        }
    }


    /* =========================================
       CALCULAR NOTA DA AVALIAÇÃO FINAL
    ========================================= */

    const notaFinal =
        (50 - (6 * mediaBase)) / 4;


    resultado.textContent =
        `Nota necessária: ${notaFinal.toFixed(2)}`;
}


/* =========================================
   NOVA LISTA
========================================= */

novaLista.addEventListener("click", function () {

    listaAlunos.innerHTML = "";

    areaTabela.style.display = "none";

    quantidadeInput.value = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


/* =========================================
   EXPORTAR PARA EXCEL
========================================= */

exportar.addEventListener("click", function () {

    const linhas =
        document.querySelectorAll("#tabelaAlunos tbody tr");


    if (linhas.length === 0) {

        alert("Não há alunos para exportar.");

        return;
    }


    const dados = [];


    linhas.forEach(function (linha, index) {

        const nome =
            linha.querySelector(".nome").value;

        const mediaTexto =
            linha.querySelector(".media").value;

        const fezParalela =
            linha.querySelector(".fez-paralela").value;

        const paralelaTexto =
            linha.querySelector(".paralela").value;

        const resultado =
            linha.querySelector(".resultado").textContent;


        const media =
            parseFloat(mediaTexto);

        const paralela =
            parseFloat(paralelaTexto);


        let mediaUsada = "";
        let notaFinal = "";


        /* =========================================
           DEFINIR NOTA USADA
        ========================================= */

        if (!isNaN(media)) {

            /*
                Se a média final for maior que 6,
                não existe avaliação final.
            */

            if (media > 6) {

                mediaUsada = media;

            } else {

                /*
                    A paralela só substitui a média
                    se for MAIOR.
                */

                if (
                    fezParalela === "sim" &&
                    !isNaN(paralela) &&
                    paralela > media
                ) {

                    mediaUsada = paralela;

                } else {

                    mediaUsada = media;
                }
            }


            /* =========================================
               CALCULAR NOTA DA AVALIAÇÃO FINAL
            ========================================= */

            /*
                Se a paralela alcançou 6,
                não faz avaliação final.
            */

            if (
                fezParalela === "sim" &&
                !isNaN(paralela) &&
                paralela >= 6
            ) {

                notaFinal = "";

            } else if (
                mediaUsada >= 1.666 &&
                mediaUsada <= 6
            ) {

                notaFinal =
                    ((50 - (6 * mediaUsada)) / 4)
                    .toFixed(2);
            }
        }


        /* =========================================
           ADICIONAR DADOS À PLANILHA
        ========================================= */

        dados.push({

            "Nº": index + 1,

            "Nome do aluno": nome,

            "Média Final": mediaTexto,

            "Fez Paralela?":
                fezParalela === "sim"
                    ? "Sim"
                    : "Não",

            "Nota da Paralela":
                paralelaTexto,

            "Nota usada":
                mediaUsada,

            "Avaliação Final":
                notaFinal,

            "Situação":
                resultado
        });

    });


    /* =========================================
       CRIAR PLANILHA
    ========================================= */

    const planilha =
        XLSX.utils.json_to_sheet(dados);


    /* =========================================
       LARGURA DAS COLUNAS
    ========================================= */

    planilha["!cols"] = [

        { wch: 6 },
        { wch: 30 },
        { wch: 15 },
        { wch: 18 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 35 }

    ];


    /* =========================================
       CRIAR ARQUIVO EXCEL
    ========================================= */

    const arquivo =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        arquivo,
        planilha,
        "Média Final"
    );


    XLSX.writeFile(
        arquivo,
        "resultado_media_final.xlsx"
    );

});