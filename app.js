/* Auxiliar de Impressão - Bouquet Flores */
(function () {
  const STORAGE_KEY = 'auxiliar-impressao-bouquet-flores-v3';
  const STORAGE_KEY_ANTIGO = 'auxiliar-impressao-bouquet-flores-v1';
  const pagamentos = ['Vem pagar', 'Receber', 'Cartão', 'Pix', 'Dinheiro'];

  const defaultState = {
    pedido: {
      entregarPara: '',
      endereco: '',
      bairro: '',
      telefone: '',
      pedido: '',
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
      fotoPedidoColorida: false
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

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    carregarDados();
    normalizarState();
    bindEvents();
    renderTudo();

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
    if (!state.calibragem.baseCampos || typeof state.calibragem.baseCampos !== 'object') state.calibragem.baseCampos = structuredCloneSafe(defaultState.calibragem.baseCampos);
    state.pedido.pagamentos = pagamentos.filter(p => (state.pedido.pagamentos || []).includes(p));
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
        salvarDadosDebounced();
        renderCartaoTipo();
        renderPreview();
      });
      input.addEventListener('change', () => {
        const path = input.dataset.bind;
        setByPath(state, path, input.value);
        if (path === 'pedido.vendedor') lembrarVendedor(input.value);
        if (path === 'pedido.dataEntrega') aplicarDataEntregaDigitada(true);
        salvarDadosDebounced();
        renderVendedores();
        renderInputs();
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
    renderFotoPedidoControles();
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
    const temFoto = Boolean(state.pedido.fotoDataUrl);
    const resumo = $('#pedidoFotoResumo');
    if (resumo) resumo.textContent = temFoto ? (state.pedido.fotoNome || 'Foto selecionada.') : 'Nenhuma foto selecionada.';

    const thumb = $('#pedidoFotoThumb');
    if (thumb) {
      thumb.hidden = !temFoto;
      thumb.src = temFoto ? state.pedido.fotoDataUrl : '';
      thumb.classList.toggle('photo-grayscale', !state.configuracoes.fotoPedidoColorida);
    }

    const remover = $('#btnRemoverFotoPedido');
    if (remover) remover.disabled = !temFoto;

    const alternar = $('#btnAlternarCorFotoPedido');
    if (alternar) {
      alternar.textContent = state.configuracoes.fotoPedidoColorida
        ? 'Foto do pedido: colorida'
        : 'Foto do pedido: preto e branco';
    }
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
      root.classList.toggle('has-pedido-foto', Boolean(state.pedido.fotoDataUrl));
      root.classList.toggle('foto-pedido-colorida', Boolean(state.configuracoes.fotoPedidoColorida));
      root.classList.toggle('foto-pedido-pb', !state.configuracoes.fotoPedidoColorida);
      addField(root, 'p-entregar', state.pedido.entregarPara, 'pedido.entregarPara');
      addField(root, 'p-endereco', state.pedido.endereco, 'pedido.endereco');
      addField(root, 'p-bairro', state.pedido.bairro, 'pedido.bairro');
      addField(root, 'p-telefone', state.pedido.telefone, 'pedido.telefone');
      addField(root, 'p-pedido', state.pedido.pedido, 'pedido.pedido');
      addFotoPedido(root);
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

  function addFotoPedido(root) {
    if (!state.pedido.fotoDataUrl) return;

    const frame = document.createElement('div');
    frame.className = 'pedido-foto-frame';

    const img = document.createElement('img');
    img.className = 'pedido-foto-img';
    img.src = state.pedido.fotoDataUrl;
    img.alt = 'Foto do pedido';

    frame.append(img);
    root.append(frame);
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
    aviso(state.configuracoes.fotoPedidoColorida ? 'Foto do pedido colorida.' : 'Foto do pedido em preto e branco.');
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
    state.pedido = structuredCloneSafe(defaultState.pedido);
    state.cartao = structuredCloneSafe(defaultState.cartao);
    state.pedido.vendedor = vendedor;
    state.cartao.tipo = tipo;
    state.cartao.fontFamily = fontFamily;
    state.cartao.fontDelta = fontDelta;
    state.configuracoes = configuracoes;
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
      pedido: '1 orquídea branca\n1 caixa de bombons\n1 cartão com mensagem',
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

  function imprimir(tipo) {
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

  function aviso(msg) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }
})();
