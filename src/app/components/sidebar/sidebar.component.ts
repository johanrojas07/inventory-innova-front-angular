import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent implements OnInit {

  public identity;
  public token;
  public isMenuFixed: boolean = false;

  constructor(
    private _userService: UserService,
    private _router: Router,
  ){ 
    this.identity = this._userService.getIdentity();
    this.token = this._userService.getToken();
    
    // Cargar preferencia del menú fijo desde localStorage
    const savedMenuState = localStorage.getItem('menuFixed');
    if (savedMenuState !== null) {
      this.isMenuFixed = savedMenuState === 'true';
    }
  }

  ngOnInit() {
    // Aplicar el estado del menú al cargar
    this.updateMenuState();
  }

  toggleMenuFixed() {
    this.isMenuFixed = !this.isMenuFixed;
    localStorage.setItem('menuFixed', this.isMenuFixed.toString());
    this.updateMenuState();
  }

  updateMenuState() {
    const menuElement = document.querySelector('.main-menu') as HTMLElement;
    const mainElements = document.querySelectorAll('.main');
    
    if (menuElement) {
      if (this.isMenuFixed) {
        menuElement.classList.add('menu-fixed');
        // Ajustar el contenido principal cuando el menú está fijado
        mainElements.forEach((main: HTMLElement) => {
          main.style.marginLeft = '280px';
        });
      } else {
        menuElement.classList.remove('menu-fixed');
        // Restaurar el margen cuando el menú no está fijado
        mainElements.forEach((main: HTMLElement) => {
          main.style.marginLeft = '80px';
        });
      }
    }
  }

  logout(){
    localStorage.removeItem('identity');
    localStorage.removeItem('token');

    this.identity = null;
    this.token = null;

    this._router.navigate(['']);
  }

}
