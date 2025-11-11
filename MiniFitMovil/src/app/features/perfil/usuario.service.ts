// src/app/features/panel/usuario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

// Ajusta a camelCase (JSON por defecto de ASP.NET Core)
export interface UsuarioDTO {
  usuarioId: number;
  rut: number;
  dv: string;                // 1 caracter (k/K permitido según backend)
  rolId: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo?: string | null;    // en tu SP devuelves Correo (string)
  telefono?: string | null;  // en tu SP devuelves Telefono (string)
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private base = `${environment.apiBaseUrl}/Usuarios`;

  constructor(private http: HttpClient) {}

  /** Perfil del usuario autenticado (GET api/usuarios/mis) */
  getMiPerfil(): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${this.base}/mis`);
  }

  /** Lista total (GET api/usuarios) */
  getAll(): Observable<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>(this.base);
  }

  /** Detalle por id (GET api/usuarios/{id}) */
  getById(id: number): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${this.base}/${id}`);
  }

  /** Crear (POST api/usuarios) */
  create(dto: Omit<UsuarioDTO, 'usuarioId'>): Observable<UsuarioDTO> {
    return this.http.post<UsuarioDTO>(this.base, dto);
  }

  // updateMiPerfil(payload: { nombre: string; correo: string; telefono: string }): Observable<void> {
  //   return this.http.put<void>(`${this.base}/me`, payload);
  // }

  updateMiPerfil(payload: { nombre: string; correo: string; telefono: string }): Observable<void> {
    return this.http.put<void>(`${this.base}/editar/`, payload);
  }


  /** Eliminar (DELETE api/usuarios/{id}) */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/eliminar/${id}`);
  }
}
