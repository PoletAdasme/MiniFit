import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { MedicionesService, MedicionDTO, UpdateMedicionDTO } from '../mediciones.services';

@Component({
  selector: 'app-editar-mediciones',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderBarComponent],
  templateUrl: './editar-mediciones.page.html',
  styleUrls: ['./editar-mediciones.page.scss']
})
export class EditarMedicionesPage {

  // IDs y etiquetas de contexto
  hijoId!: number;
  hijoNombre?: string;

  // Id de la medición a editar
  medicionId!: number;

  // Modelo del formulario (ligero)
  fecha = '';         // yyyy-MM-dd
  pesoKg!: number;    // >= 1
  estaturaCm!: number;// >= 1
  imc?: number | null;

  cargando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: MedicionesService,
    private toast: ToastController,
    private alert: AlertController
  ) {}

  async ionViewWillEnter() {
    // lee param :id
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      (await this.toast.create({ message: 'ID inválido', color: 'warning', duration: 1400 })).present();
      this.router.navigate(['/inicio/home']);
      return;
    }
    this.medicionId = id;

    // lee query params de contexto
    const qp = this.route.snapshot.queryParamMap;
    const hijoId = Number(qp.get('hijoId'));
    this.hijoNombre = qp.get('hijo') || undefined;
    if (Number.isFinite(hijoId) && hijoId > 0) {
      this.hijoId = hijoId;
    }

    // carga medición
    await this.cargar();
  }

  private async cargar() {
    this.cargando = true;
    try {
      const dto = await firstValueFrom(this.svc.getById(this.medicionId));
      // mapea a modelo del form
      this.fecha = new Date(dto.fecha).toISOString().slice(0, 10);
      this.pesoKg = Number(dto.pesoKg);
      this.estaturaCm = Number(dto.estaturaCm);
      this.imc = dto.imc ?? null;
    } catch {
      (await this.toast.create({ message: 'No se pudo cargar la medición', color: 'danger', duration: 1500 })).present();
      this.volver();
    } finally {
      this.cargando = false;
    }
  }

  // Recalcula IMC en cliente solo para mostrar (no se envía al backend)
  onChangeCampos() {
    const kg = Number(this.pesoKg);
    const cm = Number(this.estaturaCm);
    if (kg > 0 && cm > 0) {
      const m = cm / 100;
      this.imc = +(kg / (m * m)).toFixed(1);
    } else {
      this.imc = null;
    }
  }

  async guardar() {
    // construcción del DTO de actualización (IMC no se envía)
    const body: UpdateMedicionDTO = {
      // si quieres permitir cambiar fecha, descomenta:
      // Fecha: this.fecha,
      PesoKg: Number(this.pesoKg),
      EstaturaCm: Number(this.estaturaCm),
    };

    if (!(body.PesoKg > 0) || !(body.EstaturaCm > 0)) {
      (await this.toast.create({ message: 'Revise peso y estatura', color: 'warning', duration: 1500 })).present();
      return;
    }

    try {
      await firstValueFrom(this.svc.actualizar(this.medicionId, body));
      (await this.toast.create({ message: 'Cambios guardados', color: 'success', duration: 1200 })).present();
      this.volver(true);
    } catch (e) {
      (await this.toast.create({ message: 'No se pudo guardar', color: 'danger', duration: 1500 })).present();
      console.error(e);
    }
  }

  

  volver(refrescar = false) {
    // vuelve al dashboard preservando el contexto
    this.router.navigate(['/panel/mediciones'], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre, refresh: refrescar ? '1' : undefined },
      replaceUrl: true
    });
  }
}
