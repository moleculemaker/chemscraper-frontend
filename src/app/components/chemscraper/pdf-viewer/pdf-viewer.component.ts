import { Component, Input } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HighlightBox } from 'src/app/models';

@Component({
  selector: 'chemscraper-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent {
  @Input()
  pdfUrl: String = "";

  @Input()
  highlightBoxes: HighlightBox[][] = [];

  pdf: PDFDocumentProxy;
  totalPages: number = 0;
  pageNumber: number = 1;
  pageRendering: boolean = false;
  pageNumPending: number = -1;
  pdfData: Uint8Array;
  scale: number = 1.4;

  constructor(){}

  ngOnInit(){
    let loadingTask = pdfjsLib.getDocument(this.pdfUrl);

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

      let scale = this.scale;
      let viewport = page.getViewport({scale: scale});

      const originX = page.view[0];
      const originY = page.view[1];

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

        if(this.highlightBoxes && pageNumber < this.highlightBoxes.length){
          this.highlightBoxes[pageNumber].forEach(function (box) {
            let boxX = (box.x * 72.0) / 300 - originX
            let boxY = (box.y * 72.0) / 300 - originY
            let boxWidth = (box.width * 72.0) / 300
            let boxHeight = (box.height * 72.0) / 300
            let scaledBox = {x: scale * boxX, y: scale * boxY, width: scale * boxWidth, height: scale * boxHeight}

            const cornerRadius = scale * 5;
            if(context){
              context.beginPath();
              context.moveTo(scaledBox.x + cornerRadius, scaledBox.y);
              context.lineTo(scaledBox.x + scaledBox.width - cornerRadius, scaledBox.y);
              context.arcTo(scaledBox.x + scaledBox.width, scaledBox.y, scaledBox.x + scaledBox.width, scaledBox.y + cornerRadius, cornerRadius);
              context.lineTo(scaledBox.x + scaledBox.width, scaledBox.y + scaledBox.height - cornerRadius);
              context.arcTo(scaledBox.x + scaledBox.width, scaledBox.y + scaledBox.height, scaledBox.x + scaledBox.width - cornerRadius, scaledBox.y + scaledBox.height, cornerRadius);
              context.lineTo(scaledBox.x + cornerRadius, scaledBox.y + scaledBox.height);
              context.arcTo(scaledBox.x, scaledBox.y + scaledBox.height, scaledBox.x, scaledBox.y + scaledBox.height - cornerRadius, cornerRadius);
              context.lineTo(scaledBox.x, scaledBox.y + cornerRadius);
              context.arcTo(scaledBox.x, scaledBox.y, scaledBox.x + cornerRadius, scaledBox.y, cornerRadius);
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

  zoomIn(){
    this.scale += 0.1;
    this.renderPage(this.pageNumber)
  }

  zoomOut(){
    this.scale -= 0.1;
    this.renderPage(this.pageNumber)
  }
}
