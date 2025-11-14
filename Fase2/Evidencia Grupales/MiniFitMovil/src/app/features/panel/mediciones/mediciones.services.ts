import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface MedicionDTO {
  medicionId: number;
  hijoId: number;
  fecha: string;        // yyyy-MM-dd
  pesoKg: number;
  estaturaCm: number;
  imc: number | null;
}

export interface CreateMedicionDTO {
  HijoId: number;
  Fecha?: string;         // yyyy-MM-dd (opcional; si no viene, API usa hoy)
  PesoKg: number;
  EstaturaCm: number;
}

export interface UpdateMedicionDTO {
  Fecha?: string;         // opcional
  PesoKg: number;
  EstaturaCm: number;
}

@Injectable({ providedIn: 'root' })
export class MedicionesService {
  // Si tu env es: export const environment = { api: 'http://localhost:5074/api' }
  private base = `${environment.apiBaseUrl}/Mediciones`;

  constructor(private http: HttpClient) {}

  /** Lista por hijo y rango (hasta inclusivo en el backend) */
  listar(hijoId: number, desdeISO?: string, hastaISO?: string): Observable<MedicionDTO[]> {
    let params = new HttpParams();
    if (desdeISO) params = params.set('desde', desdeISO);
    if (hastaISO) params = params.set('hasta', hastaISO);
    return this.http.get<MedicionDTO[]>(`${this.base}/hijo/${hijoId}`, { params });
  }

  /** Obtener por id (lo soporta tu controller) */
  getById(id: number): Observable<MedicionDTO> {
    return this.http.get<MedicionDTO>(`${this.base}/${id}`);
  }

  /** Crear */
  crear(dto: CreateMedicionDTO): Observable<MedicionDTO> {
    return this.http.post<MedicionDTO>(this.base, dto);
  }

  /** Actualizar */
  actualizar(id: number, dto: UpdateMedicionDTO): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, dto);
  }

  /** Eliminar */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
