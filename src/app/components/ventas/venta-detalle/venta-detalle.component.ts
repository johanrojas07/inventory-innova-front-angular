import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VentaService } from 'src/app/services/venta.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-venta-detalle',
  templateUrl: './venta-detalle.component.html',
  styleUrls: ['./venta-detalle.component.css'],
  encapsulation: ViewEncapsulation.None
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
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public productoImagenSeleccionado: any = null;
  public imagenProductoSeleccionada: string = '';

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
        this.loadVentaData();
      });
    } else {
      this._router.navigate(['']);
    }
  }

  loadVentaData() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this._ventaService.data_venta(this.id).subscribe(
      response => {
        this.venta = response.data.venta;
        this.detalle_venta = response.data.detalles;
        this.isLoading = false;
      },
      error => {
        this.errorMessage = (error.error && error.error.message) ? error.error.message : 'Error al cargar la información de la venta';
        this.isLoading = false;
      }
    );
  }

  getTotal() {
    let total = 0;
    this.detalle_venta.forEach((item) => {
      total = total + (parseInt(item.precio_venta) * parseInt(item.cantidad));
    });
    return total;
  }

  getTotalCantidad() {
    let total = 0;
    this.detalle_venta.forEach((item) => {
      total = total + parseInt(item.cantidad);
    });
    return total;
  }

  getMargenGanancia(item: any) {
    const precioCompra = (item.idproducto && item.idproducto.precio_compra) ? item.idproducto.precio_compra : 0;
    const precioVenta = item.precio_venta || 0;
    const cantidad = item.cantidad || 0;
    return (precioVenta - precioCompra) * cantidad;
  }

  getTotalGanancia() {
    let total = 0;
    this.detalle_venta.forEach((item) => {
      total = total + this.getMargenGanancia(item);
    });
    return total;
  }

  verImagenProducto(producto: any) {
    this.productoImagenSeleccionado = producto;
    if (producto && producto.imagenes && producto.imagenes.length > 0 && producto.imagenes[0] && producto.imagenes[0].imagen) {
      this.imagenProductoSeleccionada = producto.imagenes[0].imagen;
    } else {
      this.imagenProductoSeleccionada = '';
    }
    
    // Abrir modal usando jQuery o Bootstrap
    if ((window as any).jQuery) {
      (window as any).jQuery('#modalImagenProducto').modal('show');
    } else {
      // Fallback si jQuery no está disponible
      const modal = document.getElementById('modalImagenProducto');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
      }
    }
  }

  cerrarModalImagen() {
    if ((window as any).jQuery) {
      (window as any).jQuery('#modalImagenProducto').modal('hide');
    } else {
      const modal = document.getElementById('modalImagenProducto');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
    }
    this.productoImagenSeleccionado = null;
    this.imagenProductoSeleccionada = '';
  }

}
