import { Component, Input } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HighlightBox } from 'src/app/models';

@Component({
  selector: 'chemscraper-pdf-viewer-dialog-service',
  templateUrl: './pdf-viewer-dialog-service.component.html',
  styleUrls: ['./pdf-viewer-dialog-service.component.scss']
})
export class PdfViewerDialogServiceComponent {

  // **Inputs cannot be used with PrimeNG DialogService for overlays**
  @Input()
  highlightBoxes: HighlightBox[][] = [];

  pdf: PDFDocumentProxy;
  totalPages: number = 0;
  pageNumber: number = 1;
  pageRendering: boolean = false;
  pageNumPending: number = -1;
  pdfData: Uint8Array;

  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig){
    this.pdfData = config.data.pdfData;
  }

  ngOnInit(){
    let loadingTask = pdfjsLib.getDocument({data: this.pdfData});

    loadingTask.promise.then((pdf) =>{
      this.pdf = pdf;
      this.totalPages = pdf.numPages;
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

      let scale = 1.5;
      let viewport = page.getViewport({scale: scale});

      // Prepare canvas using PDF page dimensions
      let canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      let context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      let renderContext = {
        canvasContext: context!,
        viewport: viewport
      };
      let renderTask = page.render(renderContext);
      renderTask.promise.then( () => {
        this.pageRendering = false;

        if(pageNumber-1 < this.highlightBoxes.length){
          this.highlightBoxes[pageNumber-1].forEach(function (box) {
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
        }

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

  goToPage(num: number){
    if (this.pageNumber < 1 && this.pageNumber > this.totalPages) {
      return;
    }
    this.pageNumber = num;
    this.queueRenderPage(this.pageNumber);
  }
}
