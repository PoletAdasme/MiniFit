// src/app/core/child.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const CHILD_KEY = 'selected_child';

export const childGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);

  // 1) Lee desde Preferences si estamos en nativo; si falla, usa localStorage.
  let selected: string | null = null;
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: CHILD_KEY });
      selected = value ?? null;
    } else {
      selected = localStorage.getItem(CHILD_KEY);
    }
  } catch {
    selected = localStorage.getItem(CHILD_KEY);
  }

  // 2) No te bloquees a ti mismo si ya estás en el selector
  const onSelector = state.url.startsWith('/inicio/selector-hijo');

  if (!selected && !onSelector) {
    router.navigate(['/inicio/selector-hijo'], {
      replaceUrl: true,
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
  return true;
};
