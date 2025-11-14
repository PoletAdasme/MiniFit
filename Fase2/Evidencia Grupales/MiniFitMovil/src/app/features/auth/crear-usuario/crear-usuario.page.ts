import { Component, inject, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

// ===== Helpers =====
function toISODate(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// (opcional simple) Valida formato básico de RUT (sin puntos, con guion y DV)
function basicRutValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v: string = (ctrl.value || '').trim();
  if (!v) return { required: true };
  // acepta "11111111-1" (8-9 dígitos + - + 0-9Kk)
  const ok = /^[0-9]{6,9}-[0-9Kk]$/.test(v.replace(/\./g, ''));
  return ok ? null : { rutFormat: true };
}

function notFutureDateValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value;
  if (!v) return null;
  const sel = new Date(v);
  const today = new Date();
  // normaliza hoy a 00:00
  today.setHours(0, 0, 0, 0);
  return sel > today ? { futureDate: true } : null;
}
/** DTO que espera el backend para crear en dbo.Usuarios */
type CrearUsuarioDTO = {
  Rut: number;
  Dv: '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'K';
  RolId: number;                    // siempre 2 (apoderado/usuario)
  Nombre: string;
  ApellidoPaterno: string;
  ApellidoMaterno?: string | null;
  Correo: string;
  Telefono: string;
  Clave: string;
};

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './crear-usuario.page.html',
  styleUrls: ['./crear-usuario.page.scss'],
})
export class CrearUsuarioPage {

  private fb          = inject(NonNullableFormBuilder);
  private http        = inject(HttpClient);
  private router      = inject(Router);
  private toastCtrl   = inject(ToastController);
  private alertCtrl   = inject(AlertController);
  

  enviando = false;

// 1) Deja el form como está, pero con bind:
form = this.fb.group({
  rut:       this.fb.control('', { validators: [Validators.required, this.rutValidator.bind(this)] }),
  nombre:    this.fb.control('', { validators: [Validators.required, Validators.minLength(2)] }),
  apPaterno: this.fb.control('', { validators: [Validators.required, Validators.minLength(2)] }),
  apMaterno: this.fb.control(''),
  correo:    this.fb.control('', { validators: [Validators.required, Validators.email] }),
  telefono:  this.fb.control('', { validators: [Validators.required, Validators.minLength(8)] }),
  clave:     this.fb.control('', { validators: [Validators.required, this.passwordValidator.bind(this)] }),
  confirmar: this.fb.control('', { validators: [Validators.required] }),
}, { validators: this.matchPasswords('clave', 'confirmar') });

// 2) Cambia tus validadores a MÉTODOS (no propiedades flecha):

rutValidator(c: AbstractControl): ValidationErrors | null {
  const v = (c.value ?? '').toString();
  const { rut, dv } = this.splitRut(v);
  if (!rut || !dv) return { rutInvalido: true };
  return this.validarDv(rut, dv) ? null : { rutInvalido: true };
}

passwordValidator(c: AbstractControl): ValidationErrors | null {
  const v = (c.value ?? '') as string;
  const ok = /[A-Z]/.test(v) && /[^A-Za-z0-9]/.test(v) && v.length >= 6;
  return ok ? null : { passwordWeak: true };
}


  /** Validador de coincidencia de claves */
  private matchPasswords(ctrl: string, confirm: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const a = group.get(ctrl)?.value;
      const b = group.get(confirm)?.value;
      return a && b && a === b ? null : { nomatch: true };
    };
  }

  // ========= Helpers de RUT & máscaras =========

  /** Formatea input de RUT mientras se escribe (12.345.678-K) */
  onRutInput(ev: CustomEvent) {
    const raw = (ev.detail as any).value ?? '';
    const clean = (raw as string).replace(/[^0-9kK]/g, '').toUpperCase();
    let f = '';
    if (clean.length > 1) {
      const cuerpo = clean.slice(0, -1);
      const dv = clean.slice(-1);
      // agrega puntos cada 3
      const cuerpoFmt = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      f = `${cuerpoFmt}-${dv}`;
    } else {
      f = clean;
    }
    this.form.controls.rut.setValue(f, { emitEvent: false });
  }

  onTelefonoInput(ev: CustomEvent) {
    const raw = (ev.detail as any).value ?? '';
    // solo números, sin máscara compleja
    const digits = (raw as string).replace(/\D/g, '').slice(0, 12);
    this.form.controls.telefono.setValue(digits, { emitEvent: false });
  }

  private splitRut(rutConFormato: string): { rut: string; dv: string } {
    const clean = (rutConFormato || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return { rut: '', dv: '' };
    return { rut: clean.slice(0, -1), dv: clean.slice(-1) };
  }

  private validarDv(rutNumStr: string, dv: string): boolean {
    // Módulo 11 clásico
    let suma = 0, m = 2;
    for (let i = rutNumStr.length - 1; i >= 0; i--) {
      suma += parseInt(rutNumStr[i], 10) * m;
      m = m === 7 ? 2 : m + 1;
    }
    const res = 11 - (suma % 11);
    const dvCalc = (res === 11 ? '0' : res === 10 ? 'K' : String(res));
    return dvCalc === dv.toUpperCase();
  }

  // ========= Envío =========

  async crear() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      (await this.toastCtrl.create({ message: 'Revisa los campos destacados', color: 'danger', duration: 1800 })).present();
      return;
    }

    const { rut, dv } = this.splitRut(this.form.controls.rut.value);
    const body: CrearUsuarioDTO = {
      Rut: parseInt(rut, 10),
      Dv: dv as CrearUsuarioDTO['Dv'],
      RolId: 2, // fijo: apoderado/usuario
      Nombre: this.form.controls.nombre.value.trim(),
      ApellidoPaterno: this.form.controls.apPaterno.value.trim(),
      ApellidoMaterno: this.form.controls.apMaterno.value?.trim() || null,
      Correo: this.form.controls.correo.value.trim(),
      Telefono: this.form.controls.telefono.value.trim(),
      Clave: this.form.controls.clave.value,
    };

    this.enviando = true;
    try {
      // POST api/Usuarios  (tu controlador ya lo tiene)
      await this.http.post(`${environment.apiBaseUrl}/Usuarios`, body).toPromise();
      (await this.toastCtrl.create({ message: 'Cuenta creada. Inicia sesión para continuar.', duration: 1800 })).present();
      this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    } catch (e: any) {
      const msg = e?.error || 'No se pudo crear la cuenta';
      (await this.alertCtrl.create({
        header: 'Error',
        message: msg,
        buttons: ['OK']
      })).present();
    }finally {
      this.enviando = false;
    }
  }

  cancelar() {
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }


  

  // accesos rápidos para template
  get f() { return this.form.controls; }
  has(ctrl: keyof typeof this.form.controls, err: string) {
    const c = this.form.controls[ctrl];
    return c.touched && c.hasError(err);
  }
}
