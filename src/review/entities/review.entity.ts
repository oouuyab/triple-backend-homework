import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewInterface } from '../interface/review.interface';
import { AttachedPhotoEntity } from './attached-photo.entity';
import { PlaceEntity } from './place.entity';
import { ReviewPointDtlEntity } from './review-point-dtl.entity';
import { UserEntity } from './user.entity';

@Entity('tb_review')
export class ReviewEntity implements ReviewInterface {
  @PrimaryColumn({ name: 'review_id' })
  reviewId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'place_id' })
  placeId: string;

  @Column({ name: 'content' })
  content: string;

  @Column({ name: 'is_del', type: 'boolean' })
  isDel: boolean;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @CreateDateColumn({ name: 'reg_date' })
  regDate: Date;

  @OneToMany((type) => AttachedPhotoEntity, (_) => _.review)
  attachedPhotoList: AttachedPhotoEntity[];

  @OneToMany((type) => ReviewPointDtlEntity, (_) => _.review)
  reviewPointDtlList: ReviewPointDtlEntity[];

  @ManyToOne((type) => UserEntity, (_) => _.reviewList)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne((type) => PlaceEntity, (_) => _.reviewList)
  @JoinColumn({ name: 'place_id' })
  place: PlaceEntity;
}
