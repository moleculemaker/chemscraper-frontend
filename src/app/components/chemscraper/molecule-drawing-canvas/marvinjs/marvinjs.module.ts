import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarvinJsEditorComponent } from '.';



@NgModule({
  declarations: [
    MarvinJsEditorComponent
  ],
  exports: [
    MarvinJsEditorComponent
  ],
  imports: [
    CommonModule
  ]
})
export class MarvinJsModule { }
