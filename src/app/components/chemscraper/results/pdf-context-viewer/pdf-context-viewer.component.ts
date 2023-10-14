import { Component, ElementRef, Input, ViewChild, AfterViewInit} from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

@Component({
  selector: 'chemscraper-pdf-context-viewer',
  templateUrl: './pdf-context-viewer.component.html',
  styleUrls: ['./pdf-context-viewer.component.scss']
})
export class PdfContextViewerComponent implements AfterViewInit{

  @Input()
  pdfUrl: String = "";

  @Input()
  startX: number = 0;

  @Input()
  startY: number = 0;

  @Input()
  width: number = 0;

  @Input()
  height: number = 0;

  @Input()
  pageNumber: string = "1";


  @ViewChild('pdfContextViewerCanvas') pdfContextViewerCanvas: ElementRef;

  pdfDoc: PDFDocumentProxy;
  boxPadding: number = 5;

  ngAfterViewInit(){
    let loadingTask = pdfjsLib.getDocument(this.pdfUrl);

    loadingTask.promise
    .then(pdfDoc => {
      // Load the first page
      this.pdfDoc = pdfDoc;
      const totalPages = pdfDoc.numPages;
      const page_no = parseInt(this.pageNumber);

      if (this.pageNumber && page_no >= 1 && page_no <= totalPages) {
        // Request the specified page
        this.renderPage(page_no);
      }
    })
    .catch(error => {
      console.error('Error loading PDF:', error);
    });

  }

  renderPage(page_no: number) {
    this.pdfDoc.getPage(page_no).then((page) => {

      const originX = page.view[0];
      const originY = page.view[1];
      const canvas = this.pdfContextViewerCanvas.nativeElement as HTMLCanvasElement;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(viewport.width / this.width, viewport.height / this.height);

      let boxX = scale * (this.startX * 72.0) / 300 - originX - this.boxPadding;
      let boxY = scale * (this.startY * 72.0) / 300 - originY - this.boxPadding;
      boxX = boxX ? boxX : 0;
      boxY = boxY ? boxY : 0;
      let boxWidth = scale * (this.width * 72.0) / 300 + ( 2 * this.boxPadding );
      let boxHeight = scale * (this.height * 72.0) / 300 + ( 2 * this.boxPadding );

      canvas.width = boxWidth;
      canvas.height = boxHeight;

      viewport.transform = [scale, 0, 0, -scale, -1 * boxX, scale*(viewport.height) - boxY];


      const renderContext = {
        canvasContext: context!,
        viewport: viewport,
      };

      page.render(renderContext);
    });


  }

}
