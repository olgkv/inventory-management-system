import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  it('calculates skip/take from page/limit and calls findAndCount', async () => {
    const repo: Pick<Repository<Product>, 'findAndCount'> = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: repo,
        },
      ],
    }).compile();

    const service = moduleRef.get(ProductsService);

    await service.list({ page: 2, limit: 10 });

    expect(repo.findAndCount).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      order: { id: 'ASC' },
    });
  });
});
