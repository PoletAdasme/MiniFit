import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { Component, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Chart from 'chart.js/auto';

// Swiper (web components)
import { register } from 'swiper/element/bundle';
register();

import {
  ComidasService,
  TipoComida,
  ComidaDetalleDTO,
  ComidaItemDetalleDTO,
  ComidaHistResumen
} from '../comidas.services';

@Component({
  selector: 'app-comidas-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderBarComponent],
  templateUrl: './comidas-dashboard.page.html',
  styleUrls: ['./comidas-dashboard.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ComidasDashboardPage implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ComidasService);
  private alert = inject(AlertController);
  private toast = inject(ToastController);

  // Debug
  private readonly DEBUG = true;
  private dbg(...a: any[]) { if (this.DEBUG) console.log('[Charts]', ...a); }

  hijoId!: number;
  hijoNombre?: string;

  // filtros
  vista: 'semanal' | 'mensual' | 'anual' = 'mensual';
  idTipoComidaFiltro: number | '' = '';
  tipos: TipoComida[] = [];

  desdeISO!: string;
  hastaISO!: string;
  readonly todayIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);

  cargando = false;

  // datos
  comidas: ComidaDetalleDTO[] = [];
  historial: ComidaHistResumen[] = [];

  // charts
  private chartLinea?: Chart;
  private chartTorta?: Chart;
  private chartBarras?: Chart;

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

    // tipos
    this.tipos = await firstValueFrom(this.svc.getTiposComida());

    // rango por vista
    this.ajustarRangoPorVista(this.vista);
    await this.cargarYGraficar();
  }

  ngOnDestroy() { this.destroyCharts(); }

  // --------- Filtros ---------
  limpiarFiltros() {
    this.vista = 'mensual';
    this.idTipoComidaFiltro = '';
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

  onVistaChange() { this.ajustarRangoPorVista(this.vista); }

  private ajustarRangoPorVista(v: 'semanal'|'mensual'|'anual') {
    const hoy = new Date();
    const hasta = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
    const desde = new Date(hasta);
    if (v === 'semanal')      desde.setDate(hasta.getDate() - 6);
    else if (v === 'mensual') desde.setMonth(hasta.getMonth() - 1);
    else                      desde.setFullYear(hasta.getFullYear() - 1);
    this.desdeISO = desde.toISOString().slice(0, 10);
    this.hastaISO = hasta.toISOString().slice(0, 10);
  }

  // --------- Carga + gráficos ---------
  private async cargarYGraficar() {
    if (!this.hijoId) return;
    this.cargando = true;
    try {
      // detalle para gráficos
      this.comidas = await firstValueFrom(
        this.svc.listarDetalle(this.hijoId, this.desdeISO, this.hastaISO)
      );
      this.dbg('detalle normalizado', this.comidas);

      // historial resumido para tarjeta
      this.historial = await firstValueFrom(
        this.svc.historialResumen(
          this.hijoId,
          this.desdeISO,
          this.hastaISO,
          this.idTipoComidaFiltro === '' ? undefined : Number(this.idTipoComidaFiltro)
        )
      );

      // redibujar gráficos
      this.renderLinea();
      this.renderTorta();
      this.renderBarrasApiladas();
    } catch (e) {
      console.error(e);
      (await this.toast.create({
        message: 'No se pudieron cargar comidas',
        color: 'danger',
        duration: 1500
      })).present();
    } finally {
      this.cargando = false;
    }
  }

  // --------- Charts ---------
  private renderLinea() {
    if (!this.comidas.length) { this.chartLinea?.destroy(); return; }

    const map = new Map<string, number>();
    for (const c of this.comidas) {
      const d = this.parseFecha((c as any).Fecha);
      if (!d) continue; // evita RangeError
      const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
      const kcal = (c.Items || []).reduce((s: number, i: ComidaItemDetalleDTO) => s + Number(i.Kcal || 0), 0);
      map.set(key, (map.get(key) || 0) + kcal);
    }

    const entries = Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
    const labels = entries.map(([d]) => {
      const dd = this.parseFecha(d)!;
      return dd.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
    });
    const data = entries.map(([,v]) => v);

    this.chartLinea?.destroy();
    this.chartLinea = new Chart('chartLinea', {
      type: 'line',
      data: {
        labels,
        datasets: [{ label: 'Kcal por día', data, tension: .35, fill: false }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private renderTorta() {
    if (!this.comidas.length) { this.chartTorta?.destroy(); return; }

    const tipoNombre = (id:number) => this.tipos.find(t=>t.idTipoComida===id)?.nombre ?? `Tipo ${id}`;
    const buckets = new Map<string, number>();
    for (const c of this.comidas) {
      const kcal = (c.Items || []).reduce((s,i)=> s + Number(i.Kcal || 0), 0);
      const key = tipoNombre((c as any).IdTipoComida);
      buckets.set(key, (buckets.get(key) || 0) + kcal);
    }

    const labels = Array.from(buckets.keys());
    const data = Array.from(buckets.values());

    this.chartTorta?.destroy();
    this.chartTorta = new Chart('chartTorta', {
      type: 'pie',
      data: { labels, datasets: [{ label: 'Kcal por tipo', data }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private renderBarrasApiladas() {
    if (!this.comidas.length) { this.chartBarras?.destroy(); return; }

    type Sum = { p:number; c:number; g:number; count:number };
    const grupos = new Map<string, Sum>();

    for (const c of this.comidas) {
      const d = this.parseFecha((c as any).Fecha);
      if (!d) continue;
      const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
      const sum = grupos.get(key) ?? { p:0, c:0, g:0, count:0 };
      for (const it of (c.Items || [])) {
        sum.p += Number(it.Proteina_g || 0);
        sum.c += Number(it.Carbohidrato_g || 0);
        sum.g += Number(it.Grasa_g || 0);
      }
      sum.count++;
      grupos.set(key, sum);
    }

    const keysOrden = Array.from(grupos.keys()).sort();
    const labels = keysOrden.map(k => {
      const [yy, mm] = k.split('-').map(Number);
      return new Date(yy, mm-1, 1).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
    });
    const avg = (s:number, n:number) => n ? +(s/n).toFixed(1) : 0;
    const dataP = keysOrden.map(k => avg(grupos.get(k)!.p, grupos.get(k)!.count));
    const dataC = keysOrden.map(k => avg(grupos.get(k)!.c, grupos.get(k)!.count));
    const dataG = keysOrden.map(k => avg(grupos.get(k)!.g, grupos.get(k)!.count));

    this.chartBarras?.destroy();
    this.chartBarras = new Chart('chartBarras', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Proteína (g) prom.', data: dataP, stack: 'macros' },
          { label: 'Carbohidrato (g) prom.', data: dataC, stack: 'macros' },
          { label: 'Grasa (g) prom.', data: dataG, stack: 'macros' },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true } }
      }
    });
  }

  private destroyCharts() {
    this.chartLinea?.destroy();
    this.chartTorta?.destroy();
    this.chartBarras?.destroy();
    this.chartLinea = this.chartTorta = this.chartBarras = undefined;
  }

  // --------- Utils ---------
  private parseFecha(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date && !isNaN(value.getTime())) return value;

    if (typeof value === 'string') {
      const s = value.trim();

      // yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss
      const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (iso) {
        const y = Number(iso[1]), m = Number(iso[2]) - 1, d = Number(iso[3]);
        const dte = new Date(y, m, d);
        return isNaN(dte.getTime()) ? null : dte;
      }

      // fallback: reemplazar espacio por T
      const d2 = new Date(s.replace(' ', 'T'));
      if (!isNaN(d2.getTime())) return d2;
    }

    // timestamps numéricos
    const n = Number(value);
    if (Number.isFinite(n)) {
      const d = new Date(n);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  }

  // suma segura
  sum(items: any[] | undefined, prop: 'Kcal' | 'Proteina_g' | 'Carbohidrato_g' | 'Grasa_g'): number {
    if (!items?.length) return 0;
    return items.reduce((acc: number, it: any) => acc + (Number(it?.[prop]) || 0), 0);
  }
  len(items: any[] | undefined): number { return items?.length ?? 0; }

  // --------- Acciones ---------
  trackById = (_: number, h: ComidaHistResumen | ComidaDetalleDTO) =>
    (h as any).comidaId ?? (h as any).ComidaId;

  irAgregar() {
    this.router.navigate(['/panel/comidas/agregar'], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }

  irEditar(id: number | null | undefined) {
    if (id == null) return;
    
      this.router.navigate(['/panel/comidas/editar', id], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });

    
  }

  async confirmarEliminar(id: number| null | undefined) {
    if (id == null) return;
    const a = await this.alert.create({
      header: 'Eliminar comida',
      message: 'Se eliminará el encabezado y todos sus ítems.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive', handler: async () => {
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

  nombreTipo(id:number) {
    return this.tipos.find(t=>t.idTipoComida===id)?.nombre ?? `Tipo ${id}`;
  }
}
