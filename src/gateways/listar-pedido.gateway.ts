import { Injectable } from '@nestjs/common';

interface PedidoQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
  cliente?: string;
  data?: string;
}

export interface PedidoRaw {
  id: number;
  cliente: string;
  status: string;
  momento: string;
  valorTotal: number;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable()
export class ListarPedidoGateway {
  private readonly baseUrl = 'http://localhost:8080/';

  async listar(params: PedidoQueryParams): Promise<PageResponse<PedidoRaw>> {
    const query = new URLSearchParams({
      page: String(params.page ?? 0),
      size: String(params.size ?? 10),
      sort: params.sort ?? '',
    });

    if (params.status) query.append('status', params.status);
    if (params.cliente) query.append('cliente', params.cliente);
    if (params.data) query.append('data', params.data);

    const response = await fetch(`${this.baseUrl}/pedidos?${query.toString()}`);

    if (!response.ok) {
      throw new Error('Erro ao buscar pedidos');
    }

    return (await response.json()) as PageResponse<PedidoRaw>;
  }
}
