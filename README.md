# Auxiliar de Impressão - Bouquet Flores

Versão v7.

## Como abrir no Windows

Extraia o ZIP e abra:

`abrir-programa.bat`

Não precisa instalar Node.js. O programa usa o Edge ou Chrome já existente no Windows.

## Alterações da v7

- O botão **Limpar** continua limpando pedido e cartão juntos.
- Agora o botão **Limpar** não altera a fonte escolhida para os dizeres.
- Também não altera o ajuste manual do tamanho da fonte dos dizeres.
- Adicionada adaptação para uso em Android como PWA, com manifesto e cache offline.
- Adicionado botão **Instalar app** quando o navegador Android permitir instalação.
- Melhorados os ícones da versão Android/PWA, incluindo ícone maskable para evitar corte.

## Como usar no Android com ícone na tela inicial

Arquivo `.bat` não funciona em Android. `.bat` é apenas para Windows.

A melhor forma simples para Android é usar como **PWA**:

1. Publique a pasta do programa em um endereço HTTPS, por exemplo no GitHub Pages.
2. Abra o endereço no Chrome do Android.
3. Toque em **Instalar app** ou no menu do Chrome e depois **Adicionar à tela inicial / Instalar app**.
4. Depois disso, o app abre com um toque no ícone, como um aplicativo comum.

Depois de instalado, o app tenta funcionar offline porque os arquivos principais ficam em cache no celular.

## Sobre impressão

O preview usa os mesmos campos, tamanhos e posições em milímetros da impressão.

No preview aparece o modelo do papel por baixo. Na impressão, o modelo some e saem somente os dados preenchidos.

Para melhor fidelidade, imprimir pelo Windows ainda é mais seguro. No Android, a impressão depende mais do Chrome, do serviço de impressão e da impressora usada.
