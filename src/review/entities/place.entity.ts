import { ReviewEntity } from '../../review/entities/review.entity';
import { CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { PlaceInterface } from '../interface/place.interface';

@Entity('tb_place')
export class PlaceEntity implements PlaceInterface {
  @PrimaryColumn({ name: 'place_id' })
  placeId: string;

  @CreateDateColumn({ name: 'reg_date' })
  regDate: Date;

  @OneToMany((type) => ReviewEntity, (_) => _.place)
  reviewList: ReviewEntity[];
}
