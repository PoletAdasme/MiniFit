import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl
} from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';

import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import {
  ComidasService,
  TipoComida,
  ComidaInsUpDTO,
  ComidaItemInsertDTO
} from '../comidas.services';
import { OffService, OffProductoView } from '../off.services';

@Component({
  selector: 'app-agregar-comida',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, HeaderBarComponent],
  templateUrl: './agregar-comida.page.html',
  styleUrls: ['./agregar-comida.page.scss']
})
export class AgregarComidaPage {

  // ====== Reactive form ======
  form: FormGroup = this.fb.group({
    fecha: [this.hoyISO(), Validators.required],
    idTipoComida: [null, Validators.required],
    termino: [''],
    items: this.fb.array<FormGroup>([])
  });

  get itemsForm(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  private createItemGroup(init?: {
    itemId?: number | null;
    productoId?: string | number | null;
    nombre?: string;
    cantidad?: number;
    unidad?: string;
    kcal?: number;
    proteina?: number;
    carbohidrato?: number;
    grasa?: number;
  }): FormGroup {
    return this.fb.group({
      itemId: [init?.itemId ?? null],
      productoId: [init?.productoId ?? null],
      nombre: [init?.nombre ?? '', [Validators.required, Validators.maxLength(200)]],
      cantidad: [init?.cantidad ?? 100, [Validators.required, Validators.min(0.01)]],
      unidad: [init?.unidad ?? 'g', [Validators.required, Validators.maxLength(20)]],
      kcal: [init?.kcal ?? 0],
      proteina: [init?.proteina ?? 0],
      carbohidrato: [init?.carbohidrato ?? 0],
      grasa: [init?.grasa ?? 0]
    });
  }

  // ====== Estado de pantalla ======
  hijoId!: number;
  hijoNombre?: string;

  tipos: TipoComida[] = [];
  resultados: OffProductoView[] = [];
  buscando = false;
  guardando = false;

  // Paginación de la búsqueda OFF
  page = 1;
  pageSize = 20;
  hasMore = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: ComidasService,
    private offSvc: OffService,
    private toast: ToastController
  ) { }

  // ====== Lifecycle ======
  async ionViewWillEnter() {
    const qp = this.route.snapshot.queryParamMap;
    this.hijoId = Number(qp.get('hijoId'));
    this.hijoNombre = qp.get('hijo') || undefined;

    // Normaliza fecha a hoy (local)
    this.form.patchValue({ fecha: this.hoyISO() });

    // Tipos de comida
    try {
      this.tipos = await firstValueFrom(this.svc.getTiposComida());
    } catch (e) {
      console.error(e);
      (await this.toast.create({
        message: 'No se pudieron cargar los tipos',
        color: 'danger',
        duration: 1200
      })).present();
    }

    // Si cambia el término, resetea paginación y resultados
    this.form.get('termino')!
      .valueChanges.pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => {
        this.page = 1;
        this.hasMore = false;
        this.resultados = [];
      });
  }

  // ====== OFF search ======
  async buscar() {
    const termino = ((this.form.get('termino')?.value as string) || '').trim();
    if (!termino) return;

    this.buscando = true;

    try {
      const res = await this.offSvc.buscarAlimentos(termino, this.page, this.pageSize);
      this.resultados = res;
      this.hasMore = (res.length === this.pageSize);
    } catch (err) {
      console.error(err);
      (await this.toast.create({
        message: 'Error al buscar alimentos',
        duration: 1500,
        color: 'danger'
      })).present();
    } finally {
      this.buscando = false;
    }
  }

  async nextPage() {
    if (!this.hasMore) return;
    this.page++;
    await this.buscar();
  }

  async prevPage() {
    if (this.page <= 1) return;
    this.page--;
    await this.buscar();
  }

  // Agrega un ítem al FormArray desde un resultado OFF
  agregarDesdeBusqueda(r: OffProductoView) {
    const g = this.createItemGroup({
      itemId: null,
      productoId: r.id ?? null,
      nombre: r.nombre ?? 'Producto',
      cantidad: 1,
      unidad: r.unidad || 'g',
      kcal: Number(r.kcal ?? 0),
      proteina: Number(r.proteina_g ?? 0),
      carbohidrato: Number(r.carbohidrato_g ?? 0),
      grasa: Number(r.grasa_g ?? 0)
    });
    this.itemsForm.push(g);
  }

  quitarItem(i: number) {
    this.itemsForm.removeAt(i);
  }

  // ====== Totales ======
  private sumProp(prop: string): number {
    return this.itemsForm.controls.reduce((acc: number, c: AbstractControl) => {
      const v = (c as FormGroup).get(prop)?.value;
      return acc + (Number(v) || 0);
    }, 0);
  }
  get totalKcal() { return this.sumProp('kcal'); }
  get totalP()    { return this.sumProp('proteina'); }
  get totalC()    { return this.sumProp('carbohidrato'); }
  get totalG()    { return this.sumProp('grasa'); }

  // ====== Guardar ======
  private async validarUnicaPorDia(idTipo: number, fechaISO: string): Promise<boolean> {
    // Colación (id=4) permite múltiples por día; ajusta si tu catálogo usa otro id
    if (idTipo === 4) return true;

    // Consulta comidas del día y revisa si ya hay del mismo tipo
    const existentes = await firstValueFrom(this.svc.listarDetalle(this.hijoId, fechaISO, fechaISO));
    const yaHayMismoTipo = (existentes ?? []).some(x => Number(x.IdTipoComida) === idTipo);
    if (yaHayMismoTipo) {
      (await this.toast.create({
        message: 'Ya existe una comida de ese tipo en esa fecha.',
        color: 'warning',
        duration: 1600
      })).present();
      return false;
    }
    return true;
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      (await this.toast.create({
        message: 'Completa los campos requeridos',
        color: 'warning',
        duration: 1200
      })).present();
      return;
    }
    if (!this.hijoId) {
      (await this.toast.create({
        message: 'Falta hijo',
        color: 'warning',
        duration: 1000
      })).present();
      return;
    }
    if (this.itemsForm.length === 0) {
      (await this.toast.create({
        message: 'Agrega al menos un producto',
        color: 'warning',
        duration: 1200
      })).present();
      return;
    }

    const v = this.form.value as any;
    const idTipo = Number(v.idTipoComida);
    const fecha: string = v.fecha;

    // Regla: una por día, excepto colación
    const ok = await this.validarUnicaPorDia(idTipo, fecha);
    if (!ok) return;

    const items: ComidaItemInsertDTO[] = this.itemsForm.controls.map((c: AbstractControl) => {
      const val = (c as FormGroup).value;
      return {
        ItemId: val.itemId ?? null,
        AlimentoExtId: val.productoId ?? null,
        NombreAlimento: val.nombre,
        Cantidad: Number(val.cantidad || 0),
        Unidad: val.unidad || 'g',
        Kcal: Number(val.kcal || 0),
        Proteina_g: Number(val.proteina || 0),
        Carbohidrato_g: Number(val.carbohidrato || 0),
        Grasa_g: Number(val.grasa || 0),
      };
    });

    const dto: ComidaInsUpDTO = {
      HijoId: this.hijoId,
      Fecha: fecha,
      IdTipoComida: idTipo,
      Items: items
    };

    try {
      this.guardando = true;
      await firstValueFrom(this.svc.crear(dto));
      (await this.toast.create({
        message: 'Comida registrada',
        color: 'success',
        duration: 1200
      })).present();
      this.router.navigate(['/panel/comidas'], {
        queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
      });
    } catch (e) {
      console.error(e);
      (await this.toast.create({
        message: 'No se pudo guardar',
        color: 'danger',
        duration: 1500
      })).present();
    } finally {
      this.guardando = false;
    }
  }

  cancelar() {
    this.router.navigate(['/panel/comidas'], {
      queryParams: { hijoId: this.hijoId, hijo: this.hijoNombre }
    });
  }

  // ====== Helpers ======
  private hoyISO(): string {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
}
