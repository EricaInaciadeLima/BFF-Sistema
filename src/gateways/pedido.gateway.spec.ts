import { PedidoGateway } from './pedido.gateway';

const buildFetchOk = (data: unknown = { content: [] }) => ({
  ok: true,
  json: jest.fn().mockResolvedValue(data),
});

describe('PedidoGateway', () => {
  let gateway: PedidoGateway;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    gateway = new PedidoGateway();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('construção de URL — parâmetros obrigatórios', () => {
    test.each([
      {
        descricao: 'page, size e sort são sempre incluídos',
        params: { page: 1, size: 20, sort: 'momento,asc' },
        expectedParts: ['page=1', 'size=20', 'sort=momento%2Casc'],
      },
      {
        descricao: 'valores default quando params vazios: page=0, size=10',
        params: {},
        expectedParts: ['page=0', 'size=10'],
      },
      {
        descricao: 'todos os parâmetros opcionais incluídos na URL',
        params: {
          page: 0,
          size: 10,
          sort: 'id,asc',
          status: 'PENDENTE',
          cliente: 'João',
          data: '2026-01-01',
        },
        expectedParts: [
          'page=0',
          'size=10',
          'status=PENDENTE',
          'cliente=Jo%C3%A3o',
          'data=2026-01-01',
        ],
      },
    ])('$descricao', async ({ params, expectedParts }) => {
      mockFetch.mockResolvedValue(buildFetchOk());

      await gateway.listar(params);

      const url = mockFetch.mock.lastCall?.[0] as string;
      for (const part of expectedParts) {
        expect(url).toContain(part);
      }
    });
  });

  describe('construção de URL — parâmetros opcionais ausentes', () => {
    test.each([
      { descricao: 'status ausente não aparece na URL', params: { page: 0, size: 10 }, notExpected: 'status=' },
      { descricao: 'cliente ausente não aparece na URL', params: { page: 0, size: 10 }, notExpected: 'cliente=' },
      { descricao: 'data ausente não aparece na URL', params: { page: 0, size: 10 }, notExpected: 'data=' },
    ])('$descricao', async ({ params, notExpected }) => {
      mockFetch.mockResolvedValue(buildFetchOk());

      await gateway.listar(params);

      const url = mockFetch.mock.lastCall?.[0] as string;
      expect(url).not.toContain(notExpected);
    });
  });

  describe('erros HTTP', () => {
    test.each([
      { status: 400, descricao: 'Bad Request' },
      { status: 401, descricao: 'Unauthorized' },
      { status: 403, descricao: 'Forbidden' },
      { status: 404, descricao: 'Not Found' },
      { status: 500, descricao: 'Internal Server Error' },
      { status: 503, descricao: 'Service Unavailable' },
    ])('deve lançar erro para HTTP $status ($descricao)', async ({ status }) => {
      mockFetch.mockResolvedValue({ ok: false, status });

      await expect(gateway.listar({})).rejects.toThrow('Erro ao buscar pedidos');
    });
  });

  describe('erro de rede', () => {
    it('deve propagar erro quando o fetch falhar por problema de rede', async () => {
      mockFetch.mockRejectedValue(new TypeError('fetch failed'));

      await expect(gateway.listar({})).rejects.toThrow('fetch failed');
    });
  });

  describe('sucesso — retorno dos dados', () => {
    it('deve retornar os dados parseados da resposta', async () => {
      const respostaApi = {
        content: [
          { id: 1, cliente: 'Ana', status: 'PENDENTE', momento: '2026-01-01', valorTotal: 50 },
        ],
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      };
      mockFetch.mockResolvedValue(buildFetchOk(respostaApi));

      const resultado = await gateway.listar({ page: 0, size: 10 });

      expect(resultado).toEqual(respostaApi);
    });

    it('deve chamar fetch exatamente uma vez por requisição', async () => {
      mockFetch.mockResolvedValue(buildFetchOk());

      await gateway.listar({ page: 0, size: 10 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
