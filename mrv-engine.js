// --- ESTADO GLOBAL ---
let DADOS_PLANILHA = [];
let pathSelecionado = null;
let regiaoAtual = "gsp";

// Mapeamento das colunas (DashboardMRV_SP_2)
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, OBS: 13,
    BK_CLI: 19, BK_COR: 20, VID1: 21, VID2: 22,
    V_VAR: 23, V_SEM: 24, V_GAR: 25, 
    MAP_IMP: 35
};

// --- INICIALIZAÇÃO ---
async function iniciarApp() {
    await carregarPlanilha();
    desenharIniciais();
}

async function carregarPlanilha() {
    // COLE AQUI SUA URL DE PUBLICAÇÃO CSV DA NOVA PLANILHA
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
                obs: c[COL.OBS] || "",
                links: {
                    bookCli: limparLinkDrive(c[COL.BK_CLI]),
                    bookCor: limparLinkDrive(c[COL.BK_COR]),
                    vid1: c[COL.VID1],
                    varanda: limparLinkDrive(c[COL.V_VAR]),
                    garden: limparLinkDrive(c[COL.V_GAR]),
                    implantacao: limparLinkDrive(c[COL.MAP_IMP])
                }
            };
        }).filter(item => item !== null);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        
    } catch (e) {
        console.error("Erro ao carregar planilha:", e);
    }
}

// --- LÓGICA DO MAPA ---
function desenhar(idContainer, dadosMapa) {
    const container = document.getElementById(idContainer);
    if (!container || !dadosMapa) return;

    const pathsHtml = dadosMapa.paths.map(p => {
        // Uma cidade fica verde se houver um residencial (R) ou lançamento (L) nela
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase() && d.tipo !== 'N');
        return `<path id="${p.id}" name="${p.name}" d="${p.d}" class="${temMRV ? 'commrv' : ''}"></path>`;
    }).join('');

    container.innerHTML = `
        <svg viewBox="${dadosMapa.viewBox}" preserveAspectRatio="xMidYMid meet">
            <g transform="${dadosMapa.transform || ''}">${pathsHtml}</g>
        </svg>`;
}

function desenharIniciais() {
    if (typeof MAPA_GSP !== 'undefined') desenhar('caixa-a', MAPA_GSP);
    if (typeof MAPA_INTERIOR !== 'undefined') desenhar('caixa-b', MAPA_INTERIOR);
}

// --- UTILITÁRIOS ---
function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    if (tipo === 'L') return `<span class="badge-estoque estoque-L">LANÇAMENTO</span>`;
    
    const n = parseInt(valor);
    if (valor === "VENDIDO" || n === 0) return `<span class="badge-estoque estoque-V">VENDIDO</span>`;
    if (n < 6) return `<span class="badge-estoque estoque-R" style="color:red; font-weight:bold;">SÓ ${valor} UN!</span>`;
    
    return `<span class="badge-estoque estoque-R">RESTAM ${valor} UN.</span>`;
}

function limparLinkDrive(url) {
    if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    const id = match ? (match[1] || match[2] || match[3]) : null;
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}

function copiarLink(url, nome) {
    navigator.clipboard.writeText(url).then(() => {
        const x = document.getElementById("toast");
        if(x) {
            x.innerText = `${nome} copiado!`;
            x.className = "show";
            setTimeout(() => { x.className = ""; }, 2000);
        }
    });
}
