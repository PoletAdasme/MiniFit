import { Component } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { ActividadService, CreateActividadDTO } from '../actividad.services';
import { TiposEjerciciosService, TipoEjercicio } from '../tipos-ejercicios.service';

@Component({
  selector: 'app-agregar-actividad',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, HeaderBarComponent],
  templateUrl: './agregar-actividad.page.html',
  styleUrls: ['./agregar-actividad.page.scss']
})
export class AgregarActividadPage {
  hijoId!: number;
  hijoNombre?: string;

  tipos: TipoEjercicio[] = [];
  guardando = false;

  form = this.fb.group({
    fecha: ['', Validators.required],
    minutos: [null as number | null, [Validators.required, Validators.min(1)]],
    idTipoEjercicio: [null as number | null, Validators.required]
  });

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: ActividadService,
    private tiposSvc: TiposEjerciciosService,
    private toast: ToastController,
  ) {}

  async ionViewWillEnter() {
    const qp = this.route.snapshot.queryParamMap;
    const hijoId = Number(qp.get('hijoId'));
    this.hijoNombre = qp.get('hijo') || undefined;

    if (!Number.isFinite(hijoId) || hijoId <= 0) {
      (await this.toast.create({ message: 'Falta hijoId', color: 'warning', duration: 1200 })).present();
      this.router.navigate(['/inicio/selector-hijo']);
      return;
    }
    this.hijoId = hijoId;

    // fecha por defecto: hoy (yyyy-MM-dd)
    const todayIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    this.form.patchValue({ fecha: todayIso });

    // Llama esto cuando entras a la página (ya lo tienes en ionViewWillEnter)
    this.tiposSvc.listar().subscribe({
      next: (tipos) => {
        console.log('[Tipos API] respuesta:', tipos);
        this.tipos = tipos ?? [];
      },
      error: async (err) => {
        console.error('[Tipos API] error:', err);
        (await this.toast.create({ message: 'No se pudieron cargar los tipos', color: 'danger', duration: 1200 })).present();
      }
    });

    

  }

    // Maneja el cambio del select y loguea lo elegido
  onTipoChange(ev: CustomEvent) {
    const raw = (ev as any)?.detail?.value;
    console.log('[Select cambio] raw value:', raw, 'typeof:', typeof raw);

    const id = raw == null ? null : Number(raw);
    console.log('[Select casteado] idTipoEjercicio (number or null):', id, 'typeof:', typeof id);

    this.form.patchValue({ idTipoEjercicio: id });
  }

  // En guardar, loguea TODO lo que mandas
  async guardar() {
    if (this.form.invalid || !this.hijoId) {
      this.form.markAllAsTouched();
      console.warn('[Guardar] Form inválido:', this.form.value, this.form.errors, this.form);
      return;
    }
    this.guardando = true;
    const v = this.form.value;

    // Construye el DTO asegurando números
    const dto = {
      hijoId: this.hijoId,
      fecha: v.fecha!, // yyyy-MM-dd
      duracionMin: Number(v.minutos),
      idTipoEjercicio: Number(v.idTipoEjercicio)
    };

    console.log('[Guardar] payload a API /ActividadDiaria:', dto);

    this.svc.crear(dto).subscribe({
      next: async (res) => {
        console.log('[Guardar] OK respuesta API:', res);
        (await this.toast.create({ message: 'Actividad registrada', color: 'success', duration: 1000 })).present();
        this.router.navigate(['/panel/actividad'], { queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre } });
      },
      error: async (err) => {
        console.error('[Guardar] ERROR API:', err);
        (await this.toast.create({ message: err?.error ?? 'No se pudo guardar', color: 'danger', duration: 1500 })).present();
      }
    }).add(() => this.guardando = false);
  }

  cancelar() {
    this.router.navigate(['/panel/actividad'], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }
}
