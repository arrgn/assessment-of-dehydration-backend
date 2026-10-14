import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';

export enum DehydrationSignStatus {
  PUBLISHED = 'Опубликован',
  DRAFT = 'Черновик',
  DELETED = 'Удален',
}

@Entity('Users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}

@Entity('Dehydration_signs')
@Index('UQ_Dehydration_signs_creator_draft', ['creatorId'], {
  unique: true,
  where: `"status" = 'Черновик'`,
})
export class DehydrationSign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ type: 'int' })
  @Index()
  creatorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'smallint', nullable: true })
  dehydratingCoefficient: number | null;

  @Column({ type: 'smallint', default: 10 })
  maxDehydratingCoefficient: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vidSrc: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imgSrc: string | null;

  @Column({
    type: 'enum',
    enum: DehydrationSignStatus,
    enumName: 'Dehydration_sign_status_enum',
    default: DehydrationSignStatus.DRAFT,
  })
  @Index()
  status: DehydrationSignStatus;

  @OneToMany(() => DehydrationLike, (like) => like.sign)
  likes: DehydrationLike[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('Dehydration_likes')
@Unique(['userId', 'signId'])
export class DehydrationLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  @Index()
  userId: number;

  @Column({ type: 'int' })
  @Index()
  signId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => DehydrationSign)
  @JoinColumn({ name: 'signId' })
  sign: DehydrationSign;
}
