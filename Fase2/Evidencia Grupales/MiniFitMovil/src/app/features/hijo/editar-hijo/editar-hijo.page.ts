// src/app/features/hijo/Editar-hijo/editar-hijo.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';

import { HijosService } from '../../inicio/hijos.services';

type DV = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'K';

interface HijoDTO {
  hijoId: number;
  usuarioId: number;
  rut: number;
  dv: DV;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNac: string;   // ISO en la API o algo convertible a Date
  edad: number;
}

interface UpdateHijoDTO {
  rut: number;
  dv: DV;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNac: string; // ISO 8601
}

@Component({
  standalone: true,
  selector: 'app-editar-hijo',
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink, HeaderBarComponent],
  templateUrl: './editar-hijo.page.html',
  styleUrls: ['./editar-hijo.page.scss'],
})
export class editarHijoPage implements OnInit {

  // DI
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private hijosSvc = inject(HijosService);
  private toast = inject(ToastController);
  private nav = inject(NavController);

  hijoId!: number;
  cargando = false;
  guardando = false;

   private toDateISO(d: Date) {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  todayIso: string = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);

  private oneYearAgoISO(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return this.toDateISO(d);
  }

  private toISODateOnly(input: string | Date | null | undefined): string {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';

  // Corrige desfase de zona horaria y corta a yyyy-MM-dd
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}


  // --------- Validadores/Helpers (declarados antes del form) ----------
  private readonly rutValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const value = (ctrl.value ?? '').toString();
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return { rut: 'incompleto' };

    const rutStr = clean.slice(0, -1);
    const dv = clean.slice(-1);
    if (!/^\d+$/.test(rutStr)) return { rut: 'num' };

    if (!this.dvOk(parseInt(rutStr, 10), dv as DV)) return { rut: 'dv' };
    return null;
  };

  // Máscara simple en blur (puntos y guion)
  private formatoRut(rutConDv: string): string {
    const clean = (rutConDv || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return clean;

    const cuerpo = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Inserta puntos cada 3 desde el final
    let out = '';
    let i = cuerpo.length;
    let count = 0;
    while (i--) {
      out = cuerpo[i] + out;
      count++;
      if (count === 3 && i > 0) {
        out = '.' + out;
        count = 0;
      }
    }
    return `${out}-${dv}`;
  }

  private splitRut(rutFull: string): { rut: number; dv: DV } {
    const clean = rutFull.replace(/[^0-9kK]/g, '').toUpperCase();
    const rut = parseInt(clean.slice(0, -1), 10);
    const dv = clean.slice(-1) as DV;
    return { rut, dv };
  }

  // Cálculo de DV
  private dvOk(rutNum: number, dv: DV): boolean {
    let M = 0, S = 1;
    for (; rutNum; rutNum = Math.floor(rutNum / 10)) {
      S = (S + (rutNum % 10) * (9 - (M++ % 6))) % 11;
    }
    const dvCalc = S ? String(S - 1) : 'K';
    return dvCalc === dv.toString().toUpperCase();
  }

  // -------------------- Form --------------------
  form = this.fb.group({
    rutFull: this.fb.control<string>('', {
      validators: [Validators.required, this.rutValidator]
    }),
    nombre: this.fb.control<string>('', {
      validators: [Validators.required, Validators.minLength(2)]
    }),
    apPaterno: this.fb.control<string>('', {
      validators: [Validators.required, Validators.minLength(2)]
    }),
    apMaterno: this.fb.control<string>(''),
    fechaNac:         this.fb.control<string | null>(null, { validators: [Validators.required,this.minAgeValidator(1)] }),
   });

  ngOnInit(): void {
    const id = parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
    this.hijoId = id;
    if (!id) {
      this.volverConError('ID de hijo inválido');
      return;
    }
    this.cargar(id);
  }

  // -------------------- Carga --------------------
  private async cargar(id: number) {
    try {
      this.cargando = true;

      // ⬇️ Ajusta si tu servicio usa otro nombre:
      const dto = await firstValueFrom(this.hijosSvc.getHijoById(id)) as HijoDTO;

      this.form.patchValue({
        rutFull: this.formatoRut(`${dto.rut}${dto.dv}`),
        nombre: dto.nombre ?? '',
        apPaterno: dto.apellidoPaterno ?? '',
        apMaterno: dto.apellidoMaterno ?? '',
         fechaNac: this.toISODateOnly(dto.fechaNac),
      });
      
      
    } catch {
      this.volverConError('No se pudo cargar el hijo');
    } finally {
      this.cargando = false;
    }
  }

  // -------------------- Guardar --------------------
  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      this.guardando = true;

      const { rut, dv } = this.splitRut(this.form.controls.rutFull.value!);

      const body: UpdateHijoDTO = {
        rut,
        dv,
        nombre: this.form.controls.nombre.value!.trim(),
        apellidoPaterno: this.form.controls.apPaterno.value!.trim(),
        apellidoMaterno: this.form.controls.apMaterno.value?.trim() || null,
        fechaNac: this.form.controls.fechaNac.value!,
      };

      // ⬇️ Ajusta si tu servicio usa otro nombre:
      await firstValueFrom(this.hijosSvc.updateHijo(this.hijoId, body));

      (await this.toast.create({ message: 'Hijo actualizado', duration: 1400 }))
        .present();
      this.nav.navigateBack('/perfil');
    } catch (e: any) {
      const msg = typeof e?.error === 'string' ? e.error : 'No se pudo guardar';
      (await this.toast.create({ message: msg, color: 'danger', duration: 1800 }))
        .present();
    } finally {
      this.guardando = false;
    }
  }

  cancelar() {
    this.nav.navigateBack('/perfil');
  }

    // Cálculo de edad (ya lo tenías; inclúyelo si aún no)
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

    // Validador: la fecha debe corresponder a >= minYears años
  private minAgeValidator(minYears: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const iso = c.value as string | null | undefined;
      if (!iso) return null;
      const age = this.calcAge(iso);
      return age >= minYears ? null : { minAge: { required: minYears, actual: age } };
    };
  }
  // -------------------- UI helpers --------------------
  // Aplica máscara cuando el usuario sale del campo
  onRutBlur() {
    const v = this.form.controls.rutFull.value || '';
    this.form.controls.rutFull.setValue(this.formatoRut(v));
  }

  hasError(ctrl: keyof editarHijoPage['form']['controls'], err: string) {
    const c = this.form.controls[ctrl];
    return c.touched && c.hasError(err);
  }

  private async volverConError(msg: string) {
    (await this.toast.create({ message: msg, color: 'danger', duration: 1800 }))
      .present();
    this.nav.navigateBack('/perfil');
  }
}
