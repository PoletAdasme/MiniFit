import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface OffProductoView {
  id: string;
  nombre: string;
  marca?: string;
  unidad?: string;
  kcal?: number;
  proteina_g?: number;
  carbohidrato_g?: number;
  grasa_g?: number;
}

@Injectable({ providedIn: 'root' })
export class OffService {
  private http = inject(HttpClient);
  // Si tu backend expone /api, deja apiBaseUrl ya con /api
  private readonly baseUrl = `${environment.apiBaseUrl}`;

  /**
   * Llama a tu OffController que devuelve List<object>.
   * Normaliza cada objeto a OffProductoView.
   */
  async buscarAlimentos(term: string, page = 1, pageSize = 6): Promise<OffProductoView[]> {
    const params = new HttpParams()
      .set('term', term)
      .set('page', page)
      .set('pageSize', pageSize);

    const url = `${this.baseUrl}/off/buscar`;

    return await firstValueFrom(
      this.http.get<any[]>(url, { params }).pipe(
        map(arr => (arr ?? []).map(o => this.normalize(o)).filter(p => !!p.nombre))
      )
    );
  }

  // --------- Helpers ---------

  private toNum(v: any): number | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    const n = Number(
      typeof v === 'string' ? v.replace(',', '.').trim() : v
    );
    return Number.isFinite(n) ? n : undefined;
  }

  /**
   * El backend ya manda campos listos:
   * { id, nombre, marca, kcal, proteina_g, carbohidrato_g, grasa_g, unidad }
   * Aun así soportamos alias por si cambian nombres.
   */
  private normalize(o: any): OffProductoView {
    // ids posibles
    const id = String(o?.id ?? o?.code ?? o?._id ?? '').trim();

    // nombre / alias
    const nombre: string =
      (o?.nombre ?? o?.product_name ?? o?.name ?? '').toString().trim();

    // marca puede venir como "marca" o "brands" (CSV)
    let marca: string | undefined =
      (o?.marca ?? o?.brand ?? o?.brands)?.toString();
    if (marca) marca = marca.split(',')[0].trim();

    // unidad por defecto
    const unidad: string | undefined =
      (o?.unidad ?? o?.serving_size ?? '100 g')?.toString().trim();

    // macros (usa los del backend si están; si no, alias)
    const kcal = this.toNum(o?.kcal ?? o?.energy_kcal_100g ?? o?.energy);
    const proteina_g = this.toNum(o?.proteina_g ?? o?.proteins_100g ?? o?.protein);
    const carbohidrato_g = this.toNum(o?.carbohidrato_g ?? o?.carbohydrates_100g ?? o?.carbs);
    const grasa_g = this.toNum(o?.grasa_g ?? o?.fat_100g ?? o?.fat);

    return { id, nombre, marca, unidad, kcal, proteina_g, carbohidrato_g, grasa_g };
  }
}
