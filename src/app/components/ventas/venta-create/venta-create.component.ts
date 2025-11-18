import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
  styleUrls: ['./venta-create.component.css'],
  encapsulation: ViewEncapsulation.None
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

  // Modal cliente
  public nuevoCliente: any = {
    nombres: '',
    correo: '',
    dni: ''
  };
  public isSavingCliente = false;


  constructor(
    private toastr: ToastrService,
    private _userService: UserService,
    private _clienteService: ClienteService,
    private _productoService: ProductoService,
    private _router: Router,
    private _ventaService: VentaService,
  ) {
    this.identity = this._userService.getIdentity();
    this.nuevoCliente = {
      nombres: '',
      correo: '',
      dni: ''
    };
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
    // Si el valor es un objeto (selección del autocomplete), retornar todos los productos
    if (value && typeof value === 'object' && value.identificador) {
      return this.productos;
    }

    // Si no hay valor, retornar todos los productos
    if (!value || value === '') {
      return this.productos.slice();
    }

    const filterValue = String(value).toLowerCase().trim();

    // Validación para Código de Barras
    // Los códigos de barras típicamente tienen 8, 12, 13, 14 dígitos (EAN-8, UPC-A, EAN-13, ITF-14)
    const isBarcode = /^\d{8,14}$/.test(filterValue);

    if (isBarcode) {
      // Buscar producto por código de barras (comparación exacta, sin importar mayúsculas/minúsculas)
      const productoEncontrado = this.productos.find(state => 
        state.codigo && String(state.codigo).toLowerCase().trim() === filterValue
      );

      if (productoEncontrado) {
        // Usar setTimeout para asegurar que el autocomplete termine de procesar
        setTimeout(() => {
          this.producto = productoEncontrado;
          // Establecer cantidad por defecto si no hay
          if (!this.detalle.cantidad || this.detalle.cantidad <= 0) {
            this.detalle.cantidad = 1;
          }
          // Agregar el producto automáticamente
          this.save_detalle({ valid: true, value: { cantidad: this.detalle.cantidad || 1, isCode: true } });
        }, 100);
        // Retornar el producto encontrado para que se muestre en el autocomplete
        return [productoEncontrado];
      } else {
        // Código de barras no encontrado
        setTimeout(() => {
          this.toastr.error('Producto no encontrado con código de barras: ' + filterValue, 'Error', {
            timeOut: 5000
          });
          this.controlFind.patchValue("");
          this.producto = null;
        }, 200);
        return [];
      }
    }

    // Búsqueda normal por texto (nombre, identificador o código)
    return this.productos.filter(state => {
      const titulo = state.titulo ? String(state.titulo).toLowerCase() : '';
      const identificador = state.identificador ? String(state.identificador).toLowerCase() : '';
      const codigo = state.codigo ? String(state.codigo).toLowerCase() : '';
      
      return titulo.includes(filterValue) || 
             identificador.includes(filterValue) || 
             codigo.includes(filterValue);
    });
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
    if (!detalleForm || !detalleForm.valid) {
      this.toastr.info('Por favor completa todos los campos requeridos', 'Información', {
        timeOut: 5000
      });
      return;
    }

    if (!this.producto || !this.producto.identificador) {
      this.toastr.warning('Por favor selecciona un producto', 'Advertencia', {
        timeOut: 5000
      });
      return;
    }

    const cantidad = parseInt(detalleForm.value.cantidad) || 1;
    const stockDisponible = parseInt(this.producto.stock) || 0;

    // Validar stock
    if (cantidad <= 0) {
      this.toastr.warning('La cantidad debe ser mayor a 0', 'Advertencia', {
        timeOut: 5000
      });
      return;
    }

    if (cantidad > stockDisponible) {
      this.toastr.warning(`No hay suficiente stock disponible. Stock disponible: ${stockDisponible}`, 'Advertencia', {
        timeOut: 7000
      });
      if (detalleForm.value.isCode) {
        this.limpiarFormularioProducto();
      }
      return;
    }

    // Buscar si el producto ya existe en el detalle
    const existProductIndex = this.data_detalle.findIndex(d => d.identificador === this.producto.identificador);
    
    if (existProductIndex >= 0) {
      // Producto ya existe, actualizar cantidad
      const cantidadActual = parseInt(this.data_detalle[existProductIndex].cantidad) || 0;
      const nuevaCantidad = cantidadActual + cantidad;
      
      if (nuevaCantidad > stockDisponible) {
        this.toastr.warning(`No hay suficiente stock. Ya tienes ${cantidadActual} unidades. Stock disponible: ${stockDisponible}`, 'Advertencia', {
          timeOut: 7000
        });
        if (detalleForm.value.isCode) {
          this.limpiarFormularioProducto();
        }
        return;
      }

      this.data_detalle[existProductIndex].cantidad = nuevaCantidad;
      this.producto.stock = stockDisponible - nuevaCantidad;
      
      // Actualizar stock en el array de productos
      const productoIndex = this.productos.findIndex(p => p._id === this.producto._id);
      if (productoIndex >= 0) {
        this.productos[productoIndex].stock = this.producto.stock;
      }
      
      this.toastr.success(`Producto actualizado. Cantidad total: ${nuevaCantidad}`, 'Éxito', {
        timeOut: 3000
      });
    } else {
      // Producto nuevo, agregarlo al detalle
      this.data_detalle.push({
        identificador: this.producto.identificador,
        imagenes: this.producto.imagenes || [],
        idproducto: this.producto._id,
        cantidad: cantidad,
        producto: this.producto.titulo,
        precio_venta: this.producto.precio_venta,
        precio_venta_original: this.producto.precio_venta,
        precio_compra: this.producto.precio_compra
      });

      // Obtener imágenes actualizadas del producto
      this._productoService.get_producto(this.producto._id).subscribe(
        (response) => {
          if (response && response.producto && response.producto.imagenes) {
            const lastIndex = this.data_detalle.length - 1;
            if (this.data_detalle[lastIndex]) {
              this.data_detalle[lastIndex].imagenes = response.producto.imagenes;
            }
          }
        },
        (error) => {
          console.error('Error obteniendo imágenes del producto:', error);
        }
      );

      // Actualizar stock del producto
      this.producto.stock = stockDisponible - cantidad;
      
      // Actualizar stock en el array de productos
      const productoIndex = this.productos.findIndex(p => p._id === this.producto._id);
      if (productoIndex >= 0) {
        this.productos[productoIndex].stock = this.producto.stock;
      }

      this.toastr.success('Producto agregado exitosamente', 'Éxito', {
        timeOut: 3000
      });
    }

    // Limpiar formulario después de agregar
    this.limpiarFormularioProducto();
  }

  limpiarFormularioProducto() {
    this.detalle = new DetalleVenta('', '', null);
    this.producto = {
      stock: '--|--',
    };
    this.controlFind.patchValue("");
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
    if (idx < 0 || idx >= this.data_detalle.length) {
      return;
    }

    const productoEliminado = this.data_detalle[idx];
    const cantidadEliminada = parseInt(productoEliminado.cantidad) || 0;

    // Restaurar stock del producto
    const objIndex = this.productos.findIndex((obj => obj._id === productoEliminado.idproducto));
    if (objIndex >= 0) {
      const stockActual = parseInt(this.productos[objIndex].stock) || 0;
      this.productos[objIndex].stock = stockActual + cantidadEliminada;
    }

    // Eliminar del detalle
    this.data_detalle.splice(idx, 1);

    this.toastr.info('Producto eliminado del detalle', 'Información', {
      timeOut: 3000
    });
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

  openClienteModal() {
    this.nuevoCliente = {
      nombres: '',
      correo: '',
      dni: ''
    };
    const modalElement = document.getElementById('modalRegistrarCliente');
    if (modalElement) {
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#modalRegistrarCliente').modal('show');
      } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        let backdrop = document.getElementById('modalRegistrarClienteBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalRegistrarClienteBackdrop';
          document.body.appendChild(backdrop);
          backdrop.addEventListener('click', () => {
            this.closeClienteModal();
          });
        }
      }
    }
  }

  closeClienteModal() {
    const modalElement = document.getElementById('modalRegistrarCliente');
    const backdrop = document.getElementById('modalRegistrarClienteBackdrop');
    
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modalRegistrarCliente').modal('hide');
      setTimeout(() => {
        const backdropElements = document.querySelectorAll('.modal-backdrop');
        backdropElements.forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 300);
    } else {
      if (modalElement) {
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
      }
      if (backdrop) {
        backdrop.remove();
      }
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  onSubmitCliente(clienteForm) {
    if (clienteForm.valid) {
      this.isSavingCliente = true;
      this._clienteService.insert_cliente({
        nombres: clienteForm.value.nombres,
        dni: clienteForm.value.dni,
        correo: clienteForm.value.correo
      }).subscribe(
        response => {
          this.isSavingCliente = false;
          this.toastr.success('Cliente registrado exitosamente', 'Éxito', {
            timeOut: 3000
          });
          
          // Recargar lista de clientes
          this._clienteService.get_clientes().subscribe(
            clientesResponse => {
              this.clientes = clientesResponse.clientes;
              // Seleccionar el nuevo cliente
              if (response && response.cliente) {
                this.venta.idcliente = response.cliente._id;
              } else if (this.clientes && this.clientes.length > 0) {
                this.venta.idcliente = this.clientes[this.clientes.length - 1]._id;
              }
              this.closeClienteModal();
            },
            error => {
              this.toastr.error('Error al cargar los clientes', 'Error', {
                timeOut: 5000
              });
              this.closeClienteModal();
            }
          );
        },
        error => {
          this.isSavingCliente = false;
          const errorMessage = (error.error && error.error.message) ? error.error.message : 'Error desconocido';
          this.toastr.error('Error al registrar el cliente: ' + errorMessage, 'Error', {
            timeOut: 9000
          });
        }
      );
    } else {
      this.toastr.info('Por favor completa todos los campos requeridos', 'Información', {
        timeOut: 5000
      });
    }
  }
}
