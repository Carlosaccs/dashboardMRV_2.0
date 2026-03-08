let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// MAPEAMENTO EXATO DA SUA NOVA ESTRUTURA (A=0, B=1, C=2...)
const COL = {
    ID: 0,          // ID_PATH
    CATEGORIA: 1,   // CATEGORIA (Usaremos para definir se é Residencial ou Complexo)
    ORDEM: 2,       // ORDEM
    NOME: 3,        // NOME_CURTO (O que aparece no botão)
    NOME_FULL: 4,   // NOME_FULL (O que aparece no título da ficha)
    ESTOQUE: 5,     // ESTOQUE
    END: 6,         // ENDERECO
    PRECO: 7,       // PRECO
    ENTREGA: 8,     // ENTREGA
    P_DE: 9,        // PLANTAS_DE
    P_ATE: 10,      // PLANTAS_ATE
    OBRA: 11,       // STATUS_OBRA
    DICA: 12,       // DICA_CURTA
    DESC: 13,       // DESCRICAO_LONGA
    BOOK: 20        // BOOK_CLIENTE (Coluna U)
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
                tipo: c[COL.CATEGORIA] === 'COMPLEXO' ? 'N' : 'R', // Mantém sua lógica de separador
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: c[COL.NOME] || "Sem Nome",
                nomeFull: c[COL.NOME_FULL] || "",
                estoque: c[COL.ESTOQUE] || "",
                endereco: c[COL.END] || "",
                preco: c[COL.PRECO] || "",
                entrega: c[COL.ENTREGA] || "",
                plantas: (c[COL.P_DE] && c[COL.P_ATE]) ? `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}` : "Consulte",
