import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CasesService } from '../services/cases.service';
import { Case } from '../models/case';
import { jsPDF } from 'jspdf';
import { CommonModule } from '@angular/common';
import * as Highcharts from 'highcharts';
import ExportingModule from 'highcharts/modules/exporting';
import { HighchartsChartComponent, HighchartsChartModule } from 'highcharts-angular';
import 'datatables.net';
import $ from 'jquery';

// Initialize the exporting module
ExportingModule(Highcharts);

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule, HighchartsChartModule],
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.css']
})
export class ReportingComponent implements OnInit, OnDestroy {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options | undefined;
  pieChartOptions: Highcharts.Options | undefined;
  cases: Case[] = [];
  dataTable: any;

  // Filter values
  // Each value needs to be unique, so "All" won't work here
  timeFrame: string = "All time frames"
  timeFrames: string[] = ['All time frames', 'Daily', 'Weekly', 'Monthly', "Yearly"];

  specie: string = "All species"
  species: string[] = ['All species', 'Adult Cat', 'Adult Dog', 'Kitten', 'Puppy']; 

  status: string = "All statuses"
  statuses: string[] = ['All statuses', 'Open', 'Closed']; 
  
  @ViewChild('casesTable', { static: false }) table!: ElementRef;

  public mainChartInstance: Highcharts.Chart | null = null;
  public chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    console.log('Chart initialized:', chart);
    this.mainChartInstance = chart;
  };

  constructor(private caseService: CasesService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.refreshData();
  }

  ngOnDestroy(): void {
    // Destroy DataTable instance when the component is destroyed to prevent memory leaks
    if (this.dataTable) {
      this.dataTable.destroy(true);
    }
  }

  refreshData(): void {
    var newStatus: string | undefined = undefined;
    if(this.status == "All statuses") {
      newStatus = undefined;
    } else {
      newStatus = this.status;
    }
    this.caseService.getAll(newStatus).then((data) => {
      this.cases = data;
      this.createBarChart();
      this.createPieChart();
      
      // Trigger change detection to ensure the view is updated
      this.cd.detectChanges();
      
      // Reinitialize the DataTable after data is loaded and view is updated
      this.initializeDataTable();
    });
  }

  /**
   * Initializes the DataTable only if it hasn't been initialized already.
   */
  initializeDataTable(): void {
    if (!$.fn.DataTable.isDataTable(this.table.nativeElement)) {
      console.log("Initializing DataTable...");
      this.dataTable = $(this.table.nativeElement).DataTable({
        pageLength: 5,
        lengthChange: false,
        ordering: true,
        searching: true,
        autoWidth: false,
      });
    } else {
      console.log("DataTable already initialized.");
    }
  }

  /**
   * Generates a PDF report containing the chart and table data.
   */
  async generatePDF(): Promise<void> {
    const doc = new jsPDF();
    doc.text('Pet Care Outcomes Report', 10, 10);

    if (this.mainChartInstance) {
      try {
        // Get SVG from the chart instance
        const svg = this.mainChartInstance.getSVG();

        // Convert SVG to a PNG image
        const imgData = await this.convertSVGToImage(svg);

        // Add the image to the PDF
        doc.addImage(imgData, 'PNG', 10, 20, 180, 100);
      } catch (error) {
        console.error("Error converting SVG to image:", error);
      }
    } else {
      console.error("Chart instance is not available.");
    }

    // Add table data
    let yPosition = 130;
    this.cases.forEach((outcome, index) => {
      doc.text(`${index + 1}. ${outcome.firstName}: ${outcome.status}`, 10, yPosition);
      yPosition += 10;
    });

    // Save the PDF
    doc.save('pet-care-outcomes-report.pdf');
  }

  /**
   * Converts SVG string to a PNG image data URL.
   * @param svg - The SVG string from the chart.
   * @returns A promise that resolves to the image data URL.
   */
  convertSVGToImage(svg: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngData = canvas.toDataURL('image/png', 1.0);
          resolve(pngData);
        } else {
          reject(new Error("Could not get canvas context."));
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = url;
    });
  }

  getOutcomeCounts(): { [key: string]: number } {
    return this.cases.reduce((acc: any, outcome: Case) => {
      acc[outcome.status] = (acc[outcome.status] || 0) + 1;
      return acc;
    }, {});
  }

  createBarChart(): void {
    const outcomeCounts = this.getOutcomeCounts();
    const categories = Object.keys(outcomeCounts);
    const data = Object.values(outcomeCounts).map(count => Number(count));

    this.chartOptions = {
      chart: {
        type: 'column',
        backgroundColor: 'rgba(0,0,0,0)',
        height: 300,
      },
      title: {
        text: 'Cases this week',
        align: 'left',
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333333'
        }
      },
      xAxis: {
        categories: categories,
        title: {
          text: null,
        },
        labels: {
          style: {
            color: '#666666'
          }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: null,
        },
        gridLineColor: '#e0e0e0',
        labels: {
          style: {
            color: '#666666'
          }
        }
      },
      legend: {
        enabled: false,
      },
      plotOptions: {
        column: {
          borderRadius: 5,
          pointPadding: 0.2,
          groupPadding: 0.1,
          color: '#4DC959',
        }
      },
      series: [
        {
          name: 'Cases',
          type: 'column',
          data: data,
          color: '#4DC959',
        },
      ],
    };
  }

  createPieChart(): void {
    const outcomeCounts = this.getOutcomeCounts();
    const pieData = Object.entries(outcomeCounts).map(([name, value]) => ({
      name,
      y: value,
    }));

    this.pieChartOptions = {
      chart: {
        type: 'pie',
        backgroundColor: 'rgba(0,0,0,0)',
      },
      title: {
        text: 'Case distribution',
        align: 'left',
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333333'
        }
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
      },
      accessibility: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.y}',
            style: {
              color: '#666666',
            }
          },
          colors: ['#4DC959', '#85E085', '#A9E6A9', '#CCECCC']
        },
      },
      series: [
        {
          name: 'Cases',
          type: 'pie',
          data: pieData,
        },
      ],
    };
  }
     /**
     * Updates filters based on select element changes and refreshes data
     * @param event The change event from the select element (see reporting html file for more info)
     */
     onStatusChange(event: Event): void {
      const newValue = (event.target as HTMLSelectElement).value;

      // Update the filter value from the html element and refresh the data
      // Includes is like contains in Swift
      if(this.timeFrames.includes(newValue ?? "")) {
        this.timeFrame = newValue ?? "";
        this.refreshData();
        return;
      }

      if (this.species.includes(newValue)) {
        this.specie = newValue ?? "";
        this.refreshData();
        return;
      }

      if (this.statuses.includes(newValue)) {
        this.status = newValue ?? "";
        this.refreshData();
        return;
      }

      if (!event.target) {
        console.error('Event target is null');
        return;
      }
    }
}