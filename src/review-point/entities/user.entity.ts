import { CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { UserInterface } from '../interface/user.interface';
import { ReviewPointMstEntity } from './review-point-mst.entity';

@Entity('tb_user')
export class UserEntity implements UserInterface {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'reg_date' })
  regDate: Date;

  @OneToOne(() => ReviewPointMstEntity, (_) => _.user)
  @JoinColumn({ name: 'user_id' })
  reviewPointMst;
}
