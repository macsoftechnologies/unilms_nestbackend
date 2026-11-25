import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant || (request.user?.tenantId ? { id: request.user.tenantId, code: request.user.tenantCode } : null);
  },
);

