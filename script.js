const dias = ["segunda","terca","quarta","quinta","sexta","sabado","domingo"];

// Obter dados
function obterDados() {
    let dados = JSON.parse(localStorage.getItem("planner"));

    if (!dados) {
        dados = {};
        dias.forEach(d => dados[d] = []);
    }

    return dados;
}

// Salvar
function salvarDados(dados) {
    localStorage.setItem("planner", JSON.stringify(dados));
}

// Adicionar tarefa
function adicionarTarefa() {
    let texto = document.getElementById("entradaTarefa").value;
    let dia = document.getElementById("diaSemana").value;

    if (!texto) return;

    let dados = obterDados();

    dados[dia].push({
        texto: texto,
        concluida: false
    });

    salvarDados(dados);

    document.getElementById("entradaTarefa").value = "";

    atualizarTela();
}

// Atualizar tela
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
        titulo.textContent = dia.toUpperCase();

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

    let texto = document.createElement("span");
    texto.textContent = tarefa.texto;

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

// Concluir tarefa
function toggleConcluida(dia, index) {
    let dados = obterDados();

    dados[dia][index].concluida = !dados[dia][index].concluida;

    salvarDados(dados);
    atualizarTela();
}

// Excluir tarefa
function excluirTarefa(dia, index) {
    let dados = obterDados();

    dados[dia].splice(index, 1);

    salvarDados(dados);
    atualizarTela();
}

// Mostrar hoje
function mostrarHoje() {
    let hoje = new Date().getDay();

    let mapa = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
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

// Exportar
function exportarDados() {
    let dados = localStorage.getItem("planner");

    let blob = new Blob([dados], { type: "application/json" });

    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "planner.json";
    link.click();
}

// Importar
function importarDados(event) {
    let arquivo = event.target.files[0];
    if (!arquivo) return;

    let leitor = new FileReader();

    leitor.onload = function(e) {
        localStorage.setItem("planner", e.target.result);
        atualizarTela();
    };

    leitor.readAsText(arquivo);
}

// Inicializar
atualizarTela();