function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;

    const pathsHtml = dados.paths.map(p => {
        const idPathNormalizado = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNormalizado);
        
        // Identifica se é o path da Grande SP (independente de maiúsculas/minúsculas)
        const isGrandeSP = p.name.toLowerCase().includes("grande são paulo") || p.id.toLowerCase() === "grandesaopaulo";
        
        // Se for Grande SP, força o ID correto. Se não, usa o padrão da caixa.
        const idAtributo = isGrandeSP ? 'id="grandesaopaulo"' : `id="${id}-${p.id}"`;
        
        let acaoClique = "";
        if (interativo) {
            if (isGrandeSP) {
                acaoClique = `onclick="trocarMapas()"` ;
            } else {
                acaoClique = `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`;
            }
        }

        const acoesHover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        
        // Adiciona a classe 'commrv' na Grande SP para ela herdar o ponteiro de clique e cores
        const classeExtra = (temMRV || isGrandeSP) && interativo ? 'commrv' : '';
        
        return `<path ${idAtributo} name="${p.name}" d="${p.d}" class="${classeExtra}" ${acaoClique} ${acoesHover}></path>`;
    }).join('');

    const zoom = interativo ? 'scale(1.2)' : 'scale(0.9)';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform: ${zoom}; transform-origin: center;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
    
    if (!interativo) {
        container.onclick = trocarMapas;
        container.style.cursor = "pointer";
    }
}

// Garanta que a função trocarMapas limpe a lateral
function trocarMapas() { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    desenharMapas(); 
    limparSelecao();
}

function limparSelecao() {
    pathSelecionado = null;
    nomeSelecionado = "";
    const titulo = document.getElementById('cidade-titulo');
    if (titulo) titulo.innerText = "Selecione uma região";
    
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    
    const painel = document.getElementById('ficha-tecnica');
    if (painel) {
        painel.innerHTML = `
            <div class="vitrine-topo">Aguardando Seleção</div>
            <p style="text-align:center; padding:40px; color:#999; font-size:0.8rem;">
                Clique em algum Residencial ou em alguma região verde do mapa
            </p>`;
    }
}
