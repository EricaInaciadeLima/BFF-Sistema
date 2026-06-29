import { Controller, Get, Query } from '@nestjs/common';
import { PedidoResumoResponseModel } from '../dto/pedido-query-params.model';
import { PedidoResumoService } from '../service/pedido-resumo.service';

@Controller('bff/pedidos')
export class PedidoController {
  constructor(private readonly pedidoResumoService: PedidoResumoService) {}
//obter resumo(trocar pedido) retornar : id do usuario, formas de pagementos, retirar paginaçao...
//listar pedidos retornar : adcionar id do usuario, controller -> no.
  @Get('resumo')
  async listarResumo(
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('sort') sort = 'momento,desc',
    @Query('status') status?: string,
    @Query('cliente') cliente?: string,
    @Query('data') data?: string,
  ): Promise<PedidoResumoResponseModel> {
    return await this.pedidoResumoService.listarResumo({
      page: Number(page),
      size: Number(size),
      sort,
      status,
      cliente,
      data,
    });
  }
}
