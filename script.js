const dias = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const NOMES_DIAS = {
    segunda: "Segunda", terca: "Terça", quarta: "Quarta",
    quinta: "Quinta", sexta: "Sexta", sabado: "Sábado"
};
const LIMITE_TAREFAS_DIA = 3;

// ==========================
// DATA
// ==========================

function obterDataAtualAPI() {
    let hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
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
            entrega.setHours(0, 0, 0, 0);
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
// TOAST
// ==========================

function mostrarToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("visivel");
    setTimeout(() => t.classList.remove("visivel"), 3000);
}

// ==========================
// OPÇÕES DE FORMULÁRIO
// ==========================

function selecionarOpcao(btn, campo) {
    const grupo = btn.parentElement;
    grupo.querySelectorAll('.opcao-btn').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    document.getElementById(campo).value = btn.dataset.val;
}

// ==========================
// LÓGICA INTELIGENTE
// ==========================

function pesoDificuldade(nivel) {
    return { facil: 1, medio: 2, dificil: 3 }[nivel] || 1;
}

function pesoPrioridade(p) {
    return { leve: 1, normal: 2, urgente: 3 }[p] || 2;
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

    if (!texto || !dataEntrega) {
        mostrarToast("⚠️ Preencha o nome e a data da tarefa.");
        return;
    }

    let dados = await obterDados();
    let diasDisponiveis = gerarDiasAtePrazo(dataEntrega);

    if (diasDisponiveis.length === 0) {
        mostrarToast("⚠️ Prazo inválido ou anterior a hoje.");
        return;
    }

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
            texto: etapas.length > 1 ? `${texto} — ${etapa}` : texto,
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
    mostrarToast("✅ Tarefa adicionada com sucesso!");
}

// ==========================
// TELA
// ==========================

async function atualizarTela() {
    await mostrarHoje();
    
}

// ==========================
// PROGRESSO DE HOJE
// ==========================

function atualizarProgresso(tarefas) {
    const total = tarefas.length;
    const concluidas = tarefas.filter(t => t.concluida).length;
    const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    document.getElementById("progressoPct").textContent = pct + "%";

    const fill = document.getElementById("circuloFill");
    fill.setAttribute("stroke-dasharray", `${pct}, 100`);
}

// ==========================
// SEMANA
// ==========================

async function mostrarSemana() {
    let container = document.getElementById("semana");
    container.innerHTML = "";

    let dados = await obterDados();
    let mapa = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    let diaHoje = mapa[new Date().getDay()];

    dias.forEach(dia => {
        let div = document.createElement("div");
        div.className = "coluna-dia";
        if (dia === diaHoje) div.classList.add("hoje-destaque");

        let titulo = document.createElement("div");
        titulo.className = "coluna-dia-titulo";
        titulo.innerHTML = NOMES_DIAS[dia];
        if (dia === diaHoje) {
            titulo.innerHTML += '<span class="dia-badge">hoje</span>';
        }

        let ul = document.createElement("ul");
        let tarefas = dados[dia] || [];

        if (tarefas.length === 0) {
            let vazio = document.createElement("p");
            vazio.className = "coluna-vazia";
            vazio.textContent = "Livre";
            div.appendChild(titulo);
            div.appendChild(vazio);
        } else {
            tarefas.forEach(t => {
                let li = document.createElement("li");
                if (t.concluida) li.classList.add("concluida");

                let dot = document.createElement("span");
                dot.className = `mini-dot mini-${t.categoria}`;

                let nome = document.createTextNode(t.texto.split("—")[0].trim());

                li.appendChild(dot);
                li.appendChild(nome);
                ul.appendChild(li);
            });

            div.appendChild(titulo);
            div.appendChild(ul);
        }

        container.appendChild(div);
    });
}

// ==========================
// ITEM DA LISTA
// ==========================

function criarItem(tarefa, dia, index) {
    let li = document.createElement("li");

    if (tarefa.concluida) {
        li.classList.add("concluida");
    }

    li.classList.add(tarefa.categoria);

    let data = new Date(tarefa.entrega).toLocaleDateString("pt-BR");

    li.innerHTML = `
        <button class="tarefa-check" onclick="toggleConcluida('${dia}', ${index})">
            ${tarefa.concluida ? "✓" : ""}
        </button>

        <div class="tarefa-info">
            <div class="tarefa-texto">${tarefa.texto}</div>
            <div class="tarefa-meta">
                <span class="tag tag-${tarefa.dificuldade}">${tarefa.dificuldade}</span>
                <span>até ${data}</span>
            </div>
        </div>

        <button class="tarefa-excluir" onclick="excluirTarefa('${dia}', ${index})">
            🗑
        </button>
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

    mostrarToast("✔ Tarefa concluída!");

    // Atualiza semana se estiver aberta
    if (document.getElementById("telaSemana").style.display === "block") {
        mostrarSemana();
    }
}

async function excluirTarefa(dia, index) {
    let dados = await obterDados();
    dados[dia].splice(index, 1);
    salvarDados(dados);
    atualizarTela();
    mostrarToast("🗑 Tarefa removida.");

    if (document.getElementById("telaSemana").classList.contains("ativa")) {
        mostrarSemana();
    }
}

// ==========================
// HOJE
// ==========================

async function mostrarHoje() {
    let mapa = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    let hoje = mapa[new Date().getDay()];
    if (hoje === "domingo") hoje = "segunda";

    document.getElementById("hojeTitulo").textContent =
        `tarefas de ${NOMES_DIAS[hoje].toLowerCase()}`;

    let lista = document.getElementById("listaHoje");
    lista.innerHTML = "";

    let dados = await obterDados();
    let tarefas = dados[hoje] || [];

    atualizarProgresso(tarefas);

    let vazio = document.getElementById("vazioHoje");
    if (tarefas.length === 0) {
        vazio.style.display = "block";
        lista.style.display = "none";
    } else {
        vazio.style.display = "none";
        lista.style.display = "flex";
        tarefas.forEach((t, i) => lista.appendChild(criarItem(t, hoje, i)));
    }
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
            entrega.setHours(0, 0, 0, 0);
            let diff = (entrega - hoje) / (1000 * 60 * 60 * 24);
            if (diff <= 2) tarefas.push({ ...t, diff, dia: d });
        });
    });

    tarefas.sort((a, b) => new Date(a.entrega) - new Date(b.entrega));

    let vazio = document.getElementById("vazioPendencias");
    if (tarefas.length === 0) {
        vazio.style.display = "block";
        container.style.display = "none";
        return;
    }

    vazio.style.display = "none";
    container.style.display = "flex";

    tarefas.forEach(t => {
        let li = document.createElement("li");
        li.classList.add(t.categoria);

        if (t.diff <= 0) li.classList.add("urgente-item");
        if (t.diff === 1) li.classList.add("alerta-item");

        let info = document.createElement("div");
        info.className = "tarefa-info";

        let texto = document.createElement("div");
        texto.className = "tarefa-texto";
        texto.textContent = t.texto;

        // BOTÃO EXCLUIR 👇
        let btnExcluir = document.createElement("button");
        btnExcluir.textContent = "🗑";
        btnExcluir.className = "tarefa-excluir";
        btnExcluir.onclick = () => removerPendencia(t);

        // montar
        info.appendChild(texto);
        li.appendChild(info);
        li.appendChild(btnExcluir);

        container.appendChild(li);
    });
}

// ==========================
// NAVEGAÇÃO
// ==========================

function ocultarTodas() {
    document.querySelectorAll(".tela").forEach(t => t.classList.remove("ativa"));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
}

function irParaHoje() {
    ocultarTodas();
    document.getElementById("telaPrincipal").classList.add("ativa");
    document.getElementById("nav-hoje").classList.add("active");
    mostrarHoje();
}

function abrirPlanejamento() {
    ocultarTodas();
    document.getElementById("telaPlanejamento").classList.add("ativa");
    document.getElementById("nav-planejamento").classList.add("active");
}

function abrirSemana() {
    ocultarTodas();
    document.getElementById("telaSemana").classList.add("ativa");
    document.getElementById("nav-semana").classList.add("active");
    mostrarSemana();
}

function abrirPendencias() {
    ocultarTodas();
    document.getElementById("telaPendencias").classList.add("ativa");
    document.getElementById("nav-pendencias").classList.add("active");
    mostrarPendencias();
}

// ==========================
// PRAZO
// ==========================

function gerarDiasAtePrazo(dataEntrega) {
    let hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let prazo = new Date(dataEntrega + "T12:00:00");
    prazo.setHours(0, 0, 0, 0);

    let lista = [];
    let cursor = new Date(hoje);

    while (cursor <= prazo) {
        let mapa = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
        let dia = mapa[cursor.getDay()];
        if (dia !== "domingo") lista.push(dia);
        cursor.setDate(cursor.getDate() + 1);
    }

    // Remove duplicatas mantendo ordem
    return [...new Set(lista)];
}

// ==========================
// EXPORT / IMPORT
// ==========================

function exportarDados() {
    let dados = localStorage.getItem("planner");
    let blob = new Blob([dados], { type: "application/json" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "planner.json";
    link.click();
    mostrarToast("📦 Dados exportados!");
}

function importarDados(e) {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = () => {
        try {
            JSON.parse(reader.result); // valida
            localStorage.setItem("planner", reader.result);
            atualizarTela();
            mostrarToast("✅ Dados importados com sucesso!");
        } catch {
            mostrarToast("❌ Arquivo inválido.");
        }
    };
    reader.readAsText(file);
}

// ==========================
// TEMA
// ==========================

function toggleTema() {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    localStorage.setItem("tema", dark ? "dark" : "light");
    document.getElementById("temaIcon").textContent = dark ? "☀" : "🌙";
}

(function () {
    if (localStorage.getItem("tema") === "dark") {
        document.body.classList.add("dark");
        const icon = document.getElementById("temaIcon");
        if (icon) icon.textContent = "☀";
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


async function removerPendencia(tarefa) {
    let dados = await obterDados();

    for (let dia of dias) {
        dados[dia] = (dados[dia] || []).filter(t =>
            !(t.texto === tarefa.texto && t.entrega === tarefa.entrega)
        );
    }

    salvarDados(dados);

    mostrarPendencias();
    mostrarToast("🗑 Removido das pendências");
}