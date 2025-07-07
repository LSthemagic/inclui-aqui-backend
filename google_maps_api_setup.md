# Configuração da API do Google Maps para o Projeto IncluiAqui

Para que o backend do projeto IncluiAqui possa utilizar os serviços do Google Maps (busca de locais, geocoding, etc.), é necessário configurar corretamente a API do Google Maps Platform. Este guia detalha os passos essenciais para obter uma chave de API e habilitar os serviços necessários.

## 1. Visão Geral do Google Maps Platform

O Google Maps Platform oferece uma variedade de APIs e SDKs para integrar funcionalidades de mapas em suas aplicações. Para utilizar esses serviços, você precisará de uma conta Google, um projeto no Google Cloud Platform (GCP), uma chave de API e, em muitos casos, uma conta de faturamento associada ao projeto [1].

### 1.1. Serviços Utilizados no Projeto IncluiAqui

O backend do IncluiAqui utiliza as seguintes APIs do Google Maps Platform:

*   **Places API**: Para buscar estabelecimentos próximos, obter detalhes de locais e fotos.
*   **Geocoding API**: Para converter endereços em coordenadas geográficas (latitude e longitude) e vice-versa (reverse geocoding).

## 2. Passos para Configuração

Siga os passos abaixo para configurar a API do Google Maps:

### 2.1. Criar ou Selecionar um Projeto no Google Cloud Platform

Todos os serviços do Google Cloud, incluindo o Google Maps Platform, são organizados em projetos. Se você já tem um projeto, pode utilizá-lo. Caso contrário, crie um novo:

1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2.  No topo da página, clique no seletor de projetos (ao lado do logo do Google Cloud).
3.  Clique em **"Novo Projeto"**.
4.  Dê um nome ao seu projeto (ex: "IncluiAqui Backend") e clique em **"Criar"**.

### 2.2. Habilitar APIs Necessárias

Após criar ou selecionar seu projeto, você precisa habilitar as APIs específicas que o backend do IncluiAqui utilizará:

1.  No Google Cloud Console, navegue até **"APIs e Serviços" > "Biblioteca"** [2].
2.  Na barra de pesquisa, procure por:
    *   `Places API`
    *   `Geocoding API`
3.  Para cada API encontrada, clique nela e, em seguida, clique no botão **"Ativar"** (se ainda não estiver ativada).

### 2.3. Criar uma Chave de API

A chave de API é um identificador único que autentica suas requisições ao Google Maps Platform. É crucial restringir essa chave para evitar uso indevido [3].

1.  No Google Cloud Console, navegue até **"APIs e Serviços" > "Credenciais"** [4].
2.  Clique em **"Criar Credenciais"** e selecione **"Chave de API"**.
3.  Uma nova chave de API será gerada. **Copie-a imediatamente**, pois ela não será exibida novamente de forma completa.
4.  **Restrinja a chave de API**: É altamente recomendável restringir sua chave de API para que ela só possa ser usada pelos serviços e endereços IP autorizados. Clique em **"Restringir chave"** na janela de criação ou edite a chave na lista de credenciais.
    *   Em **"Restrições de aplicativos"**, selecione **"Endereços IP (servidores web, cron jobs, etc.)"**.
    *   Adicione os endereços IP dos seus servidores onde o backend estará hospedado. Se estiver testando localmente, você pode deixar sem restrição de IP temporariamente, mas **NUNCA faça isso em produção**.
    *   Em **"Restrições de API"**, selecione **"Restringir chave"** e marque as APIs que você habilitou: `Places API` e `Geocoding API`.
5.  Clique em **"Salvar"**.

### 2.4. Configurar Faturamento (Obrigatório)

O Google Maps Platform utiliza um modelo de precificação "pague pelo uso", o que significa que, embora haja um nível gratuito generoso, é necessário ter uma conta de faturamento configurada para usar a maioria das APIs [5].

1.  No Google Cloud Console, navegue até **"Faturamento"**.
2.  Se você ainda não tem uma conta de faturamento, será solicitado a criar uma. Siga as instruções para configurar seu método de pagamento.
3.  Certifique-se de que a conta de faturamento esteja vinculada ao projeto que você está usando para a API do Google Maps.

## 3. Inserir a Chave de API no Projeto Backend

Após obter sua chave de API, você precisará adicioná-la ao arquivo de variáveis de ambiente (`.env`) do seu projeto backend IncluiAqui.

1.  Abra o arquivo `.env` na raiz do seu projeto backend.
2.  Localize a linha `GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"`.
3.  Substitua `"your-google-maps-api-key-here"` pela chave de API que você gerou.

    ```env
    # Google Maps API
    GOOGLE_MAPS_API_KEY="SUA_CHAVE_DE_API_AQUI"
    ```

4.  Salve o arquivo `.env`.

## 4. Testando a Configuração

Após configurar a chave de API e habilitar os serviços, você pode testar se a integração está funcionando corretamente:

1.  Inicie o servidor backend do IncluiAqui (se ainda não estiver rodando).
2.  Utilize as rotas do Google Places da API para fazer requisições, como a busca de estabelecimentos próximos ou geocoding. Por exemplo, você pode usar o `curl` ou um cliente HTTP como o Postman/Insomnia:

    ```bash
    curl -X GET "http://localhost:3333/api/places/search-nearby?lat=-23.5505&lng=-46.6333&radius=5000&keyword=restaurante"
    ```

    Se a configuração estiver correta, você deverá receber uma lista de estabelecimentos próximos. Caso contrário, verifique os logs do servidor para mensagens de erro relacionadas à API do Google Maps.

## 5. Solução de Problemas Comuns

*   **"API Key Not Configured" ou "Falha ao buscar dados do Google Maps"**: Verifique se a chave de API está corretamente inserida no `.env` e se as APIs necessárias (`Places API`, `Geocoding API`) estão ativadas no seu projeto do GCP.
*   **"You must enable Billing on Project"**: Certifique-se de que uma conta de faturamento válida esteja vinculada ao seu projeto no Google Cloud Platform.
*   **"API Not Enabled"**: Confirme se as APIs específicas que você está tentando usar (ex: Places API) estão habilitadas para o seu projeto.
*   **Restrições de Chave de API**: Se você restringiu sua chave de API por IP, certifique-se de que o endereço IP do seu servidor (ou `0.0.0.0` para testes locais) esteja na lista de IPs permitidos.

## Referências

[1] Google Maps Platform. *Getting started with Google Maps Platform*. Disponível em: [https://developers.google.com/maps/get-started](https://developers.google.com/maps/get-started)

[2] Google Cloud. *Enable and disable APIs*. Disponível em: [https://support.google.com/googleapi/answer/6158841?hl=en](https://support.google.com/googleapi/answer/6158841?hl=en)

[3] Google Cloud. *Manage API keys*. Disponível em: [https://cloud.google.com/docs/authentication/api-keys](https://cloud.google.com/docs/authentication/api-keys)

[4] Google Cloud. *Creating and managing API keys*. Disponível em: [https://cloud.google.com/api-keys/docs/create-manage-api-keys](https://cloud.google.com/api-keys/docs/create-manage-api-keys)

[5] Google Maps Platform. *Google Maps Platform billing and pricing overview*. Disponível em: [https://developers.google.com/maps/billing-and-pricing/overview](https://developers.google.com/maps/billing-and-pricing/overview)


