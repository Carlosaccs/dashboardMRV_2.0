let DADOS_GERAIS = [];
let mapaAtual = 'GSP';

// MAPEAMENTO EXATO DA PLANILHA (Início no 0)
const COL = {
    ID: 0, NOME: 2, ESTOQUE: 3, PRECO: 8, ENTREGA: 7, OBRA: 11, DICA: 12,
    BK_CLIENTE: 19, BK_CORRETOR: 20, LOC: 34, IMPLANT: 35
};

async function iniciarApp() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const r = await fetch(`${URL_CSV}&t=${Date.now()}`);
        const csv = await r.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim().length > 10);
        
        DADOS_GERAIS = linhas.slice(1).map(linha => {
            // Regex para separar por vírgula mas ignorar vírgulas dentro de aspas
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id: c[COL.ID]?.toLowerCase().trim(),
                nome: c[COL.NOME],
                estoque: c[COL.ESTOQUE],
                preco: c[COL.PRECO],
                entrega: c[COL.ENTREGA],
                obra: c[COL.OBRA],
                dica: c[COL.DICA],
                links: [
                    { label: "Book Cliente", url: c[COL.BK_CLIENTE] },
                    { label: "Book Corretor", url: c[COL.BK_CORRETOR] },
                    { label: "Localização", url: c[COL.LOC] },
                    { label: "Implantação", url: c[COL.IMPLANT] }
                ]
            };
        }).filter(d => d.id);

        renderizarInterface();
    } catch (e) {
        document.getElementById('lista-imoveis').innerHTML = "Erro ao carregar dados.";
    }
}

function renderizarInterface() {
    gerarListaLateral();
    desenharMapas();
}

function desenharMapas() {
    const principal = (mapaAtual === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const secundario = (mapaAtual === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;

    renderSVG('caixa-a', principal, true);
    renderSVG('caixa-b', secundario, false);
}

function renderSVG(containerId, dados, interativo) {
    const container = document.getElementById(containerId);
    const paths = dados.paths.map(p => {
        const idPath = p.id.toLowerCase().trim();
        const temEstoque = DADOS_GERAIS.some(d => d.id === idPath);
        const classe = (temEstoque && interativo) ? 'commrv' : '';
        const clique = interativo ? `onclick="selecionarUnidade('${p.id}')"` : `onclick="alternarMapas()"`;
        return `<path id="${containerId}-${p.id}" d="${p.d}" class="${classe}" ${clique}></path>`;
    }).join('');
    
    // O segredo do enquadramento: viewBox e preserveAspectRatio
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;
}

function selecionarUnidade(id) {
    // UI - Destaque no mapa
    document.querySelectorAll('path').forEach(p => p.classList.remove('path-ativo'));
    const p = document.getElementById(`caixa-a-${id}`);
    if(p) p.classList.add('path-ativo');

    const item = DADOS_GERAIS.find(d => d.id === id.toLowerCase());
    if(item) atualizarVitrine(item);
}

function limparLinkDrive(url) {
    if(!url || !url.includes('drive.google.com')) return url;
    // Extrai o ID do arquivo e força o modo PREVIEW (minimalista)
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    const id = match ? (match[1]) : null;
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}

function atualizarVitrine(item) {
    // Sincroniza lista lateral
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const btn = document.getElementById(`btn-${item.id}`);
    if(btn) btn.classList.add('ativo');

    const htmlLinks = item.links.map(l => {
        if(!l.url || l.url.length < 15) return "";
        const urlLimpa = limparLinkDrive(l.url);
        return `
            <div class="mat-item">
                <span style="font-size:0.7rem; font-weight:bold;">${l.label}</span>
                <div>
                    <a href="${urlLimpa}" target="_blank" class="btn-mrv abrir">Abrir</a>
                    <button class="btn-mrv copiar" onclick="copiarLink('${urlLimpa}')">Copiar</button>
                </div>
                <div class="hover-preview"><iframe src="${urlLimpa}"></iframe></div>
            </div>`;
    }).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="card-header"><h3>${item.nome}</h3></div>
        <div class="info-row">
            <div class="info-item"><label>💰 PREÇO</label><b>${item.preco}</b></div>
            <div class="info-item"><label>🔑 ENTREGA</label><b>${item.entrega}</b></div>
            <div class="info-item"><label>🏗️ OBRA</label><b>${item.obra}%</b></div>
            <div class="info-item"><label>📦 ESTOQUE</label><b>${item.estoque} UN.</b></div>
        </div>
        <div class="info-item" style="margin-bottom:15px; border-left:4px solid orange;">
            <label>DICA DO CORRETOR</label>
            <p style="font-size:0.7rem;">${item.dica}</p>
        </div>
        <div>${htmlLinks}</div>
    `;
}

function alternarMapas() {
    mapaAtual = (mapaAtual === 'GSP' ? 'INTERIOR' : 'GSP');
    desenharMapas();
}

function gerarListaLateral() {
    const list = document.getElementById('lista-imoveis');
    list.innerHTML = DADOS_GERAIS.map(item => `
        <button class="btRes" id="btn-${item.id}" onclick="selecionarUnidade('${item.id}')">
            <b>${item.nome}</b>
            <span style="font-size:0.6rem; color:#666;">${item.estoque} UN.</span>
        </button>
    `).join('');
}

function copiarLink(url) {
    navigator.clipboard.writeText(url);
    alert("Link copiado para a área de transferência!");
}

window.onload = iniciarApp;
