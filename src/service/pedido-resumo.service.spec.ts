import { Test, TestingModule } from '@nestjs/testing';
import { PedidoGateway } from '../gateways/pedido.gateway';
import { PedidoResumoService } from './pedido-resumo.service';

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

describe('PedidoResumoService', () => {
  let service: PedidoResumoService;
  let gateway: { listar: jest.Mock };

  beforeEach(async () => {
    gateway = { listar: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidoResumoService,
        { provide: PedidoGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<PedidoResumoService>(PedidoResumoService);
  });

  describe('mapeamento de campos do pedido', () => {
    test.each([
      {
        descricao: 'pedido completo — todos os campos mapeados',
        raw: buildRaw({ id: 10, cliente: 'João', status: 'PENDENTE', momento: '2026-07-15', valorTotal: 199.99 }),
        esperado: {
          numero: '#10',
          cliente: 'João',
          telefone: '',
          status: 'PENDENTE',
          entrega: '2026-07-15',
          valor: 'R$ 199,99',
          pagamento: 'ONLINE',
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
        descricao: 'telefone é sempre vazio — não vem do dado bruto',
        raw: buildRaw({ telefone: '11999999999' }),
        esperado: expect.objectContaining({ telefone: '' }),
      },
      {
        descricao: 'pagamento é sempre ONLINE — não vem do dado bruto',
        raw: buildRaw({ pagamento: 'PIX' }),
        esperado: expect.objectContaining({ pagamento: 'ONLINE' }),
      },
      {
        descricao: 'numero é prefixado com #',
        raw: buildRaw({ id: 42 }),
        esperado: expect.objectContaining({ numero: '#42' }),
      },
    ])('$descricao', async ({ raw, esperado }) => {
      gateway.listar.mockResolvedValue(buildPage([raw]));

      const resultado = await service.listarResumo({});

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

        const resultado = await service.listarResumo({});

        expect(resultado.content[0].valor).toBe(valorFormatado);
      },
    );
  });

  describe('metadados de paginação', () => {
    test.each([
      {
        descricao: 'todos os metadados presentes',
        pageOverrides: { number: 2, size: 20, totalElements: 100, totalPages: 5 },
        esperado: { page: 2, size: 20, totalElements: 100, totalPages: 5 },
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
        descricao: 'size ausente usa o tamanho do array retornado',
        pageOverrides: { number: 0, size: undefined, totalElements: 3, totalPages: 1 },
        esperado: expect.objectContaining({ size: 3 }),
      },
      {
        descricao: 'totalElements ausente usa o tamanho do array retornado',
        pageOverrides: { number: 0, size: 10, totalElements: undefined, totalPages: 1 },
        esperado: expect.objectContaining({ totalElements: 3 }),
      },
    ])('$descricao', async ({ pageOverrides, esperado }) => {
      const content = [buildRaw({ id: 1 }), buildRaw({ id: 2 }), buildRaw({ id: 3 })];
      gateway.listar.mockResolvedValue(buildPage(content, pageOverrides));

      const resultado = await service.listarResumo({});

      expect(resultado).toMatchObject(esperado);
    });
  });

  describe('lista vazia', () => {
    it('deve retornar content vazio quando gateway não retornar pedidos', async () => {
      gateway.listar.mockResolvedValue(buildPage([]));

      const resultado = await service.listarResumo({});

      expect(resultado.content).toHaveLength(0);
    });
  });

  describe('delegação ao gateway', () => {
    it('deve repassar o filtro ao gateway sem modificações', async () => {
      const filtro = { page: 2, size: 5, sort: 'id,asc', status: 'ENTREGUE' };
      gateway.listar.mockResolvedValue(buildPage([]));

      await service.listarResumo(filtro);

      expect(gateway.listar).toHaveBeenCalledWith(filtro);
    });
  });

  describe('propagação de erros do gateway', () => {
    it('deve propagar a exceção lançada pelo gateway', async () => {
      gateway.listar.mockRejectedValue(new Error('Erro ao buscar pedidos'));

      await expect(service.listarResumo({})).rejects.toThrow('Erro ao buscar pedidos');
    });
  });
});
