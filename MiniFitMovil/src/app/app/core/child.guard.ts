import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const CHILD_KEY = 'selected_child';

export const childGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const r = await Preferences.get({ key: CHILD_KEY });
  const hasChild = !!r.value;

  if (!hasChild) {
    router.navigateByUrl('/inicio/selector-hijo', { replaceUrl: true });
    return false;
  }
  return true;
};
