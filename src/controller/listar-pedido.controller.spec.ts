import { Test, TestingModule } from '@nestjs/testing';
import { ListarPedidoController } from './listar-pedido.controller';
import { ListarPedidoService } from '../service/listar-pedido.service';

const respostaPadrao = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

describe('ListarPedidoController', () => {
  let controller: ListarPedidoController;
  let service: { listar: jest.Mock };

  beforeEach(async () => {
    service = { listar: jest.fn().mockResolvedValue(respostaPadrao) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListarPedidoController],
      providers: [{ provide: ListarPedidoService, useValue: service }],
    }).compile();

    controller = module.get<ListarPedidoController>(ListarPedidoController);
  });

  describe('delegação ao service', () => {
    test.each([
      {
        descricao: 'query vazia',
        query: {},
      },
      {
        descricao: 'query com page e size',
        query: { page: '1', size: '20' },
      },
      {
        descricao: 'query com sort',
        query: { sort: 'momento,desc' },
      },
      {
        descricao: 'query com todos os filtros',
        query: {
          page: '0',
          size: '10',
          sort: 'momento,desc',
          status: 'PENDENTE',
          cliente: 'ana',
          data: '2026-06-01',
        },
      },
    ])('$descricao — deve repassar a query ao service sem modificações', async ({ query }) => {
      await controller.listar(query);

      expect(service.listar).toHaveBeenCalledWith(query);
      expect(service.listar).toHaveBeenCalledTimes(1);
    });
  });

  describe('retorno transparente do service', () => {
    it('deve retornar exatamente o que o service retornar', async () => {
      const respostaEsperada = {
        content: [
          {
            numero: '#1',
            cliente: 'Carlos',
            status: 'ENTREGUE',
            entrega: '2026-06-25',
            valor: 'R$ 75,00',
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      };
      service.listar.mockResolvedValue(respostaEsperada);

      const resultado = await controller.listar({});

      expect(resultado).toBe(respostaEsperada);
    });
  });
});
