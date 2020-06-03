# Validata Koa

Type safe data validation and sanitization for Koa requests (body, query, headers, params) using [validata](https://www.npmjs.com/package/validata).

## Getting started

```bash
npm i validata validata-koa
```

## Basic usage

```typescript
interface Body {
  age: number;
  email?: string;
  name: string;
}

const check = isObject<Body>({
  age: asNumber({ min: 0, coerceMax: 120 }),
  email: maybeString({ validator: validator.isEmail }),
  name: isString(),
});

const app = new Koa();
app.use(bodyParser());

const router: Router = new Router();
router.post('/', validateRequest({ body: check }), (ctx: RequestContext) => {
  ctx.body = ctx.request.body;
  ctx.status = Statuses.OK;
});
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(8081);
```
