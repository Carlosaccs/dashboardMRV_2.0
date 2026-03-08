let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0,          // A
    TIPO: 1,        // B
    ORDEM: 2,       // C
    NOME: 3,        // D (Nome Curto)
    NOME_FULL: 4,   // E (Nome Completo)
    ESTOQUE: 5,     // F
    END: 6,         // G
    PRECO: 7,       // H
    ENTREGA: 8,     // I
    P_DE: 9,        // J
    P_ATE: 10,      // K
    OBRA: 11,       // L
    DICA: 12,       // M
    BK_CLI: 20      // U
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        let texto = await response.text();
        
        // CORREÇÃO CRUCIAL: Remove quebras de linha dentro de aspas (textos longos)
        texto = texto.replace(/"([^"]*)"/g, (match, p1) => p1.replace(/\r?\n|\r/g, " "));

        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            // Regex para separar colunas ignorando vírgulas dentro de aspas
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            
            const nomeCurto = c[COL.NOME] || "";

            return {
                id_path: c[COL.ID]?.toLowerCase() || "",
                tipo: (c[COL.TIPO] === 'COMPLEXO' || c[COL.TIPO] === 'N') ? 'N' : 'R',
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: nomeCurto,
                nomeFull: c[COL.NOME_FULL] || nomeCurto,
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
        }).filter(i => 
            i.id_path !== "" && 
            i.nome.length > 2 && 
            i.nome.length < 40 && // Filtra frases de erro
            !i.nome.includes(",") // Se o nome tem vírgula, a coluna está errada
        );

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro no processamento:", e); }
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const cleanVal = valor ? valor.toString().toUpperCase().trim() : "";
    
    // Se o valor for muito longo, é lixo de coluna errada
    if (cleanVal.length > 15) return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;

    if (cleanVal === "" || cleanVal === "NULL" || cleanVal === "CONSULTAR") 
        return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    
    if (cleanVal === "VENDIDO" || cleanVal === "0") 
        return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    
    const n = parseInt(valor);
    if (!isNaN(n)) {
        if (n < 6 && n > 0) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${n} UN!</span>`;
        return `<span class="badge-estoque">RESTAM ${n} UN.</span>`;
    }
    return `<span class="badge-estoque">${valor}</span>`;
}

// ... (Restante das funções de mapa permanecem iguais)

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome && i.tipo !== 'N');
    
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const idLimpo = selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-');
    const btnEsq = document.getElementById(`btn-esq-${idLimpo}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    painel.innerHTML = `
        <div class="vitrine-topo notranslate">${selecionado.nomeFull}</div>
        <div style="margin-bottom:15px;">
            ${outros.map(o => `<button class="btRes notranslate" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')"><strong class="notranslate">${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}</button>`).join('')}
        </div>
        <div style="border-top:1px solid #eee; padding-top:15px;">
            <div class="btRes ativo notranslate" style="cursor:default; margin-bottom:10px;">
                <strong class="notranslate">${selecionado.nome}</strong> ${obterHtmlEstoque(selecionado.estoque, selecionado.tipo)}
            </div>
            <p style="font-size:0.7rem; color:#666; margin-bottom:10px;">📍 ${selecionado.endereco}</p>
            <div class="ficha-grid">
                <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
                <div class="info-box"><label>📐 Plantas</label><span>${selecionado.plantas}</span></div>
                <div class="info-box"><label>🏗️ Obra</label><span>${selecionado.obra}%</span></div>
            </div>
            <div class="info-box" style="background:#fff5e6; margin-top:10px; border-left: 3px solid #f37021;">
                <label style="color:#d67e00;">💡 Dica do Corretor</label>
                <p style="font-size:0.75rem;">${selecionado.dica}</p>
            </div>
            <a href="${selecionado.book}" target="_blank" class="btRes" style="background:#00713a; color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none;">📄 Book Cliente</a>
        </div>`;
}

function navegarVitrine(nome, nomeRegiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
    montarVitrine(imovel, lista, nomeRegiao);
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url;
}
