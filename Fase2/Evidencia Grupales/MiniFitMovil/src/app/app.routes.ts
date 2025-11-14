import { Routes } from '@angular/router';
import { authGuard } from './app/core/auth.guard';
import { childGuard } from './app/core/child.guard';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // login (sin barra/header)
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.page').then(m => m.LoginPage),
  },
  // crear usuario en login
  { 
    path: 'auth/crear-usuario', 
    loadComponent: () => import('./features/auth/crear-usuario/crear-usuario.page').then(m => m.CrearUsuarioPage) 
  },

  
  // HOME y secciones (con barra/header)
  {
    path: 'inicio/home',
    canActivate: [authGuard, childGuard],
    loadComponent: () =>
      import('./features/inicio/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'panel/actividad',
    loadComponent: () =>
      import('./features/panel/actividad/actividad-dashboard/actividad-dashboard.page').then(m => m.ActividadDashboardPage)
  },
  {
    path: 'panel/actividad/agregar',
    loadComponent: () =>
      import('./features/panel/actividad/agregar-actividad/agregar-actividad.page').then(m => m.AgregarActividadPage)
  },
  {
    path: 'panel/actividad/editar/:id',
    loadComponent: () =>
      import('./features/panel/actividad/editar-actividad/editar-actividad.page').then(m => m.EditarActividadPage)
  },
  {
    path: 'panel/comidas',
    loadComponent: () =>
      import('./features/panel/comidas/comidas-dashboard/comidas-dashboard.page').then(m => m.ComidasDashboardPage),
  },
  {
    path: 'panel/comidas/agregar',
    loadComponent: () =>
      import('./features/panel/comidas/agregar-comida/agregar-comida.page').then(m => m.AgregarComidaPage),
  },
  {
  path: 'panel/comidas/editar/:id',
  loadComponent: () =>
    import('./features/panel/comidas/editar-comida/editar-comida.page').then(m => m.EditarComidaPage),
  },
  {
    path: 'panel/mediciones',
    loadComponent: () =>
      import('./features/panel/mediciones/mediciones-dashboard/mediciones-dashboard.page').then(m => m.MedicionesDashboardPage)
  },
  {
    path: 'panel/mediciones/agregar',
    loadComponent: () =>
      import('./features/panel/mediciones/agregar-mediciones/agregar-mediciones.page').then(m => m.AgregarMedicionesPage)
  },
{
  path: 'panel/mediciones/editar/:id',
  loadComponent: () =>
    import('./features/panel/mediciones/editar-mediciones/editar-mediciones.page')
      .then(m => m.EditarMedicionesPage),
  // si usas guard:
  // canActivate: [AuthGuard]
},

  {
    path: 'panel/reportes',
    loadComponent: () =>
      import('./features/panel/reportes/reportes.page').then(m => m.ReportesPage),
  },

  // Flujo inicial (sin barra/header)
  {
    path: 'inicio/crear-hijo',
    loadComponent: () =>
      import('./features/inicio/crear-hijo/crear-hijo.page').then(m => m.CrearHijoPage),
  },
  {
    path: 'inicio/selector-hijo',
    loadComponent: () =>
      import('./features/inicio/selector-hijo/selector-hijo.page').then(m => m.SelectorHijoPage),
  },

  
  {
    path: 'perfil',
    loadComponent: () =>
      import('./features/perfil/perfil/perfil.page').then(m => m.PerfilPage),
  },

   {
    path: 'hijo',
    children: [
      {
        path: 'agregar-hijo',
        loadComponent: () =>
          import('./features/hijo/agregar-hijo/agregar-hijo.page')
            .then(m => m.agregarHijoPage),
      },
      {
        path: 'editar-hijo/:id',
        loadComponent: () =>
          import('./features/hijo/editar-hijo/editar-hijo.page')
            .then(m => m.editarHijoPage),
      },
    ],
  },
  

  // {
  //   path: 'hijo/agregar-hijo',
  //   loadComponent: () =>
  //     import('./features/hijo/agregar-hijo/agregar-hijo.page').then(m => m.agregarHijoPage),
  // },
  // // { path: '**', redirectTo: 'Perfil' },

 
  // {
  //   path: 'hijo/editar-hijo',
  //   loadComponent: () =>
  //     import('./features/hijo/editar-hijo/editar-hijo.page').then(m => m.editarHijoPage),
  // },
  // // { path: '**', redirectTo: 'Perfil' },
];
