import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ReviewReqDto } from './dto/review.dto';
import { ERR_MSG } from '../common/error-msg';
import { ReviewPointDtlInterface } from '../review/interface/review-point-dtl.interface';
import { PointType } from '../common/enum';
import { ReviewEntity } from './entities/review.entity';
import { AttachPhotoEntity } from './entities/attach-photo.entity';
import { ReviewPointDtlEntity } from './entities/review-point-dtl.entity';
import { UserEntity } from './entities/user.entity';
import { PlaceEntity } from './entities/place.entity';
import { ReviewPointMstEntity } from './entities/review-point-mst.entity';
import { ReviewInterface } from './interface/review.interface';
import { AttachPhotoInterface } from './interface/attach-photo.interface';
import { ReviewPointMstInterface } from './interface/review-point-mst.interface';
import { UserInterface } from './interface/user.interface';

@Injectable()
export class ReviewService {
  constructor(private dataSource: DataSource) {}

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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const manager = queryRunner.manager;

    await this.checkReviewValidation(review, manager);

    try {
      const newReviewPointDtl: Pick<
        ReviewPointDtlInterface,
        'reviewPointMstId' | 'reviewId' | 'pointType' | 'pointAmt'
      >[] = [];

      // * 리뷰 생성
      await this.createReview(
        {
          reviewId: review.reviewId,
          userId: review.userId,
          placeId: review.placeId,
          content: review.content,
        },
        manager,
      );

      // * 사진 첨부
      const attachPhotoList = review.attachedPhotoIds.map((attachPhotoId) => {
        return {
          attachPhotoId: attachPhotoId,
          reviewId: review.reviewId,
        };
      });

      await this.createAttachPhoto(attachPhotoList, manager);

      // * 리뷰 표인트 조회 및 생성
      let reviewPointMst = await this.getReviewPointMstByUserId({ userId: review.userId }, manager);

      if (!reviewPointMst) {
        reviewPointMst = await this.createReviewPointMst({ userId: review.userId }, manager);
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

      const placeReviewCnt = await this.getPlaceReviewCntExcludeSelfByPlaceId(
        { placeId: review.placeId, isDel: false, reviewId: review.reviewId },
        manager,
      );

      if (placeReviewCnt === 0) {
        newReviewPointDtl.push({
          reviewPointMstId: reviewPointMst.reviewPointMstId,
          reviewId: review.reviewId,
          pointType: PointType.PLACE_FIRST_POINT,
          pointAmt: 1,
        });
      }

      // * 포인트 처리
      await this.createReviewPointDtl(newReviewPointDtl, manager);

      // * 포인트 조회
      const reviewPointSum = await this.getReviewPointSum(
        { reviewPointMstId: reviewPointMst.reviewPointMstId },
        manager,
      );

      // * 포인트 업데이트
      await this.updateTotalPointAmt(
        { userId: review.userId, totalPointAmt: reviewPointSum },
        manager,
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(ERR_MSG.FAIL_ADD_REVIEW);
    } finally {
      queryRunner.release();
    }
  }
  private async modReview(review: ReviewReqDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const manager = queryRunner.manager;

    await this.checkReviewValidation(review, manager);

    try {
      const newReviewPointDtl: Pick<
        ReviewPointDtlInterface,
        'reviewPointMstId' | 'reviewId' | 'pointType' | 'pointAmt'
      >[] = [];

      const beforeReview = await this.getReviewWithAttachPhotoListByReviewId(
        { reviewId: review.reviewId },
        manager,
      );

      const reviewPointMst = await this.getReviewPointMstByUserId(
        { userId: review.userId },
        manager,
      );

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

      await this.updateReviewContent(
        { reviewId: review.reviewId, content: review.content },
        manager,
      );

      // * attachPhoto 삭제
      const beforeAttachPhotoIds = beforeReview.attachPhotoList.map(
        (attachPhotoInfo) => attachPhotoInfo.attachPhotoId,
      );
      const deletedAttachPhotoIds = beforeAttachPhotoIds
        .filter((id) => !review.attachedPhotoIds.includes(id))
        .map((attachPhotoId) => {
          return { attachPhotoId };
        });

      if (deletedAttachPhotoIds.length > 0) {
        await this.upDeleteAttachPhoto(deletedAttachPhotoIds, manager);
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
        await this.createAttachPhoto(newAttachPhotoList, manager);
      }

      // * 포인트 처리
      await this.createReviewPointDtl(newReviewPointDtl, manager);

      // * 포인트 조회
      const reviewPointSum = await this.getReviewPointSum(
        { reviewPointMstId: reviewPointMst.reviewPointMstId },
        manager,
      );

      // * 포인트 업데이트
      await this.updateTotalPointAmt(
        { userId: review.userId, totalPointAmt: reviewPointSum },
        manager,
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(ERR_MSG.FAIL_MOD_REVIEW);
    } finally {
      await queryRunner.release();
    }
  }

  private async deleteReview(review: ReviewReqDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const manager = queryRunner.manager;

    await this.checkReviewValidation(review, manager);

    try {
      const newReviewPointDtl: Pick<
        ReviewPointDtlInterface,
        'reviewPointMstId' | 'reviewId' | 'pointType' | 'pointAmt'
      >[] = [];

      const beforeReview = await this.getReviewWithAttachPhotoListAndReviewPointDtlListByReviewId(
        { reviewId: review.reviewId },
        manager,
      );

      const reviewPointMst = await this.getReviewPointMstByUserId(
        { userId: review.userId },
        manager,
      );

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
        .map((attachPhoto) => {
          return { attachPhotoId: attachPhoto.attachPhotoId };
        });
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

      await this.upDeleteReview({ reviewId: review.reviewId }, manager);

      if (normalAttachPhotoIdList.length > 0) {
        await this.upDeleteAttachPhoto(normalAttachPhotoIdList, manager);
      }

      // * 포인트 처리
      await this.createReviewPointDtl(newReviewPointDtl, manager);

      // * 포인트 조회
      const reviewPointSum = await this.getReviewPointSum(
        { reviewPointMstId: reviewPointMst.reviewPointMstId },
        manager,
      );

      // * 포인트 업데이트
      await this.updateTotalPointAmt(
        { userId: review.userId, totalPointAmt: reviewPointSum },
        manager,
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(ERR_MSG.FAIL_DELETE_REVIEW);
    } finally {
      await queryRunner.release();
    }
  }

  private async checkReviewValidation(review: ReviewReqDto, manager: EntityManager): Promise<void> {
    // * 유저가 존재하는지 체크
    const userInfo = await this.getUserByUserId({ userId: review.userId }, manager);
    if (!userInfo) {
      throw new BadRequestException(ERR_MSG.NOT_FOUND_USER);
    }
    if (review.action === 'ADD') {
      // * 이미 작성한 리뷰가 있는지 체크
      const reviewInfo = await this.getReviewByUserIdAndPlaceId(
        { userId: review.userId, placeId: review.placeId },
        manager,
      );
      if (reviewInfo) {
        throw new BadRequestException(ERR_MSG.ALREADY_WRITE_REVIEW);
      }

      // * 장소가 존재하는지 체크
      const placeInfo = await this.getPlaceByPlaceId({ placeId: review.placeId }, manager);
      if (!placeInfo) {
        throw new BadRequestException(ERR_MSG.NOT_FOUND_PLACE);
      }

      // * 사진 id가 중복되는지 체크
      const attachPhotoData = review.attachedPhotoIds.map((attachPhotoId) => {
        return { attachPhotoId };
      });
      const attachPhotoList = await this.getAttachPhotoListByAttachPhotoIdList(
        attachPhotoData,
        manager,
      );
      if (attachPhotoList.length > 0) {
        throw new BadRequestException(ERR_MSG.ALREADY_EXIST_ATTACH_PHOTO_ID);
      }

      // * 해당 리뷰로 적립된 포인트 정보가 있는지 체크
      const reviewPointDtlList = await this.getReviewPointDtlByReviewId(
        { reviewId: review.reviewId },
        manager,
      );
      if (reviewPointDtlList.length > 0) {
        throw new BadRequestException(ERR_MSG.ALREADY_CREATED_REVIEW_POINT_DTL);
      }
    } else if (review.action === 'MOD' || review.action === 'DELETE') {
      // * 리뷰가 존재하는지 체크, 삭제된 리뷰인지 체크, 유저 정보와 장소 정보 체크
      const reviewInfo = await this.getReviewByReviewId({ reviewId: review.reviewId }, manager);
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

      const reviewPointMst = await this.getReviewPointMstByUserId(
        { userId: review.userId },
        manager,
      );
      if (!reviewPointMst) {
        throw new BadRequestException(ERR_MSG.NOT_FOUND_REVIEW_POINT_MST);
      }

      if (review.action === 'MOD' && review.attachedPhotoIds.length > 0) {
        // * 삭제된 사진 id에 접근하는 경우
        const deletedAttachPhotoData = review.attachedPhotoIds.map((attachPhotoId) => {
          return {
            attachPhotoId,
            reviewId: review.reviewId,
          };
        });
        const deletedAttachPhotoIds = await this.getDeletedAttachPhotoListByAttachPhotoIdList(
          deletedAttachPhotoData,
          manager,
        );
        if (deletedAttachPhotoIds.length > 0) {
          throw new BadRequestException(ERR_MSG.ALREADY_DELETED_ATTACH_PHOTO_ID);
        }
      }
    }
  }

  // * user data method
  private async getUserByUserId(
    data: Pick<UserInterface, 'userId'>,
    manager: EntityManager,
  ): Promise<UserEntity> {
    return await manager.findOne(UserEntity, { where: data });
  }

  // * place data method
  private async getPlaceByPlaceId(
    data: Pick<PlaceEntity, 'placeId'>,
    manager: EntityManager,
  ): Promise<PlaceEntity> {
    return await manager.findOne(PlaceEntity, { where: data });
  }

  // * review data method
  private async getReviewByReviewId(
    data: Pick<ReviewEntity, 'reviewId'>,
    manager: EntityManager,
  ): Promise<ReviewEntity> {
    return await manager.findOne(ReviewEntity, { where: data });
  }
  private async getReviewByUserIdAndPlaceId(
    data: Pick<ReviewInterface, 'userId' | 'placeId'>,
    manager: EntityManager,
  ): Promise<ReviewEntity> {
    return await manager.findOne(ReviewEntity, {
      where: { ...data, isDel: false },
    });
  }
  private async getReviewWithAttachPhotoListByReviewId(
    data: Pick<ReviewInterface, 'reviewId'>,
    manager: EntityManager,
  ): Promise<ReviewEntity> {
    return await manager.findOne(ReviewEntity, {
      where: data,
      relations: ['attachPhotoList'],
    });
  }

  private async getReviewWithAttachPhotoListAndReviewPointDtlListByReviewId(
    data: Pick<ReviewInterface, 'reviewId'>,
    manager: EntityManager,
  ): Promise<ReviewEntity> {
    return await manager.findOne(ReviewEntity, {
      where: data,
      relations: ['attachPhotoList', 'reviewPointDtlList'],
    });
  }

  private async createReview(
    data: Pick<ReviewInterface, 'reviewId' | 'userId' | 'placeId' | 'content'>,
    manager: EntityManager,
  ): Promise<void> {
    await manager.createQueryBuilder().insert().into(ReviewEntity).values(data).execute();
  }

  private async getPlaceReviewCntExcludeSelfByPlaceId(
    data: Pick<ReviewInterface, 'placeId' | 'isDel' | 'reviewId'>,
    manager: EntityManager,
  ): Promise<number> {
    return await manager
      .createQueryBuilder(ReviewEntity, 'review')
      .where('review.placeId = :placeId', { placeId: data.placeId })
      .andWhere('review.isDel = :isDel', { isDel: data.isDel })
      .andWhere('review.reviewId != :reviewId', { reviewId: data.reviewId })
      .setLock('pessimistic_write')
      .getCount();
  }

  private async updateReviewContent(
    data: Pick<ReviewInterface, 'reviewId' | 'content'>,
    manager,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ReviewEntity)
      .set({ content: data.content })
      .where('reviewId = :reviewId', { reviewId: data.reviewId })
      .execute();
  }

  private async upDeleteReview(data: Pick<ReviewInterface, 'reviewId'>, manager): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ReviewEntity)
      .set({ isDel: true })
      .where('reviewId = :reviewId', { reviewId: data.reviewId })
      .execute();
  }

  // * attach photo method
  private async getAttachPhotoListByAttachPhotoIdList(
    data: Pick<AttachPhotoInterface, 'attachPhotoId'>[],
    manager: EntityManager,
  ): Promise<AttachPhotoEntity[]> {
    const attachPhotoIdList = data.map((el) => el.attachPhotoId);

    return await manager.find(AttachPhotoEntity, {
      where: { attachPhotoId: In(attachPhotoIdList) },
    });
  }

  private async getDeletedAttachPhotoListByAttachPhotoIdList(
    data: Pick<AttachPhotoInterface, 'reviewId' | 'attachPhotoId'>[],
    manager: EntityManager,
  ): Promise<AttachPhotoEntity[]> {
    const attachPhotoIdList = data.map((el) => el.attachPhotoId);

    return await manager.find(AttachPhotoEntity, {
      where: { reviewId: data[0].reviewId, attachPhotoId: In(attachPhotoIdList), isDel: true },
    });
  }
  private async createAttachPhoto(
    data: Pick<AttachPhotoInterface, 'attachPhotoId' | 'reviewId'>[],
    manager: EntityManager,
  ): Promise<void> {
    await manager.createQueryBuilder().insert().into(AttachPhotoEntity).values(data).execute();
  }

  private async upDeleteAttachPhoto(
    data: Pick<AttachPhotoInterface, 'attachPhotoId'>[],
    manager: EntityManager,
  ): Promise<void> {
    const attachPhotoIdList = data.map((el) => el.attachPhotoId);
    await manager
      .createQueryBuilder()
      .update(AttachPhotoEntity)
      .set({ isDel: true })
      .where('attachPhotoId IN (:attachPhotoIdList)', { attachPhotoIdList })
      .execute();
  }

  // * point method
  private async getReviewPointMstByUserId(
    data: Pick<ReviewPointMstInterface, 'userId'>,
    manager: EntityManager,
  ): Promise<ReviewPointMstEntity> {
    return await manager.findOne(ReviewPointMstEntity, { where: data });
  }

  private async getReviewPointDtlByReviewId(
    data: Pick<ReviewPointDtlInterface, 'reviewId'>,
    manager: EntityManager,
  ): Promise<ReviewPointDtlEntity[]> {
    return await manager.find(ReviewPointDtlEntity, { where: data });
  }

  private async createReviewPointMst(
    data: Pick<ReviewPointMstInterface, 'userId'>,
    manager: EntityManager,
  ): Promise<ReviewPointMstEntity> {
    const reviewPointMst = new ReviewPointMstEntity();
    reviewPointMst.userId = data.userId;

    return await manager.save(reviewPointMst);
  }

  private async createReviewPointDtl(
    data: Pick<
      ReviewPointDtlInterface,
      'reviewPointMstId' | 'reviewId' | 'pointType' | 'pointAmt'
    >[],
    manager: EntityManager,
  ): Promise<void> {
    await manager.createQueryBuilder().insert().into(ReviewPointDtlEntity).values(data).execute();
  }

  private async getReviewPointSum(
    data: Pick<ReviewPointDtlInterface, 'reviewPointMstId'>,
    manager,
  ): Promise<number> {
    const queryBuilder = await manager
      .createQueryBuilder(ReviewPointDtlEntity, 'reviewPointDtl')
      .select('SUM(reviewPointDtl.pointAmt)', 'totalPointAmt')
      .where('reviewPointDtl.reviewPointMstId = :reviewPointMstId', data)
      .getRawOne();

    return parseInt(queryBuilder.totalPointAmt);
  }

  private async updateTotalPointAmt(
    data: Pick<ReviewPointMstInterface, 'userId' | 'totalPointAmt'>,
    manager,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ReviewPointMstEntity)
      .set({
        totalPointAmt: data.totalPointAmt,
      })
      .where('userId = :userId', { userId: data.userId })
      .execute();
  }
}
