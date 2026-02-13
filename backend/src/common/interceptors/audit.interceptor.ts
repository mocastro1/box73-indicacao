import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, body } = request;

    // Only audit write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Extract entity info from URL
    const urlParts = url.split('/').filter(Boolean);
    const entidade = urlParts[1] || 'unknown'; // assuming /api/entidade/...
    const entidadeId = parseInt(urlParts[2]) || null;

    const acao = `${method} ${url}`;
    const usuarioId = user?.id || null;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: async (data) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                usuarioId,
                acao,
                entidade,
                entidadeId,
                detalhes: {
                  method,
                  url,
                  body: this.sanitizeBody(body),
                  response: this.sanitizeResponse(data),
                },
                ip,
                userAgent,
              },
            });
          } catch (error) {
            // Don't fail the request if audit log fails
            console.error('Failed to create audit log:', error);
          }
        },
        error: async (error) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                usuarioId,
                acao: `${acao} [ERROR]`,
                entidade,
                entidadeId,
                detalhes: {
                  method,
                  url,
                  body: this.sanitizeBody(body),
                  error: error.message,
                },
                ip,
                userAgent,
              },
            });
          } catch (auditError) {
            console.error('Failed to create error audit log:', auditError);
          }
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    // Remove sensitive fields
    delete sanitized.senha;
    delete sanitized.password;
    return sanitized;
  }

  private sanitizeResponse(data: any): any {
    if (!data) return null;
    if (typeof data !== 'object') return null;
    
    // Only return IDs and counts for audit
    const result: any = {};
    if (data.id) result.id = data.id;
    if (data.total) result.total = data.total;
    if (Array.isArray(data.data)) result.count = data.data.length;
    
    return result;
  }
}
