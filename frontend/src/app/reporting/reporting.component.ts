import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CasesService } from '../services/cases.service';
import { Case } from '../models/case';
import { jsPDF } from 'jspdf';
import Chart from 'chart.js/auto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css'
})
export class ReportingComponent implements OnInit {
  // ViewChild for the chart element
  @ViewChild('outcomeChart', { static: false }) outcomeChart!: ElementRef;

  // Data
  cases: Case[] = [];
  chart: any;

  // Filter values
  // Each value needs to be unique, so "All" won't work here
  timeFrame: string = "All time frames"
  timeFrames: string[] = ['All time frames', 'Daily', 'Weekly', 'Monthly', "Yearly"];

  specie: string = "All species"
  species: string[] = ['All species', 'Adult Cat', 'Adult Dog', 'Kitten', 'Puppy']; 

  status: string = "All statuses"
  statuses: string[] = ['All statuses', 'Open', 'Closed']; 

  constructor(private caseService: CasesService) {}

  // Called when the component is initialized, like viewDidLoad in iOS
  ngOnInit(): void {
    this.refreshData();
  }

  // Method for updating the chart and table data based on filters
  refreshData(): void {
    this.caseService.getAll(this.status == "All statuses" ? undefined : this.status).then((data) => {
      this.cases = data;
      this.createChart();
    });
  }

  /**
   * Creates a chart visualization using Chart.js
   */
  createChart(): void {

    // flatMap returns cases where the status is not undefined
    const filteredCases = this.cases.flatMap(outcome => {
      const status = outcome.status;
      return status !== undefined ? [outcome] : [];
    });

    // Get the outcomes (status) from the cases
    const outcomes = filteredCases.map(outcome => outcome.status);
    // Reduce (break down) the outcomes to a dictionary of counts
    const outcomeCounts = outcomes.reduce((acc: any, outcome: string) => {
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {});
    
    // Create the chart data from the outcome counts
    const chartData = {
      labels: Object.keys(outcomeCounts),
      datasets: [
        {
          label: 'Pet Care Outcomes',
          data: Object.values(outcomeCounts),
        },
      ],
    };

    // Create the bar chart
    this.chart = new Chart(this.outcomeChart.nativeElement, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    });
  }

  // This does not use html rather it uses a JS library jsPDF
  /**
   * Generates a PDF report containing the chart and case data
   * @returns Promise that resolves when PDF generation is complete
   */
  async generatePDF(): Promise<void> {
    const doc = new jsPDF();
    doc.text('Pet Care Outcomes Report', 10, 10);

    // Convert chart to image
    const chartImage = this.outcomeChart.nativeElement.toDataURL('image/png', 1.0);
    doc.addImage(chartImage, 'PNG', 10, 20, 180, 100);

    // Add table
    let y = 130;
    this.cases.forEach((outcome, index) => {
      doc.text(`${index + 1}. ${outcome.lastName}: ${outcome.status}`, 10, y);
      y += 10;
    });

    doc.save('pet-care-outcomes-report.pdf');
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