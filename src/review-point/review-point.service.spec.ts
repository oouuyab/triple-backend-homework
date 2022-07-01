import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ERR_MSG } from '../common/error-msg';
import { ReviewPointDtlEntity } from './entities/review-point-dtl.entity';
import { ReviewPointMstEntity } from './entities/review.point-mst.entity';
import { UserEntity } from './entities/user.entity';
import { ReviewPointService } from './review-point.service';

describe('ReviewPointService', () => {
  let service: ReviewPointService;
  const mockReviewPointMstRepository = {
    findOne: jest.fn().mockImplementation(async (option) => {
      if (option.where.userId === '3ede0ef2-92b7-4817-a5f3-0c575361f745') {
        return {
          userId: option.where.userId,
          totalPointAmt: 1,
        };
      } else {
        throw new BadRequestException(ERR_MSG.NOT_FOUND_USER);
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewPointService,
        {
          provide: getRepositoryToken(ReviewPointMstEntity),
          useValue: mockReviewPointMstRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewPointService>(ReviewPointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('존재하지 않는 유저 아이디의 경우 에러를 발생합니다.', async () => {
    const emptyUserId = '3ede0ef2-92b7-4817-a5f3-012345678999';

    return expect(service.getPointByUserId(emptyUserId)).rejects.toThrowError(
      new BadRequestException(ERR_MSG.NOT_FOUND_USER),
    );
  });

  it('유저 아이디로 리뷰 포인트 정보를 조회합니다.', async () => {
    const userId = '3ede0ef2-92b7-4817-a5f3-0c575361f745';

    return expect(service.getPointByUserId(userId)).resolves.toEqual({
      userId,
      totalPointAmt: 1,
    });
  });
});
