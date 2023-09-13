import { Component } from '@angular/core';
import { FormControl, FormGroup } from "@angular/forms";

@Component({
  selector: 'app-molecule-drawing-canvas',
  templateUrl: './molecule-drawing-canvas.component.html',
  styleUrls: ['./molecule-drawing-canvas.component.scss']
})
export class MoleculeDrawingCanvasComponent {

  DEBUG = false;
  showControls = false;
  benzene: string = '\n' +
    '  MJ212000                      \n' +
    '\n' +
    '  8  8  0  0  0  0  0  0  0  0999 V2000\n' +
    '   -4.9218   -0.0455    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
    '   -5.6363   -0.4580    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
    '   -5.6363   -1.2831    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
    '   -4.9218   -1.6955    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
    '   -4.2073   -1.2831    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
    '   -4.2073   -0.4580    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
    '   -4.9218    0.7794    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
    '   -5.6363    1.1919    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n' +
    '  1  2  1  0  0  0  0\n' +
    '  1  6  1  0  0  0  0\n' +
    '  2  3  1  0  0  0  0\n' +
    '  3  4  1  0  0  0  0\n' +
    '  4  5  1  0  0  0  0\n' +
    '  5  6  1  0  0  0  0\n' +
    '  1  7  1  0  0  0  0\n' +
    '  7  8  1  0  0  0  0\n' +
    'M  END\n'

  formGroup: FormGroup;

  constructor() {
    this.formGroup = new FormGroup({
      structure: new FormControl(this.benzene)
    });
  }
}
