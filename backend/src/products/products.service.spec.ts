import { ConflictException, NotFoundException } from '@nestjs/common';
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

  it('throws ConflictException on duplicate article (23505)', async () => {
    const repo: Pick<Repository<Product>, 'create' | 'save'> = {
      create: jest.fn().mockReturnValue({
        article: 'A-1',
        name: 'P1',
        priceMinor: 100,
        quantity: 1,
      } as unknown as Product),
      save: jest.fn().mockRejectedValue({ code: '23505' }),
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

    await expect(
      service.create({ article: 'A-1', name: 'P1', priceMinor: 100, quantity: 1 })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when updating missing product', async () => {
    const repo: Pick<Repository<Product>, 'findOneBy'> = {
      findOneBy: jest.fn().mockResolvedValue(null),
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

    await expect(service.update(123, { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ConflictException on duplicate article during update (23505)', async () => {
    const existing = {
      id: 1,
      article: 'A-1',
      name: 'P1',
      priceMinor: 100,
      quantity: 1,
    } as unknown as Product;

    const repo: Pick<Repository<Product>, 'findOneBy' | 'save'> = {
      findOneBy: jest.fn().mockResolvedValue(existing),
      save: jest.fn().mockRejectedValue({ code: '23505' }),
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

    await expect(service.update(1, { article: 'A-2' })).rejects.toBeInstanceOf(ConflictException);
  });
});
