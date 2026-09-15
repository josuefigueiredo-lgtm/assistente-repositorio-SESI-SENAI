const quantidade = document.getElementById("quantidade");
const btnCriar = document.getElementById("btnCriar");

const configuracao = document.getElementById("configuracao");
const areaAlunos = document.getElementById("areaAlunos");

const listaAlunos = document.getElementById("listaAlunos");
const btnNovaLista = document.getElementById("btnNovaLista");

/* ==========================================
CRIAR LISTA DE ALUNOS
========================================== */

btnCriar.addEventListener("click", function () {


const total = Number(quantidade.value);

if (!total || total < 1) {
    alert("Informe uma quantidade válida de alunos.");
    return;
}

listaAlunos.innerHTML = "";

for (let i = 1; i <= total; i++) {

    const linha = document.createElement("tr");

    linha.innerHTML = `

        <td>
            ${i}
        </td>

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

        <td class="resultado aguardando">
            Aguardando dados
        </td>

    `;

    listaAlunos.appendChild(linha);
}


configurarEventos();

configuracao.style.display = "none";

areaAlunos.style.display = "block";


});

/* ==========================================
EVENTOS DAS LINHAS
========================================== */

function configurarEventos() {


const linhas = document.querySelectorAll("#listaAlunos tr");

linhas.forEach(function (linha) {

    const media = linha.querySelector(".media");
    const fezParalela = linha.querySelector(".fez-paralela");
    const paralela = linha.querySelector(".paralela");
    const resultado = linha.querySelector(".resultado");


    /* ----------------------------------
       ALTERAÇÃO DA PARARELA
       ---------------------------------- */

    fezParalela.addEventListener("change", function () {

        if (fezParalela.value === "sim") {

            paralela.disabled = false;

        } else {

            paralela.disabled = true;
            paralela.value = "";

        }

        calcular(linha);

    });


    /* ----------------------------------
       ALTERAÇÃO DA MÉDIA
       ---------------------------------- */

    media.addEventListener("input", function () {

        calcular(linha);

    });


    /* ----------------------------------
       ALTERAÇÃO DA NOTA DA PARALELA
       ---------------------------------- */

    paralela.addEventListener("input", function () {

        calcular(linha);

    });

});


}

/* ==========================================
CÁLCULO
========================================== */

function calcular(linha) {

const mediaInput = linha.querySelector(".media");
const fezParalela = linha.querySelector(".fez-paralela");
const paralelaInput = linha.querySelector(".paralela");
const resultado = linha.querySelector(".resultado");


const media = Number(mediaInput.value);


/* ==========================================
   SEM MÉDIA INFORMADA
   ========================================== */

if (mediaInput.value === "") {

    resultado.textContent = "Aguardando dados";

    resultado.className =
        "resultado aguardando";

    return;
}


/* ==========================================
   SE FEZ PARALELA
   ========================================== */

if (fezParalela.value === "sim") {

    /* -------------------------------
       AINDA NÃO INFORMOU A PARALELA
       ------------------------------- */

    if (paralelaInput.value === "") {

        resultado.textContent =
            "Aguardando nota da paralela";

        resultado.className =
            "resultado aguardando";

        return;
    }


    const paralela = Number(
        paralelaInput.value
    );


    /* -------------------------------
       PARALELA ABAIXO DE 1,66
       ------------------------------- */

    if (paralela < 1.66) {

        resultado.textContent =
            "Sem direito à avaliação final";

        resultado.className =
            "resultado sem-direito";

        return;
    }


    /* -------------------------------
       PARALELA É MAIOR QUE A MÉDIA
       ------------------------------- */

    if (paralela > media) {

        const avaliacaoFinal =
            (50 - (6 * paralela)) / 4;

        resultado.textContent =
            avaliacaoFinal.toFixed(2);

        resultado.className =
            "resultado permitido";

        return;
    }

}


/* ==========================================
   SEM PARALELA OU PARALELA NÃO SUPERIOR
   ========================================== */

/* Se a média estiver abaixo de 1,66
   e não houve uma paralela válida
   para substituir a média */

if (media < 1.66) {

    resultado.textContent =
        "Sem direito à avaliação final";

    resultado.className =
        "resultado sem-direito";

    return;
}


/* ==========================================
   CÁLCULO PELA MÉDIA FINAL
   ========================================== */

const avaliacaoFinal =
    (50 - (6 * media)) / 4;


resultado.textContent =
    avaliacaoFinal.toFixed(2);

resultado.className =
    "resultado permitido";

}
/* ==========================================
NOVA LISTA
========================================== */

btnNovaLista.addEventListener("click", function () {


quantidade.value = "";

listaAlunos.innerHTML = "";

areaAlunos.style.display = "none";

configuracao.style.display = "block";


});
