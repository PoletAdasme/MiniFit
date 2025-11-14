import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, IonicModule, NgApexchartsModule,HeaderBarComponent],
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
})
export class ReportesPage {
  peso: any = {
    series: [{ name: 'Peso (kg)', data: [32.5, 32.8, 32.7, 33.1, 33.0, 33.4, 33.6, 33.7] }],
    chart: { type: 'line', height: 260, toolbar: { show: false } },
    stroke: { width: 3, curve: 'smooth' },
    xaxis: { categories: ['S1','S2','S3','S4','S5','S6','S7','S8'] },
    grid: { strokeDashArray: 3 },
    title: { text: 'Evolución de peso', style: { fontSize: '14px' } },
  };

  imc: any = {
    series: [{ name: 'IMC', data: [18.3, 18.4, 18.4, 18.6, 18.5, 18.7, 18.8, 18.9] }],
    chart: { type: 'area', height: 260, toolbar: { show: false } },
    stroke: { curve: 'smooth' },
    xaxis: { categories: ['S1','S2','S3','S4','S5','S6','S7','S8'] },
    grid: { strokeDashArray: 3 },
    title: { text: 'IMC estimado', style: { fontSize: '14px' } },
  };
}
