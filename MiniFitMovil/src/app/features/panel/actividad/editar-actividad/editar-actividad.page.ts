import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { ActividadService, ActividadDTO } from '../actividad.services';
import { TiposEjerciciosService, TipoEjercicio } from '../tipos-ejercicios.service';

@Component({
  selector: 'app-editar-actividad',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, HeaderBarComponent],
  templateUrl: './editar-actividad.page.html',
  styleUrls: ['./editar-actividad.page.scss']
})
export class EditarActividadPage {
  id!: number;
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
    private toast: ToastController
  ) {}

  ionViewWillEnter() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const qp = this.route.snapshot.queryParamMap;
    this.hijoId = Number(qp.get('hijoId'));
    this.hijoNombre = qp.get('hijo') || undefined;

    this.tiposSvc.listar().subscribe(t => this.tipos = t ?? []);

    if (Number.isFinite(this.id)) {
      this.svc.getById(this.id).subscribe({
        next: (x) => {
          // fecha a yyyy-MM-dd
          const dateIso = new Date(x.fecha).toISOString().slice(0, 10);
          this.form.patchValue({
            fecha: dateIso,
            minutos: x.duracionMin,
            idTipoEjercicio: x.idTipoEjercicio
          });
        },
        error: async () => {
          (await this.toast.create({ message: 'No se encontró la actividad', color: 'danger', duration: 1200 })).present();
          this.volver();
        }
      });
    } else {
      this.volver();
    }
  }

  async guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;

    const v = this.form.value;
    const dto: ActividadDTO = {
      actividadId: this.id,
      hijoId: this.hijoId,
      fecha: v.fecha!,                         // yyyy-MM-dd
      duracionMin: Number(v.minutos),
      idTipoEjercicio: Number(v.idTipoEjercicio)
    };

    this.svc.editar(this.id, dto).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Cambios guardados', color: 'success', duration: 1000 })).present();
        this.volver();
      },
      error: async (err) => {
        (await this.toast.create({ message: err?.error ?? 'No se pudo actualizar', color: 'danger', duration: 1500 })).present();
      }
    }).add(() => this.guardando = false);
  }

  cancelar() { this.volver(); }

  private volver() {
    this.router.navigate(['/panel/actividad'], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }
}
