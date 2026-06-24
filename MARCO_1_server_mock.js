// =========================================================================
// MARCO DE ENTREGA 1 — ARQUITETURA VALIDADA E DADOS MOCKADOS
// =========================================================================
// Esta é a versão INICIAL do servidor, usada apenas para validar o fluxo
// cliente-servidor com dados temporários (em memória RAM).
// Esse arquivo é mantido como referência histórica do projeto.
// A versão final e funcional está em backend/server.js (Marco 3).
// =========================================================================

const express = require('express');
const app = express();
const PORT = 3000;

// Middleware para o Express conseguir interpretar JSON no corpo das requisições
app.use(express.json());

// -------------------------------------------------------------------------
// "Banco de dados" temporário — vive apenas na memória RAM do processo.
// Assim que o servidor reiniciar, esses dados são perdidos (por isso o
// Marco 2 substitui isso por persistência real com Prisma + SQLite).
// -------------------------------------------------------------------------
let avaliacoesMock = [
  { id: 1, filme: 'Interestelar', nota: 5, comentario: 'Obra-prima de ficção científica.' },
  { id: 2, filme: 'O Senhor dos Anéis', nota: 5, comentario: 'Trilogia perfeita, nunca envelhece.' },
  { id: 3, filme: 'Matrix', nota: 4, comentario: 'Revolucionário para a época.' },
];

// Rota GET para listar as avaliações mockadas
app.get('/api/avaliacoes', (req, res) => {
  res.json(avaliacoesMock);
});

app.listen(PORT, () => {
  console.log(`Servidor (Marco 1 - dados mockados) rodando em http://localhost:${PORT}`);
});
