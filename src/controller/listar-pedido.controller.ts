import { Controller, Get, Query } from '@nestjs/common';
import {
  ListarPedidoService,
  PedidoResumoResponseModel,
} from '../service/listar-pedido.service';

@Controller('pedidos')
export class ListarPedidoController {
  constructor(private readonly listarPedidoService: ListarPedidoService) {}

  @Get()
  async listar(
    @Query() query: Record<string, unknown>,
  ): Promise<PedidoResumoResponseModel> {
    return this.listarPedidoService.listar(query);
  }
}
