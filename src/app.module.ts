import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PedidoController } from './controller/pedido.controller';
import { PedidoResumoService } from './service/pedido-resumo.service';
import { PedidoGateway } from './gateways/pedido.gateway';
import { ListarPedidoController } from './controller/listar-pedido.controller';
import { ListarPedidoService } from './service/listar-pedido.service';
import { ListarPedidoGateway } from './gateways/listar-pedido.gateway';

@Module({
  imports: [],
  controllers: [AppController, PedidoController, ListarPedidoController],
  providers: [
    AppService,
    PedidoResumoService,
    PedidoGateway,
    ListarPedidoService,
    ListarPedidoGateway,
  ],
})
export class AppModule {}
