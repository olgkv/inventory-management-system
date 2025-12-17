import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DEFAULT_SEED_COUNT } from '../common/constants';
import { Product } from './product.entity';
import { ProductsSeedService } from './products.seed.service';

describe('ProductsSeedService', () => {
  beforeEach(() => {
    delete process.env.SEED_COUNT;
  });

  it('inserts exactly DEFAULT_SEED_COUNT products when table is empty', async () => {
    const repo: Pick<Repository<Product>, 'count' | 'insert'> = {
      count: jest.fn().mockResolvedValue(0),
      insert: jest.fn().mockResolvedValue(undefined as never),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsSeedService,
        {
          provide: getRepositoryToken(Product),
          useValue: repo,
        },
      ],
    }).compile();

    const service = moduleRef.get(ProductsSeedService);

    await service.run();

    expect(repo.insert).toHaveBeenCalledTimes(1);
    const [inserted] = (repo.insert as jest.Mock).mock.calls[0];
    expect(inserted).toHaveLength(DEFAULT_SEED_COUNT);
  });

  it('does nothing when table is not empty', async () => {
    const repo: Pick<Repository<Product>, 'count' | 'insert'> = {
      count: jest.fn().mockResolvedValue(1),
      insert: jest.fn().mockResolvedValue(undefined as never),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsSeedService,
        {
          provide: getRepositoryToken(Product),
          useValue: repo,
        },
      ],
    }).compile();

    const service = moduleRef.get(ProductsSeedService);

    await service.run();

    expect(repo.insert).not.toHaveBeenCalled();
  });
});
