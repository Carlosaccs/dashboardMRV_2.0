// --- CONFIGURAÇÕES GLOBAIS ---
let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// 1. MAPEAMENTO DE COLUNAS (Ajustado para sua planilha nova)
// Verifique se a coluna ESTOQUE é a quarta (índice 3: A=0, B=1, C=2, D=3)
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12,
    BK_CLI: 19, BK_COR: 20, LOC: 34, IMPLANT: 35 
};

// 2. CONFIGURAÇÃO DO LINK (Usando o ID que você forneceu)
const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
// O link abaixo transforma o seu link de edição em um link de dados para o sistema
const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

async function iniciarApp() { 
    console.log("Iniciando carregamento da planilha: " + SHEET_ID);
    await carregarPlanilha(); 
}

async function carregarPlanilha() {
    try {
        // Adicionamos um número aleatório no final (&v=...) para forçar o Google
        // a nos dar a versão MAIS RECENTE da planilha, ignorando o erro dos "1000 UN."
        const timestamp = new Date().getTime();
        const response = await fetch(`${URL_CSV}&cachebuster=${timestamp}`);
        
        if (!response.ok) {
            throw new Error("Não foi possível acessar a planilha. Verifique se ela está compartilhada como 'Qualquer pessoa com o link'.");
        }

        const texto = await response.text();
        
        // Converte o texto CSV em uma lista de dados que o JavaScript entende
        const linhas = texto.split(/\r?\n/);
        
        // O slice(1) pula a primeira linha (cabeçalho)
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            // Divide a linha pelas vírgulas, mas ignora vírgulas dentro de aspas
            return linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(campo => {
                return campo.replace(/^"|"$/g, "").trim(); // Remove aspas extras
            });
        });

        console.log("Dados carregados com sucesso! Itens encontrados:", DADOS_PLANILHA.length);
        
        // Se houver uma função para atualizar o mapa ou lista no index.html, ela deve ser chamada aqui
        if (typeof renderizarLista === "function") {
            renderizarLista();
        }

    } catch (erro) {
        console.error("Erro ao carregar os dados da MRV:", erro);
        alert("Erro ao carregar dados da planilha nova.");
    }
}

// Inicia o processo automaticamente
iniciarApp();
