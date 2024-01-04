import { Component } from '@angular/core';
import {UserInfoService} from "./services/userinfo.service";
import {MenuItem} from "primeng/api";

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

  get userMenuItems(): Array<MenuItem> {
    return this.userInfo ? [{ label: 'Sign Out', icon: 'pi pi-fw pi-sign-out', command: () => this.logout() }] : [];
  }

  get userInfo() {
    return this.userInfoService.userInfo;
  }

  constructor(private userInfoService: UserInfoService) {

  }

  ngOnInit() {
    this.userInfoService.fetchUserInfo();
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

  login() {
    this.userInfoService.login();
  }

  logout() {
    this.userInfoService.logout();
  }
}
