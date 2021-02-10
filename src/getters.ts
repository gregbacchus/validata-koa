import { Context } from 'koa';
import { base, ValueProcessor } from 'validata';

type BodyContext = Partial<Context> & {
  request?: { body?: unknown; }
}

type HeaderContext = Partial<Context> & {
  header?: unknown;
}

type ParamsContext = Partial<Context> & {
  params?: unknown;
}

type QueryContext = Partial<Context> & {
  query?: unknown;
}

export const body = <T>(ctx: BodyContext, check: ValueProcessor<T>): T => base(check, () => ctx.request?.body as unknown);
export const headers = <T>(ctx: HeaderContext, check: ValueProcessor<T>): T => base(check, () => ctx.header as unknown, '#');
export const params = <T>(ctx: ParamsContext, check: ValueProcessor<T>): T => base(check, () => ctx.params, ':');
export const query = <T>(ctx: QueryContext, check: ValueProcessor<T>): T => base(check, () => ctx.query as unknown, '?');

export { base };
