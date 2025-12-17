import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'products' })
@Index(['article'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  article!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'int' })
  priceMinor!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
