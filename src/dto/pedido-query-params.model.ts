export interface PedidoResumoResponseModel {
  content: PedidoModel[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PedidoModel {
  numero: string;
  cliente: string;
  telefone: string;
  status: string;
  entrega: string;
  valor: string;
  pagamento: string;
}

// pedido.dto.ts
export interface PedidoDto {
  id: string;
  momento: string;
  status: string;
  enderecoEntrega: string;
  valorDesconto: number;
  cliente: any;
}
