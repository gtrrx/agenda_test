const dias = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const LIMITE_TAREFAS_DIA = 3;

// ==========================
// DATA (COM CACHE)
// ==========================

function obterDataAtualAPI() {
    let hoje = new Date();
    hoje.setHours(0,0,0,0);
    return Promise.resolve(hoje);
}

// ==========================
// DADOS
// ==========================

async function limparTarefasVencidas(dados) {
    let hoje = await obterDataAtualAPI();
    let modificado = false;

    for (let d of dias) {
        let original = dados[d] || [];

        let filtrado = original.filter(t => {
            if (!t || !t.entrega) return true;
            if (t.concluida) return true;

            let entrega = new Date(t.entrega);
            entrega.setHours(0,0,0,0);

            return entrega >= hoje;
        });

        if (filtrado.length !== original.length) {
            dados[d] = filtrado;
            modificado = true;
        }
    }

    return modificado;
}

async function obterDados() {
    let dados = JSON.parse(localStorage.getItem("planner"));

    if (!dados) {
        dados = {};
        dias.forEach(d => dados[d] = []);
    }

    const alterou = await limparTarefasVencidas(dados);

    if (alterou) salvarDados(dados);

    return dados;
}

function salvarDados(dados) {
    localStorage.setItem("planner", JSON.stringify(dados));
}

// ==========================
// LÓGICA INTELIGENTE
// ==========================

function pesoDificuldade(nivel) {
    return { facil:1, medio:2, dificil:3 }[nivel] || 1;
}

function pesoPrioridade(p) {
    return { leve:1, normal:2, urgente:3 }[p] || 2;
}

function calcularCargaDia(tarefas) {
    return tarefas.reduce((t, x) =>
        t + pesoDificuldade(x.dificuldade) + pesoPrioridade(x.prioridade || "normal"), 0);
}

function escolherMelhorDia(dados, diasDisponiveis, usados) {
    let melhor = null;
    let menor = Infinity;

    diasDisponiveis.forEach(dia => {
        if (usados.includes(dia)) return;

        let tarefas = dados[dia] || [];
        if (tarefas.length >= LIMITE_TAREFAS_DIA) return;

        let carga = calcularCargaDia(tarefas);

        if (carga < menor) {
            menor = carga;
            melhor = dia;
        }
    });

    if (!melhor) melhor = diasDisponiveis[0];
    return melhor;
}

// ==========================
// ADICIONAR TAREFA
// ==========================

async function adicionarTarefa() {
    let texto = document.getElementById("entradaTarefa").value.trim();
    let dificuldade = document.getElementById("dificuldade").value;
    let categoria = document.getElementById("categoria").value;
    let prioridade = document.getElementById("prioridade").value;
    let dataEntrega = document.getElementById("dataEntrega").value;

    if (!texto || !dataEntrega) return;

    let dados = await obterDados();
    let diasDisponiveis = gerarDiasAtePrazo(dataEntrega);

    let etapas = [];

    if (categoria === "prova")
        etapas = ["Estudo", "Exercícios", "Revisão"];
    else if (categoria === "trabalho" || categoria === "redacao")
        etapas = ["Pesquisa", "Produção", "Revisão"];
    else
        etapas = [texto];

    let usados = [];

    etapas.forEach(etapa => {
        let dia;

        if (etapa.toLowerCase().includes("revis"))
            dia = diasDisponiveis[diasDisponiveis.length - 1];
        else
            dia = escolherMelhorDia(dados, diasDisponiveis, usados);

        usados.push(dia);

        dados[dia].push({
            texto: `${texto} - ${etapa}`,
            categoria,
            dificuldade,
            prioridade,
            concluida: false,
            entrega: dataEntrega
        });
    });

    salvarDados(dados);
    document.getElementById("entradaTarefa").value = "";
    atualizarTela();
}

// ==========================
// TELA
// ==========================

async function atualizarTela() {
    await mostrarSemana();
    await mostrarHoje();
}

async function mostrarSemana() {
    let container = document.getElementById("semana");
    container.innerHTML = "";

    let dados = await obterDados();

    dias.forEach(dia => {
        let div = document.createElement("div");
        div.className = "coluna";

        let titulo = document.createElement("h4");
        titulo.textContent = dia.toUpperCase();

        let ul = document.createElement("ul");

        (dados[dia] || []).forEach((t, i) => {
            ul.appendChild(criarItem(t, dia, i));
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

    if (tarefa.concluida) li.classList.add("concluida");
    li.classList.add(tarefa.categoria);

    let data = new Date(tarefa.entrega).toLocaleDateString("pt-BR");

    li.innerHTML = `
        <span>${tarefa.texto} (${tarefa.dificuldade}) - até ${data}</span>
        <div class="botoes">
            <button onclick="toggleConcluida('${dia}',${index})">✔</button>
            <button onclick="excluirTarefa('${dia}',${index})">🗑</button>
        </div>
    `;

    return li;
}

// ==========================
// AÇÕES
// ==========================

async function toggleConcluida(dia, index) {
    let dados = await obterDados();
    dados[dia][index].concluida = !dados[dia][index].concluida;
    salvarDados(dados);
    atualizarTela();
}

async function excluirTarefa(dia, index) {
    let dados = await obterDados();
    dados[dia].splice(index, 1);
    salvarDados(dados);
    atualizarTela();
}

// ==========================
// HOJE
// ==========================

async function mostrarHoje() {
    let mapa = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
    let hoje = mapa[new Date().getDay()];

    if (hoje === "domingo") hoje = "segunda";

    document.getElementById("hojeTitulo").textContent =
        `Hoje (${hoje.toUpperCase()})`;

    let lista = document.getElementById("listaHoje");
    lista.innerHTML = "";

    let dados = await obterDados();

    (dados[hoje] || []).forEach((t, i) => {
        lista.appendChild(criarItem(t, hoje, i));
    });
}

// ==========================
// PENDÊNCIAS
// ==========================

async function mostrarPendencias() {
    let container = document.getElementById("listaPendencias");
    container.innerHTML = "";

    let dados = await obterDados();
    let hoje = await obterDataAtualAPI();

    let tarefas = [];

    dias.forEach(d => {
        (dados[d] || []).forEach(t => {
            if (t.concluida) return;

            let entrega = new Date(t.entrega);
            entrega.setHours(0,0,0,0);

            let diff = (entrega - hoje)/(1000*60*60*24);

            if (diff <= 2) tarefas.push({...t, diff});
        });
    });

    tarefas.sort((a,b)=> new Date(a.entrega)-new Date(b.entrega));

    tarefas.forEach(t => {
        let li = document.createElement("li");

        if (t.diff <= 0) li.classList.add("urgente");
        else if (t.diff === 1) li.classList.add("alerta");

        li.textContent = `${t.texto} - até ${new Date(t.entrega).toLocaleDateString("pt-BR")}`;
        container.appendChild(li);
    });
}

// ==========================
// NAVEGAÇÃO
// ==========================

function abrirPlanejamento() {
    document.getElementById("telaPrincipal").style.display = "none";
    document.getElementById("telaPlanejamento").style.display = "block";
    atualizarTela();
}

function abrirPendencias() {
    document.getElementById("telaPrincipal").style.display = "none";
    document.getElementById("telaPendencias").style.display = "block";
    mostrarPendencias();
}

function voltarInicio() {
    document.getElementById("telaPrincipal").style.display = "block";
    document.getElementById("telaPlanejamento").style.display = "none";
    document.getElementById("telaPendencias").style.display = "none";
    mostrarHoje();
}

// ==========================
// PRAZO
// ==========================

function gerarDiasAtePrazo(dataEntrega) {
    let hoje = new Date();
    let prazo = new Date(dataEntrega);

    let lista = [];

    while (hoje <= prazo) {
        let mapa = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
        let dia = mapa[hoje.getDay()];

        if (dia !== "domingo") lista.push(dia);

        hoje.setDate(hoje.getDate() + 1);
    }

    return lista;
}

// ==========================
// OUTROS
// ==========================

function exportarDados() {
    let dados = localStorage.getItem("planner");

    let blob = new Blob([dados], { type: "application/json" });
    let link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "planner.json";
    link.click();
}

function importarDados(e) {
    let file = e.target.files[0];
    let reader = new FileReader();

    reader.onload = () => {
        localStorage.setItem("planner", reader.result);
        atualizarTela();
    };

    reader.readAsText(file);
}

function toggleTema() {
    document.body.classList.toggle("dark");
    localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
}

(function () {
    if (localStorage.getItem("tema") === "dark") {
        document.body.classList.add("dark");
    }
})();

// ==========================
// INIT
// ==========================

window.onload = () => {
    atualizarTela();

    let hoje = new Date().toISOString().split("T")[0];
    document.getElementById("dataEntrega").setAttribute("min", hoje);
};