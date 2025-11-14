import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HijosService, Hijo } from '../../inicio/hijos.services';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private fb          = inject(FormBuilder);
  private auth        = inject(AuthService);
  private toastCtrl   = inject(ToastController);
  private router      = inject(Router);
  private hijosSvc       = inject(HijosService);
  showPassword = false;
  isSubmitting = false;
  hijos: Hijo[] = [];
 // Regla: mínimo 6, 1 mayúscula y 1 caracter especial
 private passwordPolicy(ctrl: AbstractControl): ValidationErrors | null {
    const v = (ctrl.value ?? '') as string;
    if (!v) return null;
    const hasUpper = /[A-Z]/.test(v);
    const hasSpecial = /[^A-Za-z0-9]/.test(v);
    return hasUpper && hasSpecial ? null : { policy: true };
  }


  loginForm = this.fb.group({
    rut: this.fb.control('', { validators: [Validators.required] }),
    password: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(6), this.passwordPolicy.bind(this)],
    }),
  });

   
  togglePassword() { this.showPassword = !this.showPassword; }
  get passwordToggleLabel() { return this.showPassword ? 'Ocultar' : 'Ver'; }

  hasError(control: 'rut' | 'password', error: string) {
    const c = this.loginForm.controls[control];
    return c.touched && c.hasError(error);
  }

      /** 🔹 Da formato 20334918K -> 20.334.918-K */
  formatearRut(event: any) {
    let valor = event.target.value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (valor.length > 1) {
      const cuerpo = valor.slice(0, -1);
      const dv = valor.slice(-1);
      valor = cuerpo
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        .concat('-', dv);
    }
    this.loginForm.controls['rut'].setValue(valor, { emitEvent: false });
  }

 async onLogin() {
  if (this.loginForm.invalid || this.isSubmitting) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isSubmitting = true;
  try {
    const { rut, password } = this.loginForm.value as { rut: string; password: string };
    await this.auth.login({ rut, password });
    await (await this.toastCtrl.create({ message: '¡Bienvenido!', duration: 1200 })).present();

    // Trae hijos del usuario
    const hijos = await firstValueFrom(this.hijosSvc.getMisHijos());
    const total = hijos?.length ?? 0;

    if (total === 0) {
      // No tiene hijos: crea el primero
      this.router.navigateByUrl('/inicio/crear-hijo', { replaceUrl: true });
      return;
    }

    if (total === 1) {
      // Tiene 1: deja seleccionado ese hijo y ve al selector
      this.hijosSvc.setSelectedHijo(hijos[0].hijoId); // por si tu flujo usa el seleccionado
      this.router.navigateByUrl('/inicio/selector-hijo', { replaceUrl: true });
      return;
    }

    // 2 o más hijos: al Home
    this.router.navigateByUrl('/inicio/home', { replaceUrl: true });

  } catch {
    (await this.toastCtrl.create({ message: 'Credenciales inválidas', color: 'danger', duration: 1600 })).present();
  } finally {
    this.isSubmitting = false;
  }
}


  goCrearUsuario() { this.router.navigateByUrl('/auth/crear-usuario'); }
}
