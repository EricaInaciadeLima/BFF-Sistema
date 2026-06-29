import { Injectable } from '@nestjs/common';
import { PedidoGateway } from '../gateways/pedido.gateway';

export interface PedidoModel {
  numero: string;
  cliente: string;
  status: string;
  entrega: string;
  valor: string;
}

export interface PedidoResumoResponseModel {
  content: PedidoModel[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface PedidoRaw {
  id: number;
  cliente: string;
  status: string;
  momento: string;
  valorTotal: number;
}

// interface PageResponse<T> {
//   content: T[];
//   number: number;
//   size: number;
//   totalElements: number;
//   totalPages: number;
// }

@Injectable()
export class ListarPedidoService {
  constructor(private readonly pedidoGateway: PedidoGateway) {}

  async listar(
    filtro: Record<string, unknown>,
  ): Promise<PedidoResumoResponseModel> {
    const response = await this.pedidoGateway.listar(filtro);

    const pedidos: PedidoRaw[] = response.content ?? [];

    const content: PedidoModel[] = pedidos.map((pedido) => ({
      numero: `#${pedido.id}`,
      cliente: pedido.cliente ?? '',
      status: pedido.status,
      entrega: pedido.momento ?? '',
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
