import * as Router from '@koa/router';
import * as Koa from 'koa';
import { Context } from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { asNumber, isObject, isString, maybeString } from 'validata';
import validator from 'validator';
import { body, Statuses, validate } from '../';

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
