// src/app/features/panel/perfil/perfil.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { UsuarioService, UsuarioDTO } from '../usuario.service';
import { HijosService, Hijo } from '../../inicio/hijos.services';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, HeaderBarComponent],
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private usuarioSvc = inject(UsuarioService);
  private hijosSvc = inject(HijosService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  cargandoPerfil = false;
  guardandoPerfil = false;
  cargandoHijos = false;

  perfilActual?: UsuarioDTO;
  hijos: Hijo[] = [];

  form = this.fb.group({
    nombre:   this.fb.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    correo:   this.fb.control('', { validators: [Validators.required, Validators.email] }),
    telefono: this.fb.control('', { validators: [Validators.required, Validators.minLength(8)] }),
  });

  ngOnInit(): void {
    // Carga inicial (primera vez que se crea el componente)
    this.refresh();
  }

  // 🔁 Se llama SIEMPRE que la vista vuelve a ser visible (al regresar de agregar/editar hijo, etc.)
  ionViewWillEnter() {
    this.refresh();
  }

  private async refresh() {
    // Ejecuta ambas cargas en paralelo
    await Promise.all([ this.cargarPerfil(), this.cargarHijos() ]);
  }

  // --- Perfil ---
  async cargarPerfil() {
    try {
      this.cargandoPerfil = true;
      const perfil = await firstValueFrom(this.usuarioSvc.getMiPerfil());
      this.perfilActual = perfil;
      this.form.patchValue({
        nombre:   perfil.nombre ?? '',
        correo:   perfil.correo ?? '',
        telefono: perfil.telefono ?? '',
      });
    } catch {
      (await this.toastCtrl.create({ message: 'No se pudo cargar el perfil', color: 'danger', duration: 1800 })).present();
    } finally {
      this.cargandoPerfil = false;
    }
  }

  async guardarPerfil() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      this.guardandoPerfil = true;
      const payload = {
        nombre:   this.form.value.nombre!.trim(),
        correo:   this.form.value.correo!.trim(),
        telefono: this.form.value.telefono!.trim(),
      };
      await firstValueFrom(this.usuarioSvc.updateMiPerfil(payload));
      (await this.toastCtrl.create({ message: 'Perfil actualizado', duration: 1500 })).present();

      if (this.perfilActual) {
        this.perfilActual.nombre   = payload.nombre;
        this.perfilActual.correo   = payload.correo;
        this.perfilActual.telefono = payload.telefono;
      }
    } catch (e: any) {
      const msg = typeof e?.error === 'string' ? e.error : 'Error al actualizar';
      (await this.toastCtrl.create({ message: msg, color: 'danger', duration: 1800 })).present();
    } finally {
      this.guardandoPerfil = false;
    }
  }

  // --- Hijos ---
  async cargarHijos() {
    try {
      this.cargandoHijos = true;
      this.hijos = (await firstValueFrom(this.hijosSvc.getMisHijos())) ?? [];
    } catch {
      (await this.toastCtrl.create({ message: 'No se pudieron cargar los hijos', color: 'danger', duration: 1600 })).present();
    } finally {
      this.cargandoHijos = false;
    }
  }

  agregarHijo() {
    this.router.navigateByUrl('/hijo/agregar-hijo');
  }
  
  editarHijo(h: Hijo) {
    this.router.navigate(['/hijo/editar-hijo', h.hijoId]);
  }


  async eliminarHijo(h: Hijo) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar hijo',
      message: `¿Seguro que deseas eliminar a ${h.nombre} ${h.apellidoPaterno}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              const svc: any = this.hijosSvc as any;
              if (svc.deleteHijo) {
                await firstValueFrom(svc.deleteHijo(h.hijoId));
                (await this.toastCtrl.create({ message: 'Hijo eliminado', duration: 1200 })).present();
                this.cargarHijos(); // refresco puntual
              } else {
                throw new Error('deleteHijo no implementado');
              }
            } catch {
              (await this.toastCtrl.create({ message: 'No se pudo eliminar', color: 'danger', duration: 1600 })).present();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  hasError(ctrl: keyof PerfilPage['form']['controls'], err: string) {
    const c = this.form.controls[ctrl];
    return c.touched && c.hasError(err);
  }
}
