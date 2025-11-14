import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HijosService, Hijo } from '../hijos.services';

@Component({
  selector: 'app-selector-hijo',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './selector-hijo.page.html',
  styleUrls: ['./selector-hijo.page.scss'],
})
export class SelectorHijoPage implements OnInit {
  private hijosSvc = inject(HijosService);
  private router   = inject(Router);
  private route    = inject(ActivatedRoute);
  private toast    = inject(ToastController);

  hijos: Hijo[] = [];
  selectedHijoId: number | null = null;
  userIdFromQP: number | null = null;
  cargando = false;

  async ngOnInit() {
    await this.cargarHijos();

    const qp = this.route.snapshot.queryParamMap;
    const qpHijo   = qp.get('hijoId');
    const qpUserId = qp.get('userId');

    this.userIdFromQP = qpUserId ? Number(qpUserId) : (Number(localStorage.getItem('userId') || '') || null);

    // Si viene un hijoId válido, auto-seleccionar y continuar
    if (qpHijo) {
      const hijoId = Number(qpHijo);
      if (Number.isFinite(hijoId) && this.hijos.some(h => h.hijoId === hijoId)) {
        this.hijosSvc.setSelectedHijo(hijoId);
        this.router.navigate(['/inicio/home'], {
          replaceUrl: true,
          queryParams: { hijoId, userId: this.userIdFromQP ?? undefined }
        });
        return;
      }
    }

    // Si solo hay 1, seleccionarlo
    if (this.hijos.length === 1) {
      this.selectedHijoId = this.hijos[0].hijoId;
    }
  }

  onRadioChange(ev: CustomEvent) {
    this.selectedHijoId = +((ev.detail as any)?.value ?? 0) || null;
  }

async confirmarSeleccion() {
  if (!this.selectedHijoId) return;
  await this.hijosSvc.setSelectedHijo(this.selectedHijoId);

  const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/inicio/home';
  this.router.navigateByUrl(returnUrl, { replaceUrl: true });
}


  private async cargarHijos() {
    this.cargando = true;
    try {
      this.hijos = await firstValueFrom(this.hijosSvc.getMisHijos());
    } catch {
      (await this.toast.create({ message: 'No se pudieron cargar los hijos', color: 'danger', duration: 1600 })).present();
    } finally {
      this.cargando = false;
    }
  } 
  //Dyland
}
