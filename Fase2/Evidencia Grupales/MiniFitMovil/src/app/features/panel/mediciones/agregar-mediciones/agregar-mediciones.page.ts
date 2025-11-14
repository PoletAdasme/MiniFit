import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MedicionesService, CreateMedicionDTO } from '../mediciones.services';
// Swiper (web components)
import { register } from 'swiper/element/bundle';
register();

@Component({
  standalone: true,
  selector: 'app-agregar-mediciones',
  templateUrl: './agregar-mediciones.page.html',
  styleUrls: ['./agregar-mediciones.page.scss'],
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule, HeaderBarComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AgregarMedicionesPage {
  form!: FormGroup;
  guardando = false;

  hijoId!: number;
  hijoNombre = '';
 
  constructor(
    private fb: FormBuilder,
    private svc: MedicionesService,
    private toast: ToastController,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.initForm();
  }

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    this.hijoId = Number(qp.get('hijoId') ?? 0);
    this.hijoNombre = qp.get('hijo') ?? '';
  }

  private hoyISO(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private initForm() {
    this.form = this.fb.group({
      fecha: [this.hoyISO(), [Validators.required]],
      pesoKg: [null, [Validators.required, Validators.min(1), Validators.max(300)]],
      estaturaCm: [null, [Validators.required, Validators.min(30), Validators.max(250)]],
    });
  }

  // atajo para el template (compatible con strictTemplates)
  get f() { return this.form.controls; }

  /** Vista previa local del IMC (no se envía, solo display) */
  get imcPreview(): string | null {
    const p = Number(this.f['pesoKg']?.value);
    const e = Number(this.f['estaturaCm']?.value);
    if (!p || !e) return null;
    const imc = p / Math.pow(e / 100, 2);
    if (!isFinite(imc)) return null;
    return imc.toFixed(1);
  }

  async guardar() {
    if (!this.hijoId) {
      (await this.toast.create({ message: 'Falta el hijoId', color: 'danger', duration: 1400 })).present();
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      (await this.toast.create({ message: 'Completa correctamente los datos', color: 'warning', duration: 1400 })).present();
      return;
    }

    const v = this.form.value;
    const dto: CreateMedicionDTO = {
      HijoId: this.hijoId,
      Fecha: v['fecha'], // yyyy-MM-dd
      PesoKg: Number(v['pesoKg']),
      EstaturaCm: Number(v['estaturaCm']),
    };

    try {
      this.guardando = true;
      await firstValueFrom(this.svc.crear(dto));
      (await this.toast.create({ message: 'Medición guardada', color: 'success', duration: 1200 })).present();
      this.router.navigate(['/panel/mediciones'], {
        queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
      });
    } catch {
      (await this.toast.create({ message: 'No se pudo guardar', color: 'danger', duration: 1500 })).present();
    } finally {
      this.guardando = false;
    }
  }

  cancelar() {
    this.router.navigate(['/panel/mediciones'], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }
}
