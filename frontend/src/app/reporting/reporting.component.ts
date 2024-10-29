import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CasesService } from '../services/cases.service';
import { Case } from '../models/case';
import { jsPDF } from 'jspdf';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css'
})
export class ReportingComponent implements OnInit {
  @ViewChild('outcomeChart', { static: false }) outcomeChart!: ElementRef;
  cases: Case[] = [];
  chart: any;

  constructor(private caseService: CasesService) {}

  ngOnInit(): void {
    this.caseService.getAll().subscribe((data) => {
      this.cases = data;
      this.createChart();
    });
  }

  createChart(): void {
    const outcomes = this.cases.map(outcome => outcome.status);
    const outcomeCounts = outcomes.reduce((acc: any, outcome: string) => {
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {});

    const chartData = {
      labels: Object.keys(outcomeCounts),
      datasets: [
        {
          label: 'Pet Care Outcomes',
          data: Object.values(outcomeCounts),
        },
      ],
    };

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
}