import { Test, TestingModule } from '@nestjs/testing';
import { PedidoGateway } from '../gateways/pedido.gateway';
import { ListarPedidoService } from './listar-pedido.service';

const buildRaw = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  cliente: 'Cliente Teste',
  status: 'PENDENTE',
  momento: '2026-07-01',
  valorTotal: 100.0,
  ...overrides,
});

const buildPage = (content: unknown[], overrides: Record<string, unknown> = {}) => ({
  content,
  number: 0,
  size: 10,
  totalElements: content.length,
  totalPages: 1,
  ...overrides,
});

describe('ListarPedidoService', () => {
  let service: ListarPedidoService;
  let gateway: { listar: jest.Mock };

  beforeEach(async () => {
    gateway = { listar: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarPedidoService,
        { provide: PedidoGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<ListarPedidoService>(ListarPedidoService);
  });

  describe('mapeamento de campos do pedido', () => {
    test.each([
      {
        descricao: 'pedido completo — todos os campos mapeados',
        raw: buildRaw({ id: 7, cliente: 'Maria', status: 'ENTREGUE', momento: '2026-08-01', valorTotal: 250.5 }),
        esperado: {
          numero: '#7',
          cliente: 'Maria',
          status: 'ENTREGUE',
          entrega: '2026-08-01',
          valor: 'R$ 250,50',
        },
      },
      {
        descricao: 'cliente ausente retorna string vazia',
        raw: buildRaw({ cliente: undefined }),
        esperado: expect.objectContaining({ cliente: '' }),
      },
      {
        descricao: 'momento ausente retorna entrega vazia',
        raw: buildRaw({ momento: undefined }),
        esperado: expect.objectContaining({ entrega: '' }),
      },
      {
        descricao: 'valorTotal ausente formata como R$ 0,00',
        raw: buildRaw({ valorTotal: undefined }),
        esperado: expect.objectContaining({ valor: 'R$ 0,00' }),
      },
      {
        descricao: 'numero é prefixado com #',
        raw: buildRaw({ id: 99 }),
        esperado: expect.objectContaining({ numero: '#99' }),
      },
    ])('$descricao', async ({ raw, esperado }) => {
      gateway.listar.mockResolvedValue(buildPage([raw]));

      const resultado = await service.listar({});

      expect(resultado.content[0]).toEqual(esperado);
    });
  });

  describe('formatação de valor monetário', () => {
    test.each([
      { valorTotal: 0, valorFormatado: 'R$ 0,00' },
      { valorTotal: 1, valorFormatado: 'R$ 1,00' },
      { valorTotal: 0.01, valorFormatado: 'R$ 0,01' },
      { valorTotal: 100.5, valorFormatado: 'R$ 100,50' },
      { valorTotal: 1234.99, valorFormatado: 'R$ 1234,99' },
      { valorTotal: 9999.9, valorFormatado: 'R$ 9999,90' },
    ])(
      'valorTotal=$valorTotal → "$valorFormatado"',
      async ({ valorTotal, valorFormatado }) => {
        gateway.listar.mockResolvedValue(buildPage([buildRaw({ valorTotal })]));

        const resultado = await service.listar({});

        expect(resultado.content[0].valor).toBe(valorFormatado);
      },
    );
  });

  describe('metadados de paginação', () => {
    test.each([
      {
        descricao: 'todos os metadados presentes',
        pageOverrides: { number: 3, size: 25, totalElements: 200, totalPages: 8 },
        esperado: { page: 3, size: 25, totalElements: 200, totalPages: 8 },
      },
      {
        descricao: 'number ausente usa 0 como padrão',
        pageOverrides: { number: undefined, size: 10, totalElements: 5, totalPages: 1 },
        esperado: expect.objectContaining({ page: 0 }),
      },
      {
        descricao: 'totalPages ausente usa 1 como padrão',
        pageOverrides: { number: 0, size: 10, totalElements: 2, totalPages: undefined },
        esperado: expect.objectContaining({ totalPages: 1 }),
      },
      {
        descricao: 'size ausente usa tamanho do array de conteúdo',
        pageOverrides: { number: 0, size: undefined, totalElements: 2, totalPages: 1 },
        esperado: expect.objectContaining({ size: 2 }),
      },
      {
        descricao: 'totalElements ausente usa tamanho do array de conteúdo',
        pageOverrides: { number: 0, size: 10, totalElements: undefined, totalPages: 1 },
        esperado: expect.objectContaining({ totalElements: 2 }),
      },
    ])('$descricao', async ({ pageOverrides, esperado }) => {
      const content = [buildRaw({ id: 1 }), buildRaw({ id: 2 })];
      gateway.listar.mockResolvedValue(buildPage(content, pageOverrides));

      const resultado = await service.listar({});

      expect(resultado).toMatchObject(esperado);
    });
  });

  describe('lista vazia', () => {
    it('deve retornar content vazio quando gateway não retornar pedidos', async () => {
      gateway.listar.mockResolvedValue(buildPage([]));

      const resultado = await service.listar({});

      expect(resultado.content).toHaveLength(0);
    });
  });

  describe('delegação ao gateway', () => {
    it('deve repassar o filtro ao gateway sem modificações', async () => {
      const filtro = { page: 1, size: 15, sort: 'id,desc', status: 'CANCELADO' };
      gateway.listar.mockResolvedValue(buildPage([]));

      await service.listar(filtro);

      expect(gateway.listar).toHaveBeenCalledWith(filtro);
    });
  });

  describe('propagação de erros do gateway', () => {
    it('deve propagar a exceção lançada pelo gateway', async () => {
      gateway.listar.mockRejectedValue(new Error('Erro ao buscar pedidos'));

      await expect(service.listar({})).rejects.toThrow('Erro ao buscar pedidos');
    });
  });
});
