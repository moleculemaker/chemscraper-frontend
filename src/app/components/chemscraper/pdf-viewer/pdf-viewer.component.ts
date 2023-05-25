import { Component, Input } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

@Component({
  selector: 'chemscraper-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent {

  pdfUrl: String = '../../../assets/or100.09.tables.pdf';
  boxCoordinates = [
    { x: 200, y: 200, width: 200, height: 50 },
    // Add more box coordinates as needed
  ];
  pdf: PDFDocumentProxy;
  totalPages: number = 0;
  pageNumber: number = 1;
  pageRendering: boolean = false;
  pageNumPending: number = -1;
  constructor(){}

  ngOnInit(){
    var loadingTask = pdfjsLib.getDocument(this.pdfUrl);
    loadingTask.promise.then((pdf) =>{
      this.pdf = pdf;
      this.totalPages = pdf.numPages;
      console.log('PDF loaded');
      if(this.totalPages > 0){
        this.renderPage(this.pageNumber);
      }
    }, function (reason) {
      // PDF loading error
      console.error(reason);
    });
  }

  renderPage(pageNumber: number) {
    this.pageRendering = true;
    this.pdf.getPage(pageNumber).then((page) => {
      console.log('Page loaded');

      var scale = 1.5;
      var viewport = page.getViewport({scale: scale});

      // Prepare canvas using PDF page dimensions
      var canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      var context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: context!,
        viewport: viewport
      };
      var renderTask = page.render(renderContext);
      renderTask.promise.then( () => {
        console.log('Page rendered');
        this.pageRendering = false;

        this.boxCoordinates.forEach(function (box) {
          const cornerRadius = 5;
          if(context){
            context.beginPath();
            context.moveTo(box.x + cornerRadius, box.y);
            context.lineTo(box.x + box.width - cornerRadius, box.y);
            context.arcTo(box.x + box.width, box.y, box.x + box.width, box.y + cornerRadius, cornerRadius);
            context.lineTo(box.x + box.width, box.y + box.height - cornerRadius);
            context.arcTo(box.x + box.width, box.y + box.height, box.x + box.width - cornerRadius, box.y + box.height, cornerRadius);
            context.lineTo(box.x + cornerRadius, box.y + box.height);
            context.arcTo(box.x, box.y + box.height, box.x, box.y + box.height - cornerRadius, cornerRadius);
            context.lineTo(box.x, box.y + cornerRadius);
            context.arcTo(box.x, box.y, box.x + cornerRadius, box.y, cornerRadius);
            context.closePath();
            context.fillStyle = "rgba(228, 248, 240, 0.5)";
            context.strokeStyle = 'rgba(30, 169, 124, 1)';
            context.fill();
            context.stroke();

          }
        });
        if (this.pageNumPending !== -1) {
          this.renderPage(this.pageNumPending);
          this.pageNumPending = -1;
        }

      });
    });
  }

  queueRenderPage(num: number) {
    if (this.pageRendering) {
      this.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  }

  onPrevPage() {
    if (this.pageNumber <= 1) {
      return;
    }
    this.pageNumber--;
    this.queueRenderPage(this.pageNumber);
  }

  onNextPage() {
    if (this.pageNumber >= this.totalPages) {
      return;
    }
    this.pageNumber++;
    this.queueRenderPage(this.pageNumber);
  }
}
