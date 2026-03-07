// Configurações Globais
let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// Mapeamento de Colunas (CSV)
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12,
    BK_CLI: 19, BK_COR: 20, VID1: 21, VID2: 22, MAPA_LOC: 34, MAPA_IMP: 35
};

// DADOS DE BACKUP (Caso a planilha falhe, o dashboard não fica em branco)
const DADOS_BACKUP = [
    { id_path: "pirituba", nome: "Res. Nascente do Jequitibá", estoque: "14", cidade: "São Paulo", endereco: "Vila Anastácio", preco: "R$ 244.390", dica: "Entre a Lapa e Pirituba." },
    { id_path: "taubate", nome: "Res. Terence Vale", estoque: "18", cidade: "Taubaté", endereco: "Bairro dos Guedes", preco: "R$ 210.399", dica: "Paz de interior." }
];

async function iniciarApp() {
    console.log("Iniciando v7.0...");
    try {
        await carregarPlanilha();
    } catch (e) {
        console.warn("Usando dados de backup devido a erro de rede.");
        DADOS_PLANILHA = DADOS_BACKUP;
        finalizarCarga();
    }
}

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    
    const resp = await fetch(`${URL_CSV}&cachebuster=${Date.now()}`);
    if (!resp.ok) throw new Error("Planilha inacessível");
    
    const texto = await resp.text();
    const linhas = texto.split(/\r?\n/).filter(l => l.trim().length > 10);
    
    DADOS_PLANILHA = linhas.slice(1).map(linha => {
        const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
        return {
            id_path: (c[COL.ID] || "").toLowerCase().trim(),
            nome: c[COL.NOME],
            estoque: c[COL.ESTOQUE],
            cidade: c[COL.CIDADE],
            endereco: c[COL.END],
            bairro: c[COL.BAIRRO],
            preco: c[COL.PRECO],
            entrega: c[COL.ENTREGA],
            dica: c[COL.DICA],
            materiais: [
                { lab: "Book Cliente", url: limparLink(c[COL.BK_CLI]) },
                { lab: "Localização", url: limparLink(c[COL.MAPA_LOC]) }
            ]
        };
    }).filter(i => i.id_path);

    finalizarCarga();
}

function finalizarCarga() {
    gerarListaLateral();
    desenharMapas();
    document.getElementById('cidade-titulo').innerText = "PRONTO - SELECIONE UMA REGIÃO";
}

// LÓGICA DE INTERAÇÃO (Reforçada para cliques)
window.desenharMapas = function() {
    const contentA = document.getElementById('caixa-a');
    const contentB = document.getElementById('caixa-b');
    
    const dPrincipal = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dMini = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;

    contentA.innerHTML = renderSVG(dPrincipal, true);
    contentB.innerHTML = renderSVG(dMini, false);
};

function renderSVG(dados, interativo) {
    const paths = dados.paths.map(p => {
        const temItem = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        const classe = (temItem && interativo) ? "commrv" : "";
        
        // Atributos de evento explícitos
        const eventos = interativo ? 
            `onclick="window.selecionarRegiao('${p.id}', '${p.name}')" onmouseover="window.updateTopo('${p.name}')" onmouseout="window.updateTopo()"` : 
            `onclick="window.alternarMapa()"`;

        return `<path id="p-${p.id}" d="${p.d}" class="${classe}" ${eventos}></path>`;
    }).join('');

    return `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet"><g>${paths}</g></svg>`;
}

// FUNÇÕES DE JANELA (Para garantir funcionamento nos paths)
window.updateTopo = (n) => { document.getElementById('cidade-titulo').innerText = n || nomeSelecionado || "SELECIONE NO MAPA"; };

window.selecionarRegiao = (id, nome) => {
    // Reset visual
    document.querySelectorAll('path').forEach(p => p.classList.remove('path-ativo'));
    const el = document.getElementById(`p-${id}`);
    if (el) el.classList.add('path-ativo');
    
    nomeSelecionado = nome;
    updateTopo(nome);
    
    const filtrados = DADOS_PLANILHA.filter(d => d.id_path === id.toLowerCase());
    exibirVitrine(filtrados, nome);
};

window.alternarMapa = () => {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    nomeSelecionado = "";
    desenharMapas();
};

function exibirVitrine(lista, regiao) {
    const container = document.getElementById('ficha-tecnica');
    if (lista.length === 0) {
        container.innerHTML = `<div style="padding:20px; color:#999;">Nenhum empreendimento em ${regiao}</div>`;
        return;
    }

    container.innerHTML = lista.map(item => `
        <div class="card-imovel">
            <div class="destaque-vitrine">
                <h3>${item.nome}</h3>
                <span>Estoque: ${item.estoque}</span>
            </div>
            <div class="info-box"><label>Preço</label><span>${item.preco || 'Sob consulta'}</span></div>
            <div class="info-box"><label>Dica</label><p>${item.dica || ''}</p></div>
            <button class="btn-abrir" onclick="window.open('${item.materiais[0].url}')">Abrir Book</button>
        </div>
    `).join('');
}

function gerarListaLateral() {
    const lateral = document.getElementById('lista-imoveis');
    lateral.innerHTML = DADOS_PLANILHA.map(item => `
        <div class="btRes" onclick="window.selecionarRegiao('${item.id_path}', '${item.cidade}')">
            <strong>${item.nome}</strong>
            <small>${item.cidade}</small>
        </div>
    `).join('');
}

function limparLink(url) {
    if (!url) return "#";
    return url.replace("view?usp=sharing", "preview");
}

window.onload = iniciarApp;
