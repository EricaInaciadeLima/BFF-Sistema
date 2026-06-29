import { Test, TestingModule } from '@nestjs/testing';
import { PedidoController } from './pedido.controller';
import { PedidoResumoService } from '../service/pedido-resumo.service';

const respostaPadrao = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

describe('PedidoController', () => {
  let controller: PedidoController;
  let service: { listarResumo: jest.Mock };

  beforeEach(async () => {
    service = { listarResumo: jest.fn().mockResolvedValue(respostaPadrao) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidoController],
      providers: [{ provide: PedidoResumoService, useValue: service }],
    }).compile();

    controller = module.get<PedidoController>(PedidoController);
  });

  describe('valores padrão', () => {
    it('deve usar page=0, size=10 e sort=momento,desc quando nenhum parâmetro for informado', async () => {
      await controller.listarResumo(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(service.listarResumo).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        sort: 'momento,desc',
        status: undefined,
        cliente: undefined,
        data: undefined,
      });
    });
  });

  describe('conversão de page e size para número', () => {
    test.each([
      { page: '0', size: '10', expectedPage: 0, expectedSize: 10 },
      { page: '1', size: '20', expectedPage: 1, expectedSize: 20 },
      { page: '5', size: '50', expectedPage: 5, expectedSize: 50 },
      { page: '99', size: '100', expectedPage: 99, expectedSize: 100 },
    ])(
      'page="$page" → $expectedPage | size="$size" → $expectedSize',
      async ({ page, size, expectedPage, expectedSize }) => {
        await controller.listarResumo(page, size, undefined, undefined, undefined, undefined);

        expect(service.listarResumo).toHaveBeenCalledWith(
          expect.objectContaining({ page: expectedPage, size: expectedSize }),
        );
      },
    );
  });

  describe('repasse de filtros opcionais', () => {
    test.each([
      {
        descricao: 'todos os filtros preenchidos',
        status: 'PENDENTE',
        cliente: 'joao',
        data: '2026-06-11',
        sort: 'momento,asc',
      },
      {
        descricao: 'apenas status informado',
        status: 'ENTREGUE',
        cliente: undefined,
        data: undefined,
        sort: 'momento,desc',
      },
      {
        descricao: 'apenas cliente informado',
        status: undefined,
        cliente: 'maria',
        data: undefined,
        sort: 'momento,desc',
      },
      {
        descricao: 'apenas data informada',
        status: undefined,
        cliente: undefined,
        data: '2026-01-01',
        sort: 'momento,desc',
      },
      {
        descricao: 'sem filtros opcionais',
        status: undefined,
        cliente: undefined,
        data: undefined,
        sort: 'momento,desc',
      },
    ])('$descricao', async ({ status, cliente, data, sort }) => {
      await controller.listarResumo('0', '10', sort, status, cliente, data);

      expect(service.listarResumo).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        sort,
        status,
        cliente,
        data,
      });
    });
  });

  describe('retorno transparente do service', () => {
    it('deve retornar exatamente a resposta do service sem modificações', async () => {
      const respostaEsperada = {
        content: [
          {
            numero: '#1',
            cliente: 'Ana',
            telefone: '',
            status: 'PENDENTE',
            entrega: '2026-01-01',
            valor: 'R$ 50,00',
            pagamento: 'ONLINE',
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      };
      service.listarResumo.mockResolvedValue(respostaEsperada);

      const resultado = await controller.listarResumo(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(resultado).toBe(respostaEsperada);
    });
  });
});
