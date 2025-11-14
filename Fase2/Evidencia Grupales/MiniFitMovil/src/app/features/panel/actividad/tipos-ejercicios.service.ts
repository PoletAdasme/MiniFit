import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TipoEjercicio {
  idTipoEjercicios: number;        // IdTipoEjercicios
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class TiposEjerciciosService {
  private base = `${environment.apiBaseUrl}/TiposEjercicios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<TipoEjercicio[]> {
    // Asumo endpoint GET /api/TiposEjercicios que devuelve [{ id, nombre }, ...]
    return this.http.get<TipoEjercicio[]>(this.base);
  }
}
