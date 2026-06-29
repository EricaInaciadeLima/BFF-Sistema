const path = require('path');
const jsonServer = require('json-server');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);

// Simula o endpoint paginado /pedidos no formato Spring Data Page<T>,
// aplicando os mesmos filtros (status, cliente, data) e ordenacao
// enviados pelo PedidoGateway.
server.get('/pedidos', (req, res) => {
  const { status, cliente, data, sort = 'momento,desc', page = '0', size = '10' } = req.query;

  let pedidos = router.db.get('pedidos').value();

  if (status) {
    pedidos = pedidos.filter((pedido) => pedido.status === status);
  }

  if (cliente) {
    const termo = String(cliente).toLowerCase();
    pedidos = pedidos.filter((pedido) =>
      pedido.cliente.toLowerCase().includes(termo),
    );
  }

  if (data) {
    pedidos = pedidos.filter((pedido) => pedido.momento.startsWith(data));
  }

  const [campo, direcao = 'asc'] = String(sort).split(',');
  pedidos = [...pedidos].sort((a, b) => {
    if (a[campo] === b[campo]) return 0;
    const resultado = a[campo] > b[campo] ? 1 : -1;
    return direcao === 'desc' ? -resultado : resultado;
  });

  const numeroPagina = Number(page);
  const tamanhoPagina = Number(size);
  const totalElements = pedidos.length;
  const totalPages = Math.max(Math.ceil(totalElements / tamanhoPagina), 1);
  const inicio = numeroPagina * tamanhoPagina;
  const content = pedidos.slice(inicio, inicio + tamanhoPagina);

  res.json({
    content,
    totalElements,
    totalPages,
    number: numeroPagina,
    size: tamanhoPagina,
    first: numeroPagina === 0,
    last: numeroPagina >= totalPages - 1,
    numberOfElements: content.length,
    empty: content.length === 0,
  });
});

server.use(router);

const port = process.env.MOCK_API_PORT || 8080;
server.listen(port, () => {
  console.log(`Mock do backend de pedidos rodando em http://localhost:${port}`);
});
