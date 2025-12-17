import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodTypeAny) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const tree = z.treeifyError(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: tree,
      });
    }

    return result.data;
  }
}
