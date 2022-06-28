import { ReviewPointMstEntity } from 'src/review/entities/review-point-mst.entity';
import { ReviewEntity } from 'src/review/entities/review.entity';
import { CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { UserInterface } from '../interface/user.interface';

@Entity('tb_user')
export class UserEntity implements UserInterface {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'reg_date' })
  regDate: Date;

  @OneToMany(() => ReviewEntity, (_) => _.user)
  reviewList: ReviewEntity[];

  @OneToOne(() => ReviewPointMstEntity, (_) => _.user)
  @JoinColumn({ name: 'user_id' })
  reviewPointMst;
}
