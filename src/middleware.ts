import { Middleware, Next } from 'koa';
import { isIssue, Issue, isValue, ValueProcessor } from 'validata';
import { RequestContext } from './middleware.types';
import { Statuses } from './statuses';
import { ValidationError } from './validation-error';

export interface ValidateOptions<B, H, Q> {
  body?: ValueProcessor<B>,
  header?: ValueProcessor<H>,
  query?: ValueProcessor<Q>,
}

export const validateRequest = <B, H, Q>({ body, query, header }: ValidateOptions<B, H, Q>
): Middleware<any, RequestContext> => async (ctx: RequestContext, next: Next): Promise<void> => {
  const bodyResult = body?.process(ctx.request.body);
  const headerResult = header?.process(ctx.header);
  const queryResult = query?.process(ctx.query);

  const issues: Issue[] = [];
  if (isIssue(bodyResult)) {
    issues.push(...bodyResult.issues);
  }
  if (isIssue(headerResult)) {
    issues.push(...headerResult.issues.map((issue) => issue.nest('#')));
  }
  if (isIssue(queryResult)) {
    issues.push(...queryResult.issues.map((issue) => issue.nest('?')));
  }
  if (issues.length > 0) {
    ctx.body = issues;
    ctx.status = Statuses.BAD_REQUEST;
    return;
  }

  if (bodyResult && isValue(bodyResult)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (ctx.request as any).body = bodyResult.value;
  }
  if (headerResult && isValue(headerResult)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ctx.header = {
      ...ctx.header,
      ...headerResult.value,
    };
  }
  if (queryResult && isValue(queryResult)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ctx.query = {
      ...ctx.query,
      ...queryResult.value,
    };
  }
  await next();
};

export const validate = (): Middleware<any, RequestContext> => async (ctx: RequestContext, next: Next): Promise<void> => {
  try {
    await next();
  } catch (err) {
    if (!(err instanceof ValidationError) || !('issues' in err)) throw err;
    ctx.body = { issues: err.issues };
    ctx.status = Statuses.BAD_REQUEST;
  }
};
