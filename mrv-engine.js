let DADOS_PLANILHA = [];
let mapaAtivo = 'GSP';
let pathSelecionado = null;

// COLUNAS EXATAS DA SUA PLANILHA
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, PRECO: 8, ENTREGA: 7, OBRA: 11, DICA: 12,
    BK_CLI: 19, BK_COR: 20, LOC: 34, IMPLANT: 35
};

async function iniciarApp() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const res = await fetch(`${URL_CSV}&v=${Date.now()}`);
        const texto = await res.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.length > 10);
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: (c[COL.ID] || "").toLowerCase(),
                tipo: c[COL.TIPO],
                nome: c[COL.NOME],
                estoque: c[COL.ESTOQUE],
                preco: c[COL.PRECO],
                entrega: c[COL.ENTREGA],
                obra: c[COL.OBRA],
                dica: c[COL.DICA],
                materiais: [
                    { label: "Book Cliente", url: limparLink(c[COL.BK_CLI]) },
                    { label: "Book Corretor", url: limparLink(c[COL.BK_COR]) },
                    { label: "Localização", url: limparLink(c[COL.LOC]) },
                    { label: "Implantação", url: limparLink(c[COL.IMPLANT]) }
                ]
            };
        }).filter(d => d.nome);

        gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro carga:", e); }
}

function limparLink(url) {
    if(!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\//);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}

function desenharMapas() {
    const p = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const s = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderSVG('caixa-a', p, true);
    renderSVG('caixa-b', s, false);
}

function renderSVG(containerId, dados, interativo) {
    const container = document.getElementById(containerId);
    const paths = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        const acao = interativo ? `onclick="comandoSelecao('${p.id}', '${p.name}')"` : `onclick="trocarMapa()"`;
        return `<path id="${containerId}-${p.id}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${acao}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}">${paths}</svg>`;
}

function comandoSelecao(id, nome, objDireto = null) {
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    const el = document.getElementById(`caixa-a-${id}`);
    if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }

    document.getElementById('cidade-titulo').innerText = nome;
    const item = objDireto || DADOS_PLANILHA.find(d => d.id_path === id.toLowerCase());
    if (item) montarFicha(item);
}

function montarFicha(item) {
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const btn = document.getElementById(`btn-esq-${item.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if(btn) btn.classList.add('ativo');

    const htmlLinks = item.materiais.map(m => {
        if(!m.url || m.url.length < 20) return "";
        return `
            <div class="mat-box">
                <span style="font-size:0.65rem; font-weight:bold;">${m.label}</span>
                <div>
                    <a href="${m.url}" target="_blank" class="btn-acao btn-abrir">ABRIR</a>
                    <button class="btn-acao btn-copiar" onclick="copiar('${m.url}')">COPIAR</button>
                </div>
                <div class="mini-preview"><iframe src="${m.url}"></iframe></div>
            </div>`;
    }).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div style="background:var(--mrv-laranja); color:white; padding:10px; border-radius:5px; margin-bottom:10px;">
            <h2 style="font-size:1rem;">${item.nome}</h2>
        </div>
        <p style="font-size:0.75rem;"><b>Preço:</b> ${item.preco}</p>
        <p style="font-size:0.75rem;"><b>Entrega:</b> ${item.entrega}</p>
        <p style="font-size:0.75rem;"><b>Obra:</b> ${item.obra}%</p>
        <div style="background:#fef9e7; padding:8px; border-left:4px solid orange; margin:10px 0; font-size:0.7rem;">
            <strong>DICA:</strong> ${item.dica}
        </div>
        <div style="margin-top:15px;">${htmlLinks}</div>
    `;
}

function copiar(u) { navigator.clipboard.writeText(u); alert("Link copiado!"); }
function trocarMapa() { mapaAtivo = (mapaAtivo === 'GSP' ? 'INTERIOR' : 'GSP'); desenharMapas(); }
function obterHtmlEstoque(v) { return `<span style="font-size:0.6rem; color:#999;">${v} un</span>`; }
