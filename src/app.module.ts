import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from './config/app.config.js';
import databaseConfig from './config/database.config.js';
import authConfig from './config/auth.config.js';
import redisConfig from './config/redis.config.js';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Global config — loads .env
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, redisConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        autoLoadEntities: true,
        synchronize: config.get('app.nodeEnv') === 'development', // NEVER in prod
        logging: config.get('app.nodeEnv') === 'development',
      }),
    }),

    // Feature modules
    UserModule,
    AuthModule,
  ],
})
export class AppModule { }
