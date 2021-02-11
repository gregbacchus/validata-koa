import { Context } from 'koa';
import { check, ValueProcessor } from 'validata';

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

export const body = <T>(ctx: BodyContext, checker: ValueProcessor<T>): T => check(checker, () => ctx.request?.body as unknown);
export const headers = <T>(ctx: HeaderContext, checker: ValueProcessor<T>): T => check(checker, () => ctx.header as unknown, '#');
export const params = <T>(ctx: ParamsContext, checker: ValueProcessor<T>): T => check(checker, () => ctx.params, ':');
export const query = <T>(ctx: QueryContext, checker: ValueProcessor<T>): T => check(checker, () => ctx.query as unknown, '?');

export { check as base };
