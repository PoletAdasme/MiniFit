import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { Component, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs'; 
import Chart from 'chart.js/auto';

import { MedicionesService, MedicionDTO } from '../../mediciones/mediciones.services';

import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'app-mediciones-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderBarComponent],
  templateUrl: './mediciones-dashboard.page.html',
  styleUrls: ['./mediciones-dashboard.page.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MedicionesDashboardPage implements OnDestroy {
  hijoId!: number;
  hijoNombre?: string;

  // filtros
  vista: 'semanal' | 'mensual' | 'anual' = 'mensual';
  desdeISO!: string;
  hastaISO!: string;
  todayIso: string = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  cargando = false;
  mediciones: MedicionDTO[] = [];

  // charts
  private chartPeso?: Chart;
  private chartIMC?: Chart;
  private chartComparativa?: Chart;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: MedicionesService,
    private alert: AlertController,
    private toast: ToastController
  ) {}

  async ionViewWillEnter() {
    // lee hijoId/hijo desde query params
    const qp = this.route.snapshot.queryParamMap;
    const hijoId = Number(qp.get('hijoId'));
    this.hijoNombre = qp.get('hijo') || undefined;
    if (Number.isFinite(hijoId) && hijoId > 0) {
      this.hijoId = hijoId;
    } else {
      (await this.toast.create({ message: 'Falta hijoId', color: 'warning', duration: 1400 })).present();
      this.router.navigate(['/inicio/selector-hijo']);
      return;
    }

    // rango inicial según vista
    this.ajustarRangoPorVista(this.vista);
    await this.cargarYGraficar();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  // === Filtros ===

  onVistaChange() {
    // Cuando cambias entre semanal/anual
    this.ajustarRangoPorVista(this.vista);
  }

  limpiarFiltros() {
    this.vista = 'mensual';
    this.ajustarRangoPorVista(this.vista);
  }

  async aplicarFiltros() {
    // si no hay hastaISO, pon hoy
    if (!this.hastaISO) this.hastaISO = this.todayIso;
    await this.cargarYGraficar();
  }

  private ajustarRangoPorVista(v: 'semanal' | 'mensual' | 'anual') {
    const hoy = new Date();
    const hasta = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
    const desde = new Date(hasta);
 
    if (v === 'semanal') {
      desde.setDate(hasta.getDate() - 6);
    } else if (v === 'mensual') {
      desde.setMonth(hasta.getMonth() - 1);
    } else {
      desde.setFullYear(hasta.getFullYear() - 1);
    }

    this.desdeISO = desde.toISOString().slice(0, 10);
    this.hastaISO = hasta.toISOString().slice(0, 10);
  }

  // Helper para asegurar number en IMC
  private calcIMC(pesoKg: number, estaturaCm: number): number {
    if (!estaturaCm) return 0;
    const imc = pesoKg / Math.pow(estaturaCm / 100, 2);
    return +imc.toFixed(1);
  }

  // === Carga + gráficos ===
  public async cargarYGraficar() {
    if (!this.hijoId) return;
    this.cargando = true;
    try {
      this.mediciones = await firstValueFrom(this.svc.listar(this.hijoId, this.desdeISO, this.hastaISO));

      // 1) gráfico línea: Peso vs Fecha
      this.renderChartPeso();
      // 2) gráfico torta: distribución por IMC
      this.renderChartIMC();
      // 3) gráfico barras: comparativa  (promedios)
      this.renderChartComparativa();
    } catch (err) {
      console.error(err);
      (await this.toast.create({ message: 'No se pudieron cargar las mediciones', color: 'danger', duration: 1500 })).present();
    } finally {
      this.cargando = false;
    }
  }

  private destroyCharts() {
    this.chartPeso?.destroy();
    this.chartIMC?.destroy();
    this.chartComparativa?.destroy();
    this.chartPeso = this.chartIMC = this.chartComparativa = undefined;
  }

  // === Render: Peso vs Fecha (línea) ===
  private renderChartPeso() {
    if (!this.mediciones.length) { this.chartPeso?.destroy(); return; }

    // ordena por fecha asc
    const orden = [...this.mediciones].sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha));
    const labels = orden.map(m => new Date(m.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }));
    const data = orden.map(m => m.pesoKg);

    this.chartPeso?.destroy();
    this.chartPeso = new Chart('chartPeso', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Peso (kg)',
          data,
          tension: 0.35,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  // === Render: Distribución por IMC (torta) ===
  private renderChartIMC() {
    if (!this.mediciones.length) { this.chartIMC?.destroy(); return; }

    const buckets = new Map<string, number>([
      ['Bajo peso (<18.5)', 0],
      ['Normal (18.5–24.9)', 0],
      ['Sobrepeso (25–29.9)', 0],
      ['Obesidad I (30–34.9)', 0],
      ['Obesidad II (35–39.9)', 0],
      ['Obesidad III (≥40)', 0],
    ]);

    for (const m of this.mediciones) {
      // asegurar number aunque IMC venga null
      const imc = m.imc ?? this.calcIMC(m.pesoKg, m.estaturaCm);

      if (imc < 18.5) buckets.set('Bajo peso (<18.5)', (buckets.get('Bajo peso (<18.5)') || 0) + 1);
      else if (imc < 25) buckets.set('Normal (18.5–24.9)', (buckets.get('Normal (18.5–24.9)') || 0) + 1);
      else if (imc < 30) buckets.set('Sobrepeso (25–29.9)', (buckets.get('Sobrepeso (25–29.9)') || 0) + 1);
      else if (imc < 35) buckets.set('Obesidad I (30–34.9)', (buckets.get('Obesidad I (30–34.9)') || 0) + 1);
      else if (imc < 40) buckets.set('Obesidad II (35–39.9)', (buckets.get('Obesidad II (35–39.9)') || 0) + 1);
      else buckets.set('Obesidad III (≥40)', (buckets.get('Obesidad III (≥40)') || 0) + 1);
    }

    const labels = Array.from(buckets.keys());
    const data = Array.from(buckets.values());

    this.chartIMC?.destroy();
    this.chartIMC = new Chart('chartIMC', {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'IMC (cantidad)',
          data
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  // === Render: Comparativa  (barras) ===
  private renderChartComparativa() {
    if (!this.mediciones.length) { this.chartComparativa?.destroy(); return; }

    // agrupa por mes (yyyy-MM) y calcula promedios de Peso/Estatura/IMC
    const grupos = new Map<string, { peso: number[]; est: number[]; imc: number[] }>();
    for (const m of this.mediciones) {
      const d = new Date(m.fecha);
      const y = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const key = `${y}-${mm}`;

      if (!grupos.has(key)) grupos.set(key, { peso: [], est: [], imc: [] });
      const g = grupos.get(key)!;
      g.peso.push(m.pesoKg);
      g.est.push(m.estaturaCm);

      // aquí estaba el TS2345: asegurar number antes de pushear
      const imcNum = m.imc ?? this.calcIMC(m.pesoKg, m.estaturaCm);
      g.imc.push(imcNum);
    }

    const keysOrden = Array.from(grupos.keys()).sort(); // yyyy-MM
    const labels = keysOrden.map(k => {
      const [yy, mm] = k.split('-').map(Number);
      const date = new Date(yy, mm - 1, 1);
      return date.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' }); // ej: nov 25
    });

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const dataPeso = keysOrden.map(k => avg(grupos.get(k)!.peso));
    const dataEst  = keysOrden.map(k => avg(grupos.get(k)!.est));
    const dataIMC  = keysOrden.map(k => avg(grupos.get(k)!.imc));

    this.chartComparativa?.destroy();
    this.chartComparativa = new Chart('chartComparativa', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Peso (kg)', data: dataPeso },
          { label: 'Estatura (cm)', data: dataEst },
          { label: 'IMC', data: dataIMC },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  // === Historial ===
  trackById = (_: number, m: MedicionDTO) => m.medicionId;

  irAgregar() {
    this.router.navigate(['/panel/mediciones/agregar'], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }
 
  irEditar(id: number | null | undefined) {
    if (id == null) { return; } // evita null/undefined
    this.router.navigate(['/panel/mediciones/editar', id], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }

  async confirmarEliminar(id: number | null | undefined) {
    if (id == null) { return; } // evita null/undefined

    const a = await this.alert.create({
      header: 'Eliminar medición',
      message: '¿Seguro que deseas eliminar este registro?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.svc.eliminar(id));
              await this.cargarYGraficar();
              (await this.toast.create({ message: 'Eliminado', duration: 1000, color: 'success' })).present();
            } catch {
              (await this.toast.create({ message: 'No se pudo eliminar', duration: 1500, color: 'danger' })).present();
            }
          }
        }
      ]
    });
    await a.present();
  }
}
