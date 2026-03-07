// --- CONFIGURAÇÕES GLOBAIS ---
let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// 1. MAPEAMENTO DE COLUNAS
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12,
    BK_CLI: 19, BK_COR: 20, LOC: 34, IMPLANT: 35 
};

// 2. CONFIGURAÇÃO DO LINK DA PLANILHA NOVO
// Aqui está o ID que você me passou
const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";

// Construção da URL de exportação para CSV (Garantindo que o Google entregue dados)
const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

async function iniciarApp() { 
    console.log("Tentando carregar a planilha...");
    await carregarPlanilha(); 
}

async function carregarPlanilha() {
    try {
        // O cachebuster é vital para o Google não te entregar o "Estoque 1000" antigo
        const cacheBuster = `&v=${new Date().getTime()}`;
        const finalUrl = URL_CSV + cacheBuster;

        const response = await fetch(finalUrl);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - Verifique se a planilha está compartilhada como 'Qualquer pessoa com o link'`);
        }

        const texto = await response.text();
        
        // Se o texto vier vazio ou for um HTML (página de login), a planilha não está pública
        if (texto.includes("<!DOCTYPE html>") || texto.length < 10) {
            throw new Error("A planilha retornou um formato inválido. Certifique-se de que o acesso está liberado para 'Qualquer pessoa com o link'.");
        }

        // Processamento das linhas
        const linhas = texto.split(/\r?\n/);
        DADOS_PLANILHA = linhas.slice(1) // Pula o cabeçalho
            .filter(linha => linha.trim() !== "") // Remove linhas vazias
            .map(linha => {
                // Regex para separar vírgulas ignorando as que estão dentro de aspas
                return linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(campo => {
                    return campo.replace(/^"|"$/g, "").trim();
                });
            });

        console.log("Sucesso! Dados carregados:", DADOS_PLANILHA);

        // Dispara a atualização da interface
        if (typeof renderizarLista === "function") {
            renderizarLista();
        }
        if (typeof atualizarMapa === "function") {
            atualizarMapa();
        }

    } catch (erro) {
        console.error("Erro ao carregar os dados:", erro);
        // Exibe o erro na tela para ajudar no diagnóstico
        const lista = document.getElementById('listaEmpreendimentos');
        if (lista) {
            lista.innerHTML = `<div style="color:red; padding:10px;">Erro ao carregar dados: ${erro.message}</div>`;
        }
    }
}

// Inicia a execução
iniciarApp();
