// =========================================================================
// FRONTEND — script.js (versão final: Marco 1 + Marco 2 + Marco 3)
// =========================================================================
// Marco 1: fetch() para buscar e renderizar dados em cards
// Marco 2: integração com POST (criar) e DELETE (excluir)
// Marco 3: BLINDAGEM CONTRA XSS — uso exclusivo de textContent,
//          NUNCA innerHTML para exibir dados vindos do usuário.
// =========================================================================

const API_URL = 'http://localhost:3000/api/avaliacoes';

const form = document.getElementById('form-avaliacao');
const listaAvaliacoes = document.getElementById('lista-avaliacoes');
const mensagemErro = document.getElementById('mensagem-erro');

// -------------------------------------------------------------------------
// Busca todas as avaliações no backend e dispara a renderização
// -------------------------------------------------------------------------
async function carregarAvaliacoes() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error('Falha ao buscar avaliações.');
    const avaliacoes = await resposta.json();
    renderizarAvaliacoes(avaliacoes);
  } catch (erro) {
    console.error(erro);
    mensagemErro.textContent = 'Não foi possível carregar as avaliações. Verifique se o servidor está rodando.';
  }
}

// -------------------------------------------------------------------------
// MARCO 3 — RENDERIZAÇÃO SEGURA CONTRA XSS
//
// Por que isso é seguro:
//   - Todos os elementos são criados via document.createElement().
//   - Os dados do usuário (filme, comentario) são inseridos SOMENTE
//     através da propriedade `textContent`.
//   - `textContent` trata qualquer conteúdo como TEXTO PURO, e nunca
//     como HTML/JS executável. Se um usuário malicioso enviar
//     "<script>alert('hack')</script>" como nome do filme, esse texto
//     será exibido literalmente na tela (como string), e o navegador
//     NUNCA vai interpretar/executar esse código.
//   - innerHTML é estritamente PROIBIDO neste arquivo para dados
//     vindos do usuário, pois ele interpreta strings como HTML real,
//     permitindo a execução de scripts injetados (ataque XSS).
// -------------------------------------------------------------------------
function renderizarAvaliacoes(avaliacoes) {
  // Limpa a lista atual antes de renderizar novamente
  listaAvaliacoes.textContent = '';

  if (!avaliacoes || avaliacoes.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'vazio';
    vazio.textContent = 'Nenhuma avaliação cadastrada ainda. Seja o primeiro a avaliar!';
    listaAvaliacoes.appendChild(vazio);
    return;
  }

  avaliacoes.forEach((avaliacao) => {
    const card = document.createElement('div');
    card.className = 'card';

    // --- Título (nome do filme) — SEGURO via textContent ---
    const titulo = document.createElement('h3');
    titulo.textContent = avaliacao.filme; // nunca innerHTML aqui

    // --- Nota ---
    const nota = document.createElement('p');
    nota.className = 'nota';
    nota.textContent = `Nota: ${'⭐'.repeat(avaliacao.nota)} (${avaliacao.nota}/5)`;

    // --- Comentário/Crítica — SEGURO via textContent ---
    const comentario = document.createElement('p');
    comentario.className = 'comentario';
    comentario.textContent = avaliacao.comentario; // nunca innerHTML aqui

    // --- Botão de excluir (Marco 2) ---
    const botaoExcluir = document.createElement('button');
    botaoExcluir.className = 'btn-excluir';
    botaoExcluir.textContent = 'Excluir';
    botaoExcluir.addEventListener('click', () => excluirAvaliacao(avaliacao.id));

    card.appendChild(titulo);
    card.appendChild(nota);
    card.appendChild(comentario);
    card.appendChild(botaoExcluir);

    listaAvaliacoes.appendChild(card);
  });
}

// -------------------------------------------------------------------------
// MARCO 2 — Envia uma nova avaliação via POST
// -------------------------------------------------------------------------
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensagemErro.textContent = '';

  const filme = document.getElementById('filme').value.trim();
  const nota = document.getElementById('nota').value;
  const comentario = document.getElementById('comentario').value.trim();

  if (!filme || !nota || !comentario) {
    mensagemErro.textContent = 'Por favor, preencha todos os campos.';
    return;
  }

  try {
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filme, nota: Number(nota), comentario }),
    });

    if (!resposta.ok) {
      const erroJson = await resposta.json();
      throw new Error(erroJson.erro || 'Erro ao salvar avaliação.');
    }

    form.reset();
    await carregarAvaliacoes();
  } catch (erro) {
    console.error(erro);
    mensagemErro.textContent = erro.message;
  }
});

// -------------------------------------------------------------------------
// MARCO 2 — Exclui uma avaliação via DELETE
// -------------------------------------------------------------------------
async function excluirAvaliacao(id) {
  const confirmar = confirm('Tem certeza que deseja excluir esta avaliação?');
  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!resposta.ok && resposta.status !== 204) {
      throw new Error('Erro ao excluir avaliação.');
    }
    await carregarAvaliacoes();
  } catch (erro) {
    console.error(erro);
    mensagemErro.textContent = erro.message;
  }
}

// -------------------------------------------------------------------------
// Inicialização: carrega as avaliações ao abrir a página
// -------------------------------------------------------------------------
carregarAvaliacoes();
