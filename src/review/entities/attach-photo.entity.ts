import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttachPhotoInterface } from '../interface/attach-photo.interface';
import { ReviewEntity } from './review.entity';

@Entity('tb_attach_photo')
export class AttachPhotoEntity implements AttachPhotoInterface {
  @PrimaryColumn({ name: 'attach_photo_id' })
  attachPhotoId: string;

  @Column({ name: 'review_id' })
  reviewId: string;

  @Column({ name: 'is_del', type: 'boolean' })
  isDel: boolean;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @CreateDateColumn({ name: 'reg_date' })
  regDate: Date;

  @ManyToOne((type) => ReviewEntity, (_) => _.attachPhotoList)
  @JoinColumn({ name: 'review_id' })
  review: ReviewEntity;
}
