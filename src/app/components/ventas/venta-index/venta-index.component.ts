import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { VentaService } from 'src/app/services/venta.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-venta-index',
  templateUrl: './venta-index.component.html',
  styleUrls: ['./venta-index.component.css']
})
export class VentaIndexComponent implements OnInit {

  public identity;
  public ventas;
  public isLoading = false;
  
  constructor(
    private toastr: ToastrService,
    private _userService : UserService,
    private _ventaService : VentaService,
    private _router : Router,
  ) { 
    this.identity = this._userService.getIdentity();
  }

  getProductosName(productos) {
    if (productos) {
      let names = '';
      productos.forEach((element) => {
        if (element && element.idproducto) {
          names = names + element.idproducto.titulo + ' - ';
        }
      });
      return names; 
    } else {
      return 'Debes ir al detalle'
    }
  }

  ngOnInit() {
    if(this.identity){
      //USUARIO AUTENTICADO
      this.isLoading = true;
      this._ventaService.get_ventas().subscribe(
        response=>{
          this.isLoading = false;
          response.ventas.reverse();
          this.ventas = response.ventas;
          console.log(this.ventas);
          
        },
        error=>{
          this.isLoading = false;
          this.toastr.error('No fue posible cargar las ventas : ' + error.error, 'Error', {
            timeOut: 9000
          });
        }
      );
    }else{
      this._router.navigate(['']);
    }
  }

}
