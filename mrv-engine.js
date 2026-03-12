// ... (mantenha suas constantes COL e DADOS_PLANILHA)

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;

    if (!interativo) {
        container.style.cursor = "pointer";
        container.onclick = trocarMapas;
    } else {
        container.onclick = null;
    }

    const pathsHtml = dados.paths.map(p => {
        const idPath = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPath);
        const clique = interativo ? `onclick="comandoSelecao('${p.id}', '${p.name}')"` : "";
        const classe = (temMRV && interativo) ? 'commrv' : '';
        return `<path id="${id}-${p.id}" d="${p.d}" class="${classe}" ${clique}></path>`;
    }).join('');

    // Ajuste no viewBox e remoção do transform fixo que podia causar distorção
    container.innerHTML = `
        <svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet">
            <g>${pathsHtml}</g>
        </svg>`;
}

// ... (mantenha a função carregarPlanilha e montarVitrine conforme enviadas anteriormente)

function desenharMapas() {
    // Agora o mapa principal sempre ganha o container com flex: 3
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    desenharMapas();
    // Limpa o título ao trocar
    document.getElementById('cidade-titulo').innerText = "Selecione uma região";
}

// Inicia
iniciarApp();
