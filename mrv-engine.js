// --- ATUALIZAÇÃO DA FUNÇÃO DESENHAR ---
function desenhar(idContainer, dadosMapa) {
    const container = document.getElementById(idContainer);
    if (!container || !dadosMapa) return;

    const pathsHtml = dadosMapa.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase() && d.tipo !== 'N');
        // Adicionamos a classe 'commrv' apenas se houver dados, permitindo o hover via CSS
        return `<path id="${p.id}" 
                      name="${p.name}" 
                      d="${p.d}" 
                      class="${temMRV ? 'commrv' : ''}"
                      onclick="cliqueNoMapa('${p.id}')">
                </path>`;
    }).join('');

    container.innerHTML = `
        <svg viewBox="${dadosMapa.viewBox}" preserveAspectRatio="xMidYMid meet">
            <g transform="${dadosMapa.transform || ''}">${pathsHtml}</g>
        </svg>`;
}

// --- NOVA FUNÇÃO PARA TRATAR O CLIQUE NO MAPA ---
function cliqueNoMapa(idPath) {
    // Busca na planilha o primeiro residencial que pertença a essa cidade/path
    const imovel = DADOS_PLANILHA.find(d => d.id_path === idPath.toLowerCase() && d.tipo !== 'N');
    
    if (imovel) {
        // Se achou, usamos a função selecionar que já existe no seu desktop.html ou mobile.html
        // Tentamos encontrar o botão correspondente na lista para dar o destaque visual
        const btnId = `btn-esq-${imovel.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const btn = document.getElementById(btnId) || null;
        
        selecionar(imovel, btn);
    } else {
        // Se não tem MRV, apenas destacamos a cidade e limpamos a ficha
        const el = document.getElementById(idPath);
        if (el) destacarNoMapa(el);
        document.getElementById('ficha-tecnica').innerHTML = '<p style="padding:20px; color:#999;">Sem residenciais cadastrados para esta cidade.</p>';
    }
}

// Função auxiliar para destacar visualmente o path
function destacarNoMapa(el) {
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    el.classList.add('path-ativo');
    pathSelecionado = el;
    
    // Atualiza o título no topo do mapa
    const display = document.getElementById('cidade-titulo') || document.getElementById('display-nome');
    if (display) display.innerText = el.getAttribute('name') || el.id;
}
