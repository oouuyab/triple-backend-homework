import { PointType } from 'src/common/enum';
import { PointAmtType } from 'src/common/types';
import { ReviewEntity } from 'src/review/entities/review.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReviewPointDtlInterface } from '../interface/review-point-dtl.interface';
import { ReviewPointMstEntity } from './review-point-mst.entity';

@Entity('tb_review_point_dtl')
export class ReviewPointDtlEntity implements ReviewPointDtlInterface {
  @PrimaryGeneratedColumn({ name: 'review_point_dtl_id' })
  reviewPointDtlId: number;

  @Column({ name: 'review_point_mst_id' })
  reviewPointMstId: number;

  @Column({ name: 'review_id' })
  reviewId: string;

  @Column({ name: 'point_type', type: 'enum', enumName: 'pointType' })
  pointType: PointType;

  @Column({ name: 'point_amt' })
  pointAmt: PointAmtType;

  @CreateDateColumn({ name: 'reg_date' })
  regDate: Date;

  @ManyToOne((type) => ReviewPointMstEntity, (_) => _.reviewPointDtlList)
  @JoinColumn({
    name: 'review_point_mst_id',
  })
  reviewPointMst: ReviewPointMstEntity;

  @ManyToOne((type) => ReviewEntity, (_) => _.reviewPointDtlList)
  @JoinColumn({ name: 'review_id' })
  review: ReviewEntity;
}
