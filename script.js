const dias = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const LIMITE_TAREFAS_DIA = 3;


// ==========================
// DADOS
// ==========================

function obterDados() {
    let dados = JSON.parse(localStorage.getItem("planner"));

    if (!dados) {
        dados = {};
        dias.forEach(d => dados[d] = []);
    }

    return dados;
}

function salvarDados(dados) {
    localStorage.setItem("planner", JSON.stringify(dados));
}


// ==========================
// LÓGICA DE DISTRIBUIÇÃO
// ==========================

function encontrarDiaDisponivel(dados, diaInicial) {
    let indice = dias.indexOf(diaInicial);

    for (let i = 0; i < dias.length; i++) {
        let diaAtual = dias[(indice + i) % dias.length];

        if (dados[diaAtual].length < LIMITE_TAREFAS_DIA) {
            return diaAtual;
        }
    }

    return diaInicial;
}


// ==========================
// ADICIONAR TAREFA
// ==========================

function adicionarTarefa() {
    let input = document.getElementById("entradaTarefa");
    let texto = input.value.trim();
    let dificuldade = document.getElementById("dificuldade").value;
    let categoria = document.getElementById("categoria").value;
    let dataEntrega = document.getElementById("dataEntrega").value;

    if (!texto || !dataEntrega) return;

    let dados = obterDados();

    let diasDisponiveis = gerarDiasAtePrazo(dataEntrega);

    if (diasDisponiveis.length === 0) {
        alert("Data de entrega inválida!");
        return;
    }

    let etapas = [];

    if (categoria === "prova") {
        etapas = ["Estudar conteúdo", "Fazer exercícios", "Revisão final"];
    } else if (categoria === "trabalho" || categoria === "redacao") {
        etapas = ["Pesquisa", "Produção", "Revisão"];
    } else {
        etapas = [texto];
    }

    let indexDia = 0;

    etapas.forEach((etapa, i) => {

        let tentativas = 0;
        let diaEscolhido = null;

        while (tentativas < diasDisponiveis.length) {
            let dia = diasDisponiveis[indexDia % diasDisponiveis.length];

            if (dados[dia].length < LIMITE_TAREFAS_DIA) {
                diaEscolhido = dia;
                break;
            }

            indexDia++;
            tentativas++;
        }

        if (!diaEscolhido) {
            diaEscolhido = diasDisponiveis[i % diasDisponiveis.length];
        }

        dados[diaEscolhido].push({
            texto: categoria === "pesquisa" || categoria === "atividades"
                ? texto
                : texto + " - " + etapa,
            categoria: categoria,
            dificuldade: dificuldade,
            concluida: false,
            entrega: dataEntrega
        });

        indexDia++;
    });

    salvarDados(dados);

    input.value = "";
    input.focus();

    atualizarTela();
}


// ==========================
// TELA
// ==========================

function atualizarTela() {
    mostrarSemana();
    mostrarHoje();
}

function mostrarSemana() {
    let container = document.getElementById("semana");
    container.innerHTML = "";

    let dados = obterDados();

    dias.forEach(dia => {
        let div = document.createElement("div");
        div.className = "coluna";

        let titulo = document.createElement("h4");

        if (dados[dia].length >= LIMITE_TAREFAS_DIA) {
            titulo.textContent = dia.toUpperCase() + " ⚠";
        } else {
            titulo.textContent = dia.toUpperCase();
        }

        let ul = document.createElement("ul");

        dados[dia].forEach((tarefa, index) => {
            let li = criarItem(tarefa, dia, index);
            ul.appendChild(li);
        });

        div.appendChild(titulo);
        div.appendChild(ul);

        container.appendChild(div);
    });
}


// ==========================
// ITEM
// ==========================

function criarItem(tarefa, dia, index) {
    let li = document.createElement("li");

    if (tarefa.concluida) {
        li.classList.add("concluida");
    }

    li.classList.add(tarefa.categoria);

    let dataFormatada = new Date(tarefa.entrega).toLocaleDateString("pt-BR");

    let texto = document.createElement("span");
    texto.textContent =
        tarefa.texto + " (" + tarefa.dificuldade + ") - até " + dataFormatada;

    let botoes = document.createElement("div");
    botoes.className = "botoes";

    let btnCheck = document.createElement("button");
    btnCheck.textContent = "✔";
    btnCheck.onclick = () => toggleConcluida(dia, index);

    let btnDel = document.createElement("button");
    btnDel.textContent = "🗑";
    btnDel.onclick = () => excluirTarefa(dia, index);

    botoes.appendChild(btnCheck);
    botoes.appendChild(btnDel);

    li.appendChild(texto);
    li.appendChild(botoes);

    return li;
}


// ==========================
// AÇÕES
// ==========================

function toggleConcluida(dia, index) {
    let dados = obterDados();
    dados[dia][index].concluida = !dados[dia][index].concluida;
    salvarDados(dados);
    atualizarTela();
}

function excluirTarefa(dia, index) {
    let dados = obterDados();
    dados[dia].splice(index, 1);
    salvarDados(dados);
    atualizarTela();
}


// ==========================
// HOJE
// ==========================

function mostrarHoje() {
    let hoje = new Date().getDay();

    let mapa = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

    let diaAtual = mapa[hoje];

    if (diaAtual === "domingo") {
        diaAtual = "segunda";
    }

    document.getElementById("hojeTitulo").textContent =
        "Hoje você precisa fazer (" + diaAtual.toUpperCase() + ")";

    let lista = document.getElementById("listaHoje");
    lista.innerHTML = "";

    let dados = obterDados();

    if (!dados[diaAtual] || dados[diaAtual].length === 0) {
        let li = document.createElement("li");
        li.textContent = "Sem tarefas para hoje 🎉";
        lista.appendChild(li);
        return;
    }

    dados[diaAtual].forEach((tarefa, index) => {
        let li = criarItem(tarefa, diaAtual, index);
        lista.appendChild(li);
    });
}


// ==========================
// BACKUP
// ==========================

function exportarDados() {
    let dados = localStorage.getItem("planner");

    if (!dados) {
        alert("Nenhum dado para exportar!");
        return;
    }

    let blob = new Blob([dados], { type: "application/json" });

    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "planner.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importarDados(event) {
    let arquivo = event.target.files[0];
    if (!arquivo) return;

    let leitor = new FileReader();

    leitor.onload = function (e) {
        localStorage.setItem("planner", e.target.result);
        atualizarTela();
    };

    leitor.readAsText(arquivo);
}


// ==========================
// TEMA
// ==========================

function toggleTema() {
    document.body.classList.toggle("dark");

    let tema = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("tema", tema);
}

(function () {
    let tema = localStorage.getItem("tema");
    if (tema === "dark") {
        document.body.classList.add("dark");
    }
})();


// ==========================
// TELAS
// ==========================

function abrirPlanejamento() {
    document.getElementById("telaPrincipal").style.display = "none";
    document.getElementById("telaPlanejamento").style.display = "block";
    atualizarTela();
}

function voltarInicio() {
    document.getElementById("telaPrincipal").style.display = "block";
    document.getElementById("telaPlanejamento").style.display = "none";
    mostrarHoje();
}


// ==========================
// PRAZO
// ==========================

function gerarDiasAtePrazo(dataEntrega) {
    let hoje = new Date();
    let prazo = new Date(dataEntrega);

    let listaDias = [];

    while (hoje <= prazo) {
        let diaSemana = hoje.getDay();

        let mapa = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

        let dia = mapa[diaSemana];

        if (dia !== "domingo") {
            listaDias.push(dia);
        }

        hoje.setDate(hoje.getDate() + 1);
    }

    return listaDias;
}


// ==========================
// INIT
// ==========================

window.onload = function () {
    atualizarTela();

    let hoje = new Date().toISOString().split("T")[0];
    document.getElementById("dataEntrega").setAttribute("min", hoje);
};