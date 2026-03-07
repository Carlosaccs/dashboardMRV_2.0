let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = "";
let mapaAtivo = 'GSP';

// MAPEAMENTO EXATO DA SUA PLANILHA
const COL = {
    ID_PATH: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, ENDERECO: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, OBS: 13,
    LOC_TXT: 14, MOBILIDADE: 15, CULTURA: 16, COMERCIO: 17, SAUDE: 18,
    BK_CLIENTE: 19, BK_CORRETOR: 20, VID1: 21, VID2: 22,
    LOC_MAPA: 34, IMPLANTACAO: 35
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^!]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: c[COL.ID_PATH]?.toLowerCase(),
                tipo: c[COL.TIPO], nome: c[COL.NOME], estoque: c[COL.ESTOQUE],
                endereco: c[COL.ENDERECO], bairro: c[COL.BAIRRO], cidade: c[COL.CIDADE],
                entrega: c[COL.ENTREGA], preco: c[COL.PRECO], 
                plantas: `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}`,
                obra: c[COL.OBRA], dica: c[COL.DICA], obs: c[COL.OBS],
                materiais: [
                    { label: "Book Cliente", url: limparLinkDrive(c[COL.BK_CLIENTE]) },
                    { label: "Book Corretor", url: limparLinkDrive(c[COL.BK_CORRETOR]) },
                    { label: "Mapa Localização", url: limparLinkDrive(c[COL.LOC_MAPA]) },
                    { label: "Implantação", url: limparLinkDrive(c[COL.IMPLANTACAO]) },
                    { label: "Vídeo 1", url: c[COL.VID1] },
                    { label: "Vídeo 2", url: c[COL.VID2] }
                ]
            };
        }).filter(item => item.nome);
        
        gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro ao carregar planilha:", e); }
}

function desenharMapas() {
    const principal = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const mini = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderizarSVG('caixa-a', principal, true);
    renderizarSVG('caixa-b', mini, false);
}

function renderizarSVG(containerId, dados, interativo) {
    const container = document.getElementById(containerId);
    const paths = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        const acao = interativo ? 
            `onclick="comandoSelecao('${p.id}', '${p.name}')"` : 
            `onclick="alternarMapas()"`;
        return `<path id="${containerId}-${p.id}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${acao}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}">${paths}</svg>`;
}

function comandoSelecao(id, nome, objDireto = null) {
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    const el = document.getElementById(`caixa-a-${id}`);
    if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }

    nomeSelecionado = nome;
    document.getElementById('cidade-titulo').innerText = nome;

    const item = objDireto || DADOS_PLANILHA.find(d => d.id_path === id.toLowerCase());
    if (item) montarVitrine(item);
}

function montarVitrine(item) {
    // Sincroniza botão da esquerda
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const btnEsq = document.getElementById(`btn-esq-${item.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    // Gera HTML dos materiais
    const htmlMateriais = item.materiais.map(mat => {
        if (!mat.url || mat.url.length < 10) return "";
        return `
            <div class="material-row">
                <span class="material-name">${mat.label}</span>
                <div class="material-actions">
                    <button class="btn-link abrir" onclick="window.open('${mat.url}', '_blank')">ABRIR</button>
                    <button class="btn-link copiar" onclick="copiarLink('${mat.url}')">COPIAR</button>
                </div>
                <div class="preview-thumb"><iframe src="${mat.url}"></iframe></div>
            </div>`;
    }).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="destaque-vitrine">
            <h2>${item.nome}</h2>
        </div>
        <p style="font-size:0.7rem; color:#555; margin-bottom:10px;">📍 ${item.endereco} - ${item.bairro}</p>
        
        <div class="ficha-grid">
            <div class="info-box"><label>💰 Preço</label><span>${item.preco}</span></div>
            <div class="info-box"><label>🔑 Entrega</label><span>${item.entrega}</span></div>
            <div class="info-box"><label>📐 Plantas</label><span>${item.plantas}</span></div>
            <div class="info-box"><label>🏗️ Obra</label><span>${item.obra}%</span></div>
        </div>

        <div class="info-box" style="background:#fff5e6; border-left:4px solid var(--mrv-laranja);">
            <label style="color:#d67e00;">DICA</label>
            <p style="font-size:0.75rem;">${item.dica}</p>
        </div>

        <div class="material-container">
            <p style="font-size:0.6rem; font-weight:bold; color:#999; margin-bottom:5px; text-transform:uppercase;">Materiais de Venda</p>
            ${htmlMateriais}
        </div>
    `;
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    // Extrai o ID e coloca no modo /preview para ficar "limpo" e permitir iframe
    const reg = /\/d\/(.+?)\//;
    const match = url.match(reg);
    if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
}

function copiarLink(url) {
    navigator.clipboard.writeText(url);
    alert("Link copiado!");
}

function alternarMapas() {
    mapaAtivo = (mapaAtivo === 'GSP' ? 'INTERIOR' : 'GSP');
    desenharMapas();
}

function obterHtmlEstoque(v, t) {
    if (t === 'N') return "";
    return `<span class="badge-estoque">${v} un</span>`;
}
