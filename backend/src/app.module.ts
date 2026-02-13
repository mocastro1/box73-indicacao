import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { EmbaixadoresModule } from './modules/embaixadores/embaixadores.module';
import { MecanicasModule } from './modules/mecanicas/mecanicas.module';
import { CuponsModule } from './modules/cupons/cupons.module';
import { IndicacoesModule } from './modules/indicacoes/indicacoes.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AuditModule,
    UsuariosModule,
    EmbaixadoresModule,
    MecanicasModule,
    CuponsModule,
    IndicacoesModule,
  ],
  providers: [AuditInterceptor],
})
export class AppModule {}
