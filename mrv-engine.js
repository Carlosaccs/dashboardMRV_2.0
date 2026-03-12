// ... (mantenha as variáveis e o COL no topo como estão)

async function iniciarApp() {
    // REMOVEMOS os estilos daqui para você controlar pelo HTML/CSS
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
        if (!texto.endsWith('\n')) texto += '\n'; // Garante o Grand Prix

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
            const catLimpa = colunas[COL.CATEGORIA] ? colunas[COL.CATEGORIA].toUpperCase() : "";
            return {
                id_path: colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "",
                tipo: catLimpa.includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME] || "",
                cidade: colunas[COL.ID] || "",
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
        gerarListaLateral(); 
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    
    // ESTA PARTE É O QUE RESOLVE O PROBLEMA DOS BTRES:
    const estaNaGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idBusca);
    const estaNoInterior = MAPA_INTERIOR.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idBusca);

    if (estaNaGSP && mapaAtivo !== 'GSP') { trocarMapas(); }
    else if (estaNoInterior && mapaAtivo !== 'INTERIOR') { trocarMapas(); }

    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        nomeSelecionado = nomePath || selecionado.cidade;
        
        document.getElementById('cidade-titulo').innerText = nomeSelecionado;
        
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        const el = document.getElementById(`caixa-a-${idBusca}`);
        if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }
        
        document.querySelectorAll('.btRes, .separador-complexo-btn').forEach(btn => btn.classList.remove('ativo'));
        const idBotao = `btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const btnClicado = document.getElementById(idBotao);
        if (btnClicado) btnClicado.classList.add('ativo');
        
        montarVitrine(selecionado, imoveis, nomeSelecionado);
    }
}

// ... (Restante das funções: renderizarNoContainer, montarVitrine, gerarListaLateral, etc. como na versão anterior)
