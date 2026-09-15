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
    const paralelaInput = linha.querySelector(".paralela");
    const fezParalela = linha.querySelector(".fez-paralela").value;
    const resultado = linha.querySelector(".resultado");

    const media = parseFloat(mediaInput.value);
    const paralela = parseFloat(paralelaInput.value);

    // Se a média ainda não foi informada
    if (isNaN(media)) {
        resultado.textContent = "Aguardando dados";
        return;
    }

    // Média maior que 6: não faz avaliação final
    if (media > 6) {
        resultado.textContent = "Não faz avaliação final";
        return;
    }

    // Média menor que 1,666
    if (media < 1.666) {

        // Ainda não fez a paralela
        if (fezParalela === "nao") {
            resultado.textContent = "Deve fazer a paralela";
            return;
        }

        // Fez paralela, mas não informou a nota
        if (isNaN(paralela)) {
            resultado.textContent = "Informe a nota da paralela";
            return;
        }

        // Paralela abaixo de 1,666
        if (paralela < 1.666) {
            resultado.textContent = "Sem direito à avaliação final";
            return;
        }
    }

    // Por padrão, utiliza a média final
    let mediaBase = media;

    // Se fez paralela
    if (fezParalela === "sim") {

        if (isNaN(paralela)) {
            resultado.textContent = "Informe a nota da paralela";
            return;
        }

        // A paralela só substitui a média se for MAIOR
        if (paralela > media) {
            mediaBase = paralela;
        }
    }

    // Cálculo da avaliação final
    const notaFinal = (50 - (6 * mediaBase)) / 4;

    resultado.textContent = `Nota necessária: ${notaFinal.toFixed(2)}`;
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
