// Based on https://burakcanekici.medium.com/uploading-file-with-drag-drop-on-angular-9a42202fe23f
import { Directive, HostListener, HostBinding, Output, EventEmitter, Input } from '@angular/core';

@Directive({
  selector: '[fileDragDrop]'
})

export class FileDragNDropDirective {
  //@Input() private allowed_extensions : Array<string> = ['png', 'jpg', 'bmp'];
  @Output() private filesChangeEmiter : EventEmitter<FileList> = new EventEmitter();
  //@Output() private filesInvalidEmiter : EventEmitter<File[]> = new EventEmitter();
  @HostBinding('style.background') private background = '#eee';
  @HostBinding('style.border') private borderStyle = '2px dashed';
  @HostBinding('style.border-color') private borderColor = '#696D7D';
  @HostBinding('style.border-radius') private borderRadius = '5px';

  constructor() { }

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent){
    evt.preventDefault();
    evt.stopPropagation();
    this.background = 'lightgray';
    this.borderColor = 'cadetblue';
    this.borderStyle = '3px solid';
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt: DragEvent){
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#eee';
    this.borderColor = '#696D7D';
    this.borderStyle = '2px dashed';
  }

  @HostListener('dragenter', ['$event']) public onDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('drop', ['$event']) public onDrop(event: DragEvent){
    event.preventDefault();
    event.stopPropagation();
    this.background = '#eee';
    this.borderColor = '#696D7D';
    this.borderStyle = '2px dashed';
    if (event && event.dataTransfer) {
      let files = event.dataTransfer.files;
      this.filesChangeEmiter.emit(files);

    }

  }
}
