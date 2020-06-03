import { Context } from 'koa';
import { isIssue, ValueProcessor } from 'validata';
import { ValidationError } from './validation-error';

export const body = <T>(ctx: Context, check: ValueProcessor<T>): T => base(check, () => ctx.body as unknown);
export const headers = <T>(ctx: Context, check: ValueProcessor<T>): T => base(check, () => ctx.header as unknown, '#');
export const params = <T>(ctx: Context, check: ValueProcessor<T>): T => base(check, () => ctx.params as unknown, ':');
export const query = <T>(ctx: Context, check: ValueProcessor<T>): T => base(check, () => ctx.query as unknown, '?');

export const base = <T>(check: ValueProcessor<T>, value: () => unknown, nest?: string | number): T => {
  const result = check.process(value());
  if (isIssue(result)) {
    throw new ValidationError(nest ? result.issues.map((issue) => issue.nest(nest)) : result.issues);
  }
  return result.value;
};
