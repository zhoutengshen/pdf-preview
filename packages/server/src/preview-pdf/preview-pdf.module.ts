import { Module } from '@nestjs/common';
import { PreviewPdfService } from './preview-pdf.service';
import { PreviewPdfController } from './preview-pdf.controller';

@Module({
  controllers: [PreviewPdfController],
  providers: [PreviewPdfService],
})
export class PreviewPdfModule {}
