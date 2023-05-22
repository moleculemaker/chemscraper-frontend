import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  emailstring: string = "mailto:chemscraper-feedback@moleculemaker.org?Subject=User feedback for ChemScraper";
  showCite: boolean = false;

  showComingSoonPopup: boolean = false;
  comingSoonTimerID: number|null = null;
  autocloseComingSoonPopup: boolean = true;

  ngOnInit() {
      this.comingSoonTimerID = setTimeout(()=>{
        this.toggleComingSoonPopup();
      }, 2000);
  }

  citeButton() {
    this.showCite = !this.showCite;
  }

  toggleComingSoonPopup() {
    this.showComingSoonPopup = !this.showComingSoonPopup;

    if (this.comingSoonTimerID) {clearTimeout(this.comingSoonTimerID);}

    if (this.autocloseComingSoonPopup) {
      this.autocloseComingSoonPopup = false;

      this.comingSoonTimerID = setTimeout(()=>{
        this.toggleComingSoonPopup();
      }, 8000);
    }
  }
}
