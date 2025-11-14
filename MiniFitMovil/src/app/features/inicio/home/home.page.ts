import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, of, switchMap, takeUntil, firstValueFrom } from 'rxjs';

import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { HijosService, Hijo } from '../hijos.services';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderBarComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomePage implements OnInit, OnDestroy {
  // --- inyección de servicios ---
  private hijosSvc  = inject(HijosService);
  private toastCtrl = inject(ToastController);
  private router    = inject(Router);
  private route     = inject(ActivatedRoute);

  // --- ciclo de vida / limpieza ---
  private destroy$ = new Subject<void>();

  // --- datos / estado ---
  hijos: Hijo[] = [];
  hijoActualId: number | null = null;

  cargando = false;
  hijoActivo: any | null = null;

  // para el botón "Ver lista hijos"
  hijosCount = 0;
  soloUnHijo = false;

  // === Carrusel (coverflow) ===
  productosCarousel = [
    { nombre: 'Pan',      src: 'assets/img/pan.png',      badge: 'Pan del día' },
    { nombre: 'Ramitas',  src: 'assets/img/ramitas.png',  badge: 'Snack favorito' },
    { nombre: 'Yogurt',   src: 'assets/img/yogurt.png',   badge: 'Rico en calcio' },
    { nombre: 'Jugo',     src: 'assets/img/jugo.png',     badge: '100% sabor' },
    { nombre: 'Despensa', src: 'assets/img/despensa.png', badge: 'Básicos del hogar' },
  ];
  current = 0;
  showCoverflow = false;
  private showTimer?: any;
  private coverflowTimer?: any;

  // utilidades carrusel
  private mod(n: number, m: number) { return ((n % m) + m) % m; }
  posClass(i: number): 'center'|'left1'|'right1'|'left2'|'right2'|'hidden' {
    const len = this.productosCarousel.length;
    const rel = this.mod(i - this.current, len);
    if (rel === 0) return 'center';
    if (rel === 1) return 'right1';
    if (rel === len - 1) return 'left1';
    if (rel === 2) return 'right2';
    if (rel === len - 2) return 'left2';
    return 'hidden';
  }
  nextSlide() { this.current = this.mod(this.current + 1, this.productosCarousel.length); }
  prevSlide() { this.current = this.mod(this.current - 1, this.productosCarousel.length); }

  ionViewDidEnter() {
    this.showTimer = setTimeout(() => {
      this.showCoverflow = true;
      this.coverflowTimer = setInterval(() => this.nextSlide(), 2800);
    }, 3000);
  }
  ionViewWillLeave() {
    clearTimeout(this.showTimer);
    clearInterval(this.coverflowTimer);
  }

  // ========= Getters prácticos (si los usas en el HTML) =========
  get hijoActual(): Hijo | undefined {
    return this.hijos.find(h => h.hijoId === this.hijoActualId);
  }
  get hijoNombre(): string {
    return this.hijoActual ? `${this.hijoActual.nombre} ${this.hijoActual.apellidoPaterno}`.trim() : '—';
  }
  get hijoEdad(): number | null {
    return this.hijoActual?.edad ?? null;
  }

  // ========= Init =========
  ngOnInit() {
    // Reacción al hijo seleccionado (single source of truth desde el service)
    this.hijosSvc.selectedHijoId$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(id => (id ? this.hijosSvc.getHijoById(id) : of(null)))
      )
      .subscribe({
        next: h => (this.hijoActivo = h),
        error: async () => {
          this.hijoActivo = null;
          (await this.toastCtrl.create({
            message: 'No se pudo cargar el hijo',
            color: 'danger',
            duration: 1600
          })).present();
        },
      });
  }

  // ========= Entrada a la vista =========
  async ionViewWillEnter() {
    // Actualiza contador para el botón "Ver lista hijos"
    await this.actualizarContadorHijos();

    // 1) Si vienen query params (hijoId), úsalos y valida existencia
    const qp = this.route.snapshot.queryParamMap;
    const qpHijo   = qp.get('hijoId');
    const qpUserId = qp.get('userId');

    if (qpHijo) {
      const hijoId = Number(qpHijo);
      if (Number.isFinite(hijoId) && hijoId > 0) {
        const ok = await this.ensureHijoExiste(hijoId);
        if (ok) {
          this.hijosSvc.setSelectedHijo(hijoId);
          // Limpia la URL
          this.router.navigateByUrl('/inicio/home', { replaceUrl: true });
          return;
        } else {
          this.router.navigate(['/inicio/crear-hijo'], {
            replaceUrl: true,
            queryParams: { userId: qpUserId ?? undefined }
          });
          return;
        }
      }
    }

    // 2) Sin query param: intenta con selección persistida
    const sel = this.hijosSvc.getSelectedHijoIdSnapshot();
    if (sel) {
      const ok = await this.ensureHijoExiste(sel);
      if (ok) return;
      this.router.navigate(['/inicio/crear-hijo'], {
        replaceUrl: true,
        queryParams: { userId: qpUserId ?? undefined }
      });
      return;
    }

    // 3) Sin selección: trae lista y decide
    try {
      this.cargando = true;
      const lista = await firstValueFrom(this.hijosSvc.getMisHijos());
      this.hijos = lista ?? [];

      this.hijosCount = this.hijos.length;
      this.soloUnHijo = (this.hijosCount === 1);

      if (!this.hijos.length) {
        this.router.navigate(['/inicio/crear-hijo'], {
          replaceUrl: true,
          queryParams: { userId: qpUserId ?? undefined }
        });
        return;
      }

      const primero = this.hijos[0].hijoId;
      const ok = await this.ensureHijoExiste(primero);
      if (ok) {
        this.hijosSvc.setSelectedHijo(primero);
      } else {
        this.router.navigate(['/inicio/crear-hijo'], {
          replaceUrl: true,
          queryParams: { userId: qpUserId ?? undefined }
        });
      }
    } finally {
      this.cargando = false;
    }
  }

  // ========= Salida / limpieza =========
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.showTimer);
    clearInterval(this.coverflowTimer);
  }

  // ========= UI actions =========
  verListaCompleta(): void {
    this.router.navigate(['/inicio/selector-hijo']);
  }

  async onChangeHijo(ev: CustomEvent) {
    const id = Number((ev.detail as any).value);
    this.hijoActualId = id;
    localStorage.setItem('hijoActualId', String(id));
  }

  go(path: string) {
    const hijoId = this.hijosSvc.getSelectedHijoIdSnapshot();
    const userId = Number(localStorage.getItem('userId') || '') || undefined;
    const extras = hijoId ? { queryParams: { hijoId, userId } } : undefined;
    this.router.navigateByUrl(path, { state: extras?.queryParams });
  }

  irASelectorHijo() {
    this.router.navigateByUrl('/inicio/selector-hijo');
  }

  irActividad(h: Hijo) {
    this.router.navigate(['/panel/actividad'], { queryParams: { hijoId: h.hijoId } });
  }
  irComidas(h: Hijo) {
    this.router.navigate(['/panel/comidas'], { queryParams: { hijoId: h.hijoId } });
  }
  irMediciones(h: Hijo) {
    this.router.navigate(['/panel/mediciones'], { queryParams: { hijoId: h.hijoId } });
  }
  irReporte(h: Hijo) {
    this.router.navigate(['/panel/reportes'], { queryParams: { hijoId: h.hijoId } });
  }

  // ========= Helpers =========
  private async ensureHijoExiste(hijoId: number): Promise<boolean> {
    try {
      const h = await firstValueFrom(this.hijosSvc.getHijoById(hijoId));
      return !!h;
    } catch {
      return false;
    }
  }

  private async actualizarContadorHijos(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.hijosSvc.getMisHijos());
      this.hijosCount = Array.isArray(lista) ? lista.length : 0;
      this.soloUnHijo = (this.hijosCount === 1);
    } catch {
      this.hijosCount = 0;
      this.soloUnHijo = false;
    }
  }
}
