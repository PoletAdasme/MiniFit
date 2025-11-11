import { Component, OnDestroy, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Chart from 'chart.js/auto';
import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { ActividadService,ActividadReadDTO } from '../actividad.services';


// Swiper (web components)
import { register } from 'swiper/element/bundle';
register();


@Component({
  selector: 'app-actividad-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderBarComponent],
  templateUrl: './actividad-dashboard.page.html',
  styleUrls: ['./actividad-dashboard.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ActividadDashboardPage implements OnDestroy {

  hijoId!: number;
  hijoNombre?: string;

  // === Filtros (mismo flujo que Mediciones) ===
  vista: 'semanal' | 'mensual' | 'anual' = 'mensual';
  desdeISO!: string;
  hastaISO!: string;
  todayIso: string = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  cargando = false;
  actividades: ActividadReadDTO[] = [];

  // Charts
  private chartLinea?: Chart;
  private chartTorta?: Chart;
  private chartBarras?: Chart;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: ActividadService,
    private alert: AlertController,
    private toast: ToastController
  ) {}

  async ionViewWillEnter() {
    const qp = this.route.snapshot.queryParamMap;
    const hijoId = Number(qp.get('hijoId'));
    this.hijoNombre = qp.get('hijo') || undefined;

    if (!Number.isFinite(hijoId) || hijoId <= 0) {
      (await this.toast.create({ message: 'Falta hijoId', color: 'warning', duration: 1400 })).present();
      this.router.navigate(['/inicio/selector-hijo']);
      return;
    }
    this.hijoId = hijoId;

    // Rango inicial por vista y carga
    this.ajustarRangoPorVista(this.vista);
    await this.cargarYGraficar();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

 private destroyCharts() {
    this.chartLinea?.destroy();
    this.chartTorta?.destroy();
    this.chartBarras?.destroy();
    this.chartLinea = this.chartTorta = this.chartBarras = undefined;
  }

  // === Filtros ===
  limpiarFiltros() {
    this.vista = 'mensual';
    this.ajustarRangoPorVista(this.vista);
  }

  async aplicarFiltros() {
    if (!this.hastaISO) this.hastaISO = this.todayIso;

    if (this.desdeISO && this.hastaISO) {
      const d = new Date(this.desdeISO);
      const h = new Date(this.hastaISO);
      if (d > h) this.desdeISO = this.hastaISO;
    }
    await this.cargarYGraficar();
  }

  onVistaChange() {
    this.ajustarRangoPorVista(this.vista);
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

  // ===== Carga + gráficos =====
  private async cargarYGraficar() {
    if (!this.hijoId) return;
    this.cargando = true;

    try {
      this.actividades = await firstValueFrom(
        this.svc.listar(this.hijoId, this.desdeISO, this.hastaISO)
      );

      this.renderLinea();
      this.renderTorta();
      this.renderBarrasApiladas();
    } catch (e) {
      console.error(e);
      (await this.toast.create({
        message: 'No se pudieron cargar actividades',
        color: 'danger',
        duration: 1500
      })).present();
    } finally {
      this.cargando = false;
    }
  }



  // === Gráfico 1: Línea (minutos por día) ===
  private renderLinea() {
    if (!this.actividades.length) { this.chartLinea?.destroy(); return; }

    const orden = [...this.actividades].sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha));
    const labels = orden.map(a =>
      new Date(a.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
    );
    const data = orden.map(a => a.duracionMin);

    this.chartLinea?.destroy();
    this.chartLinea = new Chart('actChartLinea', {
      type: 'line',
      data: {
        labels,
        datasets: [{ label: 'Minutos por día', data, tension: 0.35, fill: false }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // === Gráfico 2: Torta (distribución por tipo de ejercicio) ===
  private renderTorta() {
    if (!this.actividades.length) { this.chartTorta?.destroy(); return; }

    const buckets = new Map<string, number>(); // nombreTipo -> minutos acumulados
    for (const a of this.actividades) {
      const key = a.tipoNombre ?? 'Sin tipo';
      buckets.set(key, (buckets.get(key) || 0) + (a.duracionMin || 0));
    }

    const labels = Array.from(buckets.keys());
    const data = Array.from(buckets.values());

    this.chartTorta?.destroy();
    this.chartTorta = new Chart('actChartTorta', {
      type: 'pie',
      data: { labels, datasets: [{ label: 'Minutos por tipo', data }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // === Gráfico 3: Barras (promedio mensual de minutos) ===
  private renderBarrasApiladas() {
    if (!this.actividades.length) { this.chartBarras?.destroy(); return; }

    // Agrupa yyyy-MM y promedia minutos
    const grupos = new Map<string, number[]>();
    for (const a of this.actividades) {
      const d = new Date(a.fecha);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(a.duracionMin);
    }

    const keysOrden = Array.from(grupos.keys()).sort();
    const labels = keysOrden.map(k => {
      const [yy, mm] = k.split('-').map(Number);
      const date = new Date(yy, mm - 1, 1);
      return date.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
    });
 
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
    const dataProm = keysOrden.map(k => avg(grupos.get(k)!));

    this.chartBarras?.destroy();
    this.chartBarras = new Chart('actChartBarras', {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Promedio mensual (min)', data: dataProm }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // === Historial / Acciones
  trackById = (_: number, a: ActividadReadDTO) => a.actividadId;

  irAgregar() {
    this.router.navigate(['/panel/actividad/agregar'], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }

  irEditar(id: number | null | undefined) {
    if (id == null) return;
    this.router.navigate(['/panel/actividad/editar', id], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }

  async confirmarEliminar(id: number | null | undefined) {
    if (id == null) return;

    const a = await this.alert.create({
      header: 'Eliminar actividad',
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
              (await this.toast.create({ message: 'Eliminado', color: 'success', duration: 1000 })).present();
            } catch {
              (await this.toast.create({ message: 'No se pudo eliminar', color: 'danger', duration: 1500 })).present();
            }
          }
        }
      ]
    });
    await a.present();
  }
}
