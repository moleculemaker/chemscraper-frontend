import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'chemscraper-export-menu',
  templateUrl: './export-menu.component.html',
  styleUrls: ['./export-menu.component.scss']
})
export class ExportMenuComponent implements OnInit{
  selectedRecordFilter: any = null;
  selectedCheckboxes: string[] = [];

  recordFilterOptions: any[] = [
      { name: 'All Molecules', key: 'A' },
      { name: 'Selected Molecules', key: 'M' }
  ];

  formatOptions: any[] = [
    { name: 'All Formats', key: 'A' },
    { name: 'CDXML files', key: 'B' },
    { name: 'Molecule Table (csv)', key: 'C' },
    { name: 'Annotated document(s) (pdf)', key: 'D' }
  ];

  ngOnInit() {
      this.selectedRecordFilter = this.recordFilterOptions[0];
  }

  export(){
    console.log(this.selectedRecordFilter);
    console.log(this.selectedCheckboxes);

  }
}
