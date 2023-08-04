import { Component, OnInit } from '@angular/core';
import { ChemScraperService } from 'src/app/chemscraper.service';
import { ExportRequestBody } from 'src/app/models';

@Component({
  selector: 'chemscraper-export-menu',
  templateUrl: './export-menu.component.html',
  styleUrls: ['./export-menu.component.scss']
})
export class ExportMenuComponent implements OnInit{
  selectedRecordFilter: string = '';
  selectedFormats: string[] = [];

  recordFilterOptions: any[] = [
      { name: 'All Molecules', key: 'ALL' },
      // { name: 'Selected Molecules', key: 'M' }
  ];

  formatOptions: any[] = [
    { name: 'CDXML file(s)', key: 'CDXML' },
    { name: 'Molecule Table (csv)', key: 'CSV' },
    // { name: 'Annotated document(s) (pdf)', key: 'PDF' }
  ];

  selectedAllFormats: any[] = [];

  exportRequestBody : ExportRequestBody = {
    jobId: '',
    recordFilter: '',
    formats: []
  };

  constructor(
    private _chemScraperService: ChemScraperService
  ){ }

  ngOnInit() {
      this.selectedRecordFilter = this.recordFilterOptions[0].key;
  }

  export(){
    console.log(this.selectedRecordFilter);
    console.log(this.selectedFormats);
    const jobId = window.location.href.split('/').at(-1);
    if(jobId){
      this.exportRequestBody.jobId = jobId;
    }
    this.exportRequestBody.formats = this.selectedFormats;
    this.exportRequestBody.recordFilter = this.selectedRecordFilter
    this._chemScraperService.exportFiles(this.exportRequestBody).subscribe((file: Blob) => {
      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ChemScraper-result.zip'); // replace with your filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  selectAllFormats() {
    if(this.selectedAllFormats.includes('ALL')){
      this.selectedFormats = this.formatOptions.map(formatOption => formatOption.key);
    } else {
      this.selectedFormats = [];
    }
  }

  onCheckboxesChange() {
    if(this.selectedFormats.length < this.formatOptions.length){
      this.selectedAllFormats = [];
    }
  }

}
