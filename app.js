/* Auxiliar de Impressão - Bouquet Flores */
(function () {
  const STORAGE_KEY = 'auxiliar-impressao-bouquet-flores-v3';
  const STORAGE_KEY_ANTIGO = 'auxiliar-impressao-bouquet-flores-v1';
  const pagamentos = ['Vem pagar', 'Receber', 'Cartão', 'Pix', 'Dinheiro'];
  const DEFAULT_CATALOGO_SUPABASE_URL = 'https://kixsrmftboxdjlgqdbdw.supabase.co';
  const DEFAULT_CATALOGO_SUPABASE_ANON_KEY = 'sb_publishable_YXApcJjdBqHvU6A94Z0bAw_G68DBkm_';
  const DEFAULT_TAXA_ENTREGA = '25,00';


  const defaultState = {
    pedido: {
      entregarPara: '',
      endereco: '',
      bairro: '',
      telefone: '',
      pedido: '',
      produtos: [],
      dataEntrega: '',
      diaSemana: '',
      periodoEntrega: '',
      vendedor: '',
      valor: '',
      pagamentos: [],
      cliente: '',
      foneCliente: '',
      fotoDataUrl: '',
      fotoNome: ''
    },
    cartao: {
      tipo: 'com',
      destinatario: '',
      endereco: '',
      telefone: '',
      mensagem: '',
      fontDelta: 0,
      fontFamily: "Georgia, 'Times New Roman', serif"
    },
    vendedores: ['Loja', 'WhatsApp'],
    ultimoVendedor: '',
    configuracoes: {
      fotoPedidoColorida: false,
      taxaEntrega: DEFAULT_TAXA_ENTREGA,
      catalogoSupabaseUrl: DEFAULT_CATALOGO_SUPABASE_URL,
      catalogoSupabaseAnonKey: DEFAULT_CATALOGO_SUPABASE_ANON_KEY
    },
    catalogo: {
      produtos: [],
      carregadoEm: '',
      status: ''
    },
    calibragemPadraoVersao: 12,
    calibragem: {
      impressao: {
        pedido: { x: 0.5, y: -0.5, escala: 100 },
        cartaoDizeres: { x: 0, y: 0, escala: 100 },
        cartaoSemDizeres: { x: 0, y: 0, escala: 100 }
      },
      basePedido: { x: 0, y: 0, tickX: 0, tickY: 0 },
      baseCartaoDizeres: { x: 0, y: 0 },
      baseCartaoSemDizeres: { x: 0, y: 0 },
      baseCampos: {
        "pedido": {
                "entregarPara": {
                        "x": -0.5,
                        "y": -2
                },
                "endereco": {
                        "x": -2,
                        "y": -2
                },
                "bairro": {
                        "x": 0,
                        "y": -2
                },
                "telefone": {
                        "x": 0,
                        "y": -2
                },
                "pedido": {
                        "x": 0,
                        "y": 3
                },
                "dataDia": {
                        "x": 0,
                        "y": 0
                },
                "dataMes": {
                        "x": -2,
                        "y": 0
                },
                "dataAno": {
                        "x": -6.5,
                        "y": 0
                },
                "diaSemana": {
                        "x": 0,
                        "y": 0
                },
                "periodoEntrega": {
                        "x": 0,
                        "y": 0
                },
                "vendedor": {
                        "x": 0,
                        "y": 0
                },
                "valor": {
                        "x": 0,
                        "y": 0
                },
                "pagamentos": {
                        "vemPagar": {
                                "x": -2,
                                "y": -0.5
                        },
                        "receber": {
                                "x": -2,
                                "y": -1
                        },
                        "cartao": {
                                "x": -2,
                                "y": -1
                        },
                        "pix": {
                                "x": -2,
                                "y": -1.5
                        },
                        "dinheiro": {
                                "x": -2,
                                "y": -2
                        }
                },
                "cliente": {
                        "x": -1,
                        "y": -1
                },
                "foneCliente": {
                        "x": 0,
                        "y": -1.5
                }
        },
        "cartao": {
                "mensagem": {
                        "x": 0,
                        "y": 0
                },
                "destinatario": {
                        "x": 0,
                        "y": -1.5
                },
                "endereco": {
                        "x": 0,
                        "y": -1.5
                },
                "telefone": {
                        "x": 0,
                        "y": -1.5
                }
        },
        "cartaoSem": {
                "destinatario": {
                        "x": 0,
                        "y": -5
                },
                "endereco": {
                        "x": 0,
                        "y": 0
                },
                "telefone": {
                        "x": 0,
                        "y": -1
                }
        }
}
    }
  };

  let state = structuredCloneSafe(defaultState);
  let saveTimer = null;
  let configPreviewMode = 'pedido';
  let modalPreviewMode = 'pedido';
  let deferredInstallPrompt = null;
  let proximoFocoProdutoPorTab = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    carregarDados();
    normalizarState();
    bindEvents();
    renderTudo();
    carregarCatalogoProdutos({ silencioso: true });

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  }

  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeDeep(target, source) {
    for (const key of Object.keys(source || {})) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = mergeDeep(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  function carregarDados() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY_ANTIGO);
      if (raw) state = JSON.parse(raw);
    } catch (error) {
      aviso('Não foi possível carregar os dados salvos. O programa abriu com dados limpos.');
    }
  }

  function salvarDadosDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(salvarDados, 200);
  }

  function salvarDados() {
    try {
      normalizarState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      aviso('Não foi possível salvar os dados. Verifique permissão da pasta/perfil do navegador.');
    }
  }

  function normalizarState() {
    const versaoCalibragemAnterior = state?.calibragemPadraoVersao;
    state = mergeDeep(structuredCloneSafe(defaultState), state || {});
    if (versaoCalibragemAnterior !== defaultState.calibragemPadraoVersao) {
      state.calibragem = structuredCloneSafe(defaultState.calibragem);
      state.calibragemPadraoVersao = defaultState.calibragemPadraoVersao;
    }
    if (!Array.isArray(state.vendedores)) state.vendedores = [];
    state.vendedores = [...new Set(state.vendedores.filter(Boolean).map(v => String(v).trim()))];
    if (!state.vendedores.length) state.vendedores = ['Loja'];
    if (!state.pedido.vendedor) state.pedido.vendedor = state.ultimoVendedor || state.vendedores[0] || '';
    if (!state.vendedores.includes(state.pedido.vendedor)) state.vendedores.unshift(state.pedido.vendedor);
    if (!['com', 'sem'].includes(state.cartao.tipo)) state.cartao.tipo = 'com';
    if (!state.cartao.fontFamily) state.cartao.fontFamily = defaultState.cartao.fontFamily;
    state.configuracoes.fotoPedidoColorida = Boolean(state.configuracoes.fotoPedidoColorida);
    state.configuracoes.taxaEntrega = state.configuracoes.taxaEntrega || DEFAULT_TAXA_ENTREGA;
    state.configuracoes.catalogoSupabaseUrl = state.configuracoes.catalogoSupabaseUrl || DEFAULT_CATALOGO_SUPABASE_URL;
    state.configuracoes.catalogoSupabaseAnonKey = state.configuracoes.catalogoSupabaseAnonKey || DEFAULT_CATALOGO_SUPABASE_ANON_KEY;
    if (!state.catalogo || typeof state.catalogo !== 'object') state.catalogo = structuredCloneSafe(defaultState.catalogo);
    if (!Array.isArray(state.catalogo.produtos)) state.catalogo.produtos = [];
    if (!state.calibragem.baseCampos || typeof state.calibragem.baseCampos !== 'object') state.calibragem.baseCampos = structuredCloneSafe(defaultState.calibragem.baseCampos);
    state.pedido.pagamentos = pagamentos.filter(p => (state.pedido.pagamentos || []).includes(p));
    migrarPedidoAntigoParaProdutos();
    normalizarProdutosPedido();
  }

  function bindEvents() {
    $$('.tab').forEach(btn => {
      btn.addEventListener('click', () => trocarTela(btn.dataset.screen));
    });

    $$('[data-bind]').forEach(input => {
      input.addEventListener('input', () => {
        const path = input.dataset.bind;
        setByPath(state, path, input.value);
        if (path === 'pedido.vendedor') lembrarVendedor(input.value);
        if (path === 'pedido.dataEntrega') {
          aplicarDataEntregaDigitada(false);
        }
        if (path === 'configuracoes.taxaEntrega') atualizarTaxaEntregaDoPedido(false);
        if (path === 'configuracoes.catalogoSupabaseUrl' || path === 'configuracoes.catalogoSupabaseAnonKey') limparProdutosCatalogoCarregados();
        salvarDadosDebounced();
        renderCartaoTipo();
        renderProdutosPedidoForm({ manterFoco: true });
        renderCatalogoControles();
        renderPreview();
      });
      input.addEventListener('change', () => {
        const path = input.dataset.bind;
        setByPath(state, path, input.value);
        if (path === 'pedido.vendedor') lembrarVendedor(input.value);
        if (path === 'pedido.dataEntrega') aplicarDataEntregaDigitada(true);
        if (path === 'configuracoes.taxaEntrega') atualizarTaxaEntregaDoPedido(true);
        if (path === 'configuracoes.catalogoSupabaseUrl' || path === 'configuracoes.catalogoSupabaseAnonKey') limparProdutosCatalogoCarregados();
        salvarDadosDebounced();
        renderVendedores();
        renderInputs();
        renderProdutosPedidoForm({ manterFoco: true });
        renderCatalogoControles();
        renderPreview();
      });
    });

    $$('[data-bind-number]').forEach(input => {
      input.addEventListener('input', () => {
        const value = Number(String(input.value).replace(',', '.')) || 0;
        setByPath(state, input.dataset.bindNumber, value);
        salvarDadosDebounced();
        renderPreview();
      });
    });

    const valorInput = $('[data-bind="pedido.valor"]');
    if (valorInput) {
      valorInput.addEventListener('blur', () => {
        normalizarValorPedido();
        salvarDadosDebounced();
        renderInputs();
        renderPreview();
      });
    }

    const dataEntregaInput = $('[data-bind="pedido.dataEntrega"]');
    if (dataEntregaInput) {
      dataEntregaInput.addEventListener('blur', () => {
        aplicarDataEntregaDigitada(true);
        salvarDadosDebounced();
        renderInputs();
        renderPreview();
      });
      dataEntregaInput.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        aplicarDataEntregaDigitada(true);
        salvarDadosDebounced();
        renderInputs();
        renderPreview();
      });
    }


    const fotoPedidoInput = $('#pedidoFotoInput');
    if (fotoPedidoInput) {
      fotoPedidoInput.addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        carregarFotoPedido(file).finally(() => {
          fotoPedidoInput.value = '';
        });
      });
    }


    const produtosLista = $('#pedidoProdutosLista');
    if (produtosLista) {
      produtosLista.addEventListener('input', handleProdutoPedidoInput);
      produtosLista.addEventListener('change', handleProdutoPedidoChange);
      produtosLista.addEventListener('click', handleProdutoPedidoClick);
      produtosLista.addEventListener('keydown', handleProdutoPedidoKeydown);
    }

    on('#btnAdicionarProdutoPedido', 'click', abrirSeletorCatalogoProdutos);
    on('#btnAdicionarTaxaEntrega', 'click', adicionarTaxaEntregaPedido);
    on('#btnAtualizarCatalogoProdutos', 'click', () => carregarCatalogoProdutos({ silencioso: false }));
    on('#btnRestaurarCatalogoSupabase', 'click', restaurarConfiguracaoCatalogoSupabase);

    $$('[data-payment]').forEach(chk => {
      chk.addEventListener('change', () => {
        const value = chk.dataset.payment;
        const list = new Set(state.pedido.pagamentos || []);
        chk.checked ? list.add(value) : list.delete(value);
        state.pedido.pagamentos = pagamentos.filter(item => list.has(item));
        salvarDadosDebounced();
        renderPreview();
      });
    });

    $$('input[name="tipoCartao"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        state.cartao.tipo = radio.value;
        configPreviewMode = 'cartao';
        modalPreviewMode = 'cartao';
        salvarDadosDebounced();
        renderTudo();
      });
    });

    on('#btnHoje', 'click', () => setDataEntrega(0));
    on('#btnAmanha', 'click', () => setDataEntrega(1));
    on('#btnCopiarParaCartao', 'click', copiarPedidoParaCartao);
    on('#btnCopiarDoPedido', 'click', copiarPedidoParaCartao);
    on('#btnFonteMenor', 'click', () => ajustarFonte(-1));
    on('#btnFonteMaior', 'click', () => ajustarFonte(1));
    on('#btnFonteAuto', 'click', () => {
      state.cartao.fontDelta = 0;
      salvarDadosDebounced();
      renderInputs();
      renderPreview();
    });
    on('#btnAdicionarVendedor', 'click', adicionarVendedor);
    on('#novoVendedor', 'keydown', event => {
      if (event.key === 'Enter') adicionarVendedor();
    });
    on('#btnLimparPedido', 'click', limparTudo);
    on('#btnLimparCartao', 'click', limparTudo);
    on('#btnLimparTudo', 'click', limparTudo);
    on('#btnPreencherTeste', 'click', preencherTeste);
    on('#btnRemoverFotoPedido', 'click', removerFotoPedido);
    on('#btnAlternarCorFotoPedido', 'click', alternarCorFotoPedido);
    on('#btnPreviewPedido', 'click', () => abrirPreviewModal('pedido'));
    on('#btnPreviewCartao', 'click', () => abrirPreviewModal('cartao'));
    on('#showPedidoPreview', 'click', () => setConfigPreviewMode('pedido'));
    on('#showCartaoPreview', 'click', () => setConfigPreviewMode('cartao'));
    on('#btnFecharPreview', 'click', fecharPreviewModal);
    on('#previewModal', 'click', event => {
      if (event.target.id === 'previewModal') fecharPreviewModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') fecharPreviewModal();
    });
    on('#btnImprimirPedido', 'click', () => imprimir('pedido'));
    on('#btnImprimirCartao', 'click', () => imprimir(state.cartao.tipo === 'sem' ? 'cartao-sem' : 'cartao-com'));
    on('#btnInstalarApp', 'click', instalarAppAndroid);
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      atualizarBotaoInstalacao();
    });
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      atualizarBotaoInstalacao();
    });
    window.addEventListener('resize', () => {
      atualizarBotaoInstalacao();
      atualizarZoomPreviewModal();
    });
    atualizarBotaoInstalacao();
  }

  function on(selector, eventName, handler) {
    const el = $(selector);
    if (el) el.addEventListener(eventName, handler);
  }

  function trocarTela(screen) {
    $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.screen === screen));
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${screen}`));
    if (screen === 'ajustes') renderPreview();
  }

  function renderTudo() {
    renderInputs();
    renderVendedores();
    renderCartaoTipo();
    renderProdutosPedidoForm();
    renderFotoPedidoControles();
    renderCatalogoControles();
    renderPreview();
  }

  function renderInputs() {
    $$('[data-bind]').forEach(input => {
      const value = getByPath(state, input.dataset.bind) ?? '';
      if (input.value !== String(value)) input.value = value;
    });
    $$('[data-bind-number]').forEach(input => {
      const value = getByPath(state, input.dataset.bindNumber) ?? 0;
      if (input.value !== String(value)) input.value = value;
    });

    $$('[data-payment]').forEach(chk => {
      chk.checked = (state.pedido.pagamentos || []).includes(chk.dataset.payment);
    });
    $$('input[name="tipoCartao"]').forEach(radio => {
      radio.checked = radio.value === state.cartao.tipo;
    });
  }

  function renderDiaSemanaInput() {
    const value = String(state.pedido.diaSemana || '');
    $$('[data-bind="pedido.diaSemana"]').forEach(input => {
      if (input.value !== value) input.value = value;
    });
  }

  function renderVendedores() {
    const select = $('#selectVendedorPedido');
    if (select) {
      const previous = select.value;
      select.innerHTML = state.vendedores.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
      select.value = state.pedido.vendedor || previous || state.vendedores[0] || '';
    }

    const list = $('#listaVendedores');
    if (!list) return;
    list.innerHTML = '';
    state.vendedores.forEach(vendedor => {
      const item = document.createElement('div');
      item.className = 'seller-item';
      item.innerHTML = `<strong>${escapeHtml(vendedor)}</strong>`;
      const buttons = document.createElement('div');
      buttons.className = 'button-row';

      const usar = document.createElement('button');
      usar.textContent = 'Usar';
      usar.type = 'button';
      usar.addEventListener('click', () => {
        state.pedido.vendedor = vendedor;
        lembrarVendedor(vendedor);
        salvarDadosDebounced();
        renderTudo();
        aviso(`Vendedor selecionado: ${vendedor}`);
      });

      const remover = document.createElement('button');
      remover.textContent = 'Remover';
      remover.type = 'button';
      remover.className = 'danger';
      remover.addEventListener('click', () => removerVendedor(vendedor));

      buttons.append(usar, remover);
      item.append(buttons);
      list.append(item);
    });
  }

  function renderCartaoTipo() {
    const fieldset = $('#fieldsetDizeres');
    if (fieldset) fieldset.style.display = state.cartao.tipo === 'com' ? '' : 'none';
  }

  function renderFotoPedidoControles() {
    const alternar = $('#btnAlternarCorFotoPedido');
    if (alternar) {
      alternar.textContent = state.configuracoes.fotoPedidoColorida
        ? 'Fotos do pedido: coloridas'
        : 'Fotos do pedido: preto e branco';
    }
  }

  function renderCatalogoControles() {
    renderCatalogoDatalist();

    const status = $('#catalogoProdutosStatus');
    if (status) {
      const quantidade = Array.isArray(state.catalogo.produtos) ? state.catalogo.produtos.length : 0;
      const carregado = state.catalogo.carregadoEm ? ` Última atualização: ${state.catalogo.carregadoEm}.` : '';
      status.textContent = state.catalogo.status || (quantidade ? `${quantidade} produto(s) carregado(s) do catálogo.${carregado}` : 'Catálogo ainda não carregado.');
    }
  }

  function renderCatalogoDatalist() {
    const datalist = $('#catalogoProdutosDatalist');
    if (!datalist) return;
    datalist.innerHTML = '';
    (state.catalogo.produtos || []).forEach(produto => {
      const option = document.createElement('option');
      option.value = produto.nome || '';
      const preco = produto.preco ? formatarValorParaTela(produto.preco) : '';
      option.label = [produto.nome, preco].filter(Boolean).join(' - ');
      datalist.append(option);
    });
  }

  function renderProdutosPedidoForm(options = {}) {
    const lista = $('#pedidoProdutosLista');
    if (!lista) return;
    const focoAnterior = options.manterFoco ? obterFocoAtualProduto() : null;
    normalizarProdutosPedido();

    lista.innerHTML = '';
    state.pedido.produtos.forEach((produto, index) => {
      const card = document.createElement('div');
      card.className = `order-product-card${produto.ehTaxaEntrega ? ' delivery-product-card' : ''}`;
      card.dataset.produtoIndex = String(index);

      const fotoSrc = produto.fotoDataUrl || produto.fotoUrl || '';
      const fotoResumo = fotoSrc ? (produto.fotoNome || 'Foto selecionada') : 'Sem foto';
      const podeRemover = state.pedido.produtos.length > 1 || produtoPossuiConteudo(produto);
      const inputFotoId = `produtoFoto-${produto.id || index}`;

      card.innerHTML = `
        <div class="product-card-grid">
          <label class="product-name-field product-placeholder-field">
            <input type="text" value="${escapeAttr(produto.nome)}" data-produto-campo="nome" list="catalogoProdutosDatalist" autocomplete="off" placeholder="Nome do produto" aria-label="Nome do produto" ${produto.ehTaxaEntrega ? 'readonly' : ''}>
          </label>
          <label class="product-price-field product-placeholder-field">
            <input type="text" value="${escapeAttr(produto.preco)}" data-produto-campo="preco" inputmode="decimal" autocomplete="off" placeholder="Preço" aria-label="Preço">
          </label>
          <div class="product-photo-compact">
            <span class="product-photo-name">${escapeHtml(fotoResumo)}</span>
            ${fotoSrc ? `<img src="${escapeAttr(fotoSrc)}" class="photo-thumb ${state.configuracoes.fotoPedidoColorida ? '' : 'photo-grayscale'}" alt="Prévia da foto do produto">` : ''}
            <label class="file-button small-file-button">Foto
              <input type="file" id="${inputFotoId}" data-produto-foto accept="image/*" ${produto.ehTaxaEntrega ? 'disabled' : ''}>
            </label>
            <button type="button" class="secondary small-button" data-produto-action="remover-foto" ${fotoSrc ? '' : 'disabled'}>Remover foto</button>
            <button type="button" class="secondary small-button" data-produto-action="remover" ${podeRemover ? '' : 'disabled'}>Remover produto</button>
          </div>
        </div>
      `;
      lista.append(card);
    });

    const btnTaxa = $('#btnAdicionarTaxaEntrega');
    if (btnTaxa) {
      btnTaxa.disabled = pedidoTemTaxaEntrega();
      btnTaxa.textContent = pedidoTemTaxaEntrega() ? 'Taxa adicionada' : 'Adicionar taxa';
    }

    const focoViaTab = proximoFocoProdutoPorTab;
    proximoFocoProdutoPorTab = null;
    const focoParaRestaurar = focoViaTab?.sairDaLista ? null : (focoViaTab || focoAnterior);
    if (focoParaRestaurar) restaurarFocoProduto(focoParaRestaurar);
  }

  function handleProdutoPedidoKeydown(event) {
    if (event.key !== 'Tab') return;
    proximoFocoProdutoPorTab = obterProximoFocoProduto(event.target, event.shiftKey ? -1 : 1) || { sairDaLista: true };
  }

  function obterProximoFocoProduto(elementoAtual, direcao) {
    const lista = $('#pedidoProdutosLista');
    if (!lista) return null;
    const focaveis = $$('[data-produto-campo], [data-produto-foto], [data-produto-action]', lista)
      .filter(el => !el.disabled && el.type !== 'hidden');
    const index = focaveis.indexOf(elementoAtual);
    if (index < 0) return null;
    const proximo = focaveis[index + direcao];
    return proximo ? descreverFocoProduto(proximo) : null;
  }

  function descreverFocoProduto(elemento) {
    const card = elemento?.closest?.('[data-produto-index]');
    if (!card) return null;
    const index = Number(card.dataset.produtoIndex);
    if (!Number.isFinite(index)) return null;
    if (elemento.dataset?.produtoCampo) return { index, tipo: 'campo', valor: elemento.dataset.produtoCampo };
    if (elemento.matches?.('[data-produto-foto]')) return { index, tipo: 'foto' };
    if (elemento.dataset?.produtoAction) return { index, tipo: 'acao', valor: elemento.dataset.produtoAction };
    return null;
  }

  function obterFocoAtualProduto() {
    const active = document.activeElement;
    const card = active?.closest?.('[data-produto-index]');
    if (!card) return null;
    const index = Number(card.dataset.produtoIndex);
    if (!Number.isFinite(index)) return null;

    return descreverFocoProduto(active);
  }

  function restaurarFocoProduto(foco) {
    requestAnimationFrame(() => {
      const card = $(`[data-produto-index="${foco.index}"]`) || $(`[data-produto-index="${Math.max(0, foco.index - 1)}"]`);
      if (!card) return;
      let seletor = '';
      if (foco.tipo === 'campo') seletor = `[data-produto-campo="${foco.valor}"]`;
      if (foco.tipo === 'foto') seletor = '[data-produto-foto]';
      if (foco.tipo === 'acao') seletor = `[data-produto-action="${foco.valor}"]`;
      const el = seletor ? $(seletor, card) : null;
      if (el && !el.disabled) el.focus({ preventScroll: true });
    });
  }


  function produtoPedidoVazio() {
    return {
      id: gerarIdProdutoPedido(),
      nome: '',
      preco: '',
      observacao: '',
      fotoDataUrl: '',
      fotoUrl: '',
      fotoNome: '',
      catalogoId: '',
      ehTaxaEntrega: false
    };
  }

  function gerarIdProdutoPedido() {
    return `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function migrarPedidoAntigoParaProdutos() {
    if (Array.isArray(state.pedido.produtos) && state.pedido.produtos.length) return;
    const textoAntigo = String(state.pedido.pedido || '').trim();
    if (!textoAntigo) return;

    state.pedido.produtos = textoAntigo
      .split('\n')
      .map(linha => linha.trim())
      .filter(Boolean)
      .map(nome => ({ ...produtoPedidoVazio(), nome }));
    state.pedido.pedido = '';
  }

  function normalizarProdutosPedido() {
    if (!Array.isArray(state.pedido.produtos)) state.pedido.produtos = [];

    state.pedido.produtos = state.pedido.produtos.map(produto => ({
      ...produtoPedidoVazio(),
      ...(produto || {}),
      id: produto?.id || gerarIdProdutoPedido(),
      nome: String(produto?.nome || ''),
      preco: String(produto?.preco || ''),
      observacao: '',
      fotoDataUrl: String(produto?.fotoDataUrl || ''),
      fotoUrl: String(produto?.fotoUrl || ''),
      fotoNome: String(produto?.fotoNome || ''),
      catalogoId: String(produto?.catalogoId || ''),
      ehTaxaEntrega: Boolean(produto?.ehTaxaEntrega)
    }));

    state.pedido.produtos = state.pedido.produtos.filter((produto, index, lista) => {
      if (produto.ehTaxaEntrega) return true;
      if (produtoPossuiConteudo(produto)) return true;
      return index === lista.length - 1;
    });

    if (!state.pedido.produtos.length || produtoPossuiConteudo(state.pedido.produtos[state.pedido.produtos.length - 1])) {
      state.pedido.produtos.push(produtoPedidoVazio());
    }
  }

  function produtoPossuiConteudo(produto) {
    return Boolean(
      String(produto?.nome || '').trim()
      || String(produto?.preco || '').trim()
      || produto?.fotoDataUrl
      || produto?.fotoUrl
      || produto?.ehTaxaEntrega
    );
  }

  function produtosPedidoPreenchidos() {
    normalizarProdutosPedido();
    return state.pedido.produtos.filter(produto => String(produto.nome || '').trim());
  }

  function pedidoTemTaxaEntrega() {
    return state.pedido.produtos.some(produto => produto.ehTaxaEntrega);
  }

  function handleProdutoPedidoInput(event) {
    const target = event.target;
    const card = target.closest?.('[data-produto-index]');
    const campo = target.dataset?.produtoCampo;
    if (!card || !campo) return;

    const index = Number(card.dataset.produtoIndex);
    const produto = state.pedido.produtos[index];
    if (!produto) return;

    produto[campo] = target.value;
    if (campo === 'preco') {
      recalcularValorPedido();
      renderInputs();
    }
    salvarDadosDebounced();
    renderPreview();
  }

  function handleProdutoPedidoChange(event) {
    const target = event.target;
    const card = target.closest?.('[data-produto-index]');
    if (!card) return;

    const index = Number(card.dataset.produtoIndex);
    const produto = state.pedido.produtos[index];
    if (!produto) return;

    if (target.dataset?.produtoCampo === 'nome') {
      autoPreencherProdutoDoCatalogo(index, target.value);
      normalizarProdutosPedido();
      recalcularValorPedido();
      salvarDadosDebounced();
      renderProdutosPedidoForm({ manterFoco: true });
      renderInputs();
      renderPreview();
      return;
    }

    if (target.dataset?.produtoCampo === 'preco') {
      produto.preco = formatarValorParaTela(produto.preco);
      recalcularValorPedido();
      salvarDadosDebounced();
      renderProdutosPedidoForm({ manterFoco: true });
      renderInputs();
      renderPreview();
      return;
    }

    if (target.matches?.('[data-produto-foto]')) {
      const file = target.files && target.files[0];
      target.value = '';
      if (file) carregarFotoProdutoPedido(index, file);
    }
  }

  function handleProdutoPedidoClick(event) {
    const button = event.target.closest?.('[data-produto-action]');
    if (!button) return;

    const card = button.closest('[data-produto-index]');
    const index = Number(card?.dataset.produtoIndex);
    const produto = state.pedido.produtos[index];
    if (!produto) return;

    const action = button.dataset.produtoAction;
    if (action === 'remover') {
      state.pedido.produtos.splice(index, 1);
      normalizarProdutosPedido();
      recalcularValorPedido();
      salvarDadosDebounced();
      renderTudo();
      return;
    }

    if (action === 'remover-foto') {
      produto.fotoDataUrl = '';
      produto.fotoUrl = '';
      produto.fotoNome = '';
      salvarDadosDebounced();
      renderTudo();
    }
  }

  function abrirSeletorCatalogoProdutos() {
    const produtos = Array.isArray(state.catalogo.produtos) ? state.catalogo.produtos : [];
    if (!produtos.length) {
      aviso('Atualize o catálogo antes de adicionar um produto.');
      return;
    }

    fecharSeletorCatalogoProdutos();

    const overlay = document.createElement('div');
    overlay.className = 'catalog-picker-overlay';
    overlay.innerHTML = `
      <div class="catalog-picker" role="dialog" aria-modal="true" aria-labelledby="catalogPickerTitle">
        <div class="catalog-picker-header">
          <strong id="catalogPickerTitle">Adicionar do catálogo</strong>
          <button type="button" class="secondary small-button" data-catalog-picker-close>Fechar</button>
        </div>
        <input type="search" class="catalog-picker-search" placeholder="Buscar produto" aria-label="Buscar produto no catálogo" autocomplete="off">
        <div class="catalog-picker-list" role="listbox"></div>
      </div>
    `;

    const inputBusca = $('.catalog-picker-search', overlay);
    const lista = $('.catalog-picker-list', overlay);

    function renderLista() {
      const termo = normalizarTextoBusca(inputBusca.value);
      const filtrados = produtos
        .filter(produto => !termo || normalizarTextoBusca([produto.nome, produto.descricao, produto.categoria].filter(Boolean).join(' ')).includes(termo))
        .slice(0, 80);

      lista.innerHTML = filtrados.length
        ? filtrados.map(produto => {
            const index = produtos.indexOf(produto);
            const preco = produto.preco ? formatarValorParaTela(produto.preco) : '';
            const imagem = produto.imagemUrl ? `<img src="${escapeAttr(produto.imagemUrl)}" alt="">` : '<span class="catalog-picker-no-photo">Sem foto</span>';
            return `
              <button type="button" class="catalog-picker-item" data-catalogo-index="${index}" role="option">
                <span class="catalog-picker-thumb">${imagem}</span>
                <span class="catalog-picker-info">
                  <strong>${escapeHtml(produto.nome || 'Produto sem nome')}</strong>
                  ${preco ? `<span>${escapeHtml(preco)}</span>` : ''}
                </span>
              </button>
            `;
          }).join('')
        : '<p class="catalog-picker-empty">Nenhum produto encontrado.</p>';
    }

    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('[data-catalog-picker-close]')) {
        fecharSeletorCatalogoProdutos();
        return;
      }

      const item = event.target.closest('[data-catalogo-index]');
      if (!item) return;
      const produto = produtos[Number(item.dataset.catalogoIndex)];
      if (!produto) return;
      adicionarProdutoDoCatalogoAoPedido(produto);
      fecharSeletorCatalogoProdutos();
    });

    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') fecharSeletorCatalogoProdutos();
    });

    inputBusca.addEventListener('input', renderLista);
    document.body.append(overlay);
    renderLista();
    requestAnimationFrame(() => inputBusca.focus());
  }

  function fecharSeletorCatalogoProdutos() {
    $$('.catalog-picker-overlay').forEach(overlay => overlay.remove());
  }

  function adicionarProdutoDoCatalogoAoPedido(produtoCatalogo) {
    const produto = produtoPedidoVazio();
    produto.catalogoId = produtoCatalogo.id || '';
    produto.nome = produtoCatalogo.nome || '';
    produto.preco = produtoCatalogo.preco ? formatarValorParaTela(produtoCatalogo.preco) : '';
    produto.fotoUrl = produtoCatalogo.imagemUrl || '';
    produto.fotoNome = produto.fotoUrl ? 'Imagem do catálogo' : '';

    normalizarProdutosPedido();
    const ultimo = state.pedido.produtos[state.pedido.produtos.length - 1];
    if (ultimo && !produtoPossuiConteudo(ultimo)) state.pedido.produtos.pop();

    const taxaIndex = state.pedido.produtos.findIndex(item => item.ehTaxaEntrega);
    if (taxaIndex >= 0) {
      state.pedido.produtos.splice(taxaIndex, 0, produto);
    } else {
      state.pedido.produtos.push(produto);
    }

    state.pedido.produtos.push(produtoPedidoVazio());
    recalcularValorPedido();
    salvarDadosDebounced();
    renderTudo();
    aviso('Produto adicionado do catálogo.');
  }

  function adicionarTaxaEntregaPedido() {
    if (pedidoTemTaxaEntrega()) return aviso('A taxa de entrega já foi adicionada.');
    const produto = produtoPedidoVazio();
    produto.nome = 'Taxa de entrega';
    produto.preco = formatarValorParaTela(state.configuracoes.taxaEntrega || DEFAULT_TAXA_ENTREGA);
    produto.ehTaxaEntrega = true;

    normalizarProdutosPedido();
    const ultimo = state.pedido.produtos[state.pedido.produtos.length - 1];
    if (ultimo && !produtoPossuiConteudo(ultimo)) state.pedido.produtos.pop();
    state.pedido.produtos.push(produto, produtoPedidoVazio());
    recalcularValorPedido();
    salvarDadosDebounced();
    renderTudo();
    aviso('Taxa de entrega adicionada ao pedido.');
  }

  function atualizarTaxaEntregaDoPedido(formatar) {
    if (formatar) state.configuracoes.taxaEntrega = formatarValorParaTela(state.configuracoes.taxaEntrega || DEFAULT_TAXA_ENTREGA);
    state.pedido.produtos.forEach(produto => {
      if (produto.ehTaxaEntrega) produto.preco = formatarValorParaTela(state.configuracoes.taxaEntrega || DEFAULT_TAXA_ENTREGA);
    });
    recalcularValorPedido();
  }

  function recalcularValorPedido() {
    const total = produtosPedidoPreenchidos().reduce((soma, produto) => soma + (parseMoeda(produto.preco) || 0), 0);
    state.pedido.valor = total > 0 ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
  }

  async function carregarFotoProdutoPedido(index, file) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      aviso('Selecione um arquivo de imagem válido.');
      return;
    }

    try {
      const dataUrl = await redimensionarImagemParaPedido(file);
      const produto = state.pedido.produtos[index];
      if (!produto) return;
      produto.fotoDataUrl = dataUrl;
      produto.fotoUrl = '';
      produto.fotoNome = file.name || 'Foto selecionada';
      salvarDadosDebounced();
      renderTudo();
      aviso('Foto adicionada ao produto.');
    } catch (error) {
      aviso('Não foi possível carregar a foto. Tente outra imagem.');
    }
  }

  function autoPreencherProdutoDoCatalogo(index, nomeDigitado) {
    const nome = String(nomeDigitado || '').trim();
    if (!nome) return;

    const produtoCatalogo = (state.catalogo.produtos || []).find(produto => normalizarTextoBusca(produto.nome) === normalizarTextoBusca(nome));
    if (!produtoCatalogo) return;

    const produto = state.pedido.produtos[index];
    if (!produto || produto.ehTaxaEntrega) return;

    produto.catalogoId = produtoCatalogo.id || '';
    produto.nome = produtoCatalogo.nome || produto.nome;
    produto.preco = formatarValorParaTela(produtoCatalogo.preco);
    produto.fotoUrl = produto.fotoDataUrl ? produto.fotoUrl : (produtoCatalogo.imagemUrl || '');
    produto.fotoNome = produto.fotoNome || (produtoCatalogo.imagemUrl ? 'Imagem do catálogo' : '');
  }

  async function carregarCatalogoProdutos({ silencioso = false } = {}) {
    const url = String(state.configuracoes.catalogoSupabaseUrl || '').trim().replace(/\/$/, '');
    const key = String(state.configuracoes.catalogoSupabaseAnonKey || '').trim();
    if (!url || !key) {
      state.catalogo.status = 'Informe a URL e a chave pública do Supabase para carregar o catálogo.';
      renderCatalogoControles();
      return;
    }

    try {
      state.catalogo.status = 'Carregando produtos do catálogo...';
      renderCatalogoControles();

      const { rows, origem } = await buscarProdutosCatalogoSupabase(url, key);
      state.catalogo.produtos = (Array.isArray(rows) ? rows : [])
        .map(mapearProdutoCatalogo)
        .filter(produto => produto.nome && produto.disponivel);
      state.catalogo.carregadoEm = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      state.catalogo.status = `${state.catalogo.produtos.length} produto(s) carregado(s) do catálogo.${origem ? ` Fonte: ${origem}.` : ''}`;
      salvarDadosDebounced();
      renderCatalogoControles();
      renderProdutosPedidoForm({ manterFoco: true });
      if (!silencioso) aviso('Catálogo carregado.');
    } catch (error) {
      console.error(error);
      const detalhe = error?.message ? ` Detalhe: ${error.message}` : '';
      state.catalogo.status = `Não foi possível carregar o catálogo.${detalhe}`;
      renderCatalogoControles();
      if (!silencioso) aviso('Não foi possível carregar o catálogo.');
    }
  }

  async function buscarProdutosCatalogoSupabase(url, key) {
    const tentativas = [
      { nome: 'REST produtos sem Authorization', tabela: 'produtos', order: 'nome.asc', authorization: false },
      { nome: 'REST produtos sem ordem', tabela: 'produtos', order: '', authorization: false },
      { nome: 'REST produtos com Authorization', tabela: 'produtos', order: 'nome.asc', authorization: true },
      { nome: 'REST products sem Authorization', tabela: 'products', order: 'nome.asc', authorization: false }
    ];
    const erros = [];

    for (const tentativa of tentativas) {
      try {
        const rows = await buscarProdutosCatalogoRest(url, key, tentativa);
        return { rows, origem: tentativa.nome };
      } catch (error) {
        erros.push(`${tentativa.nome}: ${error.message}`);
      }
    }

    throw new Error(erros.join(' | '));
  }

  async function buscarProdutosCatalogoRest(url, key, tentativa) {
    const params = new URLSearchParams();
    params.set('select', '*');
    if (tentativa.order) params.set('order', tentativa.order);
    const endpoint = `${url}/rest/v1/${tentativa.tabela}?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const headers = {
        apikey: key,
        Accept: 'application/json'
      };
      if (tentativa.authorization) headers.Authorization = `Bearer ${key}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
        headers
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}${detail ? ` - ${limitarTextoErro(detail)}` : ''}`);
      }

      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('resposta não é uma lista');
      return rows;
    } finally {
      clearTimeout(timeout);
    }
  }

  function limitarTextoErro(texto) {
    const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
    if (/42501|permission denied|GRANT SELECT/i.test(limpo)) {
      return 'permissão negada na tabela produtos. No Supabase, rode: GRANT USAGE ON SCHEMA public TO anon; GRANT SELECT ON TABLE public.produtos TO anon;';
    }
    return limpo.slice(0, 220);
  }

  function restaurarConfiguracaoCatalogoSupabase() {
    state.configuracoes.catalogoSupabaseUrl = DEFAULT_CATALOGO_SUPABASE_URL;
    state.configuracoes.catalogoSupabaseAnonKey = DEFAULT_CATALOGO_SUPABASE_ANON_KEY;
    limparProdutosCatalogoCarregados();
    salvarDadosDebounced();
    renderInputs();
    renderCatalogoControles();
    aviso('Configuração padrão do catálogo restaurada.');
  }

  function mapearProdutoCatalogo(row = {}) {
    const disponibilidade = row.disponivel ?? row.disponibilidade ?? row.ativo ?? true;
    return {
      id: String(row.id || ''),
      nome: String(row.nome || row.name || ''),
      preco: row.preco ?? row.price ?? '',
      descricao: String(row.descricao || row.description || ''),
      imagemUrl: String(row.imagem_url || row.imagemUrl || row.image_url || row.foto_url || ''),
      disponivel: disponibilidade !== false && disponibilidade !== 'false' && disponibilidade !== 0 && disponibilidade !== '0'
    };
  }

  function limparProdutosCatalogoCarregados() {
    state.catalogo.produtos = [];
    state.catalogo.carregadoEm = '';
    state.catalogo.status = 'Configuração alterada. Atualize o catálogo novamente.';
  }

  function normalizarTextoBusca(texto) {
    return removerAcentos(String(texto || '').trim().toLowerCase()).replace(/\s+/g, ' ');
  }

  function renderPreview() {
    aplicarCalibragem();
    renderPedidoOverlays();
    renderCartaoDizeresOverlays();
    renderCartaoSemOverlays();
    renderFotoPedidoControles();
    atualizarVisibilidadePreview();
    setTimeout(atualizarZoomPreviewModal, 0);
  }

  function aplicarCalibragem() {
    const calibragemFixa = defaultState.calibragem;
    const pedidoBase = calibragemFixa.basePedido || {};
    const cartaoDizeresBase = calibragemFixa.baseCartaoDizeres || {};
    const cartaoSemBase = calibragemFixa.baseCartaoSemDizeres || {};

    document.documentElement.style.setProperty('--pedido-x', `${num(pedidoBase.x)}mm`);
    document.documentElement.style.setProperty('--pedido-y', `${num(pedidoBase.y)}mm`);
    document.documentElement.style.setProperty('--pedido-tick-x', `${num(pedidoBase.tickX)}mm`);
    document.documentElement.style.setProperty('--pedido-tick-y', `${num(pedidoBase.tickY)}mm`);
    document.documentElement.style.setProperty('--cartao-dizeres-x', `${num(cartaoDizeresBase.x)}mm`);
    document.documentElement.style.setProperty('--cartao-dizeres-y', `${num(cartaoDizeresBase.y)}mm`);
    document.documentElement.style.setProperty('--cartao-sem-x', `${num(cartaoSemBase.x)}mm`);
    document.documentElement.style.setProperty('--cartao-sem-y', `${num(cartaoSemBase.y)}mm`);

    aplicarCalibragemImpressao();

    const font = calcularFonteDizeres(state.cartao.mensagem, state.cartao.fontDelta);
    document.documentElement.style.setProperty('--mensagem-font', `${font}pt`);
    document.documentElement.style.setProperty('--mensagem-font-family', state.cartao.fontFamily || defaultState.cartao.fontFamily);
    const fonteAtual = $('#fonteAtual');
    if (fonteAtual) fonteAtual.textContent = `Fonte: ${font} pt`;
  }


  function aplicarCalibragemImpressao() {
    const impressao = defaultState.calibragem.impressao || {};
    aplicarVariaveisImpressao('pedido', impressao.pedido || {});
    aplicarVariaveisImpressao('cartao-dizeres', impressao.cartaoDizeres || {});
    aplicarVariaveisImpressao('cartao-sem', impressao.cartaoSemDizeres || {});
  }

  function aplicarVariaveisImpressao(prefixo, ajustes) {
    document.documentElement.style.setProperty(`--print-${prefixo}-x`, `${num(ajustes.x)}mm`);
    document.documentElement.style.setProperty(`--print-${prefixo}-y`, `${num(ajustes.y)}mm`);
    document.documentElement.style.setProperty(`--print-${prefixo}-scale`, String(calcularEscalaImpressao(ajustes.escala)));
  }

  function calcularEscalaImpressao(valor) {
    const escala = Number(valor);
    if (!Number.isFinite(escala) || escala <= 0) return 1;
    return Math.max(0.5, Math.min(2, escala / 100));
  }

  function renderPedidoOverlays() {
    const data = splitDateParts(state.pedido.dataEntrega);
    $$('.pedido-overlay').forEach(root => {
      root.innerHTML = '';
      root.classList.toggle('has-pedido-foto', produtosPedidoPreenchidos().some(produto => produto.fotoDataUrl || produto.fotoUrl));
      root.classList.toggle('foto-pedido-colorida', Boolean(state.configuracoes.fotoPedidoColorida));
      root.classList.toggle('foto-pedido-pb', !state.configuracoes.fotoPedidoColorida);
      addField(root, 'p-entregar', state.pedido.entregarPara, 'pedido.entregarPara');
      addField(root, 'p-endereco', state.pedido.endereco, 'pedido.endereco');
      addField(root, 'p-bairro', state.pedido.bairro, 'pedido.bairro');
      addField(root, 'p-telefone', state.pedido.telefone, 'pedido.telefone');
      addProdutosPedido(root);
      addField(root, 'p-data-dia nowrap', data.dia, 'pedido.dataDia');
      addField(root, 'p-data-mes nowrap', data.mes, 'pedido.dataMes');
      addField(root, 'p-data-ano nowrap', data.ano, 'pedido.dataAno');
      addField(root, 'p-dia nowrap', state.pedido.diaSemana, 'pedido.diaSemana');
      addField(root, 'p-periodo nowrap', state.pedido.periodoEntrega, 'pedido.periodoEntrega');
      addField(root, 'p-vendedor nowrap', state.pedido.vendedor, 'pedido.vendedor');
      addField(root, 'p-valor nowrap', formatarValorParaTela(state.pedido.valor), 'pedido.valor');
      addField(root, 'p-cliente', state.pedido.cliente, 'pedido.cliente');
      addField(root, 'p-fone-cliente', state.pedido.foneCliente, 'pedido.foneCliente');

      pagamentos.forEach((pagamento, index) => {
        if ((state.pedido.pagamentos || []).includes(pagamento)) {
          const mark = document.createElement('div');
          mark.className = `checkbox-mark tick-${index}`;
          mark.textContent = '✓';
          aplicarOffset(mark, tickKey(pagamento));
          root.append(mark);
        }
      });
    });
  }

  function renderCartaoDizeresOverlays() {
    $$('.cartao-dizeres-overlay').forEach(root => {
      root.innerHTML = '';
      addField(root, 'cd-mensagem', state.cartao.mensagem, 'cartao.mensagem');
      addField(root, 'cd-destinatario', state.cartao.destinatario, 'cartao.destinatario');
      addField(root, 'cd-endereco', state.cartao.endereco, 'cartao.endereco');
      addField(root, 'cd-telefone', state.cartao.telefone, 'cartao.telefone');
    });
  }

  function renderCartaoSemOverlays() {
    $$('.cartao-sem-overlay').forEach(root => {
      root.innerHTML = '';
      addField(root, 'cs-destinatario', state.cartao.destinatario, 'cartaoSem.destinatario');
      addField(root, 'cs-endereco', state.cartao.endereco, 'cartaoSem.endereco');
      addField(root, 'cs-telefone', state.cartao.telefone, 'cartaoSem.telefone');
    });
  }

  function addProdutosPedido(root) {
    const produtos = produtosPedidoPreenchidos();
    const container = document.createElement('div');
    container.className = 'pedido-produtos';
    aplicarOffset(container, 'pedido.pedido');

    if (!produtos.length) {
      container.textContent = '';
      root.append(container);
      return;
    }

    produtos.forEach(produto => {
      const item = document.createElement('div');
      const fotoSrc = produto.fotoDataUrl || produto.fotoUrl || '';
      item.className = `pedido-produto-item${produto.ehTaxaEntrega ? ' pedido-produto-taxa' : ''}${fotoSrc ? '' : ' pedido-produto-sem-foto'}`;
      if (fotoSrc) {
        const img = document.createElement('img');
        img.className = 'pedido-produto-foto pedido-foto-img';
        img.src = fotoSrc;
        img.alt = '';
        item.append(img);
      }

      const info = document.createElement('div');
      info.className = 'pedido-produto-info';

      const linha = document.createElement('div');
      linha.className = 'pedido-produto-linha';

      const nome = document.createElement('strong');
      nome.textContent = produto.nome || '';
      linha.append(nome);

      const preco = parseMoeda(produto.preco);
      if (preco !== null && preco > 0) {
        const precoEl = document.createElement('span');
        precoEl.className = 'pedido-produto-preco';
        precoEl.textContent = formatarValorParaTela(produto.preco);
        linha.append(precoEl);
      }

      info.append(linha);


      item.append(info);
      container.append(item);
    });

    root.append(container);
  }

  function addField(root, className, text, offsetKey) {
    const el = document.createElement('div');
    el.className = `field ${className}`;
    el.textContent = text || '';
    aplicarOffset(el, offsetKey);
    root.append(el);
  }

  function aplicarOffset(el, offsetKey) {
    if (!offsetKey) return;
    const offset = getOffset(offsetKey);
    if (offset.x || offset.y) el.style.transform = `translate(${offset.x}mm, ${offset.y}mm)`;
  }

  function getOffset(offsetKey) {
    return {
      x: num(getByPath(defaultState, `calibragem.baseCampos.${offsetKey}.x`)),
      y: num(getByPath(defaultState, `calibragem.baseCampos.${offsetKey}.y`))
    };
  }

  function tickKey(pagamento) {
    const map = {
      'Vem pagar': 'pedido.pagamentos.vemPagar',
      'Receber': 'pedido.pagamentos.receber',
      'Cartão': 'pedido.pagamentos.cartao',
      'Pix': 'pedido.pagamentos.pix',
      'Dinheiro': 'pedido.pagamentos.dinheiro'
    };
    return map[pagamento];
  }

  function atualizarVisibilidadePreview() {
    atualizarContainerPreview($('#pedidoInlinePreviewRoot'), 'pedido');
    atualizarContainerPreview($('#cartaoInlinePreviewRoot'), 'cartao');
    atualizarContainerPreview($('#configPreviewRoot'), configPreviewMode);
    atualizarContainerPreview($('#modalPreviewRoot'), modalPreviewMode);

    $('#showPedidoPreview')?.classList.toggle('active', configPreviewMode === 'pedido');
    $('#showCartaoPreview')?.classList.toggle('active', configPreviewMode === 'cartao');
  }

  function atualizarContainerPreview(root, mode) {
    if (!root) return;
    $$('.print-sheet', root).forEach(sheet => sheet.classList.remove('preview-visible'));
    let kind = 'pedido';
    if (mode === 'cartao') kind = state.cartao.tipo === 'sem' ? 'cartao-sem' : 'cartao-com';
    const sheet = $(`.print-sheet[data-preview-kind="${kind}"]`, root);
    if (sheet) sheet.classList.add('preview-visible');
  }

  function setConfigPreviewMode(mode) {
    configPreviewMode = mode;
    renderPreview();
  }

  function abrirPreviewModal(mode) {
    modalPreviewMode = mode;
    const title = $('#previewModalTitle');
    if (title) title.textContent = mode === 'pedido' ? 'Preview do pedido' : 'Preview do cartão';
    renderPreview();
    const modal = $('#previewModal');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(atualizarZoomPreviewModal, 0);
  }

  function fecharPreviewModal() {
    const modal = $('#previewModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function setDataEntrega(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    state.pedido.dataEntrega = formatDate(date);
    state.pedido.diaSemana = weekday(date);
    salvarDadosDebounced();
    renderTudo();
  }

  function sincronizarDiaSemanaComData(formatarData) {
    const texto = String(state.pedido.dataEntrega || '').trim();
    if (!texto) {
      state.pedido.diaSemana = '';
      return false;
    }

    const data = parseDataEntrega(texto);
    if (!data) return false;

    state.pedido.diaSemana = weekday(data);
    if (formatarData) state.pedido.dataEntrega = formatDate(data);
    return true;
  }

  function aplicarDataEntregaDigitada(formatarCampo) {
    const input = $('[data-bind="pedido.dataEntrega"]');
    const texto = input ? input.value : state.pedido.dataEntrega;
    state.pedido.dataEntrega = texto;

    const deveFormatar = Boolean(formatarCampo || deveFormatarDataDuranteDigitacao(texto));
    const dataValida = sincronizarDiaSemanaComData(deveFormatar);

    if (dataValida && input && deveFormatar && input.value !== state.pedido.dataEntrega) {
      input.value = state.pedido.dataEntrega;
    }

    renderDiaSemanaInput();
    return dataValida;
  }

  function deveFormatarDataDuranteDigitacao(value) {
    const texto = String(value || '').trim();
    if (!texto) return false;

    const normalizado = removerAcentos(texto).toLowerCase();
    if (/^(hoje|hj|amanha|amanh|aman)$/.test(normalizado)) return true;
    if (/^\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2}$/.test(texto)) return true;
    if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}$/.test(texto)) return true;

    const digits = texto.replace(/\D/g, '');
    return /^\d+$/.test(texto) && (digits.length === 6 || digits.length === 8);
  }

  function splitDateParts(value) {
    const texto = String(value || '').trim();
    if (!texto) return { dia: '', mes: '', ano: '' };

    const data = parseDataEntrega(texto);
    if (data) {
      return {
        dia: pad2(data.getDate()),
        mes: pad2(data.getMonth() + 1),
        ano: String(data.getFullYear())
      };
    }

    const partes = texto.match(/\d+/g) || [];
    if (partes.length >= 3) {
      let [dia, mes, ano] = partes;
      if (dia.length === 4) [ano, mes, dia] = partes;
      return { dia: pad2(dia), mes: pad2(mes), ano: normalizarAno(ano) || '' };
    }
    const digits = texto.replace(/\D/g, '');
    if (digits.length === 8) {
      if (Number(digits.slice(0, 4)) >= 1900) {
        return { dia: digits.slice(6, 8), mes: digits.slice(4, 6), ano: digits.slice(0, 4) };
      }
      return { dia: digits.slice(0, 2), mes: digits.slice(2, 4), ano: digits.slice(4, 8) };
    }
    if (digits.length === 6) return { dia: digits.slice(0, 2), mes: digits.slice(2, 4), ano: `20${digits.slice(4, 6)}` };
    if (digits.length === 4) return { dia: digits.slice(0, 2), mes: digits.slice(2, 4), ano: '' };
    return { dia: texto, mes: '', ano: '' };
  }

  function parseDataEntrega(value) {
    let texto = String(value || '').trim();
    if (!texto) return null;

    const normalizado = removerAcentos(texto).toLowerCase();
    if (/^(hoje|hj)$/.test(normalizado)) return dateOnly(new Date());
    if (/^(amanha|amanh|aman)$/.test(normalizado)) {
      const d = dateOnly(new Date());
      d.setDate(d.getDate() + 1);
      return d;
    }

    const porMesExtenso = parseDataComMesExtenso(normalizado);
    if (porMesExtenso) return porMesExtenso;

    const numeros = texto.match(/\d+/g) || [];
    if (numeros.length >= 3) {
      let [a, b, c] = numeros;
      if (a.length === 4) return criarData(a, b, c, false);
      return criarData(c, b, a, false);
    }

    if (numeros.length === 2) {
      const [dia, mes] = numeros;
      const ano = escolherAnoParaDiaMes(dia, mes);
      return criarData(ano, mes, dia, true);
    }

    const digits = texto.replace(/\D/g, '');
    if (digits.length === 8) {
      if (Number(digits.slice(0, 4)) >= 1900) {
        return criarData(digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8), false);
      }
      return criarData(digits.slice(4, 8), digits.slice(2, 4), digits.slice(0, 2), false);
    }
    if (digits.length === 6) {
      return criarData(normalizarAno(digits.slice(4, 6)), digits.slice(2, 4), digits.slice(0, 2), false);
    }
    if (digits.length === 4) {
      const dia = digits.slice(0, 2);
      const mes = digits.slice(2, 4);
      const ano = escolherAnoParaDiaMes(dia, mes);
      return criarData(ano, mes, dia, true);
    }

    return null;
  }

  function parseDataComMesExtenso(texto) {
    const meses = {
      janeiro: 1, jan: 1,
      fevereiro: 2, fev: 2,
      marco: 3, mar: 3,
      abril: 4, abr: 4,
      maio: 5, mai: 5,
      junho: 6, jun: 6,
      julho: 7, jul: 7,
      agosto: 8, ago: 8,
      setembro: 9, set: 9,
      outubro: 10, out: 10,
      novembro: 11, nov: 11,
      dezembro: 12, dez: 12
    };

    const numeros = texto.match(/\b\d{1,4}\b/g) || [];
    const dia = numeros[0];
    if (!dia) return null;

    const nomesMeses = Object.keys(meses).sort((a, b) => b.length - a.length);
    const nomeMes = nomesMeses.find(nome => new RegExp(`\\b${nome}\\b`).test(texto));
    if (!nomeMes) return null;

    const mes = meses[nomeMes];
    const possivelAno = numeros.length >= 2 ? numeros[numeros.length - 1] : '';
    const temAno = Boolean(possivelAno && possivelAno !== dia);
    const ano = temAno ? normalizarAno(possivelAno) : escolherAnoParaDiaMes(dia, mes);
    return criarData(ano, mes, dia, !temAno);
  }

  function criarData(ano, mes, dia, permitirAnoAutomatico) {
    const y = Number(normalizarAno(ano));
    const m = Number(String(mes).replace(/\D/g, ''));
    const d = Number(String(dia).replace(/\D/g, ''));
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;

    let data = new Date(y, m - 1, d);
    if (data.getFullYear() !== y || data.getMonth() !== m - 1 || data.getDate() !== d) return null;

    if (permitirAnoAutomatico) {
      const hoje = dateOnly(new Date());
      if (data < hoje) {
        data = new Date(y + 1, m - 1, d);
        if (data.getMonth() !== m - 1 || data.getDate() !== d) return null;
      }
    }

    return data;
  }

  function escolherAnoParaDiaMes(dia, mes) {
    const anoAtual = new Date().getFullYear();
    const data = criarData(anoAtual, mes, dia, false);
    if (!data) return anoAtual;
    return data < dateOnly(new Date()) ? anoAtual + 1 : anoAtual;
  }

  function normalizarAno(value) {
    const text = String(value || '').replace(/\D/g, '');
    if (!text) return '';
    if (text.length <= 2) return String(2000 + Number(text.padStart(2, '0')));
    return text.padStart(4, '0').slice(-4);
  }

  function dateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function removerAcentos(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function pad2(value) {
    const text = String(value || '').replace(/\D/g, '');
    return text ? text.padStart(2, '0').slice(-2) : '';
  }

  function copiarPedidoParaCartao() {
    state.cartao.destinatario = state.pedido.entregarPara || state.cartao.destinatario;
    const partesEndereco = [state.pedido.endereco, state.pedido.bairro].filter(Boolean);
    state.cartao.endereco = partesEndereco.join(' - ') || state.cartao.endereco;
    state.cartao.telefone = state.pedido.telefone || state.cartao.telefone;
    configPreviewMode = 'cartao';
    modalPreviewMode = 'cartao';
    salvarDadosDebounced();
    renderTudo();
    aviso('Destinatário copiado para o cartão.');
  }

  function ajustarFonte(delta) {
    state.cartao.fontDelta = Math.max(-8, Math.min(8, (Number(state.cartao.fontDelta) || 0) + delta));
    salvarDadosDebounced();
    renderInputs();
    renderPreview();
  }

  function adicionarVendedor() {
    const input = $('#novoVendedor');
    const nome = input.value.trim();
    if (!nome) return aviso('Digite o nome do vendedor.');
    if (!state.vendedores.includes(nome)) state.vendedores.push(nome);
    state.pedido.vendedor = nome;
    lembrarVendedor(nome);
    input.value = '';
    salvarDadosDebounced();
    renderTudo();
    aviso('Vendedor adicionado.');
  }

  function removerVendedor(nome) {
    if (state.vendedores.length <= 1) return aviso('Mantenha pelo menos um vendedor cadastrado.');
    const ok = confirm(`Remover o vendedor "${nome}"?`);
    if (!ok) return;
    state.vendedores = state.vendedores.filter(v => v !== nome);
    if (state.pedido.vendedor === nome) {
      state.pedido.vendedor = state.vendedores[0] || '';
      lembrarVendedor(state.pedido.vendedor);
    }
    salvarDadosDebounced();
    renderTudo();
  }

  async function carregarFotoPedido(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      aviso('Selecione um arquivo de imagem válido.');
      return;
    }

    try {
      const dataUrl = await redimensionarImagemParaPedido(file);
      state.pedido.fotoDataUrl = dataUrl;
      state.pedido.fotoNome = file.name || 'Foto selecionada';
      salvarDadosDebounced();
      renderTudo();
      aviso('Foto adicionada ao pedido.');
    } catch (error) {
      aviso('Não foi possível carregar a foto. Tente outra imagem.');
    }
  }

  function removerFotoPedido() {
    if (!state.pedido.fotoDataUrl) return;
    state.pedido.fotoDataUrl = '';
    state.pedido.fotoNome = '';
    salvarDadosDebounced();
    renderTudo();
    aviso('Foto removida do pedido.');
  }

  function alternarCorFotoPedido() {
    state.configuracoes.fotoPedidoColorida = !state.configuracoes.fotoPedidoColorida;
    salvarDadosDebounced();
    renderTudo();
    aviso(state.configuracoes.fotoPedidoColorida ? 'Fotos do pedido coloridas.' : 'Fotos do pedido em preto e branco.');
  }

  function redimensionarImagemParaPedido(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Falha ao abrir imagem.'));
        img.onload = () => {
          const max = 1000;
          const scale = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
          const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
          const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function lembrarVendedor(nome) {
    state.ultimoVendedor = nome || '';
  }

  function limparPedido() {
    if (!confirm('Limpar todos os campos do pedido?')) return;
    const vendedor = state.pedido.vendedor;
    state.pedido = structuredCloneSafe(defaultState.pedido);
    state.pedido.vendedor = vendedor || state.ultimoVendedor || state.vendedores[0] || '';
    salvarDadosDebounced();
    renderTudo();
  }

  function limparCartao() {
    if (!confirm('Limpar todos os campos do cartão?')) return;
    const tipo = state.cartao.tipo;
    state.cartao = structuredCloneSafe(defaultState.cartao);
    state.cartao.tipo = tipo;
    salvarDadosDebounced();
    renderTudo();
  }

  function limparTudo() {
    if (!confirm('Limpar pedido e cartão?')) return;
    const vendedor = state.pedido.vendedor || state.ultimoVendedor || state.vendedores[0] || '';
    const tipo = state.cartao.tipo;
    const fontFamily = state.cartao.fontFamily || defaultState.cartao.fontFamily;
    const fontDelta = Number(state.cartao.fontDelta) || 0;
    const configuracoes = structuredCloneSafe(state.configuracoes || defaultState.configuracoes);
    const catalogo = structuredCloneSafe(state.catalogo || defaultState.catalogo);
    state.pedido = structuredCloneSafe(defaultState.pedido);
    state.cartao = structuredCloneSafe(defaultState.cartao);
    state.pedido.vendedor = vendedor;
    state.cartao.tipo = tipo;
    state.cartao.fontFamily = fontFamily;
    state.cartao.fontDelta = fontDelta;
    state.configuracoes = configuracoes;
    state.catalogo = catalogo;
    salvarDadosDebounced();
    renderTudo();
  }

  function preencherTeste() {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 1);
    state.pedido = {
      ...state.pedido,
      entregarPara: 'Mariana Alves',
      endereco: 'Rua das Hortênsias, 128 - Apto 42',
      bairro: 'Jardim Primavera',
      telefone: '(16) 99999-1234',
      pedido: '',
      produtos: [
        { ...produtoPedidoVazio(), nome: 'Orquídea branca', preco: formatarValorParaTela('95'), observacao: '', fotoDataUrl: '', fotoUrl: '', fotoNome: '' },
        { ...produtoPedidoVazio(), nome: 'Caixa de bombons', preco: formatarValorParaTela('25'), observacao: '', fotoDataUrl: '', fotoUrl: '', fotoNome: '' },
        { ...produtoPedidoVazio(), nome: 'Cartão com mensagem', preco: '', observacao: '', fotoDataUrl: '', fotoUrl: '', fotoNome: '' },
        produtoPedidoVazio()
      ],
      dataEntrega: formatDate(hoje),
      diaSemana: weekday(hoje),
      periodoEntrega: 'Tarde',
      vendedor: state.pedido.vendedor || state.vendedores[0] || 'Loja',
      valor: formatarValorParaTela('120,5'),
      pagamentos: [...pagamentos],
      cliente: 'João Pereira',
      foneCliente: '(16) 98888-4321'
    };
    state.cartao = {
      ...state.cartao,
      tipo: 'com',
      destinatario: 'Mariana Alves',
      endereco: 'Rua das Hortênsias, 128 - Jardim Primavera',
      telefone: '(16) 99999-1234',
      mensagem: 'Que seu dia seja leve, bonito e cheio de carinho. Receba este presente com todo meu amor.',
    };
    configPreviewMode = 'pedido';
    modalPreviewMode = 'pedido';
    salvarDadosDebounced();
    renderTudo();
    aviso('Pedido teste preenchido.');
  }


  function detectarPlataforma() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isWindows = /Windows/i.test(ua) || /^Win/i.test(platform);
    return { isAndroid, isIOS, isWindows };
  }

  function veioDoAtalhoInstalado() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return params.get('app') === '1' || params.get('source') === 'pwa' || params.get('utm_source') === 'homescreen';
    } catch (_) {
      return false;
    }
  }

  function estaAbertoComoAplicativo() {
    return veioDoAtalhoInstalado()
      || window.matchMedia?.('(display-mode: standalone)').matches
      || window.matchMedia?.('(display-mode: fullscreen)').matches
      || window.matchMedia?.('(display-mode: minimal-ui)').matches
      || window.navigator.standalone === true
      || document.referrer.startsWith('android-app://');
  }

  function atualizarBotaoInstalacao() {
    const btn = $('#btnInstalarApp');
    if (!btn) return;

    const esconder = () => {
      btn.hidden = true;
      btn.setAttribute('aria-hidden', 'true');
      btn.style.display = 'none';
    };

    const mostrar = texto => {
      btn.textContent = texto;
      btn.hidden = false;
      btn.removeAttribute('aria-hidden');
      btn.style.display = 'inline-flex';
    };

    esconder();

    if (estaAbertoComoAplicativo()) return;

    const { isAndroid, isIOS, isWindows } = detectarPlataforma();

    // Android/Chrome: só mostra se o navegador disparou o evento nativo de instalação.
    // Isso impede o botão de aparecer dentro do app já instalado ou como falso positivo.
    if (isAndroid) {
      if (!deferredInstallPrompt) return;
      mostrar('Baixar aplicativo');
      return;
    }

    // iPhone não dispara beforeinstallprompt. Mantém instrução manual só no Safari/navegador.
    if (isIOS) {
      mostrar('Baixar aplicativo');
      return;
    }

    // Windows: mostra só no navegador normal. Em PWA/atalho instalado, display-mode esconde.
    if (isWindows) {
      mostrar('Adicionar atalho à área de trabalho');
      return;
    }
  }

  async function instalarAppAndroid() {
    if (estaAbertoComoAplicativo()) {
      atualizarBotaoInstalacao();
      return;
    }

    const { isAndroid, isIOS, isWindows } = detectarPlataforma();

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try { await deferredInstallPrompt.userChoice; } catch (_) {}
      deferredInstallPrompt = null;
      atualizarBotaoInstalacao();
      return;
    }

    if (isIOS) {
      aviso('No iPhone, toque em Compartilhar e depois em “Adicionar à Tela de Início”. Depois abra pelo ícone criado.');
      return;
    }

    if (isWindows) {
      aviso('No Windows, use o menu do Chrome/Edge e escolha “Instalar app” ou “Apps > Instalar este site como aplicativo”.');
      return;
    }

    if (isAndroid) {
      aviso('No Android, abra pelo Chrome e use “Instalar app” ou “Adicionar à tela inicial”.');
      return;
    }
  }

  function atualizarZoomPreviewModal() {
    const modal = $('#previewModal');
    const root = $('#modalPreviewRoot');
    if (!modal || !root) return;

    root.style.setProperty('--modal-preview-zoom', '1');
    if (modal.classList.contains('hidden') || window.innerWidth > 620) return;

    const sheet = $('.print-sheet.preview-visible', root);
    if (!sheet) return;

    const stageRect = root.getBoundingClientRect();
    const sheetWidth = sheet.offsetWidth || 1;
    const sheetHeight = sheet.offsetHeight || 1;
    const availableWidth = Math.max(120, stageRect.width - 8);
    const availableHeight = Math.max(120, stageRect.height - 8);
    const zoom = Math.max(0.35, Math.min(1, availableWidth / sheetWidth, availableHeight / sheetHeight));
    root.style.setProperty('--modal-preview-zoom', zoom.toFixed(3));
  }


  function validarPedidoParaImpressao() {
    const produtos = produtosPedidoPreenchidos();
    if (!produtos.length) {
      aviso('Adicione pelo menos um produto ao pedido.');
      return false;
    }

    const produtoSemNome = state.pedido.produtos.some(produto => produtoPossuiConteudo(produto) && !String(produto.nome || '').trim());
    if (produtoSemNome) {
      aviso('Preencha o nome de todos os produtos adicionados.');
      return false;
    }

    return true;
  }

  function imprimir(tipo) {
    if (tipo === 'pedido' && !validarPedidoParaImpressao()) return;
    recalcularValorPedido();
    normalizarValorPedido();
    sincronizarDiaSemanaComData(true);
    renderInputs();
    renderPreview();
    prepararModoImpressao(tipo);
    garantirPaginaA4Impressao();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.focus();
          window.print();
        } catch (error) {
          limparModoImpressao();
          aviso('Não foi possível abrir a janela de impressão. Tente novamente.');
        }
      });
    });
  }

  function prepararModoImpressao(tipo) {
    limparModoImpressao();

    const printArea = $('#printArea');
    if (printArea) printArea.setAttribute('aria-hidden', 'false');

    let modo = 'cartao-com';
    if (tipo === 'pedido') modo = 'pedido';
    if (tipo === 'cartao-sem') modo = 'cartao-sem';

    document.body.dataset.printMode = modo;
    document.body.classList.add(`print-${modo}`);

    const folha = $(`.print-area .print-sheet[data-preview-kind="${modo}"]`);
    if (folha) folha.classList.add('print-active');
  }

  function garantirPaginaA4Impressao() {
    const styleId = 'force-a4-print-style';
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.media = 'print';
      document.head.appendChild(style);
    }

    // Reforço inline para o Chrome/Android e drivers que ignoram ou demoram a
    // aplicar o @page do arquivo CSS externo. O navegador ainda pode permitir
    // alteração manual, mas a página enviada pelo app passa a declarar A4.
    style.textContent = `
      @page { size: 210mm 297mm; margin: 0; }
      @page :first { size: 210mm 297mm; margin: 0; }
      @media print {
        html, body { width: 210mm !important; max-width: 210mm !important; }
        body.print-pedido::before,
        body.print-cartao-com::before,
        body.print-cartao-sem::before {
          content: "";
          position: fixed;
          left: 0;
          top: 0;
          width: 210mm;
          height: 297mm;
          pointer-events: none;
          z-index: -1;
        }
      }
    `;
  }

  function limparModoImpressao() {
    document.body.classList.remove('print-pedido', 'print-cartao-com', 'print-cartao-sem');
    delete document.body.dataset.printMode;

    $$('.print-area .print-sheet.print-active').forEach(sheet => {
      sheet.classList.remove('print-active');
    });

    const printArea = $('#printArea');
    if (printArea) printArea.setAttribute('aria-hidden', 'true');
  }

  function calcularFonteDizeres(texto, delta) {
    const len = (texto || '').replace(/\s+/g, ' ').trim().length;
    const linhas = (texto || '').split('\n').length;
    let font = 26;
    if (len > 60) font = 24;
    if (len > 120) font = 22;
    if (len > 200) font = 20;
    if (len > 320) font = 18;
    if (len > 460) font = 16;
    if (len > 650) font = 14;
    if (linhas > 5) font -= 1;
    if (linhas > 8) font -= 1;
    return Math.max(12, Math.min(32, font + (Number(delta) || 0)));
  }

  function normalizarValorPedido() {
    state.pedido.valor = formatarValorParaTela(state.pedido.valor);
  }

  function formatarValorParaTela(valor) {
    const texto = String(valor ?? '').trim();
    if (!texto) return '';
    const numero = parseMoeda(texto);
    if (numero === null) return texto;
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function parseMoeda(texto) {
    let s = String(texto ?? '').trim();
    if (!s) return null;
    s = s.replace(/R\$\s?/gi, '').replace(/\s/g, '');
    s = s.replace(/[^0-9,.-]/g, '');
    if (!/[0-9]/.test(s)) return null;

    const negativo = s.startsWith('-');
    s = s.replace(/-/g, '');

    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    let decimalSeparator = '';

    if (lastComma >= 0 && lastDot >= 0) {
      decimalSeparator = lastComma > lastDot ? ',' : '.';
    } else if (lastComma >= 0) {
      const digitsAfter = s.length - lastComma - 1;
      decimalSeparator = digitsAfter <= 2 ? ',' : '';
    } else if (lastDot >= 0) {
      const digitsAfter = s.length - lastDot - 1;
      decimalSeparator = digitsAfter <= 2 ? '.' : '';
    }

    if (decimalSeparator) {
      const last = s.lastIndexOf(decimalSeparator);
      const intPart = s.slice(0, last).replace(/[^0-9]/g, '') || '0';
      const decPart = s.slice(last + 1).replace(/[^0-9]/g, '').padEnd(2, '0').slice(0, 2);
      const parsed = Number(`${intPart}.${decPart}`);
      return Number.isFinite(parsed) ? (negativo ? -parsed : parsed) : null;
    }

    const parsed = Number(s.replace(/[^0-9]/g, ''));
    return Number.isFinite(parsed) ? (negativo ? -parsed : parsed) : null;
  }

  function formatDate(date) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function weekday(date) {
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  function setByPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((acc, key) => {
      if (!acc[key] || typeof acc[key] !== 'object') acc[key] = {};
      return acc[key];
    }, obj);
    target[last] = value;
  }

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function aviso(msg) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }
})();
