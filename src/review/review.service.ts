import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { ReviewReqDto } from './dto/review.dto';
import { ERR_MSG } from 'src/common/errorMsg';
import { ReviewPointDtlInterface } from 'src/review/interface/review-point-dtl.interface';
import { PointType } from 'src/common/enum';
import { ReviewEntity } from './entities/review.entity';
import { AttachPhotoEntity } from './entities/attach-photo.entity';
import { ReviewPointDtlEntity } from './entities/review-point-dtl.entity';
import { UserEntity } from './entities/user.entity';
import { PlaceEntity } from './entities/place.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewPointMstEntity } from './entities/review-point-mst.entity';

@Injectable()
export class ReviewService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ReviewEntity)
    private reviewEntity: Repository<ReviewEntity>,
    @InjectRepository(AttachPhotoEntity)
    private attachPhotoEntity: Repository<AttachPhotoEntity>,
    @InjectRepository(ReviewPointDtlEntity)
    private reviewPointDtlEntity: Repository<ReviewPointDtlEntity>,
    @InjectRepository(UserEntity)
    private userEntity: Repository<UserEntity>,
    @InjectRepository(PlaceEntity)
    private placeEntity: Repository<PlaceEntity>,
  ) {}

  async postReview(review: ReviewReqDto): Promise<void> {
    if (review.action === 'ADD') {
      await this.addReview(review);
    } else if (review.action === 'MOD') {
      await this.modReview(review);
    } else if (review.action === 'DELETE') {
      await this.deleteReview(review);
    }
  }

  private async addReview(review: ReviewReqDto): Promise<void> {
    await this.checkReviewValidation(review);
    await this.dataSource.transaction(async (manager) => {
      try {
        const newReviewPointDtl: Pick<
          ReviewPointDtlInterface,
          'reviewPointMstId' | 'reviewId' | 'pointType' | 'pointAmt'
        >[] = [];

        // * 리뷰 생성
        await manager
          .createQueryBuilder()
          .insert()
          .into(ReviewEntity)
          .values({
            reviewId: review.reviewId,
            userId: review.userId,
            placeId: review.placeId,
            content: review.content,
          })
          .execute();

        // * 사진 첨부
        const attachPhotoList = review.attachedPhotoIds.map((attachPhotoId) => {
          return {
            attachPhotoId: attachPhotoId,
            reviewId: review.reviewId,
            isDel: false,
          };
        });

        await manager
          .createQueryBuilder()
          .insert()
          .into(AttachPhotoEntity)
          .values(attachPhotoList)
          .execute();

        // * 리뷰 표인트 조회 및 생성
        let reviewPointMst = await manager.findOne(ReviewPointMstEntity, {
          where: { userId: review.userId },
        });

        if (!reviewPointMst) {
          const reviewPointMstInfo = new ReviewPointMstEntity();
          reviewPointMstInfo.userId = review.userId;

          reviewPointMst = await manager.save(reviewPointMstInfo);
        }

        if (review.content.length > 0) {
          newReviewPointDtl.push({
            reviewPointMstId: reviewPointMst.reviewPointMstId,
            reviewId: review.reviewId,
            pointType: PointType.TEXT_POINT,
            pointAmt: 1,
          });
        }

        if (review.attachedPhotoIds.length > 0) {
          newReviewPointDtl.push({
            reviewPointMstId: reviewPointMst.reviewPointMstId,
            reviewId: review.reviewId,
            pointType: PointType.PHOTO_POINT,
            pointAmt: 1,
          });
        }

        const placeReviewCnt = await manager
          .createQueryBuilder(ReviewEntity, 'review')
          .where('review.placeId = :placeId', { placeId: review.placeId })
          .andWhere('review.isDel = :isDel', { isDel: false })
          .andWhere('review.reviewId != :reviewId', { reviewId: review.reviewId })
          .getCount();

        if (placeReviewCnt === 0) {
          newReviewPointDtl.push({
            reviewPointMstId: reviewPointMst.reviewPointMstId,
            reviewId: review.reviewId,
            pointType: PointType.PLACE_FIRST_POINT,
            pointAmt: 1,
          });
        }

        // * 포인트 처리
        await manager
          .createQueryBuilder()
          .insert()
          .into(ReviewPointDtlEntity)
          .values(newReviewPointDtl)
          .execute();

        // * 포인트 조회
        const reviewPointData = await manager
          .createQueryBuilder(ReviewPointDtlEntity, 'reviewPointDtl')
          .select('SUM(reviewPointDtl.pointAmt)', 'totalPointAmt')
          .where('reviewPointDtl.reviewPointMstId = :reviewPointMstId', {
            reviewPointMstId: reviewPointMst.reviewPointMstId,
          })
          .getRawOne();

        // * 포인트 업데이트
        await manager
          .createQueryBuilder()
          .update(ReviewPointMstEntity)
          .set({
            totalPointAmt: reviewPointData.totalPointAmt,
          })
          .where('userId = :userId', { userId: review.userId })
          .execute();
      } catch (err) {
        throw new BadRequestException(ERR_MSG.FAIL_ADD_REVIEW);
      }
    });
  }
  private async modReview(review: ReviewReqDto): Promise<void> {
    await this.checkReviewValidation(review);

    await this.dataSource.transaction(async (manager) => {
      try {
        const newReviewPointDtl: Pick<
          ReviewPointDtlInterface,
          'reviewPointMstId' | 'reviewId' | 'pointType' | 'pointAmt'
        >[] = [];

        const beforeReview = await manager.findOne(ReviewEntity, {
          where: { reviewId: review.reviewId },
          relations: ['attachPhotoList'],
        });

        const reviewPointMst = await manager.findOne(ReviewPointMstEntity, {
          where: { userId: review.userId },
        });

        if (beforeReview.content !== review.content) {
          if (beforeReview.content.length === 0 && review.content.length > 0) {
            newReviewPointDtl.push({
              reviewPointMstId: reviewPointMst.reviewPointMstId,
              reviewId: review.reviewId,
              pointType: PointType.TEXT_POINT,
              pointAmt: 1,
            });
          }

          if (beforeReview.content.length !== 0 && review.content.length === 0) {
            newReviewPointDtl.push({
              reviewPointMstId: reviewPointMst.reviewPointMstId,
              reviewId: review.reviewId,
              pointType: PointType.TEXT_POINT,
              pointAmt: -1,
            });
          }
        }

        const normalAttachPhotoList = beforeReview.attachPhotoList.filter(
          (attachPhoto) => attachPhoto.isDel === false,
        );
        if (normalAttachPhotoList.length === 0 && review.attachedPhotoIds.length > 0) {
          newReviewPointDtl.push({
            reviewPointMstId: reviewPointMst.reviewPointMstId,
            reviewId: review.reviewId,
            pointType: PointType.PHOTO_POINT,
            pointAmt: 1,
          });
        }

        if (normalAttachPhotoList.length > 0 && review.attachedPhotoIds.length === 0) {
          newReviewPointDtl.push({
            reviewPointMstId: reviewPointMst.reviewPointMstId,
            reviewId: review.reviewId,
            pointType: PointType.PHOTO_POINT,
            pointAmt: -1,
          });
        }

        await manager
          .createQueryBuilder()
          .update(ReviewEntity)
          .set({ content: review.content })
          .where('reviewId = :reviewId', { reviewId: review.reviewId })
          .execute();

        // * attachPhoto 삭제
        const beforeAttachPhotoIds = beforeReview.attachPhotoList.map(
          (attachPhotoInfo) => attachPhotoInfo.attachPhotoId,
        );
        const deletedAttachPhotoIds = beforeAttachPhotoIds.filter(
          (id) => !review.attachedPhotoIds.includes(id),
        );
        if (deletedAttachPhotoIds.length > 0) {
          await manager
            .createQueryBuilder()
            .update(AttachPhotoEntity)
            .set({
              isDel: true,
            })
            .where('attachPhotoId IN (:attachPhotoIdList)', {
              attachPhotoIdList: deletedAttachPhotoIds,
            })
            .execute();
        }

        // * attachPhoto 추가
        const newAttachPhotoList = review.attachedPhotoIds
          .filter((id) => !beforeAttachPhotoIds.includes(id))
          .map((id) => {
            return {
              attachPhotoId: id,
              reviewId: review.reviewId,
            };
          });
        if (newAttachPhotoList.length > 0) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(AttachPhotoEntity)
            .values(newAttachPhotoList)
            .execute();
        }

        // * 포인트 디테일 업데이트
        await manager
          .createQueryBuilder()
          .insert()
          .into(ReviewPointDtlEntity)
          .values(newReviewPointDtl)
          .execute();

        // * 포인트 마스터 업데이트
        const reviewPointData = await manager
          .createQueryBuilder(ReviewPointDtlEntity, 'reviewPointDtl')
          .select('SUM(reviewPointDtl.pointAmt)', 'totalPointAmt')
          .where('reviewPointDtl.reviewPointMstId = :reviewPointMstId', {
            reviewPointMstId: reviewPointMst.reviewPointMstId,
          })
          .getRawOne();

        if (reviewPointData.totalPointAmt < 0) {
          throw new BadRequestException(ERR_MSG.WRONG_POINT_NEGATIVE);
        }

        // * 포인트 업데이트
        await manager
          .createQueryBuilder()
          .update(ReviewPointMstEntity)
          .set({
            totalPointAmt: reviewPointData.totalPointAmt,
          })
          .where('userId = :userId', { userId: review.userId })
          .execute();
      } catch (err) {
        console.log(err.stack);
        throw new BadRequestException(ERR_MSG.FAIL_MOD_REVIEW);
      }
    });
  }

  private async deleteReview(review: ReviewReqDto): Promise<void> {
    await this.checkReviewValidation(review);

    await this.dataSource.transaction(async (manager) => {
      try {
        const newReviewPointDtl: Pick<
          ReviewPointDtlInterface,
          'reviewPointMstId' | 'reviewId' | 'pointType' | 'pointAmt'
        >[] = [];

        const beforeReview = await manager.findOne(ReviewEntity, {
          where: { reviewId: review.reviewId },
          relations: ['attachPhotoList', 'reviewPointDtlList'],
        });

        const reviewPointMst = await manager.findOne(ReviewPointMstEntity, {
          where: { userId: review.userId },
        });

        if (beforeReview.content.length > 0) {
          newReviewPointDtl.push({
            reviewPointMstId: reviewPointMst.reviewPointMstId,
            reviewId: review.reviewId,
            pointType: PointType.TEXT_POINT,
            pointAmt: -1,
          });
        }

        const normalAttachPhotoIdList = beforeReview.attachPhotoList
          .filter((attachPhoto) => attachPhoto.isDel === false)
          .map((attachPhoto) => attachPhoto.attachPhotoId);
        if (normalAttachPhotoIdList.length > 0) {
          newReviewPointDtl.push({
            reviewPointMstId: reviewPointMst.reviewPointMstId,
            reviewId: review.reviewId,
            pointType: PointType.PHOTO_POINT,
            pointAmt: -1,
          });
        }

        const firstReviewPointSum = beforeReview.reviewPointDtlList.reduce(
          (acc, reviewPointDtl) =>
            reviewPointDtl.pointType === PointType.PLACE_FIRST_POINT
              ? acc + +reviewPointDtl.pointAmt
              : acc,
          0,
        );

        if (firstReviewPointSum === 1) {
          newReviewPointDtl.push({
            reviewPointMstId: reviewPointMst.reviewPointMstId,
            reviewId: review.reviewId,
            pointType: PointType.PLACE_FIRST_POINT,
            pointAmt: -1,
          });
        }

        await manager
          .createQueryBuilder()
          .update(ReviewEntity)
          .set({ isDel: true })
          .where('reviewId = :reviewId', { reviewId: review.reviewId })
          .execute();

        if (normalAttachPhotoIdList.length > 0) {
          await manager
            .createQueryBuilder()
            .update(AttachPhotoEntity)
            .set({ isDel: true })
            .where('attachPhotoId IN (:attachPhotoId)', { attachPhotoId: normalAttachPhotoIdList })
            .execute();
        }

        // * 포인트 디테일 업데이트
        await manager
          .createQueryBuilder()
          .insert()
          .into(ReviewPointDtlEntity)
          .values(newReviewPointDtl)
          .execute();

        // * 포인트 마스터 업데이트
        const reviewPointData = await manager
          .createQueryBuilder(ReviewPointDtlEntity, 'reviewPointDtl')
          .select('SUM(reviewPointDtl.pointAmt)', 'totalPointAmt')
          .where('reviewPointDtl.reviewPointMstId = :reviewPointMstId', {
            reviewPointMstId: reviewPointMst.reviewPointMstId,
          })
          .getRawOne();

        // * 포인트 업데이트
        await manager
          .createQueryBuilder()
          .update(ReviewPointMstEntity)
          .set({
            totalPointAmt: reviewPointData.totalPointAmt,
          })
          .where('userId = :userId', { userId: review.userId })
          .execute();
      } catch (err) {
        throw new BadRequestException(ERR_MSG.FAIL_DELETE_REVIEW);
      }
    });
  }

  private async checkReviewValidation(review: ReviewReqDto): Promise<void> {
    // * 유저가 존재하는지 체크
    const userInfo = await this.userEntity.findOne({ where: { userId: review.userId } });
    if (!userInfo) {
      throw new BadRequestException(ERR_MSG.NOT_FOUND_USER);
    }
    if (review.action === 'ADD') {
      // * 이미 작성한 리뷰가 있는지 체크
      const reviewInfo = await this.reviewEntity.findOne({
        where: { userId: review.userId, placeId: review.placeId, isDel: false },
      });
      if (reviewInfo) {
        throw new BadRequestException(ERR_MSG.ALREADY_WRITE_REVIEW);
      }

      // * 장소가 존재하는지 체크
      const placeInfo = await this.placeEntity.findOne({ where: { placeId: review.placeId } });
      if (!placeInfo) {
        throw new BadRequestException(ERR_MSG.NOT_FOUND_PLACE);
      }

      // * 사진 id가 중복되는지 체크
      const attachPhotoList = await this.attachPhotoEntity.find({
        where: { attachPhotoId: In(review.attachedPhotoIds) },
      });
      if (attachPhotoList.length > 0) {
        throw new BadRequestException(ERR_MSG.ALREADY_EXIST_ATTACH_PHOTO_ID);
      }

      // * 해당 리뷰로 적립된 포인트 정보가 있는지 체크
      const reviewPointDtlList = await this.reviewPointDtlEntity.find({
        where: { reviewId: review.reviewId },
      });
      if (reviewPointDtlList.length > 0) {
        throw new BadRequestException(ERR_MSG.ALREADY_CREATED_REVIEW_POINT_DTL);
      }
    } else if (review.action === 'MOD' || review.action === 'DELETE') {
      // * 리뷰가 존재하는지 체크, 삭제된 리뷰인지 체크, 유저 정보와 장소 정보 체크
      const reviewInfo = await this.reviewEntity.findOne({ where: { reviewId: review.reviewId } });
      if (!reviewInfo) {
        throw new BadRequestException(ERR_MSG.NOT_FOUND_REVIEW);
      }
      if (reviewInfo.isDel) {
        throw new BadRequestException(ERR_MSG.ALREADY_DELETED_REVIEW);
      }
      if (reviewInfo.userId !== review.userId) {
        throw new BadRequestException(ERR_MSG.WRONG_USER_ID);
      }
      if (reviewInfo.placeId !== review.placeId) {
        throw new BadRequestException(ERR_MSG.WRONG_PLACE_ID);
      }

      if (review.action === 'MOD') {
        // * 삭제된 사진 id에 접근하는 경우
        const deletedAttachPhotoIds = await this.attachPhotoEntity.find({
          where: {
            isDel: true,
            reviewId: review.reviewId,
            attachPhotoId: In(review.attachedPhotoIds),
          },
        });
        if (deletedAttachPhotoIds.length > 0) {
          throw new BadRequestException(ERR_MSG.ALREADY_DELETED_ATTACH_PHOTO_ID);
        }
      }
    }
  }
}
