import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ProductoService } from 'src/app/services/producto.service';
import Swal from 'sweetalert2';

declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-producto-index',
  templateUrl: './producto-index.component.html',
  styleUrls: ['./producto-index.component.css']
})
export class ProductoIndexComponent implements OnInit {

  public productos;
  public filtroProductos = [];
  public categorias;
  public titulo_cat;
  public descripcion_cat;
  public producto_stock;
  public producto_id;
  public success_message;
  public booleanValue = false;
  public isLoading = false;
  public paginator;
  public titulo_catText;
  public descripcion_catText;
  public filtroText;
  public producto_stockText;
  public imagen_view = null;

  constructor(
    private toastr: ToastrService,
    private _productoService: ProductoService,
  ) {
  }

  ngOnInit() {
    this.isLoading = true;
    this._productoService.get_productos('').subscribe(
      response => {
        this.productos = response.productos;
        this.filtroProductos = this.productos;
        console.log(this.productos);
        this.isLoading = false;

      },
      error => {
        this.toastr.error('No fue posible cargar los productos: ' + error.error, 'Error', {
          timeOut: 9000
        });
        this.isLoading = false;
      }
    );

    this._productoService.get_categorias().subscribe(
      response => {
        this.categorias = response.categorias;
      },
      error => {
        this.toastr.error('No fue posible cargar las categorias: ' + error.error, 'Error', {
          timeOut: 9000
        });
      }
    );
  }

  swipe(idProducto: string) {
    this.imagen_view = '';
    this.isLoading = true;
    this._productoService.get_producto(idProducto).subscribe(
      (response) => {
        this.isLoading = false;
        if (response && response.producto && response.producto.imagenes) {
          this.imagen_view = response.producto.imagenes[0].imagen;
        } else {
          this.toastr.error('No se encontro ninguna imagen', 'Error', {
            timeOut: 9000
          });
        }
      }, () => {
        this.isLoading = false;
        this.toastr.error('No fue posible cargar la imagen', 'Error', {
          timeOut: 9000
        });
      })
  }

  orderBy(property) {
    if (this.booleanValue) {
      this.filtroProductos.sort((a, b) => a[property] < b[property] ? 1 : a[property] > b[property] ? -1 : 0)
      this.booleanValue = !this.booleanValue
    } else {
      this.filtroProductos.sort((a, b) => a[property] > b[property] ? 1 : a[property] < b[property] ? -1 : 0)
      this.booleanValue = !this.booleanValue
    }
  }

  filterData(searchValue) {
    this.filtroProductos = this.productos.filter((item) => {
      return (item.titulo.toLowerCase().includes(searchValue.toLowerCase()) || item.identificador.toLowerCase().includes(searchValue.toLowerCase()) || item.descripcion.toLowerCase().includes(searchValue.toLowerCase()))
        || item && item.idcategoria && (item.idcategoria.titulo.toLowerCase().includes(searchValue.toLowerCase()) || item.idcategoria.descripcion.toLowerCase().includes(searchValue.toLowerCase()));
    });
  }

  save_cat(categoriaForm) {
    if (categoriaForm.valid) {
      this._productoService.insert_categoria({
        titulo: categoriaForm.value.titulo_cat,
        descripcion: categoriaForm.value.descripcion_cat,
      }).subscribe(
        response => {
          this._productoService.get_categorias().subscribe(
            response => {
              this.categorias = response.categorias;
              $('#modal-save-categoria').modal('hide');
            },
            error => {
              this.toastr.error('No fue posible obtener las categorias: ' + error.error, 'Error', {
                timeOut: 9000
              });
            }
          );
        },
        error => {
          this.toastr.error('No fue posible crea la categoria: ' + error.error, 'Error', {
            timeOut: 9000
          });
        }
      );

    }
  }

  eliminar(id) {
    Swal.fire({
      title: 'Estas seguro de eliminarlo?',
      text: "Eliminación!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar!',
      cancelButtonText: 'No, cancelar!',
      reverseButtons: true
    }).then((result) => {
      if (result.value) {
        Swal.fire(
          'Registro eliminado!',
          'Se elimino correctamente.',
          'success'
        )

        this._productoService.delete_producto(id).subscribe(
          response => {
            this.isLoading = true;
            this._productoService.get_productos('').subscribe(
              response => {
                this.isLoading = false;
                this.productos = response.productos;
                this.filtroProductos = this.productos;
              }
              , erro => {
                this.isLoading = false;
                this.toastr.error('No fue posible obtener los productos: ' + erro.error, 'Error', {
                  timeOut: 9000
                });
              }
            );
          }
          , error => {
            this.toastr.error('No fue posible eliminar el producto: ' + error.error, 'Error', {
              timeOut: 9000
            });
          }
        );

      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        Swal.fire(
          'Cancelado',
          'Se cancelo la solicitud :)',
          'error'
        )
      }
    })
  }

  get_id(id) {
    this.producto_id = id;
  }

  close_alert() {
    this.success_message = '';
  }

  aumentar_stock(stockForm) {
    if (stockForm.valid) {
      if (this.producto_id) {
        this._productoService.stock_producto({
          _id: this.producto_id,
          stock: stockForm.value.producto_stock,
        }).subscribe(
          response => {
            this.isLoading = true;
            this.success_message = 'Se aumento el stock correctamente';
            this._productoService.get_productos('').subscribe(
              response => {
                console.log("SIIIIII", response);
                this.isLoading = false;
                this.productos = response.productos;
                this.filtroProductos = this.productos;
                $('.modal').modal('hide');
              }
              , error => {
                this.isLoading = false;
                this.toastr.error('No fue posible obtener los productos: ' + error.error, 'Error', {
                  timeOut: 9000
                });
              }
            );
          },
          error => {
            this.toastr.error('No fue aumentar el stock del producto: ' + error.error, 'Error', {
              timeOut: 9000
            });
            console.log(error);

          }
        );
      }

    }
  }

}
