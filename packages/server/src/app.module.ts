import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PreviewPdfModule } from './preview-pdf/preview-pdf.module';

@Module({
  imports: [PreviewPdfModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
