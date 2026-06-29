import { Injectable } from '@nestjs/common';
import {
  PedidoResumoResponseModel,
  PedidoModel,
} from '../dto/pedido-query-params.model';
import {
  PedidoGateway,
  PedidoRaw,
  PageResponse,
} from '../gateways/pedido.gateway';

@Injectable()
export class PedidoResumoService {
  constructor(private readonly pedidoGateway: PedidoGateway) {}

  async listarResumo(
    filtro: Record<string, unknown>,
  ): Promise<PedidoResumoResponseModel> {
    const response: PageResponse<PedidoRaw> =
      await this.pedidoGateway.listar(filtro);

    const pedidos = response.content ?? [];

    const content: PedidoModel[] = pedidos.map((pedido) => ({
      cliente: pedido.cliente ?? '',
      telefone: '',
      status: pedido.status,
      entrega: pedido.momento ?? '',
      numero: `#${pedido.id}`,
      pagamento: 'ONLINE',
      valor: this.formatarValor(pedido.valorTotal ?? 0),
    }));

    return {
      content,
      page: response.number ?? 0,
      size: response.size ?? pedidos.length,
      totalElements: response.totalElements ?? pedidos.length,
      totalPages: response.totalPages ?? 1,
    };
  }

  private formatarValor(valor: number): string {
    const v = (valor ?? 0).toFixed(2);
    return `R$ ${v.replace('.', ',')}`;
  }
}
