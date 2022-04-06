import * as Router from '@koa/router';
import { ParameterizedContext, Request } from 'koa';

interface WithRequestBody {
  request: Request & { body: unknown };
}

interface WithTypedHeader {
  header: Record<string, string | undefined>
}

export type ExtraContext = WithRequestBody & WithTypedHeader;

interface RouterParamContext<StateT = any, CustomT = Record<string, unknown>> {
  /**
   * url params
   */
  params: Record<string, string | undefined>;
  /**
   * the router instance
   */
  router: Router<StateT, CustomT>;
  /**
   * Matched route
   */
  _matchedRoute: string | RegExp | undefined;
  _matchedRouteName: string | undefined;
}

type RouterContext<StateT = any, CustomT = Record<string, unknown>> = ParameterizedContext<StateT, CustomT & RouterParamContext<StateT, CustomT>>;

export type RequestContext = RouterContext<any, ExtraContext>;
