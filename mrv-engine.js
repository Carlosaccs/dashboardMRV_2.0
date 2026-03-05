let DADOS_PLANILHA = [];
let pathSelecionado = null;

// Reajuste os números abaixo se as colunas na sua planilha mudarem de ordem
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, OBS: 13,
    BK_CLI: 19, BK_COR: 20, VID1: 21, VID2: 22,
    V_VAR: 23, V_SEM: 24, V_GAR: 25, MAP_IMP: 35
};

async function iniciarApp() {
    await carregarPlanilha();
    desenharIniciais();
}

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            if (!c[COL.NOME]) return null;
            return {
                id_path: c[COL.ID]?.toLowerCase(),
                tipo: c[COL.TIPO]?.toUpperCase() || "R",
                nome: c[COL.NOME],
                estoque: c[COL.ESTOQUE] || "0",
                endereco: c[COL.END] || "",
                bairro: c[COL.BAIRRO] || "",
                cidade: c[COL.CIDADE] || "",
                entrega: c[COL.ENTREGA] || "",
                preco: c[COL.PRECO] || "",
                plantas: (c[COL.P_DE] && c[COL.P_ATE]) ? `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}` : "Consulte",
                obra: c[COL.OBRA] || "0",
                dica: c[COL.DICA] || "",
                links: {
                    bookCli: limparLinkDrive(c[COL.BK_CLI]),
                    vid1: c[COL.VID1]
                }
            };
        }).filter(item => item !== null);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
    } catch (e) { console.error("Erro planilha:", e); }
}

function desenhar(idContainer, dadosMapa) {
    const container = document.getElementById(idContainer);
    if (!container || !dadosMapa) return;

    const pathsHtml = dadosMapa.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase() && d.tipo !== 'N');
        return `<path id="${p.id}" name="${p.name}" d="${p.d}" 
                      class="${temMRV ? 'commrv' : ''}" 
                      onclick="cliqueNoMapa('${p.id}')"></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dadosMapa.viewBox}" preserveAspectRatio="xMidYMid meet">
        <g transform="${dadosMapa.transform || ''}">${pathsHtml}</g>
    </svg>`;
}

function desenharIniciais() {
    // Agora desenha os dois mapas obrigatoriamente
    if (typeof MAPA_GSP !== 'undefined') desenhar('caixa-a', MAPA_GSP);
    if (typeof MAPA_INTERIOR !== 'undefined') desenhar('caixa-b', MAPA_INTERIOR);
}

function cliqueNoMapa(idPath) {
    // FILTRO: Pega TODOS os imóveis dessa cidade
    const imoveisDaCidade = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase() && d.tipo !== 'N');
    
    const el = document.getElementById(idPath);
    if (el) destacarNoMapa(el);

    const painelFicha = document.getElementById('ficha-tecnica');

    if (imoveisDaCidade.length > 0) {
        // Gera uma ficha para cada residencial encontrado
        painelFicha.innerHTML = imoveisDaCidade.map(item => `
            <div class="ficha-card" style="border-left: 5px solid var(--mrv-verde); padding: 15px; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div class="ficha-header">
                    <h2 style="color:var(--mrv-verde); font-size:1.1rem;">${item.nome}</h2>
                    <p style="font-size:0.8rem; margin-bottom:10px;">📍 <strong>${item.bairro}</strong> - ${item.cidade}</p>
                </div>
                <div class="ficha-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <div class="info-box" style="background:#f9f9f9; padding:8px; border-radius:4px;">
                        <label style="display:block; font-size:0.6rem; color:#888; text-transform:uppercase;">💰 Preço</label>
                        <span style="font-size:0.85rem;">${item.preco}</span>
                    </div>
                    <div class="info-box" style="background:#f9f9f9; padding:8px; border-radius:4px;">
                        <label style="display:block; font-size:0.6rem; color:#888; text-transform:uppercase;">🔑 Entrega</label>
                        <span style="font-size:0.85rem;">${item.entrega}</span>
                    </div>
                </div>
                <div class="info-box" style="background:#fff5e6; padding:8px; border-radius:4px; margin-top:8px;">
                    <label style="display:block; font-size:0.6rem; color:#d67e00; text-transform:uppercase;">💡 Dica</label>
                    <span style="font-size:0.8rem;">${item.dica}</span>
                </div>
                <div style="margin-top:12px;">
                    <a href="${item.links.bookCli}" target="_blank" class="btn-link" style="padding:8px 12px; background:var(--mrv-verde); color:#fff; text-decoration:none; border-radius:4px; font-size:0.8rem;">📄 Book Cliente</a>
                </div>
            </div>
        `).join('');
    } else {
        painelFicha.innerHTML = '<p style="padding:20px; color:#999; text-align:center;">Nenhum residencial cadastrado nesta cidade.</p>';
    }
}

function destacarNoMapa(el) {
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    el.classList.add('path-ativo');
    pathSelecionado = el;
    const display = document.getElementById('cidade-titulo') || document.getElementById('display-nome');
    if (display) display.innerText = el.getAttribute('name') || el.id;
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url;
}
