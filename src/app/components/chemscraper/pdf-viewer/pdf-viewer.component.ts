import { Component, Input } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

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
  constructor(){}

  ngOnInit(){
    var loadingTask = pdfjsLib.getDocument(this.pdfUrl);
    loadingTask.promise.then((pdf) =>{
      console.log('PDF loaded');

      var pageNumber = 2;
      pdf.getPage(pageNumber).then((page) => {
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


            // context!.beginPath();
            // context!.rect(box.x, box.y, box.width, box.height);
            // context!.fillStyle = "rgba(30, 169, 124, 0.5)";
            // context!.fill();
          });

        });
      });
    }, function (reason) {
      // PDF loading error
      console.error(reason);
    });
  }
}
