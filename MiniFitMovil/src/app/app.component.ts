import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { Router, RouterModule, NavigationStart, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnDestroy {
  private router = inject(Router);
  private menu = inject(MenuController);

  /** Si es false, no se renderiza el menú (ver HTML con *ngIf) */
  menuEnabled = true;

  private navStartSub?: Subscription;
  private navEndSub?: Subscription;

  constructor() {
    // Cerrar cualquier menú apenas comienza una navegación
    this.navStartSub = this.router.events
      .pipe(filter(e => e instanceof NavigationStart))
      .subscribe(async () => {
        try {
          // cierra el abierto si lo hay
          const opened = await this.menu.getOpen();
          if (opened) await opened.close();
          await this.menu.close(); // cierra "cualquiera"
        } catch {}
      });

    // Habilitar/deshabilitar el menú según la URL final
    this.navEndSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(async (e: any) => {
        const url: string = e.urlAfterRedirects ?? e.url ?? '';
        const isAuth = url.startsWith('/auth');

        this.menuEnabled = !isAuth;
        await this.menu.enable(this.menuEnabled, 'mainMenu');

        if (isAuth) {
          // extra por si queda alguna clase / overlay colgando
          try {
            const opened = await this.menu.getOpen();
            if (opened) await opened.close();
            await this.menu.close('mainMenu');
          } catch {}
          document.body.classList.remove('menu-content-open', 'menu-enabled');
        }
      });
  }

  ngOnDestroy(): void {
    this.navStartSub?.unsubscribe();
    this.navEndSub?.unsubscribe();
  }

  // ===== Acciones del menú =====
  async goPerfil() {
    try {
      const opened = await this.menu.getOpen();
      if (opened) await opened.close();
      await this.menu.close('mainMenu');
    } catch {}
    await this.router.navigateByUrl('/perfil');
  }

  async logout() {
    // 1) Cierra y deshabilita antes de navegar
    try {
      const opened = await this.menu.getOpen();
      if (opened) await opened.close();
      await this.menu.close('mainMenu');
      await this.menu.enable(false, 'mainMenu');
    } catch {}
    document.body.classList.remove('menu-content-open', 'menu-enabled');

    // 2) Limpia credenciales
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    } catch {}

    // 3) Navega a login (el navEnd también desmontará el menú)
    await this.router.navigateByUrl('/auth/login', { replaceUrl: true });

    // 4) asegura estado coherente
    this.menuEnabled = false;
  }
}
