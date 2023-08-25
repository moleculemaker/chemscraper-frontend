import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTextareaModule } from 'primeng/inputtextarea';

import { MoleculeDrawingCanvasComponent } from './molecule-drawing-canvas.component';

describe('MoleculeDrawingCanvasComponent', () => {
  let component: MoleculeDrawingCanvasComponent;
  let fixture: ComponentFixture<MoleculeDrawingCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ FormsModule, InputTextareaModule ],
      declarations: [ MoleculeDrawingCanvasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoleculeDrawingCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
