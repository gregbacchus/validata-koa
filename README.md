# Validata Koa

Type safe data validation and sanitization for [Koa](https://www.npmjs.com/package/koa) requests
(body, query, headers, params) using [validata](https://www.npmjs.com/package/validata).

See [validata](https://www.npmjs.com/package/validata) for more details on validation functionality.

## Getting started

```bash
npm i validata validata-koa
```

## Basic usage

### Body checking

```typescript
import * as Router from '@koa/router';
import * as Koa from 'koa';
import { Context } from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { asNumber, isObject, isString, maybeString } from 'validata';
import validator from 'validator';
import { body, Statuses, validate } from 'validata-koa';

interface Body {
  age: number;
  email?: string;
  name: string;
}

const bodyCheck = isObject<Body>({
  age: asNumber({ min: 0, coerceMax: 120 }),
  email: maybeString({ validator: validator.isEmail }),
  name: isString(),
});

const app = new Koa();
app.use(bodyParser());

const router: Router = new Router();
// validate() middleware captures and formats validation issue responses
router.post('/:id', validate(), (ctx: Context) => {
  // these are now strongly typed
  // if age is passed in as a string, it will be converted to a number (by the asNumber() check)
  const { age, email, name } = body(ctx, bodyCheck);
  console.log({ age, email, name });
  ctx.status = Statuses.OK;
});
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(8081);
```

### Params and query parameters

```typescript
import * as Router from '@koa/router';
import * as Koa from 'koa';
import { Context } from 'koa';
import { asNumber, isObject, isString, maybeAsNumber } from 'validata';
import { params, query, Statuses, validate } from 'validata-koa';

interface Params {
  id: number;
}

const paramsCheck = isObject<Params>({
  id: asNumber({ min: 0 }),
});

interface Query {
  filter: string;
  page?: number;
}

const queryCheck = isObject<Query>({
  filter: isString(),
  page: maybeAsNumber({ min: 0 }),
});

const app = new Koa();
const router: Router = new Router();

// validate() middleware captures and formats validation issue responses
router.post('/:id', validate(), (ctx: Context) => {
  // these are now strongly typed
  const { id } = params(ctx, paramsCheck);
  const { filter, page } = query(ctx, queryCheck);

  ctx.body = { id, filter, page };
  ctx.status = Statuses.OK;
});
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(8081);
```

Testing it out...

```bash
curl -X POST localhost:8081/foo
# status=400
# {"issues":[{"path":[":","id"],"value":"foo","reason":"no-conversion","info":{"toType":"number"}}]}

curl -X POST localhost:8081/12
# status=400
# {"issues":[{"path":["?","filter"],"reason":"not-defined"}]}

curl -X POST localhost:8081/12?filter=test
# status=200
# {"id":12,"filter":"test"}

curl -X POST localhost:8081/-2?filter=test
# status=400
# {"issues":[{"path":[":","id"],"value":-2,"reason":"min","info":{"min":0}}]}
```

### Headers

... can be done in pretty much the same way
