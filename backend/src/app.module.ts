import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';
import databaseConfig from './config/database.config';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.getOrThrow<string>('database.host');
        const port = Number(configService.getOrThrow<number>('database.port'));
        const username = configService.getOrThrow<string>('database.username');
        const password = configService.getOrThrow<string>('database.password');
        const database = configService.getOrThrow<string>('database.database');

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          synchronize: false,
          migrationsRun: process.env.NODE_ENV !== 'test',
          autoLoadEntities: true,
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        };
      },
    }),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: TypeOrmExceptionFilter,
    },
  ],
})
export class AppModule {}
