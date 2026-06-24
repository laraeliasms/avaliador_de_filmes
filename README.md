# Site de Avaliação de Filmes — Projeto Full Stack (ABP)

Projeto dividido em **3 Marcos de Entrega**, conforme `Projeto_Full_Stack_Apresentacao_ABP.pdf`.

## Estrutura de Diretórios

```
movie-review-app/
├── backend/
│   ├── server.js              # Servidor Express (versão final, com Prisma + Helmet)
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma      # Modelagem do banco SQLite
│   └── dev.db                 # Gerado automaticamente após migração (SQLite)
├── frontend/
│   ├── index.html
│   └── script.js
├── MARCO_1_server_mock.js     # Versão do server.js só com dados em memória (referência histórica)
├── RELATORIO.md
└── README.md
```

> Observação: o arquivo `backend/server.js` já está na **versão final** (Marco 3: CRUD com Prisma + Helmet + proteção XSS).
> O arquivo `MARCO_1_server_mock.js` foi mantido separado apenas como referência do código inicial do Marco 1 (dados mockados em memória), para você mostrar a evolução do projeto na apresentação.

## Como rodar (resumo — detalhes completos no RELATORIO.md)

```bash
cd backend
npm install
npx prisma migrate dev --name init
node server.js
```

Depois abra `frontend/index.html` no navegador (ou sirva com uma extensão como "Live Server").
