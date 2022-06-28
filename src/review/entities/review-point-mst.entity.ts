import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReviewPointMstInterface } from '../interface/review-point-mst.interface';
import { ReviewPointDtlEntity } from './review-point-dtl.entity';
import { UserEntity } from './user.entity';

@Entity('tb_review_point_mst')
export class ReviewPointMstEntity implements ReviewPointMstInterface {
  @PrimaryGeneratedColumn({ name: 'review_point_mst_id' })
  reviewPointMstId: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'total_point_amt' })
  totalPointAmt: number;

  @CreateDateColumn({ name: 'reg_date' })
  regDate: Date;

  @OneToOne((type) => UserEntity, (_) => _.reviewPointMst)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany((type) => ReviewPointDtlEntity, (_) => _.reviewPointMst)
  reviewPointDtlList: ReviewPointDtlEntity[];
}
