import { describeGiven, when } from '@geeebe/jest-bdd';
import Router from '@koa/router';
import { address, internet, name } from 'faker';
import { Server } from 'http';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import request from 'supertest';
import { isArray } from 'util';
import { asString, isNumber, isObject, maybeString } from 'validata';
import validator from 'validator';
import { ValidateOptions, validateRequest } from './middleware';
import { RequestContext } from './middleware.types';
import { Statuses } from './statuses';

export const startTestServer = <B, H, Q>(checks: ValidateOptions<B, H, Q>): Server => {
  const app = new Koa();
  app.use(bodyParser());

  const router: Router = new Router();
  router.post('/', validateRequest(checks), (ctx: RequestContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ctx.body = ctx.request.body;
    ctx.status = Statuses.OK;
  });
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app.listen();
};

describe('validateRequest', () => {
  describeGiven('koa is configured with validata middleware having no checks', () => {
    const given = () => {
      const server = startTestServer({});
      return { server };
    };

    when('POST is called with empty object', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/')
        .send({});

      it('will succeed', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.OK);
        expect(response.body).toStrictEqual({});
      });
    });
  });

  describeGiven('koa is configured with validata middleware having body check', () => {
    interface Body {
      age: number;
      email?: string;
      name: string;
    }

    const given = () => {
      const check = isObject<Body>({
        age: isNumber({ min: 0, coerceMax: 100 }),
        email: maybeString({ validator: validator.isEmail }),
        name: asString(),
      });
      const server = startTestServer({ body: check });
      return { server };
    };

    when('POST is called with empty object', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/')
        .send({});

      it('will fail validation', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        if (!isArray(response.body)) fail('body must be an array');
        expect(response.body.length).toBe(2);
        expect(response.body).toContainEqual(expect.objectContaining({ path: ['age'], reason: 'not-defined' }));
        expect(response.body).toContainEqual(expect.objectContaining({ path: ['name'], reason: 'not-defined' }));
        expect(response.body).not.toContain(expect.objectContaining({ path: ['email'], reason: 'not-defined' }));
      });
    });

    when('POST is called with valid object', () => {
      const { server } = given();
      afterAll(() => server.close());

      const requestBody = {
        age: 500,
        name: name.findName(),
        email: internet.email(),
      };
      const promise = request(server)
        .post('/')
        .send(requestBody);

      it('will succeed, and respond with coerced values', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.OK);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const body: Record<string, unknown> = response.body;

        expect(body.age).toBe(100);
        expect(body.email).toBe(requestBody.email);
        expect(body.name).toBe(requestBody.name);
      });
    });

    when('POST is called with object containing extra properties', () => {
      const { server } = given();
      afterAll(() => server.close());

      const requestBody = {
        age: 500,
        name: name.findName(),
        email: internet.email(),
        address: address.streetAddress(),
      };
      const promise = request(server)
        .post('/')
        .send(requestBody);

      it('will fail validation', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        if (!isArray(response.body)) fail('body must be an array');
        expect(response.body.length).toBe(1);
        expect(response.body).toContainEqual(expect.objectContaining({ path: ['address'], reason: 'unexpected-property' }));
      });
    });
  });
});
