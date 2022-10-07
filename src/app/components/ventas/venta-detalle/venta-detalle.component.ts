import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VentaService } from 'src/app/services/venta.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-venta-detalle',
  templateUrl: './venta-detalle.component.html',
  styleUrls: ['./venta-detalle.component.css']
})
export class VentaDetalleComponent implements OnInit {

  public id;
  public venta: any = {
    iduser: '',
    idcliente: '',
    comentarios: ''
  };
  public detalle_venta = [];
  public identity;

  constructor(
    private _route: ActivatedRoute,
    private _ventaService: VentaService,
    private _userService: UserService,
    private _router: Router
  ) {
    this.identity = this._userService.getIdentity();
  }

  ngOnInit() {

    if (this.identity) {
      this._route.params.subscribe(params => {
        this.id = params['id'];

        this._ventaService.data_venta(this.id).subscribe(
          response => {

            this.venta = response.data.venta;
            this.detalle_venta = response.data.detalles;
            console.log("Venta", response);
          },
          error => {

          }
        );
      });
    } else {
      this._router.navigate(['']);
    }

  }

  getTotal() {
    let total = 0;
    this.detalle_venta.forEach((item) => {
      total = total + (parseInt(item.precio_venta) * parseInt(item.cantidad));
    });
    return total;
  }

  
  swipe(img: string) {
    var image = new Image();
    image.src = img;
    var w = window.open("");
    w.document.write(image.outerHTML);
  }

}
