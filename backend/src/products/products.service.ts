import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  async list(params: { page: number; limit: number }) {
    const { page, limit } = params;

    const skip = (page - 1) * limit;

    const [data, total] = await this.productRepository.findAndCount({
      skip,
      take: limit,
      order: { id: 'ASC' },
    });

    return {
      data,
      total,
    };
  }

  async create(dto: {
    article: string;
    name: string;
    priceMinor: number;
    quantity: number;
  }): Promise<Product> {
    return await this.productRepository.manager.transaction(async em => {
      const repo = em.getRepository(Product);
      const entity = repo.create(dto);
      return await repo.save(entity);
    });
  }

  async update(
    id: number,
    dto: Partial<{
      article: string;
      name: string;
      priceMinor: number;
      quantity: number;
    }>
  ): Promise<Product> {
    return await this.productRepository.manager.transaction(async em => {
      const repo = em.getRepository(Product);
      const existing = await repo.findOneBy({ id });

      if (!existing) {
        throw new NotFoundException({ message: 'Product not found' });
      }

      const next = Object.assign(existing, dto);
      return await repo.save(next);
    });
  }

  async remove(id: number): Promise<void> {
    await this.productRepository.manager.transaction(async em => {
      const repo = em.getRepository(Product);
      const result = await repo.delete({ id });

      if (!result.affected) {
        throw new NotFoundException({ message: 'Product not found' });
      }
    });
  }
}
