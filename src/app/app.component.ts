import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  emailstring: string = "mailto:moleculemaker@illinois.edu?Subject=User feedback for CLEAN";
  showCite: boolean = false;
  citeButton() {
    this.showCite = !this.showCite;
  }
}
