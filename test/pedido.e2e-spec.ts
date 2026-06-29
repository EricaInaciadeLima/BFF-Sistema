import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Pedidos BFF (e2e)', () => {
  let app: INestApplication<App>;
  let fetchMock: jest.Mock<
    Promise<{ ok: boolean; json?: () => Promise<unknown> }>,
    [string]
  >;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    fetchMock = jest.fn<
      Promise<{ ok: boolean; json?: () => Promise<unknown> }>,
      [string]
    >();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /bff/pedidos/resumo deve retornar os dados do backend usando os filtros padrao', async () => {
    const payload = { content: [{ id: 1 }], totalElements: 1 };
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const response = await request(app.getHttpServer())
      .get('/bff/pedidos/resumo')
      .expect(200);

    expect(response.body).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/pedidos?page=0&size=10&sort=momento%2Cdesc',
    );
  });

  it('GET /bff/pedidos/resumo deve repassar os filtros de query para o backend', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [] }),
    });

    await request(app.getHttpServer())
      .get('/bff/pedidos/resumo')
      .query({
        page: '2',
        size: '5',
        sort: 'momento,asc',
        status: 'ENTREGUE',
        cliente: 'joao',
        data: '2026-06-11',
      })
      .expect(200);

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('size=5');
    expect(calledUrl).toContain('sort=momento%2Casc');
    expect(calledUrl).toContain('status=ENTREGUE');
    expect(calledUrl).toContain('cliente=joao');
    expect(calledUrl).toContain('data=2026-06-11');
  });

  it('GET /bff/pedidos/resumo deve retornar 500 quando o backend responder com erro', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await request(app.getHttpServer()).get('/bff/pedidos/resumo').expect(500);
  });
});
