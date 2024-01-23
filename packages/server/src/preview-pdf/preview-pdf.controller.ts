import { Controller, Get, Req, Res } from '@nestjs/common';
import { PreviewPdfService } from './preview-pdf.service';
import { Response, Request } from 'express';

@Controller('preview-pdf')
export class PreviewPdfController {
  constructor(private readonly previewPdfService: PreviewPdfService) {}

  @Get()
  getPdfStream(@Req() req: Request, @Res() res: Response) {
    return this.previewPdfService.getPdfStream(res, req);
  }
}
