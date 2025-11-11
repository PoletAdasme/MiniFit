import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-header-bar',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss'],
})
export class HeaderBarComponent {
  constructor( 
    private menu: MenuController,
    private router: Router
  ) {}

async goHome() {
  await this.menu.close();
  this.router.navigateByUrl('/inicio/home');
}

 async logout() {
  await this.menu.close();
  await this.menu.enable(false);

  // Limpia sesión si aplica
  // this.auth.logout();  // o this.token.clear();

  this.router.navigate(['/auth/login']);
}


}
