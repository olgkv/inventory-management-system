import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './product.entity';
import { ProductsService } from './products.service';

type RepoLike = {
  create?: (dto: unknown) => unknown;
  save?: (entity: unknown) => Promise<unknown>;
  findOneBy?: (where: unknown) => Promise<unknown>;
  delete?: (where: unknown) => Promise<{ affected?: number }>;
};

type EntityManagerLike = {
  getRepository: (entity: unknown) => RepoLike;
};

type TransactionManagerLike = {
  transaction: (cb: (em: EntityManagerLike) => Promise<unknown>) => Promise<unknown>;
};

function repoWithTransaction(transaction: TransactionManagerLike) {
  return { manager: transaction };
}

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
    const transaction: TransactionManagerLike = {
      transaction: jest.fn(async cb =>
        cb({
          getRepository: () => ({
            create: () => ({ article: 'A-1', name: 'P1', priceMinor: 100, quantity: 1 }),
            save: () => Promise.reject({ code: '23505' }),
          }),
        })
      ),
    };

    const repo = repoWithTransaction(transaction);

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
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('throws NotFoundException when updating missing product', async () => {
    const transaction: TransactionManagerLike = {
      transaction: jest.fn(async cb =>
        cb({
          getRepository: () => ({
            findOneBy: () => Promise.resolve(null),
          }),
        })
      ),
    };

    const repo = repoWithTransaction(transaction);

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

    const transaction: TransactionManagerLike = {
      transaction: jest.fn(async cb =>
        cb({
          getRepository: () => ({
            findOneBy: () => Promise.resolve(existing),
            save: () => Promise.reject({ code: '23505' }),
          }),
        })
      ),
    };

    const repo = repoWithTransaction(transaction);

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

    await expect(service.update(1, { article: 'A-2' })).rejects.toMatchObject({
      code: '23505',
    });
  });

  it('throws NotFoundException when deleting missing product', async () => {
    const transaction: TransactionManagerLike = {
      transaction: jest.fn(async cb =>
        cb({
          getRepository: () => ({
            delete: () => Promise.resolve({ affected: 0 }),
          }),
        })
      ),
    };

    const repo = repoWithTransaction(transaction);

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

    await expect(service.remove(123)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes product when affected is 1', async () => {
    const transaction: TransactionManagerLike = {
      transaction: jest.fn(async cb =>
        cb({
          getRepository: () => ({
            delete: () => Promise.resolve({ affected: 1 }),
          }),
        })
      ),
    };

    const repo = repoWithTransaction(transaction);

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

    await expect(service.remove(1)).resolves.toBeUndefined();
  });

  it('creates product successfully with valid data', async () => {
    const mockProduct: Product = {
      id: 1,
      article: 'TEST-001',
      name: 'Test Product',
      priceMinor: 9999,
      quantity: 10,
      createdAt: new Date(),
    };

    const transaction: TransactionManagerLike = {
      transaction: jest.fn(async cb =>
        cb({
          getRepository: () => ({
            create: dto => ({ ...mockProduct, ...(dto as any), id: 1 }),
            save: entity => Promise.resolve(entity),
          }),
        })
      ),
    };

    const repo = repoWithTransaction(transaction);

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

    const result = await service.create({
      article: 'TEST-001',
      name: 'Test Product',
      priceMinor: 9999,
      quantity: 10,
    });

    expect(result).toBeDefined();
    expect(result.article).toBe('TEST-001');
    expect(result.name).toBe('Test Product');
  });

  it('updates product successfully with valid partial data', async () => {
    const existingProduct: Product = {
      id: 1,
      article: 'ORIG-001',
      name: 'Original Name',
      priceMinor: 5000,
      quantity: 5,
      createdAt: new Date(),
    };

    const transaction: TransactionManagerLike = {
      transaction: jest.fn(async cb =>
        cb({
          getRepository: () => ({
            findOneBy: () => Promise.resolve(existingProduct),
            save: entity => Promise.resolve(entity),
          }),
        })
      ),
    };

    const repo = repoWithTransaction(transaction);

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

    const result = await service.update(1, { name: 'Updated Name', priceMinor: 6000 });

    expect(result).toBeDefined();
    expect(result.name).toBe('Updated Name');
    expect(result.priceMinor).toBe(6000);
    expect(result.article).toBe('ORIG-001'); // Unchanged
  });

  it('updates product with only name field', async () => {
    const existingProduct: Product = {
      id: 1,
      article: 'ORIG-001',
      name: 'Original Name',
      priceMinor: 5000,
      quantity: 5,
      createdAt: new Date(),
    };

    const transaction: TransactionManagerLike = {
      transaction: jest.fn(async cb =>
        cb({
          getRepository: () => ({
            findOneBy: () => Promise.resolve(existingProduct),
            save: entity => Promise.resolve(entity),
          }),
        })
      ),
    };

    const repo = repoWithTransaction(transaction);

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

    const result = await service.update(1, { name: 'Only Name Updated' });

    expect(result.name).toBe('Only Name Updated');
    expect(result.priceMinor).toBe(5000); // Unchanged
    expect(result.quantity).toBe(5); // Unchanged
  });

  it('calculates correct skip for page 1', async () => {
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

    await service.list({ page: 1, limit: 10 });

    expect(repo.findAndCount).toHaveBeenCalledWith({
      skip: 0, // (1 - 1) * 10 = 0
      take: 10,
      order: { id: 'ASC' },
    });
  });

  it('calculates correct skip for higher pages', async () => {
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

    await service.list({ page: 5, limit: 20 });

    expect(repo.findAndCount).toHaveBeenCalledWith({
      skip: 80, // (5 - 1) * 20 = 80
      take: 20,
      order: { id: 'ASC' },
    });
  });

  it('uses correct ordering by id ASC', async () => {
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

    await service.list({ page: 1, limit: 10 });

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { id: 'ASC' },
      })
    );
  });
});
