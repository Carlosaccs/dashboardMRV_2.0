let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, TIPO: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, PRECO: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, BK_CLI: 20
};

async function iniciarApp() {
    console.log("Iniciando App...");
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        let texto = await response.text();
        
        // Limpeza de aspas e quebras de linha
        texto = texto.replace(/"([^"]*)"/g, (m, p1) => p1.replace(/\r?\n|\r/g, " "));

        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            
            // Limpeza extra para evitar IDs quebrados (remove espaços e caracteres especiais do ID)
            const idLimpo = c[COL.ID] ? c[COL.ID].toLowerCase().replace(/\s/g, '') : "";

            return {
                id_path: idLimpo,
                tipo: (c[COL.TIPO] === 'COMPLEXO' || c[COL.TIPO] === 'N') ? 'N' : 'R',
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: c[COL.NOME] || "",
                nomeFull: c[COL.NOME_FULL] || c[COL.NOME],
                estoque: c[COL.ESTOQUE] || "",
                endereco: c[COL.END] || "",
                cidade: c[COL.ID] ? c[COL.ID].toUpperCase() : "", 
                entrega: c[COL.ENTREGA] || "",
                preco: c[COL.PRECO] || "",
                plantas: (c[COL.P_DE] || c[COL.P_ATE]) ? `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}` : "Consulte",
                obra: c[COL.OBRA] || "0",
                dica: c[COL.DICA] || "",
                book: limparLinkDrive(c[COL.BK_CLI] || "")
            };
        }).filter(i => i.id_path !== "" && i.nome.length > 2 && i.nome.length < 45);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
        console.log("Dados carregados com sucesso!");

    } catch (e) { console.error("Erro fatal no carregamento:", e); }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container) return;

    const pathsHtml = dados.paths.map(p => {
        const idPathNormalizado = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNormalizado);
        
        let acaoClique = interativo ? `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"` : "";
        const acoesHover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${acaoClique} ${acoesHover}></path>`;
    }).join('');

    const zoom = interativo ? 'scale(1.2)' : 'scale(0.9)';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform: ${zoom}; transform-origin: center;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
    
    if (!interativo) {
        container.onclick = trocarMapas;
        container.style.cursor = "pointer";
    }
}

function desenharMapas() {
    console.log("Desenhando mapas...");
    const dadosCima = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dadosBaixo = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderizarNoContainer('caixa-a', dadosCima, true);
    renderizarNoContainer('caixa-b', dadosBaixo, false);
}

function cliqueNoMapa(id, nome, temMRV) {
    if (!temMRV) return;
    comandoSelecao(id, nome, 'mapa');
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        nomeSelecionado = nomePath;
        document.getElementById('cidade-titulo').innerText = nomePath;
        
        // Ativa visualmente o path
        const el = document.getElementById(`caixa-a-${idPath}`);
        if (el) {
            if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
            el.classList.add('path-ativo');
            pathSelecionado = el;
        }
        
        montarVitrine(selecionado, imoveis, nomePath);
    }
}

function hoverNoMapa(nome) { document.getElementById('cidade-titulo').innerText = nome; }
function resetTitulo() { document.getElementById('cidade-titulo').innerText = nomeSelecionado; }
function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; desenharMapas(); }

// ... (Manter funções obterHtmlEstoque, montarVitrine e limparLinkDrive iguais às anteriores)
