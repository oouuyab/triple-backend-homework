import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttachedPhotoInterface } from '../interface/attached-photo.interface';
import { ReviewEntity } from './review.entity';

@Entity('tb_attached_photo')
export class AttachedPhotoEntity implements AttachedPhotoInterface {
  @PrimaryColumn({ name: 'attached_photo_id' })
  attachedPhotoId: string;

  @Column({ name: 'review_id' })
  reviewId: string;

  @Column({ name: 'is_del', type: 'boolean' })
  isDel: boolean;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @CreateDateColumn({ name: 'reg_date' })
  regDate: Date;

  @ManyToOne((type) => ReviewEntity, (_) => _.attachedPhotoList)
  @JoinColumn({ name: 'review_id' })
  review: ReviewEntity;
}
