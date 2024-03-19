import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { ResultService } from 'src/app/result.service';
import { interval } from "rxjs/internal/observable/interval";
import { Subscription, timer } from 'rxjs';
import { finalize, startWith, switchMap, takeWhile } from "rxjs/operators";
import { Router } from '@angular/router';
import { MenuItem, Message } from 'primeng/api';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import {
  PredictionRow,
  PollingResponseResult,
  PollingResponseStatus,
  SingleSeqResult,
  SeqResult,
  HighlightBox,
  Job
} from '../../../models';
import { ChemScraperService } from 'src/app/chemscraper.service';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { Table } from 'primeng/table';
import { Molecule } from "@api/mmli-backend/v1";
import { PdfViewerDialogServiceComponent } from '../pdf-viewer-dialog-service/pdf-viewer-dialog-service.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
  providers: [DialogService]
})
export class ResultsComponent {
  showMarvinJsEditor: boolean;
  // marvinJsSmiles: string = '';  using private field now

  // subscribe to result service to get the predictionRow. after receive, set contentLoaded to false.
  timeInterval: Subscription;
  contentLoaded: boolean = false;
  pdfURLs: string[] = [];
  currentPDF: string = "";
  currentPDFName: string = "";

  rows: PredictionRow[] = [];
  getResponse: PollingResponseResult;
  failedJob: boolean = false;
  jobID: string | undefined;
  downloadRows: string[][] = [['Identifier', 'Predicted EC Number']];
  statusResponse: Job;
  useExample: boolean = false;
  preComputedMessage: Message[];
  jobFailedMessage: Message[];
  stages: MenuItem[];
  activeStage: number;

  fileNames: string[];
  selectedFile: string;
  splitView: boolean = true;
  highlightBoxes: HighlightBox[][];
  searchText: string;
  molecules: any[];
  filterPanelVisible: boolean = false;

  tableFilterStateOptions: any[] = [{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }];
  tableFilterValue: string = 'off';

  pollForResult: boolean = true;
  selectedMolecule: Molecule | null = null;

  firstRowIndex: number = 0;

  pages_count: number = 0;
  ref: DynamicDialogRef;
  sortOptions: any[];
  moleculeStatusFilterOptions: any[];
  flaggedFilterOptions: any[];
  selectedSortOption: any;
  selectedMoleculeStatusFilterOption: any;
  selectedFlaggedFilterOption: any;
  similaritySortSMILE: string = "";
  isAscending: boolean = true;

  copySuccess = false;

  @ViewChild('resultsTable') resultsTable: Table;
  @ViewChild('sortOverlay') sortOverlay: OverlayPanel;

  constructor(
    private router: Router,
    private _resultService: ResultService,
    private httpClient: HttpClient,
    private _chemScraperService: ChemScraperService,
    private sanitizer: DomSanitizer,
    private dialogService: DialogService
  ) {
    this.sortOptions = [
      { label: 'Location In PDF (default)', value: 'Location In PDF', disabled: false },
      { label: 'Molecular Weight', value: 'Molecular Weight', disabled: false },
      { label: 'Number of Atoms', value: 'Number of Atoms', disabled: false },
      { label: 'Occurrences', value: 'Occurrences', disabled: false },
      { label: 'Similarity', value: 'Similarity', disabled: true }
    ];
    this.moleculeStatusFilterOptions = [
      { label: 'All molecules found', value: 'all' },
      { label: 'Has converted CDXML structure', value: 'hasCDXML' },
      { label: 'No converted CDXML structure', value: 'noCDXML' }
    ];
    this.flaggedFilterOptions = [
      { label: 'All', value: 'all' },
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' }
    ];
  }

  @ViewChild(PdfViewerComponent) pdfViewerComponent: PdfViewerComponent;

  ngOnInit(): void {
    this.preComputedMessage = [
      { severity: 'info', detail: 'This is a pre-computed result for the example data. To see real-time computation, click the "Run a new Request" button and use the "Copy and Paste" input method.' },
      // { severity: 'info', detail: 'This is a pre-computed result for the example data. Real-time computation is currently disabled due to high demand, but please visit us again soon!' },
    ];
    this.jobFailedMessage = [
      { severity: 'error', detail: 'Job failed possibly due to incorrect input or intermittent issues. Please use the “Run a new Request” button above to try again, or click the feedback link at the bottom of the page to report a problem.' }
    ]

    this.jobID = window.location.href.split('/').at(-1);

    this.stages = [
      {
        label: 'Running ChemScraper Job'
      },
      {
        label: 'Fetching External Data'
      },
      {
        label: 'Execution Complete, Showing Results'
      }
    ];
    this.activeStage = 0;

    // Temp files names
    this.fileNames = [];

    this.molecules = [];

    // Temp file read function
    // this.process_example_file();
    this.selectedSortOption = "Location In PDF";
    this.selectedMoleculeStatusFilterOption = "all";
    this.selectedFlaggedFilterOption = "all";

    this.getResult();

  }

  private _marvinJsSmiles: string = '';

  get marvinJsSmiles(): string {
    return this._marvinJsSmiles;
  }

  set marvinJsSmiles(value: string) {
    // When SMILES is updated, automatically enable sort in GUI.
    this._marvinJsSmiles = value;
    if (value === '') {
      this.selectedSortOption = "Location In PDF";
      this.sortData("Location In PDF")
      return;
    }
    this.selectedSortOption = "Similarity";
    this.similaritySort(value)
  }

  flagMolecule(molecule: Molecule, event: Event) {
    this._chemScraperService.flagMolecule(this.jobID + '', molecule).subscribe(result => {
      // finally, mark this as flagged
      molecule.flagged = true;
    });
  }

  unflagMolecule(molecule: Molecule, event: Event) {
    event.stopPropagation();
    this._chemScraperService.unflagMolecule(this.jobID + '', molecule).subscribe(result => {
      // finally, mark this as not flagged
      molecule.flagged = false;
    });

  }

  updateStatusStage(currentStage: number) {
    this.activeStage = currentStage;
    const listItems = Array.from(document.querySelectorAll('#LoadingStages ul li'));
    // console.log(listItems);
    listItems.forEach((childElement, childIndex) => {
      if (childIndex < currentStage) {
        const stageElement = Array.from(childElement.querySelectorAll('a .p-steps-number'));
        const firstElement = stageElement[0];
        firstElement.classList.add('completed-stage')
      }
    })
    if (currentStage == this.stages.length) {
      // this.useExample = true;
    }

  }

  copySmilesToClipboard() {
    navigator.clipboard.writeText(this.marvinJsSmiles).then(() => {
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 5000);

    }, () => {
      alert('Failure: Unable to copy SMILES string to clipboard.');
    });
  }

  copyAndPasteURL(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  ngOnDestroy(): void {
    this.timeInterval.unsubscribe();
  }

  toggleSplitView() {
    this.splitView = !this.splitView;
  }

  filterResults() {
    this.filterPanelVisible = true;
  }

  selectRow(event: Event) {
    // event.stopPropagation();
  }

  getResult() {
    let jobID = window.location.href.split('/').at(-1);
    if (jobID == "example_PDF") {
      this.updateStatusStage(1);
      this.pollForResult = false;
      if (jobID)
        this._chemScraperService.getResult(jobID).subscribe(
          (data) => {
            this.molecules = data;
            this.pages_count = Math.max(...this.molecules.map(molecule => parseInt(molecule.page_no)))

            this.updateStatusStage(2);

            this.getHighlightBoxes(1);

            if (jobID)
              this._chemScraperService.getInputPDf(jobID).subscribe(
                (urls) => {
                  this.pdfURLs = urls;
                  if (this.pdfURLs.length > 0) {
                    this.currentPDF = this.pdfURLs[0];
                    const pdfName = this.currentPDF.split("/").pop();
                    if (pdfName) {
                      this.currentPDFName = pdfName;
                      this.fileNames.push(pdfName);
                    }
                    this.contentLoaded = true;
                  }
                }
              );
          }
        );
    }
    else if (jobID) {
      timer(0, 10000).pipe(
        switchMap(() => this._chemScraperService.getResultStatus(jobID ? jobID : "example_PDF")),
        takeWhile(() => this.pollForResult)
      ).subscribe(
        (jobStatus) => {
          this.statusResponse = jobStatus;
          console.log(jobStatus);

          if (jobStatus.phase == "completed") {
            this.updateStatusStage(1);
            this.pollForResult = false;
            if (jobID)
              this._chemScraperService.getResult(jobID).subscribe(
                (data) => {
                  data.forEach(molecule => {
                    molecule.structure = this.modifySvg(molecule.structure.toString());
                  })

                  this.molecules = data;
                  this.pages_count = Math.max(...this.molecules.map(molecule => parseInt(molecule.page_no)))

                  this.updateStatusStage(2);

                  this.getHighlightBoxes(1);

                  if (jobID)
                    this._chemScraperService.getInputPDf(jobID).subscribe(
                      (urls) => {
                        this.pdfURLs = urls;
                        if (this.pdfURLs.length > 0) {
                          this.currentPDF = this.pdfURLs[0];
                          const pdfName = this.currentPDF.split("/").pop();
                          if (pdfName) {
                            this.currentPDFName = pdfName;
                            this.fileNames.push(pdfName);
                          }
                          this.contentLoaded = true;
                        }
                      }
                    );
                }
              );
          } else if (jobStatus.phase == "error") {
            if (jobID)
              this._chemScraperService.getError(jobID).subscribe(
                (response) => {
                  console.log(response);
                  this.pollForResult = false;
                }
              );
          } else {
            console.log("Job execution underway");
          }
        }
      );
    }

  }

  getHighlightBoxes(doc_no: number) {
    this.highlightBoxes = []
    let filteredMolecules = this.molecules.filter(molecule => molecule.doc_no === doc_no.toString());
    for (const molecule of filteredMolecules) {
      if (!this.highlightBoxes[parseInt(molecule.page_no)]) {
        while (this.highlightBoxes.length < parseInt(molecule.page_no)) {
          this.highlightBoxes.push([]);
        }
        this.highlightBoxes[parseInt(molecule.page_no)] = [];
      }
      this.highlightBoxes[parseInt(molecule.page_no)].push({
        moleculeId: molecule.id,
        moleculeName: molecule.name,
        x: parseInt(molecule.minX),
        y: parseInt(molecule.minY),
        width: parseInt(molecule.width),
        height: parseInt(molecule.height)
      });
    }
  }

  onRowSelected(event: any) {
    // if(event.data){
    //   this.pdfViewerComponent.highlightMolecule(event.data.id, parseInt(event.data.page_no));
    //   const input_pdf_container = document.getElementById("input_pdf_container");
    //   if(input_pdf_container){
    //     input_pdf_container.scrollBy(-10000, -10000);
    //     input_pdf_container.scrollBy((parseInt(event.data.minX) * 72.0) / 300, (parseInt(event.data.minY) * 72.0) / 300);
    //   }
    // }
  }

  onRowUnselected(event: any) {
    // if(event.data){
    //   this.pdfViewerComponent.highlightMolecule(-1);
    // }
  }

  goToRow(rowIndex: number) {
    // Read the current number of rows per page from the table
    const rowsPerPage = this.resultsTable.rows;

    // Calculate the start index of the page
    this.firstRowIndex = Math.floor(rowIndex / rowsPerPage) * rowsPerPage;

    // Scroll to the specific row within the page
    setTimeout(() => {
      const rowElements = document.querySelectorAll('.p-datatable-tbody > tr');
      if (rowElements && rowIndex < this.molecules.length) {
        rowElements[rowIndex % rowsPerPage].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        this.selectedMolecule = this.molecules[rowIndex];
        // this.pdfViewerComponent.highlightMolecule(this.selectedMolecule.id, parseInt(this.selectedMolecule.page_no));
      }
    });
  }

  openMarvinjsEditor($event: MouseEvent) {
    this.showMarvinJsEditor = true;
  }

  closeMarvinjsEditor($event: MouseEvent) {
    this.showMarvinJsEditor = false;
  }

  filterBySmiles(molecules: Molecule[], smiles: string): number {
    return molecules.reduce((count, molecule) => molecule.SMILE.includes(this._marvinJsSmiles) ? count + 1 : count, 0);
  }

  // filterBySmiles(molecules: Molecule[], smiles: string) {
  //   return molecules.sort((a, b) => {
  //     const aIncludesSmiles = a.SMILE?.includes(smiles) ? 1 : 0;
  //     const bIncludesSmiles = b.SMILE?.includes(smiles) ? 1 : 0;
  //     return bIncludesSmiles - aIncludesSmiles;
  //   });
  // }


  sortBySmiles(molecules: Molecule[], smiles: string) {
    return molecules.sort((a, b) => {
      const lengthA = this.longestCommonSubstring(a.SMILE, smiles).length;
      const lengthB = this.longestCommonSubstring(b.SMILE, smiles).length;
      return lengthB - lengthA; // Sort in descending order of match length
    });
  }

  // Helper method to find the longest common substring
  longestCommonSubstring(s1: string = '', s2: string = ''): string {
    if (!s1 || !s2) return '';

    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(0));
    let longestLength = 0;
    let longestEndPos = 0;

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s1[j - 1] === s2[i - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
          if (matrix[i][j] > longestLength) {
            longestLength = matrix[i][j];
            longestEndPos = j;
          }
        } else {
          matrix[i][j] = 0;
        }
      }
    }

    return s1.substring(longestEndPos - longestLength, longestEndPos);
  }


  modifySvg(svgString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElem = doc.querySelector('svg');

    if (svgElem) {
      // Extract width and height values
      const width = svgElem.getAttribute('width');
      const height = svgElem.getAttribute('height');

      // Remove width and height attributes
      svgElem.removeAttribute('width');
      svgElem.removeAttribute('height');

      // Add viewBox attribute
      if (width && height && !svgElem.getAttribute('viewBox')) {
        svgElem.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      // Convert modified SVG back to string
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgElem);
    }

    return svgString; // return original if modifications failed
  }

  OpenPDFOverlay(moleculeId: number) {
    this.ref = this.dialogService.open(PdfViewerDialogServiceComponent, {
      height: '80%',
      data: {
        pdfURL: this.currentPDF,
        highlightBoxes: this.highlightBoxes,
        highlightedMoleculeId: moleculeId,
        pageNumber: parseInt(this.molecules[moleculeId].page_no)
      }
    });
  }

  similaritySort(smile: string) {
    this.similaritySortSMILE = smile;
    this.updateSimilaritySortDisabledState();
    // console.log("Similarity sort: " + smile, "Ascending: " + this.isAscending, "JobID: " + this.jobID);
    if (this.jobID) {
      this._chemScraperService.getSimilaritySortedOrder(this.jobID, smile).subscribe({
        next: (response) => {
          this.molecules.sort((data1: Molecule, data2: Molecule) => {
            const indexA = response.indexOf(data1.id);
            const indexB = response.indexOf(data2.id);
            if (this.isAscending) {
              return indexA - indexB;
            }
            return indexB - indexA;
          });
          this.goToRow(0);

          // Collapse all rows
          this.resultsTable.expandedRowKeys = {};
        },
        error: (error) => {
          // Suppressing errors from appearing in the browser console
          // Error handling logic can be implemented here if needed
          console.debug("No similarity match found. Err: ", error);
        }
      });
    }
  }

  searchStructure() {
    this.similaritySort(this.marvinJsSmiles);
    this.showMarvinJsEditor = false;
  }

  toggleSort() {
    console.log(this.isAscending);

    this.isAscending = !this.isAscending;
    this.sortData(this.selectedSortOption);
  }

  onSortChange(event: any) {
    this.sortData(event.value);
    // this.sortOverlay.hide();
  }

  onFilterChange(event: any) {
    console.log(this.selectedMoleculeStatusFilterOption);
    console.log(this.selectedFlaggedFilterOption);

  }

  sortData(value: string) {
    if (value == "Location In PDF") {
      this.molecules.sort((data1: Molecule, data2: Molecule) => {
        if (this.isAscending) {
          return data1.id - data2.id;
        }
        return data2.id - data1.id;
      });
    } else if (value == "Number of Atoms") {
      this.molecules.sort((data1: Molecule, data2: Molecule) => {
        if (this.isAscending) {
          return data1.atom_count - data2.atom_count;
        }
        return data2.atom_count - data1.atom_count;
      });
    } else if (value == "Molecular Weight") {
      this.molecules.sort((data1: Molecule, data2: Molecule) => {
        if (!data2.molecularWeight || data2.molecularWeight == 'Unavailable') {
          return -1;
        }
        if (!data1.molecularWeight || data1.molecularWeight == 'Unavailable') {
          return 1;
        }
        const weight1 = parseFloat(data1.molecularWeight);
        const weight2 = parseFloat(data2.molecularWeight);
        if (isNaN(weight2)) {
          return -1;
        }
        if (isNaN(weight1)) {
          return 1;
        }
        if (this.isAscending) {
          return weight1 - weight2;
        }
        return weight2 - weight1;
      });

    } else if (value == "Occurrences") {
      this.molecules.sort((data1: Molecule, data2: Molecule) => {
        if (this.isAscending) {
          return data1.OtherInstances.length - data2.OtherInstances.length;
        }
        return data2.OtherInstances.length - data1.OtherInstances.length;
      });
    } else if (value == "Similarity") {
      this.similaritySort(this.similaritySortSMILE);
    }
  }

  updateSimilaritySortDisabledState() {
    this.sortOptions = this.sortOptions.map(sortOption => {
      if (sortOption.value === 'Similarity') {
        return { ...sortOption, label: "Similarity: " + this.similaritySortSMILE, disabled: this.similaritySortSMILE == "" };
      }
      return sortOption;
    });
  }

}


