import { describeGiven, then, when } from '@geeebe/jest-bdd';
import * as Router from '@koa/router';
import { internet, name, random } from 'faker';
import { Server } from 'http';
import * as Koa from 'koa';
import { Context } from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as request from 'supertest';
import { asNumber, isObject, isString, Issue, maybeString } from 'validata';
import validator from 'validator';
import { body, headers, params } from './getters';
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

    then('it will succeed', async () => {
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

      then('it will succeed', async () => {
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

      then('it will fail', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        expect(response.body).toStrictEqual(
          { 'issues': [{ 'info': { 'toType': 'number' }, 'path': [':', 'id'], 'reason': 'no-conversion', 'value': 'testing' }] }
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

      then('it will succeed', async () => {
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

      then('it will fail', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        expect(response.body).toStrictEqual(
          { 'issues': [{ 'info': { 'toType': 'number' }, 'path': ['#', 'x-my-header'], 'reason': 'no-conversion', 'value': 'testing' }] }
        );
      });
    });
  });
});

describe('request body', () => {
  describeGiven('koa is configured with param check', () => {
    interface MyBody {
      age: number;
      email?: string;
      name: string;
    }
    const given = () => {
      const server = startTestServer((ctx) => {
        const check = isObject<MyBody>({
          age: asNumber({ min: 0, coerceMax: 120 }),
          email: maybeString({ validator: validator.isEmail }),
          name: isString(),
        });
        return body(ctx, check);
      });
      return { server };
    };

    when('POST is called with an empty body', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/12')
        .send({});

      then('it will fail with 2 issues', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const issues: Issue[] = response.body.issues;
        if (!issues) fail('No issues returned');
        expect(issues.length).toBe(2);
        expect(issues).toContainEqual({ 'path': ['age'], 'reason': 'not-defined' });
        expect(issues).toContainEqual({ 'path': ['name'], 'reason': 'not-defined' });
      });
    });

    when('POST is called with valid request', () => {
      const { server } = given();
      afterAll(() => server.close());

      const data = {
        age: 300,
        email: internet.email(),
        name: name.findName(),
      };
      const promise = request(server)
        .post('/12')
        .send(data);

      then('it will succeed and coerce age', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.OK);
        expect(response.body).toStrictEqual({
          age: 120,
          email: data.email,
          name: data.name,
        });
      });
    });

    when('POST is called with body containing additional properties', () => {
      const { server } = given();
      afterAll(() => server.close());

      const data = {
        age: 300,
        email: internet.email(),
        name: name.findName(),
        extra: random.word(),
      };
      const promise = request(server)
        .post('/12')
        .send(data);

      then('it will fail', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const issues: Issue[] = response.body.issues;
        if (!issues) fail('No issues returned');
        expect(issues.length).toBe(1);
        expect(issues).toContainEqual({ 'path': ['extra'], 'reason': 'unexpected-property', 'value': data.extra });
      });
    });
  });
});
