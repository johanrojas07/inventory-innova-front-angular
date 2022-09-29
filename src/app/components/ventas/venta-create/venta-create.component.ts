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
  public venta: any = {
    idcliente: '',
  };
  public productos;
  public producto: any = {
    stock: '--|--',
  }
  public total = 0;

  public data_detalle: Array<any> = [];
  public detalle: any = {
    idproducto: ''
  };
  public error_message;
  filteredProducts: Observable<any[]>;


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
      this._clienteService.get_clientes().subscribe(
        response => {
          this.venta.idcliente = (response.clientes && response.clientes[0]) ? response.clientes[0]._id : null;
          this.clientes = response.clientes;
        },
        error => {

        }
      );

      this._productoService.get_productos('').subscribe(
        response => {
          this.productos = response.productos;
          console.log("this.productos", this.productos)
          this.filteredProducts = this.controlFind.valueChanges.pipe(
            startWith(''),
            map(state => (state ? this._filterStates(state) : this.productos.slice())),
          );
          console.log("this.filteredProducts", this.filteredProducts)
        },
        error => {

        }
      );
    } else {
      this._router.navigate(['']);
    }

  }


  private _filterStates(value: any): any[] {
    console.log("LLEGOOOO", value);

    const filterValue = (value && value.identificador) ? value.identificador.toLowerCase() : value.toLowerCase();

    return this.productos.filter(state => state.titulo.toLowerCase().includes(filterValue) || state.identificador.toLowerCase().includes(filterValue));
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
    console.log(" event.option.value", event.option.value);
    this.producto = event.option.value;
  }

  close_alert() {
    this.error_message = '';
  }


  save_detalle(detalleForm) {



    if (detalleForm.valid && this.producto && this.producto.identificador) {

      const existProduct = this.data_detalle.find(d => d.identificador == this.producto.identificador);
      if (existProduct) {
        this.toastr.warning('Este producto ya fue agregado, no es posible agregarlo nuevamente', 'Error', {
          timeOut: 9000
        });
        return;
      }

      if (detalleForm.value.cantidad <= this.producto.stock) {

        this.data_detalle.push({
          identificador: this.producto.identificador,
          imagenes: this.producto.imagenes,
          idproducto: this.producto._id,
          cantidad: detalleForm.value.cantidad,
          producto: this.producto.titulo,
          precio_venta: this.producto.precio_venta
        });


        this.total = this.total + (parseInt(this.producto.precio_venta) * parseInt(detalleForm.value.cantidad));

        this.detalle = new DetalleVenta('', '', null);
        this.producto = null;
        this.controlFind.patchValue("");
      } else {
        this.toastr.warning('No existe el suficiente stock para la venta', 'Warning', {
          timeOut: 9000
        });
      }
    } else {
      this.toastr.error('Ocurrio un error, no estan los datos completos', 'Error', {
        timeOut: 9000
      });
    }
  }

  eliminar(idx, precio_venta, cantidad) {
    this.data_detalle.splice(idx, 1);
    this.total = this.total - (parseInt(precio_venta) * parseInt(cantidad));
  }

  onSubmit(ventaForm) {
    if (ventaForm.valid) {
      if (ventaForm.value.idcliente != '') {

        this.data_detalle.forEach(object => {
          delete object['imagenes'];
        });

        let data = {
          idcliente: ventaForm.value.idcliente,
          iduser: this.identity._id,
          detalles: this.data_detalle
        }

        console.log("Registrar venta", data);
        this._ventaService.save_data(data).subscribe(
          response => {
            this._router.navigate(['ventas']);
          },
          error => {
            console.log(error);
          }
        );

      } else {
        console.log('error');
      }

    } else {
      console.log('error');

    }
  }
}
