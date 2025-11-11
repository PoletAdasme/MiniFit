// hijos.services.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of } from 'rxjs';

// en tu HijosService
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export interface Hijo {
  hijoId: number;
  usuarioId: number;
  rut: number;
  dv: string | number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNac?: string;   // o Date si ya lo manejas así
  edad: number;
}
interface CreateHijoDTO {
  rut: number;
  dv: DvChar;                
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNac: string;         
}
interface UpdateHijoDTO {
  rut: number;
  dv: string | number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fechaNac: string; // ISO 8601
}

// hijos.services.ts
export type DvChar = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'K';
const CHILD_KEY = 'selected_child';
@Injectable({ providedIn: 'root' })
export class HijosService {
  private api = 'http://localhost:5074/api/Hijos'; // tu base real

  constructor(private http: HttpClient) {}

  // --- EXISTENTE ---
  getMisHijos(): Observable<Hijo[]> {
    return this.http.get<Hijo[]>(`${this.api}/mis`);
  }

  getHijoById(id: number): Observable<Hijo> {
    return this.http.get<Hijo>(`${this.api}/${id}`);
  }

  // ==========================
  //  Estado del hijo seleccionado
  // ==========================
  private STORAGE_KEY = 'selectedHijoId';

  private selectedHijoIdSubject = new BehaviorSubject<number | null>(this.loadSelectedFromStorage());
  /** Stream para que Home (y otras páginas) reaccionen a la selección */
  selectedHijoId$ = this.selectedHijoIdSubject.asObservable();

  /** Setea y persiste el hijo activo */
async setSelectedHijo(id: number) {
  const value = String(id);
  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: CHILD_KEY, value });
    } else {
      localStorage.setItem(CHILD_KEY, value);
    }
  } catch {
    localStorage.setItem(CHILD_KEY, value);
  }
}

  /** Lectura instantánea (sincrónica) del id seleccionado */
  getSelectedHijoIdSnapshot(): number | null {
    return this.selectedHijoIdSubject.value;
  }

  /** Limpia la selección (opcional) */
  clearSelectedHijo() {
    this.selectedHijoIdSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  crearHijo(dto: CreateHijoDTO): Observable<Hijo> {
    return this.http.post<Hijo>(`${this.api}`, dto);
  }

  updateHijo(id: number, dto: UpdateHijoDTO): Observable<void> {
    return this.http.put<void>(`${this.api}/${id}`, dto);
  }

  deleteHijo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  private loadSelectedFromStorage(): number | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }
}
