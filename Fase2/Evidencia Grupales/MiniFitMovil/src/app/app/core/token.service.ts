import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';
const EXP_KEY   = 'auth_token_exp';

@Injectable({ providedIn: 'root' })
export class TokenService {
  async set(token: string) {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  }
  async get(): Promise<string | null> {
    const r = await Preferences.get({ key: TOKEN_KEY });
    return r.value ?? null;
  }
  async setExpiration(iso: string) {
    await Preferences.set({ key: EXP_KEY, value: iso });
  }
  async getExpiration(): Promise<string | null> {
    const r = await Preferences.get({ key: EXP_KEY });
    return r.value ?? null;
  }
  async remove() {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: EXP_KEY });
  }
  
}
