import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ActividadReadDTO {
  actividadId: number;
  hijoId: number;
  fecha: string;          // ISO (yyyy-MM-dd)
  duracionMin: number;
  idTipoEjercicio: number;
  tipoNombre?: string;
}

export interface CreateActividadDTO {
  hijoId: number;
  fecha: string;          // yyyy-MM-dd
  duracionMin: number;
  idTipoEjercicio: number;
}

export interface ActividadDTO extends CreateActividadDTO {
  actividadId: number;
}

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private base = `${environment.apiBaseUrl}/ActividadDiaria`;

  constructor(private http: HttpClient) {}

  listar(hijoId: number, desde?: string, hasta?: string): Observable<ActividadReadDTO[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ActividadReadDTO[]>(`${this.base}/hijo/${hijoId}`, { params });
  }

  getById(id: number): Observable<ActividadReadDTO> {
    return this.http.get<ActividadReadDTO>(`${this.base}/${id}`);
  }

  crear(dto: CreateActividadDTO): Observable<ActividadDTO> {
    return this.http.post<ActividadDTO>(this.base, dto);
  }

  editar(id: number, dto: ActividadDTO | CreateActividadDTO): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
