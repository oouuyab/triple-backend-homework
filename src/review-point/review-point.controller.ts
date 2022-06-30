import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ReviewPointResDto } from './dto/point.dto';
import { ReviewPointService } from './review-point.service';

@Controller('/review-point')
export class ReviewPointController {
  constructor(private readonly reviewPointService: ReviewPointService) {}
  @Get(':userId')
  async getPoint(@Param('userId', new ParseUUIDPipe()) userId: string): Promise<ReviewPointResDto> {
    return await this.reviewPointService.getPointByUserId(userId);
  }
}
