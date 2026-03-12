let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, DOCUMENTOS: 15, 
    DICA: 16, DESC_LONGA: 17, BK_CLI: 24
};

async function iniciarApp() {
    try {
        if (typeof MAPA_GSP !== 'undefined') desenharMapas();
        await carregarPlanilha();
    } catch (err) { console.error("Erro na inicialização:", err); }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
        const linhas = [];
        let linhaAtual = "", dentroDeAspas = false;
        
        for (let i = 0; i < texto.length; i++) {
            const char = texto[i];
            if (char === '"') dentroDeAspas = !dentroDeAspas;
            if ((char === '\n' || char === '\r') && !dentroDeAspas) {
                if (linhaAtual.trim()) linhas.push(linhaAtual);
                linhaAtual = "";
            } else { linhaAtual += char; }
        }

        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const colunas = [];
            let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());

            // --- LÓGICA DE CATEGORIA FLEXÍVEL ---
            const catRaw = colunas[COL.CATEGORIA] ? colunas[COL.CATEGORIA].toUpperCase() : "";
            const nomeCurto = colunas[COL.NOME] || "";
            
            // Se a categoria for vazia ou contiver COMPLEXO, e o nome for GRAND PRIX, força como Complexo
            const ehComplexo = catRaw.includes('COMPLEXO') || (nomeCurto.toUpperCase().includes('GRAND PRIX'));

            let idFinal = colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "";
            
            return {
                id_path: idFinal || "interlagos", // Fallback se o ID falhar
                tipo: ehComplexo ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: nomeCurto,
                cidade: idFinal.toUpperCase() || "INTERLAGOS",
                estoque: colunas[COL.ESTOQUE] || "",
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "",
                preco: colunas[COL.P_DE] || "Consulte",
                p_de: colunas[COL.P_DE] || "-",
                obra: colunas[COL.OBRA] || "0",
                documentos: colunas[COL.DOCUMENTOS] || "",
                dica: colunas[COL.DICA] || "",
                descLonga: colunas[COL.DESC_LONGA] || "",
                book: colunas[COL.BK_CLI] || ""
            };
        }).filter(i => i.nome && i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
}

// ... manter as outras funções (renderizarNoContainer, comandoSelecao, etc) iguais ...

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    const pathsHtml = dados.paths.map(p => {
        const idPathNormalizado = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNormalizado);
        const isGSP = p.id.toLowerCase() === "grandesaopaulo";
        const clique = interativo ? (isGSP ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const hover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        const classe = (temMRV || isGSP) && interativo ? 'commrv' : '';
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${classe}" ${clique} ${hover}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function cliqueNoMapa(id, nome, temMRV) { if (temMRV) comandoSelecao(id, nome); }

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        nomeSelecionado = nomePath;
        document.getElementById('cidade-titulo').innerText = nomePath;
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        const el = document.getElementById(`caixa-a-${idPath}`);
        if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }
        document.querySelectorAll('.btRes, .separador-complexo-btn').forEach(btn => btn.classList.remove('ativo'));
        const idBotao = `btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const btnClicado = document.getElementById(idBotao);
        if (btnClicado) btnClicado.classList.add('ativo');
        montarVitrine(selecionado, imoveis, nomePath);
    }
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const listaSuperior = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div><div style="margin-bottom:10px;">${listaSuperior.map(item => {
                const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
                return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque, item.tipo) : ''}</button>`;
            }).join('')}</div><div style="padding-top:8px;"><p style="font-size:0.65rem; color:#444; margin-bottom:8px;">📍 ${selecionado.endereco}</p>`;
    if (selecionado.tipo === 'N') {
        const desc = (selecionado.descLonga || "").split('\n').map(p => `<p style="margin-bottom:8px;">${p.trim()}</p>`).join('');
        html += `<div class="box-argumento" style="border-left-color: var(--mrv-verde); background:#f9f9f9;"><label>Sobre o Complexo</label>${desc}</div>`;
    } else {
        html += `<table class="tabela-mrv"><thead><tr><th>PLANTA</th><th class="laranja">PREÇO</th><th>ENTREGA</th></tr></thead><tbody><tr><td>${selecionado.p_de}</td><td class="destaque">${selecionado.preco}</td><td>${selecionado.entrega}</td></tr></tbody></table><div class="info-box"><label>Status da Obra</label><span>${selecionado.obra}%</span></div><a href="${selecionado.book}" target="_blank" class="btRes" style="background:#00713a; color:white; justify-content:center; font-weight:bold; margin-top:10px; width:100%; display:flex; align-items:center;">📄 BOOK CLIENTE</a>`;
    }
    html += `</div>`;
    painel.innerHTML = html;
}

function navegarVitrine(nome, nomeRegiao) { const imovel = DADOS_PLANILHA.find(i => i.nome === nome); if (imovel) comandoSelecao(imovel.id_path, nomeRegiao, imovel); }
function hoverNoMapa(nome) { document.getElementById('cidade-titulo').innerText = nome; }
function resetTitulo() { document.getElementById('cidade-titulo').innerText = nomeSelecionado || "Selecione uma região"; }
function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; desenharMapas(); limparInterface(); }
function limparInterface() {
    nomeSelecionado = ""; pathSelecionado = null;
    document.getElementById('cidade-titulo').innerText = "Selecione uma região";
    document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p>Clique em um imóvel ou região</p></div>`;
    document.querySelectorAll('.btRes, .separador-complexo-btn').forEach(btn => btn.classList.remove('ativo'));
}
function obterHtmlEstoque(valor, tipo) { if (tipo === 'N') return ""; return `<span class="badge-estoque">RESTAM ${valor} UN.</span>`; }

iniciarApp();
