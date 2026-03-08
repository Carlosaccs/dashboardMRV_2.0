let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// MAPEAMENTO PARA SUA NOVA TABELA
const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME_CURTO: 3, NOME_FULL: 4,
    ESTOQUE: 5, END: 6, PRECO: 7, ENTREGA: 8, P_DE: 9, P_ATE: 10,
    OBRA: 11, DICA: 12, DESC_LONGA: 13, BK_CLI: 20
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: c[COL.ID]?.toLowerCase() || "",
                categoria: (c[COL.CATEGORIA] || "RESIDENCIAL").toUpperCase(),
                ordem: parseInt(c[COL.ORDEM]) || 99,
                nome: c[COL.NOME_CURTO] || "",
                nomeFull: c[COL.NOME_FULL] || "",
                estoque: c[COL.ESTOQUE] || "",
                endereco: c[COL.END] || "",
                preco: c[COL.PRECO] || "",
                entrega: c[COL.ENTREGA] || "",
                plantas: `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}`,
                obra: c[COL.OBRA] || "0",
                dica: c[COL.DICA] || "",
                descricaoLonga: c[COL.DESC_LONGA] || "",
                book: limparLinkDrive(c[COL.BK_CLI])
            };
        }).filter(i => i.nome !== "");

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro:", e); }
}

function obterHtmlEstoque(valor, cat) {
    if (cat === 'COMPLEXO') return "";
    if (!valor || valor === "0" || valor === "") return `<span class="badge-estoque">CONSULTAR</span>`;
    return `<span class="badge-estoque">ESTOQUE: ${valor}</span>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const btnEsq = document.getElementById(`btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    let html = `<div class="vitrine-topo">${selecionado.nomeFull}</div>`;

    if (selecionado.categoria === 'COMPLEXO') {
        html += `<div style="padding-top:15px;">
            <div class="info-box"><label>SOBRE O COMPLEXO</label><p style="font-size:0.8rem;">${selecionado.descricaoLonga}</p></div>
            <a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; margin-top:15px; border:none;">📄 Book do Complexo</a>
        </div>`;
    } else {
        html += `<div style="padding-top:15px;">
            <p style="font-size:0.7rem; color:#666; margin-bottom:10px;">📍 ${selecionado.endereco}</p>
            <div class="ficha-grid">
                <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
            </div>
            <div class="info-box" style="margin-top:10px; border-left: 3px solid var(--mrv-laranja);">
                <label>💡 Dica</label><p style="font-size:0.75rem;">${selecionado.dica}</p>
            </div>
            <a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; margin-top:15px; border:none;">📄 Book Cliente</a>
        </div>`;
    }
    painel.innerHTML = html;
}

// FUNÇÕES DE MAPA (ESTÁVEIS)
function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container) return;
    const pathsHtml = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        let acaoClique = interativo ? `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"` : "";
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${acaoClique}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g>${pathsHtml}</g></svg>`;
}
function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP' ? MAPA_GSP : MAPA_INTERIOR), true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP' ? MAPA_INTERIOR : MAPA_GSP), false);
}
function cliqueNoMapa(id, nome, temMRV) { if (!temMRV) return; comandoSelecao(id, nome); }
function comandoSelecao(idPath, nomePath) {
    document.getElementById('cidade-titulo').innerText = nomePath;
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase());
    if (imoveis.length > 0) montarVitrine(imoveis[0], imoveis, nomePath);
}
function limparLinkDrive(url) { if (!url || !url.includes('drive.google.com')) return url; const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/); return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url; }
