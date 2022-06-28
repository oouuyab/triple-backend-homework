import { Controller, Get, Query } from '@nestjs/common';
import { ReviewPointResDto } from './dto/point.dto';
import { ReviewPointService } from './review-point.service';

@Controller('/review-point')
export class ReviewPointController {
  constructor(private readonly reviewPointService: ReviewPointService) {}
  @Get()
  async getPoint(@Query('user-id') userId: string): Promise<ReviewPointResDto> {
    return await this.reviewPointService.getPointByUserId(userId);
  }
}
