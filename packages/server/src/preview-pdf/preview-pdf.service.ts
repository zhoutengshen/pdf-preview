import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Response, Request } from 'express';

@Injectable()
export class PreviewPdfService {
  getPdfStream(resp: Response, req: Request) {
    // 获取当前系统启动根目录
    try {
      const filename = 'pldi-09.pdf';
      resp.setHeader('Content-Type', 'application/pdf');
      resp.setHeader('Content-Disposition', `inline; filename=${filename}`);
      const rootPath = process.cwd();
      const filePath = path.join(rootPath, 'static', filename);
      const stat = fs.statSync(filePath);
      const corsHeader = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, PUT, POST, DELETE',
        // 关键点：PDFjs 需要访问这个头部信息，对于默认的cors 请求头只能访问七个基本字段：cache-control,content-language,content-type,expires,last-modified,pragma
        'Access-Control-Expose-Headers':
          'Accept-Ranges, Content-Length, Content-Range',
        'Access-Control-Max-Age': '3000',
      };
      if (!req.headers.range) {
        const contentLength = stat.size;
        const stream = fs.createReadStream(filePath);
        resp.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Length': contentLength,
          'Accept-Ranges': 'bytes',
          ...corsHeader,
        });
        stream.pipe(resp);
      } else {
        const [start, end] = req.headers.range
          .split('=')[1]
          .split('-')
          .map((x) => {
            return Number(x);
          });
        const stream = fs.createReadStream(filePath, { start, end });
        resp.writeHead(206, {
          'Content-Type': 'application/pdf',
          'Accept-Ranges': 'bytes',
          ...corsHeader,
        });

        stream.pipe(resp);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
