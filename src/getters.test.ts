import { describeGiven, when } from '@geeebe/jest-bdd';
import Router from '@koa/router';
import { Server } from 'http';
import Koa, { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import request from 'supertest';
import { asNumber, isObject } from 'validata';
import { headers, params } from './getters';
import { validate } from './middleware';
import { RequestContext } from './middleware.types';
import { Statuses } from './statuses';

export const startTestServer = (handler?: (ctx: Context) => unknown): Server => {
  const app = new Koa();
  app.use(bodyParser());

  const router: Router = new Router();
  router.post('/:id', validate(), (ctx: RequestContext) => {
    if (handler) {
      ctx.body = handler(ctx);
    } else {
      ctx.body = {};
    }
    ctx.status = Statuses.OK;
  });
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app.listen();
};

describeGiven('koa is configured with no checks', () => {
  const given = () => {
    const server = startTestServer();
    return { server };
  };

  when('POST is called with empty object', () => {
    const { server } = given();
    afterAll(() => server.close());

    const promise = request(server)
      .post('/12')
      .send({});

    it('will succeed', async () => {
      const response = await promise;

      expect(response.status).toBe(Statuses.OK);
      expect(response.body).toStrictEqual({});
    });
  });
});

describe('params', () => {
  describeGiven('koa is configured with param check', () => {
    interface NumberId {
      id: number;
    }
    const given = () => {
      const server = startTestServer((ctx) => {
        const check = isObject<NumberId>({
          id: asNumber(),
        });
        return params(ctx, check);
      });
      return { server };
    };

    when('POST is called with numeric id', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/12')
        .send({});

      it('will succeed', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.OK);
        expect(response.body).toStrictEqual({ id: 12 });
      });
    });

    when('POST is called with non-numeric id', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/testing')
        .send({});

      it('will fail', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        expect(response.body).toStrictEqual(
          { 'issues': [{ 'path': [':', 'id'], 'reason': 'no-conversion', 'value': 'testing' }] }
        );
      });
    });
  });
});

describe('headers', () => {
  describeGiven('koa is configured with param check', () => {
    interface MyHeaders {
      'x-my-header': number;
    }
    const given = () => {
      const server = startTestServer((ctx) => {
        const check = isObject<MyHeaders>({
          'x-my-header': asNumber(),
        }, { stripExtraProperties: true });
        return headers(ctx, check);
      });
      return { server };
    };

    when('POST is called with numeric custom header', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/12')
        .set({ 'x-my-header': '12345' })
        .send({});

      it('will succeed', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.OK);
        expect(response.body).toStrictEqual({ 'x-my-header': 12345 });
      });
    });

    when('POST is called with non-numeric custom header', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/12')
        .set({ 'x-my-header': 'testing' })
        .send({});

      it('will fail', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        expect(response.body).toStrictEqual(
          { 'issues': [{ 'path': ['#', 'x-my-header'], 'reason': 'no-conversion', 'value': 'testing' }] }
        );
      });
    });
  });
});
