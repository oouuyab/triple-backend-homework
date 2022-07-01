import { Test, TestingModule } from '@nestjs/testing';
import { ReviewPointController } from './review-point.controller';
import { ReviewPointService } from './review-point.service';

describe('ReviewPointController', () => {
  let controller: ReviewPointController;
  const mockReviewPointService = {
    getPointByUserId: jest.fn((dto) => {
      return {
        userId: '3ede0ef2-92b7-4817-a5f3-0c575361f745',
        totalPointAmt: 1,
      };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewPointController],
      providers: [ReviewPointService],
    })
      .overrideProvider(ReviewPointService)
      .useValue(mockReviewPointService)
      .compile();

    controller = module.get<ReviewPointController>(ReviewPointController);
  });

  describe('getPointByUserId Test', () => {
    it('should be define', () => {
      expect(controller).toBeDefined();
    });

    it('id로 totalPointAmt 조회', async () => {
      const getPoint = await controller.getPoint('3ede0ef2-92b7-4817-a5f3-0c575361f745');

      expect(getPoint).toEqual({
        userId: '3ede0ef2-92b7-4817-a5f3-0c575361f745',
        totalPointAmt: 1,
      });
    });
  });
});
