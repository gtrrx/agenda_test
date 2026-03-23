const dias = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
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

    for (let i = 0; i < 7; i++) {
        let diaAtual = dias[(indice + i) % 7];

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
    let dia = document.getElementById("diaSemana").value;
    let dificuldade = document.getElementById("dificuldade").value;
    let categoria = document.getElementById("categoria").value;

    if (!texto) return;

    let dados = obterDados();
    let indiceDia = dias.indexOf(dia);

    // 🔹 PESQUISA e ATIVIDADES (simples)
    if (categoria === "pesquisa" || categoria === "atividades") {

        let diaFinal = encontrarDiaDisponivel(dados, dia);

        dados[diaFinal].push({
            texto: texto,
            categoria: categoria,
            dificuldade: dificuldade,
            concluida: false
        });
    }

    // 🔹 PROVA (dividir estudo)
    else if (categoria === "prova") {

        let etapas = [
            "Estudar conteúdo",
            "Fazer exercícios",
            "Revisão final"
        ];

        etapas.forEach((etapa, i) => {
            let diaBase = dias[(indiceDia + i) % 7];
            let diaAtual = encontrarDiaDisponivel(dados, diaBase);

            dados[diaAtual].push({
                texto: texto + " - " + etapa,
                categoria: categoria,
                dificuldade: dificuldade,
                concluida: false
            });
        });
    }

    // 🔹 TRABALHO e REDAÇÃO
    else if (categoria === "trabalho" || categoria === "redacao") {

        let etapas = [
            "Pesquisa",
            "Produção",
            "Revisão"
        ];

        etapas.forEach((etapa, i) => {
            let diaBase = dias[(indiceDia + i) % 7];
            let diaAtual = encontrarDiaDisponivel(dados, diaBase);

            dados[diaAtual].push({
                texto: texto + " - " + etapa,
                categoria: categoria,
                dificuldade: dificuldade,
                concluida: false
            });
        });
    }

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

// Mostrar semana
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

// Criar item
function criarItem(tarefa, dia, index) {
    let li = document.createElement("li");

    if (tarefa.concluida) {
        li.classList.add("concluida");
    }

    li.classList.add(tarefa.categoria);

    let texto = document.createElement("span");
    texto.textContent = tarefa.texto + " (" + tarefa.dificuldade + ")";

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
// HOJE (FOCO PRINCIPAL)
// ==========================

function mostrarHoje() {
    let hoje = new Date().getDay();

    let mapa = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    let diaAtual = mapa[hoje];

    document.getElementById("hojeTitulo").textContent =
        "Hoje você precisa fazer (" + diaAtual.toUpperCase() + ")";

    let lista = document.getElementById("listaHoje");
    lista.innerHTML = "";

    let dados = obterDados();

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

    let blob = new Blob([dados], { type: "application/json" });

    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "planner.json";
    link.click();
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


// TELAS
function abrirPlanejamento() {
    document.getElementById("telaPrincipal").style.display = "none";
    document.getElementById("telaPlanejamento").style.display = "block";

    atualizarTela(); // garante atualização
}

function voltarInicio() {
    document.getElementById("telaPrincipal").style.display = "block";
    document.getElementById("telaPlanejamento").style.display = "none";

    mostrarHoje(); // atualiza só o hoje
}

atualizarTela();