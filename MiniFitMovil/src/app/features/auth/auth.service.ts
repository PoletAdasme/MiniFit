import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from '../../app/core/token.service';

export interface LoginDTO {
  /** RUT con formato usuario, ej: '20.334.918-1' */
  rut: string;
  password: string;
}

export interface RegisterDTO {
  /** RUT con formato usuario, ej: '20.334.918-1' */
  rut: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo: string;
  telefono: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  /** ISO (UTC) que devuelve la API */
  expiration: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Ej: http://localhost:5074/api  (según tu environment) */
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient, private token: TokenService) {}

  /** Convierte '20.334.918-1' -> { rut:'20334918', dv:'1' } */
  splitRut(rutConFormato: string): { rut: string; dv: string } {
    const clean = (rutConFormato || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return { rut: '', dv: '' };
    return { rut: clean.slice(0, -1), dv: clean.slice(-1) };
  }

  // ===================== LOGIN =====================
  async login(dto: LoginDTO): Promise<AuthResponse> {
    const { rut, dv } = this.splitRut(dto.rut);
    const body = { rut, dv, password: dto.password };

    // POST /api/Auth
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.base}/Auth`, body)
    );

    if (res?.token) {
      await this.token.set(res.token);
      if (res.expiration) await this.token.setExpiration(res.expiration);
    }
    return res;
  }

  // ===================== REGISTER (CREAR CUENTA) =====================
  /**
   * Crea una cuenta nueva.
   * Backend esperado: POST /api/Auth/register
   * Body: { rut, dv, nombre, apellidoPaterno, apellidoMaterno, correo, telefono, password }
   * Si tu API devuelve token al registrarse, lo guardamos; si no, solo resuelve.
   */
  async register(dto: RegisterDTO): Promise<void | AuthResponse> {
    const { rut, dv } = this.splitRut(dto.rut);

    const body = {
      rut,
      dv,
      nombre: dto.nombre.trim(),
      apellidoPaterno: dto.apellidoPaterno.trim(),
      apellidoMaterno: (dto.apellidoMaterno ?? '').trim() || null,
      correo: dto.correo.trim(),
      telefono: dto.telefono.trim(),
      password: dto.password, // ya validada en el front
    };

    // POST /api/Auth/register
    const res = await firstValueFrom(
      this.http.post<AuthResponse | void>(`${this.base}/Auth/register`, body)
    );

    // Si el backend decide retornar token en el registro, lo persistimos:
    const maybe = res as AuthResponse | undefined;
    if (maybe?.token) {
      await this.token.set(maybe.token);
      if (maybe.expiration) await this.token.setExpiration(maybe.expiration);
    }
    return res;
  }

  // ===================== LOGOUT =====================
  async logout() {
    await this.token.remove();
  }
}
