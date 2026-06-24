// =========================================================================
// SERVIDOR FINAL — MARCO 2 (CRUD + Prisma/SQLite) + MARCO 3 (Segurança)
// =========================================================================
// Este arquivo já contém:
//   - Persistência real via Prisma ORM + SQLite (Marco 2)
//   - Middleware "helmet" para cabeçalhos HTTP seguros (Marco 3)
// =========================================================================

const express = require('express');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

// -------------------------------------------------------------------------
// MARCO 3 — SEGURANÇA: Helmet configura uma série de cabeçalhos HTTP
// (ex: X-Content-Type-Options, X-Frame-Options, Content-Security-Policy
// básica, etc.) que ajudam a mitigar ataques como XSS, clickjacking e
// sniffing de MIME type. Deve ser um dos primeiros middlewares.
// -------------------------------------------------------------------------
app.use(helmet());

// Middleware nativo do Express para interpretar JSON no corpo das requisições
app.use(express.json());

// (Opcional) Servir o frontend estático diretamente pelo backend.
// Descomente a linha abaixo se quiser que o Express sirva os arquivos
// da pasta frontend em vez de abri-los manualmente no navegador.
// app.use(express.static('../frontend'));

// -------------------------------------------------------------------------
// MARCO 2 — ROTA GET: lista todas as avaliações reais salvas no SQLite
// -------------------------------------------------------------------------
app.get('/api/avaliacoes', async (req, res) => {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      orderBy: { id: 'desc' },
    });
    res.json(avaliacoes);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ erro: 'Erro ao buscar avaliações.' });
  }
});

// -------------------------------------------------------------------------
// MARCO 2 — ROTA POST: cria uma nova avaliação no banco
// -------------------------------------------------------------------------
app.post('/api/avaliacoes', async (req, res) => {
  try {
    const { filme, nota, comentario } = req.body;

    // Validação básica de entrada (defesa em profundidade — além do
    // textContent no frontend, validamos também no backend)
    if (!filme || typeof filme !== 'string' || filme.trim() === '') {
      return res.status(400).json({ erro: 'O campo "filme" é obrigatório.' });
    }
    const notaNumero = Number(nota);
    if (!Number.isInteger(notaNumero) || notaNumero < 1 || notaNumero > 5) {
      return res.status(400).json({ erro: 'A nota deve ser um número inteiro entre 1 e 5.' });
    }
    if (!comentario || typeof comentario !== 'string' || comentario.trim() === '') {
      return res.status(400).json({ erro: 'O campo "comentario" é obrigatório.' });
    }

    const novaAvaliacao = await prisma.avaliacao.create({
      data: {
        filme: filme.trim(),
        nota: notaNumero,
        comentario: comentario.trim(),
      },
    });

    res.status(201).json(novaAvaliacao);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ erro: 'Erro ao salvar avaliação.' });
  }
});

// -------------------------------------------------------------------------
// MARCO 2 — ROTA DELETE: remove uma avaliação pelo ID
// -------------------------------------------------------------------------
app.delete('/api/avaliacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNumero = Number(id);

    if (!Number.isInteger(idNumero)) {
      return res.status(400).json({ erro: 'ID inválido.' });
    }

    await prisma.avaliacao.delete({
      where: { id: idNumero },
    });

    res.status(204).send(); // 204 No Content = sucesso, sem corpo de resposta
  } catch (error) {
    // P2025 = registro não encontrado (erro padrão do Prisma)
    if (error.code === 'P2025') {
      return res.status(404).json({ erro: 'Avaliação não encontrada.' });
    }
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).json({ erro: 'Erro ao deletar avaliação.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
