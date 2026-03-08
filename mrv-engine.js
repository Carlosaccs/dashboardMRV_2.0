let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// MAPEAMENTO EXATO DA SUA NOVA TABELA (A=0, B=1, C=2...)
const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME_CURTO: 3, NOME_FULL: 4,
    ESTOQUE: 5, END: 6, PRECO: 7, ENTREGA: 8, P_DE: 9, P_ATE: 10,
    OBRA: 11, DICA: 12, DESC_LONGA: 13, BK_CLI: 20 // Coluna U
};

async function iniciarApp() { await carregarPlanilha(); }

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
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: c[COL.NOME_CURTO] || "Sem Nome",
                nomeFull: c[COL.NOME_FULL] || "",
                estoque: c[COL.ESTOQUE] || "",
                endereco: c[COL.END] || "",
                preco: c[COL.PRECO] || "",
                entrega: c[COL.ENTREGA] || "",
                plantas: (c[COL.P_DE] && c[COL.P_ATE]) ? `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}` : "Consulte",
                obra: c[COL.OBRA] || "0",
                dica: c[COL.DICA] || "",
                desc: c[COL.DESC_LONGA] || "",
                book: limparLinkDrive(c[COL.BK_CLI])
            };
        }).filter(i => i.nome !== "Sem Nome");

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro na carga:", e); }
}

function obterHtmlEstoque(valor, cat) {
    if (cat === 'COMPLEXO') return "";
    if (!valor || valor.trim() === "" || valor === "0") return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    const n = parseInt(valor);
    if (valor.toUpperCase() === "VENDIDO" || n === 0) return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    return `<span class="badge-estoque" style="color:${n < 6 ? '#e31010' : 'inherit'}">${n < 6 ? 'SÓ ' : 'RESTAM '}${valor} UN.</span>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if (!painel) return;

    // Destaque visual na lateral (ID sanitizado para não dar erro)
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const idLimpo = `btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const btnEsq = document.getElementById(idLimpo);
    if (btnEsq) btnEsq.classList.add('ativo');

    let html = `<div class="vitrine-topo">${selecionado.nomeFull || selecionado.nome}</div>`;

    if (selecionado.categoria === 'COMPLEXO') {
        html += `
            <div style="padding-top:10px;">
                <div class="info-box" style="background:#fff; border: 1px solid #ddd; line-height: 1.5;">
                    <label style="color:var(--mrv-verde); margin-bottom:8px;">SOBRE O PROJETO</label>
                    <p style="font-size:0.8rem; color:#444;">${selecionado.desc}</p>
                </div>
                ${selecionado.book ? `<a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none;">📄 Ver Apresentação</a>` : ""}
            </div>`;
    } else {
        html += `
            <div style="padding-top:10px;">
                <div class="btRes ativo" style="cursor:default; margin-bottom:10px;">
                    <strong>Residencial Selecionado</strong> ${obterHtmlEstoque(selecionado.estoque, selecionado.categoria)}
                </div>
                <p style="font-size:0.65rem; color:#666; margin-bottom:10px;">📍 ${selecionado.endereco}</p>
                <div class="ficha-grid">
                    <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                    <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
                    <div class="info-box"><label>📐 Plantas</label><span>${selecionado.plantas}</span></div>
                    <div class="info-box"><label>🏗️ Obra</label><span>${selecionado.obra}%</span></div>
                </div>
                <div class="info-box" style="background:#fff5e6; border-left: 3px solid var(--mrv-laranja);">
                    <label style="color:#d67e00;">💡 Dica do Corretor</label>
                    <p style="font-size:0.75rem;">${selecionado.dica}</p>
                </div>
                ${selecionado.book ? `<a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none;">📄 Book Cliente</a>` : ""}
            </div>`;
    }
    painel.innerHTML = html;
}

// Funções de Mapa e Navegação (v6.8 estável)
function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container) return;
    const pathsHtml = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        let clique = interativo ? `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"` : "";
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${clique}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform:${interativo?'scale(1.2)':'scale(0.9)'};"><g>${pathsHtml}</g></svg>`;
}
function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo==='GSP'?MAPA_GSP:MAPA_INTERIOR), true);
    renderizarNoContainer('caixa-b', (mapaAtivo==='GSP'?MAPA_INTERIOR:MAPA_GSP), false);
    if(document.getElementById('caixa-b')) document.getElementById('caixa-b').onclick = trocarMapas;
}
function cliqueNoMapa(id, nome, tem) { if (!tem) return; nomeSelecionado = nome; comandoSelecao(id, nome, 'mapa'); }
function comandoSelecao(idPath, nomePath, fonte) {
    document.getElementById('cidade-titulo').innerText = nomePath;
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase());
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : [...imoveis].sort((a,b) => a.ordem - b.ordem)[0];
        montarVitrine(selecionado, imoveis, nomePath);
    }
}
function navegarVitrine(nome, regiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
    montarVitrine(imovel, lista, regiao);
}
function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; limparSelecao(); desenharMapas(); }
function limparSelecao() { pathSelecionado = null; document.getElementById('ficha-tecnica').innerHTML = '<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size:30px;">📍</p><p>Selecione um item</p></div>'; }
function limparLinkDrive(url) { if (!url || !url.includes('drive.google.com')) return url; const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/); return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url; }
