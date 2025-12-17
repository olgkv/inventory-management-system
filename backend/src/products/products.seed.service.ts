import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  DEFAULT_SEED_COUNT,
  DEFAULT_SEED_PRICE_BASE_MINOR,
  SEED_ARTICLE_PAD,
  SEED_QUANTITY_MOD,
} from '../common/constants';
import { Product } from './product.entity';

@Injectable()
export class ProductsSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  async onApplicationBootstrap() {
    const seedForce = process.env.SEED_FORCE === 'true';
    const isTestEnv =
      process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID === 'string';

    if (isTestEnv && !seedForce) {
      return;
    }

    await this.run();
  }

  async run() {
    const count = await this.productRepository.count();

    if (count > 0) {
      return;
    }

    const parsedSeedCount = Number(process.env.SEED_COUNT ?? DEFAULT_SEED_COUNT);
    const seedCount =
      Number.isFinite(parsedSeedCount) && parsedSeedCount > 0
        ? Math.trunc(parsedSeedCount)
        : DEFAULT_SEED_COUNT;

    const products = Array.from({ length: seedCount }, (_, i) => {
      const n = i + 1;
      return {
        article: `SEED-${String(n).padStart(SEED_ARTICLE_PAD, '0')}`,
        name: `Seed Product ${n}`,
        priceMinor: DEFAULT_SEED_PRICE_BASE_MINOR + n,
        quantity: n % SEED_QUANTITY_MOD,
      };
    });

    await this.productRepository.insert(products);
  }
}
