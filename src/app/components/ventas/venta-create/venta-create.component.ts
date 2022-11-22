import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { Router } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';
import { DetalleVenta } from "../../../models/DetalleVenta";
import { VentaService } from 'src/app/services/venta.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-venta-create',
  templateUrl: './venta-create.component.html',
  styleUrls: ['./venta-create.component.css']
})
export class VentaCreateComponent implements OnInit {

  public controlFind = new FormControl('');
  public identity;
  public clientes: any;
  public tipos_pago: any = [
    {id: 1, name: 'Efectivo'},
    {id: 2, name: 'Nequi'},
    {id: 3, name: 'Sin Pagar'},
  ];
  public venta: any = {
    idcliente: '',
    tipo_pago: 1
  };
  public productos;
  public producto: any = {
    stock: '--|--',
  }
  public total = 0;
  public imagen_view = '';

  public data_detalle: Array<any> = [];
  public detalle: any = {
    idproducto: '',
    cantidad: null
  };
  public comentarios = '';
  public error_message;
  filteredProducts: Observable<any[]>;
  public isLoading = false;


  constructor(
    private toastr: ToastrService,
    private _userService: UserService,
    private _clienteService: ClienteService,
    private _productoService: ProductoService,
    private _router: Router,
    private _ventaService: VentaService,
  ) {
    this.identity = this._userService.getIdentity();
  }

  ngOnInit() {
    if (this.identity) {
      this.isLoading = true;
      this._clienteService.get_clientes().subscribe(
        response => {
          this.venta.idcliente = (response.clientes && response.clientes[0]) ? response.clientes[0]._id : null;
          this.venta.tipo_pago = 1;
          this.clientes = response.clientes;
        },
        () => {
          this.toastr.error('Error obteniendo los clientes :(.', 'Error', {
            timeOut: 9000
          });
        }
      );

      this._productoService.get_productos('').subscribe(
        response => {
          this.productos = response.productos;
          this.filteredProducts = this.controlFind.valueChanges.pipe(
            startWith(''),
            map(state => (state ? this._filterStates(state) : this.productos.slice())),
          );
          this.isLoading = false;
        },
        () => {
          this.toastr.error('Error obteniendo los productos :(.', 'Error', {
            timeOut: 9000
          });
          this.isLoading = false;

        }
      );
    } else {
      this._router.navigate(['']);
    }

  }


  private _filterStates(value: any): any[] {
    console.log("Seleccion: ", value);

    const filterValue = (value && value.identificador) ? value.identificador.toLowerCase() : value.toLowerCase();

    // Inicio Validacion para Codigo de Barra
    const exist = this.productos.filter(state => (state.codigo && state.codigo == filterValue));
    if (exist.length > 0) {
      this.producto = exist[0];
      this.save_detalle({ valid: true, value: { cantidad: 1, isCode: true } })
      return;
    }

    if (filterValue && /^\d+$/.test(filterValue) && (filterValue.length === 13)) {
      this.toastr.error('Producto no encontrado con Codigo: ' + filterValue, 'Error', {
        timeOut: 9000
      });
      this.controlFind.patchValue("");
    }
    // Fin Validacion para Codigo de Barra

    return this.productos.filter(state => state.titulo.toLowerCase().includes(filterValue) || state.identificador.toLowerCase().includes(filterValue) || state.codigo.toLowerCase().includes(filterValue));
  }

  compareObjectSelect(data?) {
    if (data && data.titulo && data.identificador) {
      return data.identificador + " | " + data.titulo;
    } else if (data && data.titulo) {
      return "|" + data.titulo
    } else {
      return "";
    }
  }


  setDataProduct(event) {
    this.producto = event.option.value;
  }

  close_alert() {
    this.error_message = '';
  }


  save_detalle(detalleForm) {

    if (detalleForm.valid && this.producto && this.producto.identificador) {
      if (detalleForm.value.cantidad <= this.producto.stock) {
        const existProductIndex = this.data_detalle.findIndex(d => d.identificador == this.producto.identificador);
        if (existProductIndex >= 0) {

          this.producto.stock = parseInt(this.producto.stock) - parseInt(detalleForm.value.cantidad);
          this.data_detalle[existProductIndex].cantidad = parseInt(this.data_detalle[existProductIndex].cantidad) + parseInt(detalleForm.value.cantidad);
          console.log("stock producto", this.producto.stock);
          console.log("stock detalle", this.data_detalle[existProductIndex].cantidad);
          this.toastr.info('Producto Actualizado', 'Informacion', {
            timeOut: 3000
          });
        } else {

          console.log("HOLAAA", this.producto);
          this.data_detalle.push({
            identificador: this.producto.identificador,
            imagenes: this.producto.imagenes,
            idproducto: this.producto._id,
            cantidad: detalleForm.value.cantidad,
            producto: this.producto.titulo,
            precio_venta: this.producto.precio_venta,
            precio_venta_original: this.producto.precio_venta,
            precio_compra: this.producto.precio_compra
          });
          this._productoService.get_producto(this.producto._id).subscribe(
            (response) => {
              if (response && response.producto && response.producto.imagenes) {
                this.data_detalle[this.data_detalle.length-1].imagenes = response.producto.imagenes;
              }
            })

          this.toastr.success('Producto Agregado', 'Informacion', {
            timeOut: 3000
          });
          this.producto.stock = this.producto.stock - detalleForm.value.cantidad;
        }
      } else {
        this.toastr.warning('No hay suficiente stock disponible. :(', 'Warning', {
          timeOut: 9000
        });
        if (detalleForm.value.isCode) {
          this.detalle = new DetalleVenta('', '', null);
          this.producto = null;
          this.controlFind.patchValue("");
        }
        return;
      }
      this.detalle = new DetalleVenta('', '', null);
      this.producto = null;
      this.controlFind.patchValue("");
    } else {
      this.toastr.info('Complete el formulario', 'Error', {
        timeOut: 9000
      });
    }
  }

  swipe(img: string) {
    var image = new Image();
    image.src = img;
    var w = window.open("");
    w.document.write(image.outerHTML);
  }


  getTotal() {
    let total = 0;
    this.data_detalle.forEach((item) => {
      total = total + (parseInt(item.precio_venta) * parseInt(item.cantidad));
    });
    return total;
  }

  eliminar(idx) {
    const objIndex = this.productos.findIndex((obj => obj._id == this.data_detalle[idx].idproducto));
    this.productos[objIndex].stock = parseInt(this.productos[objIndex].stock) + parseInt(this.data_detalle[idx].cantidad);

    this.data_detalle.splice(idx, 1);
  }

  onSubmit(ventaForm) {
    if (ventaForm.valid) {
      if (ventaForm.value.idcliente != '') {
        if (this.data_detalle.length == 0) {
          this.toastr.warning('No hay productos seleccionados', 'Error', {
            timeOut: 9000
          });
          return;
        }

        this.data_detalle.forEach(object => {
          delete object['imagenes'];
        });

        let data = {
          idcliente: ventaForm.value.idcliente,
          iduser: this.identity._id,
          detalles: this.data_detalle,
          comentarios: this.comentarios,
          tipo_pago: parseInt(ventaForm.value.tipo_pago),
          total_venta: this.getTotal()
        }

        console.log("Registrar venta", data);
        this._ventaService.save_data(data).subscribe(
          (response) => {
            this._router.navigate(['ventas']);
          },
          error => {
            this.toastr.error('Error registrando la venta. :(', 'Error', {
              timeOut: 9000
            });
            console.log(error);
          }
        );
      } else {
        this.toastr.warning('Cliente no definido', 'Warning', {
          timeOut: 9000
        });
      }
    } else {
      this.toastr.warning('Formulario no valido', 'Warning', {
        timeOut: 9000
      });
    }
  }
}
