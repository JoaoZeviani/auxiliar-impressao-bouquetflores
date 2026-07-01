# Auxiliar de Impressão — Bouquet Flores

O **Auxiliar de Impressão** é um programa feito para preencher e imprimir os papéis físicos usados pela **Bouquet Flores**.

Ele funciona no computador e também pode ser usado no celular como aplicativo instalado pela tela inicial, quando hospedado no GitHub Pages.

## O que o programa faz

O programa trabalha com três modelos de papel:

- **Pedido**
- **Cartão com dizeres**
- **Cartão sem dizeres**

Ele permite preencher os dados necessários, visualizar o posicionamento dos campos e imprimir apenas as informações digitadas, sem imprimir o fundo do papel.

Isso é importante porque a loja já possui os papéis físicos prontos. O programa serve para jogar os textos exatamente nos espaços corretos desses papéis.

## Principais funcionalidades

- Preencher pedido.
- Preencher cartão com dizeres.
- Preencher cartão sem dizeres.
- Alternar entre cliente deseja ou não deseja escrever dizeres.
- Copiar destinatário do pedido para o cartão.
- Preencher data de hoje ou amanhã automaticamente.
- Converter valor do pedido automaticamente para formato monetário.
  - Exemplo: `120` vira `R$ 120,00`.
  - Exemplo: `120,5` vira `R$ 120,50`.
- Selecionar vendedor.
- Adicionar vendedor.
- Remover vendedor.
- Lembrar o último vendedor usado.
- Ajustar fonte dos dizeres.
- Aumentar ou diminuir automaticamente o tamanho dos dizeres conforme o texto.
- Visualizar preview do pedido e do cartão.
- Imprimir pedido separadamente.
- Imprimir cartão separadamente.
- Ajustar a posição de cada campo individualmente.
- Salvar posições ajustadas como novo padrão.
- Preencher pedido teste para conferência/debug.
- Limpar pedido e cartão ao mesmo tempo.

## Medidas dos papéis

- **Pedido:** 145 mm × 206 mm
- **Cartão com dizeres:** 145 mm × 196 mm
- **Cartão sem dizeres:** 158 mm × 102,5 mm

## Como usar no computador

Abra o site ou o atalho do programa.

Se estiver no Windows, o programa pode mostrar a opção **Adicionar atalho à área de trabalho**. Use essa opção para facilitar o acesso no computador da loja.

Depois disso, o programa poderá ser aberto pelo ícone, sem precisar procurar o arquivo manualmente.

## Como usar no celular

O programa pode ser instalado como aplicativo no celular quando estiver hospedado no GitHub Pages.

No Android:

1. Abra o site no Chrome.
2. Toque nos três pontinhos do navegador.
3. Toque em **Instalar app** ou **Adicionar à tela inicial**.
4. Confirme.

No iPhone:

1. Abra o site no Safari.
2. Toque no botão de compartilhar.
3. Toque em **Adicionar à Tela de Início**.
4. Confirme.

Depois disso, o programa aparece na tela inicial do celular como um aplicativo.

## Como preencher um pedido

1. Abra a aba **Pedido**.
2. Preencha os campos necessários.
3. Escolha o vendedor.
4. Informe valor, data, período, destinatário e demais dados.
5. Marque as opções de pagamento/recebimento necessárias.
6. Clique em **Preview** para conferir.
7. Clique em **Imprimir pedido** para imprimir.

Na impressão, o programa imprime apenas os dados preenchidos. O fundo do pedido não é impresso.

## Como preencher um cartão

1. Abra a aba **Cartão**.
2. Escolha se o cliente deseja ou não escrever dizeres.
3. Preencha os dizeres, se houver.
4. Preencha ou copie os dados do destinatário.
5. Ajuste a fonte dos dizeres, se necessário.
6. Clique em **Preview** para conferir.
7. Clique em **Imprimir cartão** para imprimir.

O cartão é impresso separadamente do pedido.

## Botão “Copiar destinatário”

Esse botão copia os dados do destinatário preenchidos no pedido para o cartão.

No cartão com dizeres, o nome e endereço do destinatário ficam abaixo da faixa marrom.

No cartão sem dizeres, os dados ocupam o espaço principal do cartão.

## Botão “Limpar”

O botão **Limpar** apaga os dados preenchidos do pedido e do cartão.

Ele não limpa a fonte escolhida dos dizeres nem o ajuste manual do tamanho da fonte.

## Configurações

Na aba **Configurações**, é possível:

- Adicionar vendedores.
- Remover vendedores.
- Alterar a fonte dos dizeres.
- Ajustar a posição dos campos.
- Visualizar o preview enquanto ajusta os campos.
- Preencher um pedido teste.
- Salvar as posições ajustadas.

## Ajuste de posição dos campos

Cada campo pode ser movido individualmente.

Isso serve para corrigir diferenças entre impressoras, margens e encaixe real do papel físico.

Use os controles de posição para mover os textos até que eles caiam exatamente nos espaços corretos do papel.

Depois de ajustar tudo, clique em **Salvar posição**.

Esse botão transforma as posições atuais no novo padrão do programa e zera os valores de ajuste.

## Preview e impressão

O preview mostra o papel com o modelo de fundo para facilitar a conferência visual.

Na impressão, o fundo do papel é escondido e saem apenas os dados preenchidos.

Para a impressão ficar fiel ao preview, use a opção de impressão em tamanho real:

- Escala: **100%**
- Desativar: **ajustar à página**
- Desativar: **redimensionar para caber**

A precisão final pode variar de acordo com a impressora. Por isso o programa possui ajustes individuais de posição.

## Onde os dados ficam salvos

Os dados ficam salvos no próprio navegador/dispositivo usado.

Isso significa que:

- Um celular não vê os dados preenchidos em outro celular.
- Um computador não vê os dados preenchidos em outro computador.
- As configurações de posição ficam salvas apenas no aparelho/navegador onde foram ajustadas.
- Se duas pessoas usarem o mesmo computador e o mesmo navegador, elas usarão as mesmas configurações locais.

As informações digitadas não são enviadas para o GitHub.

## Observação importante

O GitHub Pages apenas hospeda o programa.

As informações digitadas pelos usuários não ficam públicas e não são salvas no repositório.

Outras pessoas podem abrir o site se tiverem o link, mas não conseguem alterar os seus dados locais nem as posições salvas no seu navegador.
