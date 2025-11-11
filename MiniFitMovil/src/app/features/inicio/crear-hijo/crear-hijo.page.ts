import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HijosService, DvChar } from '../hijos.services';
import { firstValueFrom } from 'rxjs';

interface CreateHijoDTO {
  rut: number;
  dv: DvChar;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNac: string;
}

@Component({
  selector: 'app-crear-hijo',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './crear-hijo.page.html',
  styleUrls: ['./crear-hijo.page.scss']
})
export class CrearHijoPage {
  private fb         = inject(NonNullableFormBuilder);
  private hijosSvc   = inject(HijosService);
  private router     = inject(Router);
  private toastCtrl  = inject(ToastController);
  private alertCtrl  = inject(AlertController);
  private loadingCtrl = inject(LoadingController);

  enviando = false;
  guardando = false;

 private toDateISO(d: Date) {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  
  todayIso = this.toDateISO(new Date());
  private oneYearAgoISO(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return this.toDateISO(d);
  }

 form = this.fb.group({
    rutCompleto:      this.fb.control('', { validators: [Validators.required, this.rutValido] }),
    nombre:           this.fb.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    apellidoPaterno:  this.fb.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    apellidoMaterno:  this.fb.control(''),                               // opcional
    fechaNac:         this.fb.control<string | null>(null, { validators: [Validators.required,this.minAgeValidator(1)] }),
    edad:             this.fb.control<number | null>({ value: null, disabled: true }, { validators: [Validators.min(1)] })
  });


  constructor() {
    // default: hace 1 año
    this.form.controls.fechaNac.setValue(this.oneYearAgoISO());

    // recalcula edad
    this.form.controls.fechaNac.valueChanges.subscribe(val => {
      const edad = this.calcularEdad(val);
      this.form.controls.edad.setValue(edad);
    });
  }

  // ====== Validadores RUT ======

  private rutValido(): ValidatorFn {
    return (c: AbstractControl) => {
      const raw = (c.value ?? '').toString().trim().toUpperCase();
      if (!raw) return { required: true };

      // Acepta formatos con o sin puntos/guión
      const clean = raw.replace(/[^0-9Kk]/g, '').toUpperCase();
      if (clean.length < 2) return { rut: true };

      const dv = clean.slice(-1);
      const numStr = clean.slice(0, -1);
      if (!/^\d+$/.test(numStr)) return { rut: true };

      const esperado = this.dvCalcular(numStr);
      return esperado === dv ? null : { rut: true };
    };
  }

  private dvCalcular(numStr: string): string {
    let suma = 0, mult = 2;
    for (let i = numStr.length - 1; i >= 0; i--) {
      suma += parseInt(numStr[i], 10) * mult;
      mult = mult === 7 ? 2 : mult + 1;
    }
    const res = 11 - (suma % 11);
    if (res === 11) return '0';
    if (res === 10) return 'K';
    return String(res);
  }

  private calcularEdad(iso: string | null): number | null {
    if (!iso) return null;
    const hoy = new Date();
    const d = new Date(iso);
    let edad = hoy.getFullYear() - d.getFullYear();
    const m = hoy.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--;
    return edad;
  }

  get hasRutError() {
    const c = this.form.controls.rutCompleto;
    return c.touched && c.invalid;
  }

      // --- auto-cálculo de edad desde fechaNac ---
// Límite superior para el ion-datetime si lo usas con [max]
  maxDateISO = new Date().toISOString();
  maxFecha = new Date().toISOString(); // hoy
  minFecha = new Date(2000, 0, 1).toISOString(); // año 2000 o el rango que quieras

    hasError(ctrl: keyof CrearHijoPage['form']['controls'], err: string) {
    const c = this.form.controls[ctrl];
    return c.touched && c.hasError(err);
  }

  // Eventos para la máscara del RUT
  onRutInput(ev: any) {
    const raw = String(ev?.detail?.value ?? '');
    const formatted = this.formateaRut(raw);
    this.form.controls.rutCompleto.setValue(formatted, { emitEvent: false });
  }
  
  onRutBlur() {
    const v = this.form.controls.rutCompleto.value ?? '';
    this.form.controls.rutCompleto.setValue(this.formateaRut(v), { emitEvent: false });
    this.form.controls.rutCompleto.markAsTouched();
  }

  

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }


     // Normaliza RUT
    const parsed = this.parseRut(this.form.controls.rutCompleto.value);
    if (!parsed) {
      (await this.toastCtrl.create({ message: 'RUT inválido.', color: 'danger', duration: 1500 })).present();
      return;
    }

      const clean = this.form.controls.rutCompleto.value.replace(/[^0-9Kk]/g, '');
        const dvStr = clean.slice(-1);
        const dv    = dvStr as DvChar;
        const rut   = parseInt(clean.slice(0, -1), 10);


      const body: CreateHijoDTO = {
      rut,
      dv,
      nombre: this.form.controls.nombre.value.trim(),
      apellidoPaterno: this.form.controls.apellidoPaterno.value.trim(),
      apellidoMaterno: this.form.controls.apellidoMaterno.value?.trim() || null,
      fechaNac: this.form.controls.fechaNac.value!,
    };

    this.enviando = true;
    try {
      this.guardando = true;

      const resp = await firstValueFrom(this.hijosSvc.crearHijo(body));
      let hijoId: number | null = (resp && (resp.hijoId || resp.usuarioId)) ?? null;

      if (!hijoId) {
        const lista = await firstValueFrom(this.hijosSvc.getMisHijos());
        const recien = lista?.find(h => h.rut === body.rut && String(h.dv).toUpperCase() === body.dv);
        hijoId = recien?.hijoId ?? null;
      }

      (await this.toastCtrl.create({ message: 'Hijo registrado', duration: 1500 })).present();

      const userId = Number(localStorage.getItem('userId') || '') || undefined;

      if (hijoId) {
        this.hijosSvc.setSelectedHijo(hijoId);
        this.router.navigate(['/inicio/home'], {
          replaceUrl: true,
          queryParams: { hijoId, userId }
        });
      } else {
        // fallback si no logramos identificar el id creado
        this.router.navigate(['/inicio/selector-hijo'], {
          replaceUrl: true,
          queryParams: { userId }
        });
      }
    } catch (e: any) {
      const msg = e?.error || 'No se pudo crear la cuenta';
      (await this.alertCtrl.create({ header: 'Error', message: msg, buttons: ['OK'] })).present();
    } finally {
      this.enviando = false;
      this.guardando = false;
    }
  }

  cancelar() { 
    this.router.navigateByUrl('/inicio/home');
  }
  // Edad mínima
  private minAgeValidator(minYears: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const iso = c.value as string | null | undefined;
      if (!iso) return null;
      const age = this.calcAge(iso);
      return age >= minYears ? null : { minAge: { required: minYears, actual: age } };
    };
  }

  private calcAge(iso?: string | null): number {
    if (!iso) return 0;
    const birth = new Date(iso);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(age, 0);
  }


   // -------------------- RUT: máscara + validación --------------------
  private formateaRut(v: string): string {
    if (!v) return '';
    // elimina todo menos números y K/k
    const clean = v.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!clean) return '';

    const dv = clean.slice(-1);
    let body = clean.slice(0, -1);

    // separar con puntos de derecha a izquierda
    let out = '';
    while (body.length > 3) {
      out = '.' + body.slice(-3) + out;
      body = body.slice(0, -3);
    }
    out = body + out;
    return `${out}-${dv}`;
  }


   private parseRut(v: string): { rut: number; dv: string } | null {
    if (!v) return null;
    const clean = v.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!/^\d+[0-9K]$/.test(clean)) return null;

    const dv = clean.slice(-1);
    const numStr = clean.slice(0, -1);
    const num = Number(numStr);
    if (!Number.isFinite(num)) return null;

    // calcula DV
    let sum = 0, mul = 2;
    for (let i = numStr.length - 1; i >= 0; i--) {
      sum += Number(numStr[i]) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const rem = 11 - (sum % 11);
    const dvCalc = rem === 11 ? '0' : rem === 10 ? 'K' : String(rem);

    if (dv !== dvCalc) return null;
    return { rut: num, dv };
  }

}
