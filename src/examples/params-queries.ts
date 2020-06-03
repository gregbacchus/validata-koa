import Router from '@koa/router';
import Koa, { Context } from 'koa';
import { asNumber, isObject, isString, maybeAsNumber } from 'validata';
import { params, query, Statuses, validate } from '..';

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
