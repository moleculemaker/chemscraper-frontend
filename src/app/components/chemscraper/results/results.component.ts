import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { ResultService } from 'src/app/result.service';
import { interval } from "rxjs/internal/observable/interval";
import { Subscription, timer } from 'rxjs';
import { finalize, startWith, switchMap, takeWhile } from "rxjs/operators";
import { Router } from '@angular/router';
import { MenuItem, Message, MessageService } from 'primeng/api';
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
import { JobsService, Configuration } from "@api/mmli-backend/v1";
import { Molecule } from "@api/mmli-backend/v1/model/molecule";
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
  statusResponse?: Job;
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
  molecules: any[]; // all received from backend
  moleculesToDisplay: any[]; // the ones shown to the user, after search + filtering.
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
  moleculeNameFilterOptions: any[];
  flaggedFilterOptions: any[];
  selectedSortOption: any;
  selectedMoleculeStatusFilterOption: any;
  selectedMoleculeNameFilterOption: any;
  selectedFlaggedFilterOption: any;
  countActiveFilters: any;
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
    private dialogService: DialogService,
    private messageService: MessageService,
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
    this.moleculeNameFilterOptions = [
      { label: 'All', value: 'all' },
      { label: 'Available', value: 'hasCDXML' },
      { label: 'Unavailable', value: 'noCDXML' }
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
    this.moleculesToDisplay = [];

    // Temp file read function
    // this.process_example_file();
    this.selectedSortOption = "Location In PDF";
    this.selectedMoleculeStatusFilterOption = "all";
    this.selectedMoleculeNameFilterOption = "all";
    this.selectedFlaggedFilterOption = "all";

    this.getResult();

    // this.showMessage("info", "Info", "Testing toast popups.");
    // this.showMessage("error", "Error", "Testing error toast popups.");

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
      this.similaritySortSMILE = "";
      this.similaritySort(value)
      return;
    }
    this.selectedSortOption = "Similarity";
    this.similaritySort(value)
  }

  showMessage(severity: string, summary: string, detail: string, life: number = 15000) {
    this.messageService.add({ severity: severity, summary: summary, detail: detail, life: life });
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
            // console.log("In getResult.subscribe()", data);
            // this.showMessage('info', 'Info', `Got results for job ${jobID}. Data: ${data}`);
            this.molecules = data;
            this.moleculesToDisplay = data;
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
          },
          (error) => {
            // TODO: Update UI, not just toast.
            console.error(`Failed to fetch results for job ${jobID}. Error: ${error}`);
            this.showMessage('error', 'Error', `Failed to fetch results for job ${jobID}. Error: ${error}`);
          }
        );
    }
    else if (jobID) {
      console.log("Starting timer to fetch results for jobID:", jobID);
      timer(0, 10000).pipe(
        switchMap(() => this._chemScraperService.getResultStatus(jobID ? jobID : "example_PDF")),
        takeWhile(() => this.pollForResult),
      ).subscribe(
        (jobs: Array<Job>) => {
          const firstMatch = jobs?.find(() => true);
          this.statusResponse = firstMatch;
          console.log(firstMatch);

          if (!firstMatch || firstMatch?.phase == "error") {
            if (jobID)
              this._chemScraperService.getError(jobID).subscribe(
                (response) => {
                  console.log(response);
                  this.pollForResult = false;
                }
              );
          } else if (firstMatch?.phase == "completed") {
            this.updateStatusStage(1);
            this.pollForResult = false;
            if (jobID)
              this._chemScraperService.getResult(jobID).subscribe(
                (data) => {
                  data.forEach(molecule => {
                    molecule.structure = this.modifySvg(molecule.structure.toString());
                  })

                  this.molecules = data;
                  this.moleculesToDisplay = data;
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
                },
                (error) => {
                  console.error(`Failed to fetch results for job ${jobID}. Error: ${error}`);
                  this.showMessage('error', `Failed to fetch results for job ${jobID}.`, `Error: ${error}`);
                }
              );
          } else {
            console.log("Job execution underway");
          }
        },
        (error) => {
          this.showMessage('error', `Error: failed to fetch results for job ${jobID}.`, `${error.code, error.message || JSON.stringify(error)}`);
          if (jobID)
            this._chemScraperService.getError(jobID).subscribe(
              (response) => {
                this.showMessage('info', 'Error details', `${response}`);
                this.pollForResult = false;
              },
              (error) => {
                console.error(`Failed to fetch error details for job ${jobID}. Error: ${error}`);
                this.showMessage('error', 'Failed to fetch error details', `Error: ${JSON.stringify(error)}`);
              }
            );

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

  filterBySmiles(molecules: Molecule[], smiles: string): Molecule[] {
    return molecules.filter(molecule => {
      // Account for filter options
      const matchesSmiles = molecule.SMILE.includes(smiles);
      const matchesStatus = this.selectedMoleculeStatusFilterOption === 'all' ||
        (this.selectedMoleculeStatusFilterOption === 'hasCDXML' && molecule.structure) ||
        (this.selectedMoleculeStatusFilterOption === 'noCDXML' && !molecule.structure);
      const matchesName = this.selectedMoleculeNameFilterOption === 'all' ||
        (this.selectedMoleculeNameFilterOption === 'hasCDXML' && (molecule.name != 'Unavailable')) ||
        (this.selectedMoleculeNameFilterOption === 'noCDXML' && (!molecule.name || molecule.name === 'Unavailable'));
      const matchesFlagged = this.selectedFlaggedFilterOption === 'all' ||
        (this.selectedFlaggedFilterOption === 'yes' && molecule.flagged) ||
        (this.selectedFlaggedFilterOption === 'no' && !molecule.flagged);

      // if (matchesSmiles && matchesStatus && matchesName && matchesFlagged) {
      //   console.log("PASSES FILTER:", molecule.name, molecule.molecularFormula, molecule.SMILE, matchesSmiles, matchesStatus, matchesName, matchesFlagged);
      // }
      return matchesSmiles && matchesStatus && matchesName && matchesFlagged;
    });
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

  similaritySort(smile: string): Molecule[] {
    // ⭐️ MAIN SORT FUNCTION ⭐️

    if (smile === '') {
      this.moleculesToDisplay = this.filterBySmiles(this.molecules, smile);
    }

    this._marvinJsSmiles = smile;
    this.similaritySortSMILE = smile;
    this.updateSimilaritySortDisabledState();

    if (!this.jobID) {
      this.moleculesToDisplay = this.molecules;
      return this.moleculesToDisplay;
    }

    this._chemScraperService.getSimilaritySortedOrder(this.jobID, smile).subscribe({
      next: (response) => {
        // this.sortMoleculesBySimilarity(response);
        this.molecules.sort((data1: Molecule, data2: Molecule) => {
          const indexA = response.indexOf(data1.id);
          const indexB = response.indexOf(data2.id);
          if (this.isAscending) {
            return indexA - indexB;
          }
          return indexB - indexA;
        });

        this.moleculesToDisplay = this.filterBySmiles(this.molecules, smile);
        this.goToRow(0);
        this.resultsTable.expandedRowKeys = {};
      },
      error: (error) => {
        console.debug("No similarity match found. Err: ", error);
        this.showMessage('info', `No exact matches found for '${smile}'`,
          'The molecules are sorted by similarity, but no exact matches found for SMILE: ' + smile, 4000);
      }
    });

    return this.moleculesToDisplay;
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
    // Update a "badge" w/ the number of currently active filters.
    let countActiveFilters = 0
    if (this.selectedMoleculeStatusFilterOption != 'all') {
      countActiveFilters++;
    }
    if (this.selectedMoleculeNameFilterOption != 'all') {
      countActiveFilters++;
    }
    if (this.selectedFlaggedFilterOption != 'all') {
      countActiveFilters++;
    }
    this.countActiveFilters = countActiveFilters;

    this.similaritySort(this.similaritySortSMILE);
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


// @Component({
//   selector: 'app-some-component',
//   templateUrl: './some.component.html'
// })
// export class SomeComponent {
//   constructor(private messageService: MessageService) { }

//   showError() {
//     this.messageService.add({
//       severity: 'error',
//       summary: 'Error Message',
//       detail: 'This is a detailed error message.'
//     });
//   }
// }
