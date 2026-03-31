import { Module, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Module({})
export class DatabaseModule implements OnModuleInit {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
  }
}
