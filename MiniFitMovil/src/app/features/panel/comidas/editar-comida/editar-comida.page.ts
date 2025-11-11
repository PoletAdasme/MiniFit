import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { HeaderBarComponent } from 'src/app/shared/header-bar/header-bar.component';
import { firstValueFrom } from 'rxjs';

import {
  ComidasService,
  ComidaInsUpDTO,
  TipoComida,
  ComidaItemDetalleDTO
} from '../comidas.services';

import { OffService } from '../off.services';

@Component({
  selector: 'app-editar-comida',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, HeaderBarComponent],
  templateUrl: './editar-comida.page.html',
  styleUrls: ['./editar-comida.page.scss']
})
export class EditarComidaPage implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private nav = inject(NavController);
  private toast = inject(ToastController);

  private comidasSrv = inject(ComidasService);
  private offSrv = inject(OffService);

  // ------- estado -------
  hijoId!: number;
  comidaId!: number;
  tipos: TipoComida[] = [];
  guardando = false;

  resultados: any[] = [];
  buscando = false;

  // Paginación OFF
  page = 1;
  pageSize = 20;
  hasMore = false;

  form = this.fb.group({
    fecha: ['', Validators.required],                 // yyyy-MM-dd
    idTipoComida: [null as number | null, Validators.required],
    termino: [''],
    items: this.fb.array<FormGroup>([])
  });

  // ===== getters =====
  get itemsForm(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }
  get totalKcal(): number {
    return this.itemsForm.controls.reduce((a, g) => a + (+g.get('kcal')!.value || 0), 0);
  }
  get totalP(): number {
    return this.itemsForm.controls.reduce((a, g) => a + (+g.get('proteina')!.value || 0), 0);
  }
  get totalC(): number {
    return this.itemsForm.controls.reduce((a, g) => a + (+g.get('carbohidrato')!.value || 0), 0);
  }
  get totalG(): number {
    return this.itemsForm.controls.reduce((a, g) => a + (+g.get('grasa')!.value || 0), 0);
  }

  // ===== ciclo de vida =====
  async ngOnInit() {
    // 1) Tipos para el select
    this.tipos = await firstValueFrom(this.comidasSrv.getTiposComida());

    // 2) Parámetros (ruta y query)
    const pm = this.route.snapshot.paramMap;
    const qp = this.route.snapshot.queryParamMap;

    this.comidaId = Number(pm.get('comidaId') ?? pm.get('id'));
    this.hijoId   = Number(qp.get('hijoId'));

    if (!Number.isFinite(this.hijoId) || this.hijoId <= 0 ||
        !Number.isFinite(this.comidaId) || this.comidaId <= 0) {
      await this.toastQuick('Faltan parámetros para editar (hijo/comida).', 'danger');
      this.nav.back();
      return;
    }

    // 3) Cargar detalle (try getComidaById → fallback con listarDetalle)
    let det: any = null;
    try {
      // Si tu servicio lo expone, esto funcionará
      det = await firstValueFrom((this.comidasSrv as any).getComidaById(this.hijoId, this.comidaId));
    } catch { /* ignorar */ }

    if (!det) {
      // Fallback: trae todas y filtra por ID
      const lista = await firstValueFrom(
        this.comidasSrv.listarDetalle(this.hijoId, '1900-01-01', '2100-12-31')
      );
      det = (lista ?? []).find(x => (x as any).ComidaId === this.comidaId);
    }

    if (!det) {
      await this.toastQuick('No se encontró la comida', 'danger');
      this.nav.back();
      return;
    }

    // 4) Pintar encabezado
    this.form.patchValue({
      fecha: this.asISODate((det as any).Fecha),
      idTipoComida: (det as any).IdTipoComida
    });

    // 5) Poblar ítems
    this.itemsForm.clear();
    ((det as any).Items ?? []).forEach((it: ComidaItemDetalleDTO) => {
      this.itemsForm.push(this.fb.group({
        nombre: [it.NombreAlimento ?? ''],
        unidad: [it.Unidad ?? ''],
        kcal: [Number(it.Kcal ?? 0)],
        proteina: [Number(it.Proteina_g ?? 0)],
        carbohidrato: [Number(it.Carbohidrato_g ?? 0)],
        grasa: [Number(it.Grasa_g ?? 0)],
      }));
    });
  }

  // ------- acciones -------
  cancelar() {
    this.nav.back();
  }

  quitarItem(index: number) {
    this.itemsForm.removeAt(index);
  }

  // ====== Búsqueda OFF (UNIFICADA) ======
  async buscar() {
    await this.doSearch(1);
  }

  async nextPage() {
    if (this.hasMore) await this.doSearch(this.page + 1);
  }

  async prevPage() {
    if (this.page > 1) await this.doSearch(this.page - 1);
  }

  private async doSearch(page: number) {
    const termino = (this.form.get('termino')!.value || '').toString().trim();
    if (!termino) return;

    this.buscando = true;
    try {
      // El servicio puede devolver: Array o { items, hasMore }
      const res: any = await this.offSrv.buscarAlimentos(termino, page, this.pageSize);

      const items = Array.isArray(res) ? res : (res?.items ?? []);
      this.resultados = items;

      this.hasMore = Array.isArray(res)
        ? items.length === this.pageSize
        : Boolean(res?.hasMore);

      this.page = page;
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

  agregarDesdeBusqueda(r: any) {
    this.itemsForm.push(this.fb.group({
      nombre: [r.nombre ?? ''],
      unidad: [r.unidad ?? ''],
      kcal: [Number(r.kcal ?? 0)],
      proteina: [Number(r.proteina_g ?? 0)],
      carbohidrato: [Number(r.carbohidrato_g ?? 0)],
      grasa: [Number(r.grasa_g ?? 0)],
    }));
    this.toastQuick('Ítem agregado.');
  }

  // --- actualizar (PUT api/comidas/actualizar/{id}) ---
  async actualizar() {
    if (this.form.invalid || this.guardando) return;
    this.guardando = true;

    try {
      const v = this.form.getRawValue();

      const dto: ComidaInsUpDTO = {
        HijoId: this.hijoId,
        Fecha: this.asISODate(v.fecha as string),   // yyyy-MM-dd
        IdTipoComida: v.idTipoComida!,
        Items: (this.itemsForm.value as any[]).map(x => ({
          ItemId: null,
          AlimentoExtId: null,
          NombreAlimento: x.nombre,
          Cantidad: 1,
          Unidad: x.unidad ?? '',
          Kcal: +x.kcal || 0,
          Proteina_g: +x.proteina || 0,
          Carbohidrato_g: +x.carbohidrato || 0,
          Grasa_g: +x.grasa || 0
        }))
      };

      await firstValueFrom(this.comidasSrv.actualizar(this.comidaId, dto));
      await this.toastQuick('Comida actualizada');
      this.nav.back();
    } catch (err) {
      await this.toastQuick('No se pudo actualizar', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  /** yyyy-MM-dd sin desplazar por zona horaria */
  private asISODate(d: string | Date): string {
    if (typeof d === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const m = d.match(/^\d{4}-\d{2}-\d{2}/);
      if (m) return m[0];
      const dt = new Date(d);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } else {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  private async toastQuick(msg: string, color: 'success'|'danger'|'medium' = 'success') {
    const t = await this.toast.create({ message: msg, duration: 1400, color });
    await t.present();
  }
}
