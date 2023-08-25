import { Component } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ReplaySubject } from "rxjs";
import { MarvinJSUtilInstance, Sketch } from ".";

export type onChangeFunc<T> = (newValue: T) => void;
export type onTouchedFunc = () => void;

declare let MarvinJSUtil: MarvinJSUtilInstance;

@Component({
  selector: 'app-marvin-js-editor',
  template: '<iframe id="sketch" src="/assets/marvin-js/editorws.html" height="100%" width="100%" style="border: 0; padding: 0; margin: 0"></iframe>',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi:true,
      useExisting: MarvinJsEditorComponent
    }
  ]
})
export class MarvinJsEditorComponent implements ControlValueAccessor {
  private sketcherInstance$ = new ReplaySubject<Sketch>(1);

  private onTouched: onTouchedFunc = () => {};
  private onChange: onChangeFunc<string | undefined> = s => {};

  private isTouched = false;

  constructor() {
    this.grabSketcherInstance();
  }

  writeValue(val: string): void {
    this.sketcherInstance$.subscribe(sketcherInstance => {
      if (val) {
        sketcherInstance.importStructure('mol', val).then();
      } else {
        sketcherInstance.clear();
      }
    });
  }

  markAsTouched(): void {
    if (!this.isTouched) {
      this.onTouched();
      this.isTouched = true;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(): void {
    // not supported
  }

  private grabSketcherInstance(): void {
    MarvinJSUtil.getEditor('#sketch').then(
      (sketcherInstance: any) => {
        this.sketcherInstance$.next(sketcherInstance);
        sketcherInstance.on('molchange', async () => {
          this.markAsTouched();
          const structure = sketcherInstance.isEmpty()
            ? undefined
            : await sketcherInstance.exportStructure('mol');
          this.onChange(structure);
        });
      },
      () => {
        // try again in 100ms when the first attempt was too early
        setTimeout(() => {
          this.grabSketcherInstance();
        }, 100);
      }
    );
  }
}
