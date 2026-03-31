import { Test, TestingModule } from '@nestjs/testing';
import { CatalogosController } from './catalogos.controller';

describe('CatalogosController', () => {
  let controller: CatalogosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogosController],
    }).compile();

    controller = module.get<CatalogosController>(CatalogosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
