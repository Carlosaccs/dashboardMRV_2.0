let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// ORDEM EXATA DA SUA PLANILHA
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, OBS: 13,
    LOC: 14, MOB: 15, LAZER: 16, COM: 17, SAUDE: 18,
    BK_CLI: 19, BK_COR: 20, VID1: 21, VID2: 22,
    VAR_S: 23, VAR_N: 24, GARD: 25, AP_A: 26, AP_B: 27, AP_C: 28,
    MAP_LOC: 34, MAP_IMP: 35
};

async function iniciarApp() { await carregarPlanilha(); }

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: c[COL.ID]?.toLowerCase(),
                tipo: c[COL.TIPO], nome: c[COL.NOME], estoque: c[COL.ESTOQUE],
                endereco: c[COL.END], bairro: c[COL.BAIRRO], cidade: c[COL.CIDADE],
                entrega: c[COL.ENTREGA], preco: c[COL.PRECO], 
                plantas: `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}`,
                obra: c[COL.OBRA], dica: c[COL.DICA], obs: c[COL.OBS],
                links: [
                    { label: "Book Cliente", url: limparLink(c[COL.BK_CLI]) },
                    { label: "Book Corretor", url: limparLink(c[COL.BK_COR]) },
                    { label: "Localização", url: limparLink(c[COL.MAP_LOC]) },
                    { label: "Implantação", url: limparLink(c[COL.MAP_IMP]) },
                    { label: "Vídeo 1", url: limparLink(c[COL.VID1]) },
                    { label: "Vídeo 2", url: limparLink(c[COL.VID2]) }
                ]
            };
        }).filter(i => i.nome);
        gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro ao carregar:", e); }
}

// ... (Funções desenharMapas, renderizarNoContainer e cliqueNoMapa permanecem as mesmas da v6.8)

function montarVitrine(sel, lista, regiao) {
    const outros = lista.filter(i => i.nome !== sel.nome);
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const bE = document.getElementById(`btn-esq-${sel.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (bE) bE.classList.add('ativo');

    let htmlLinks = sel.links.map(link => {
        if (!link.url || link.url === "" || link.url.length < 10) return "";
        return `
            <div class="material-row">
                <span class="material-label">${link.label}</span>
                <div class="material-btns">
                    <button class="btn-acao btn-abrir" onclick="window.open('${link.url}', '_blank')">Abrir</button>
                    <button class="btn-acao btn-copiar" onclick="copiarLink('${link.url}')">Copiar</button>
                </div>
                <div class="preview-container">
                    <iframe src="${link.url}"></iframe>
                </div>
            </div>`;
    }).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="destaque-vitrine">
            <h2>${sel.nome}</h2>
            <div style="font-size:0.7rem; margin-top:5px;">${obterHtmlEstoque(sel.estoque, sel.tipo)}</div>
        </div>
        <p style="font-size:0.7rem; color:#444; margin-bottom:10px;">📍 ${sel.endereco} - <strong>${sel.bairro}</strong></p>
        
        <div class="ficha-grid">
            <div class="info-box"><label>💰 Preço</label><span>${sel.preco}</span></div>
            <div class="info-box"><label>🔑 Entrega</label><span>${sel.entrega}</span></div>
            <div class="info-box"><label>📐 Plantas</label><span>${sel.plantas}</span></div>
            <div class="info-box"><label>🏗️ Obra</label><span>${sel.obra}%</span></div>
        </div>

        <div class="info-box" style="background:#fff5e6; border-left:4px solid var(--mrv-laranja); margin-bottom:15px;">
            <label style="color:#d67e00;">DICA</label>
            <p style="font-size:0.75rem;">${sel.dica}</p>
        </div>

        <div style="margin-top:10px;">
            <p style="font-size:0.6rem; font-weight:bold; color:#999; margin-bottom:5px; text-transform:uppercase;">Materiais de Venda</p>
            ${htmlLinks}
        </div>
    `;
}

function limparLink(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    // Força o modo de visualização direta para evitar menus do Drive
    const id = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return id ? `https://drive.google.com/file/d/${id[1]||id[2]||id[3]}/preview` : url;
}

function copiarLink(url) {
    navigator.clipboard.writeText(url);
    alert("Link copiado!");
}
