import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

/** ---- Catálogo ---- */
export interface TipoComida {
  idTipoComida: number;
  nombre: string;
}

/** ---- Items de una comida ---- */
export interface ComidaItemDetalleDTO {
  ItemId: number;
  AlimentoExtId?: string | null;
  NombreAlimento: string;
  Cantidad: number;
  Unidad: string;
  Kcal: number;
  Proteina_g: number;
  Carbohidrato_g: number;
  Grasa_g: number;
}

/** ---- Encabezado + detalle ---- */
export interface ComidaDetalleDTO {
  ComidaId: number;
  HijoId: number;
  /** ISO (yyyy-MM-dd) o Date serializable desde el backend */
  Fecha: string;
  IdTipoComida: number;
  Items: ComidaItemDetalleDTO[];
}

/** ---- Insert/Update (encabezado+items) ---- */
export interface ComidaItemInsertDTO {
  ItemId: number | null;
  AlimentoExtId: string | number | null;
  NombreAlimento: string;
  Cantidad: number;
  Unidad: string;
  Kcal: number;
  Proteina_g: number;
  Carbohidrato_g: number;
  Grasa_g: number;
}

export interface ComidaInsUpDTO {
  HijoId: number;
  Fecha: string;            // yyyy-MM-dd
  IdTipoComida: number;
  Items: ComidaItemInsertDTO[];
}

// --- NUEVO: fila de historial resumido (1 por comida) ---
export interface ComidaHistResumen {
  comidaId: number;
  hijoId: number;
  fecha: string;          // ISO (el back manda Date)
  idTipoComida: number;
  tipoNombre: string;
  items: number;
  kcal: number;
  proteina_g: number;
  carbohidrato_g: number;
  grasa_g: number;
}

@Injectable({ providedIn: 'root' })
export class ComidasService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/comidas`;

  /** Catálogo de tipos */
  getTiposComida(): Observable<TipoComida[]> {
    return this.http.get<TipoComida[]>(`${this.base}/tipos`).pipe(
      map(x => x ?? [])
    );
  }
  // ... dentro de tu servicio ComidasService
  historialResumen(
    hijoId: number,
    desdeISO?: string,
    hastaISO?: string,
    idTipoComida?: number
  ) {
    let params = new HttpParams();
    if (desdeISO) params = params.set('desde', desdeISO);
    if (hastaISO) params = params.set('hasta', hastaISO);
    if (idTipoComida != null) params = params.set('idTipoComida', String(idTipoComida));

    return this.http.get<ComidaHistResumen[]>(
      `${this.base}/historial-resumen/${hijoId}`,
      { params }
    );
  }
  // 👉 Agrega esto dentro de ComidasService

  getComidaById(hijoId: number, comidaId: number) {
    return this.listarDetalle(hijoId).pipe(
      map(list => (list ?? []).find(x => x.ComidaId === comidaId) ?? null)
    );
  }


    
  listarDetalle(hijoId: number, desde?: string, hasta?: string) {
    const params: any = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    // usa el endpoint con hijoId en la ruta (DTO con detalle)
    return this.http.get<any[]>(
      `${this.base}/detalle/${hijoId}`,
      { params }
    ).pipe(
      map(rows => (rows ?? []).map(r => ({
        // Normalizo a PascalCase (lo que ya usan tus renders)
        ComidaId:       r.ComidaId       ?? r.comidaId,
        HijoId:         r.HijoId         ?? r.hijoId,
        Fecha:          (r.Fecha ?? r.fecha) ? String(r.Fecha ?? r.fecha).slice(0,10) : '',
        IdTipoComida:   r.IdTipoComida   ?? r.idTipoComida,
        Items: (r.Items ?? r.items ?? []).map((it: any) => ({
          ItemId:         it.ItemId         ?? it.comidaItemId ?? 0,
          AlimentoExtId:  it.AlimentoExtId  ?? it.alimentoExtId ?? null,
          NombreAlimento: it.NombreAlimento ?? it.nombreAlimento,
          Cantidad:       Number(it.Cantidad ?? it.cantidad ?? 0),
          Unidad:         it.Unidad         ?? it.unidad ?? '',
          Kcal:           Number(it.Kcal           ?? it.kcal           ?? 0),
          Proteina_g:     Number(it.Proteina_g     ?? it.proteina_g     ?? 0),
          Carbohidrato_g: Number(it.Carbohidrato_g ?? it.carbohidrato_g ?? 0),
          Grasa_g:        Number(it.Grasa_g        ?? it.grasa_g        ?? 0),
        }))
      })))
    );
  }





  /** Crear/actualizar una comida con sus items */
  crear(dto: ComidaInsUpDTO): Observable<void> {
    return this.http.post<void>(`${this.base}/insertar`, dto);
  }

    /** Actualizar comida (encabezado + items) */
  actualizar(id: number, dto: ComidaInsUpDTO): Observable<void> {
    return this.http.put<void>(`${this.base}/actualizar/${id}`, dto);
  }

 
   /** Eliminar */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
