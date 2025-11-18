import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Producto } from 'src/app/models/Producto';
import { ProductoService } from 'src/app/services/producto.service';
import { ToastrService } from 'ngx-toastr';

interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-producto-edit',
  templateUrl: './producto-edit.component.html',
  styleUrls: ['./producto-edit.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProductoEditComponent implements OnInit {

  public producto: Producto;
  public id;
  public categorias;
  // public file :File;
  public imgSelect: String | ArrayBuffer;
  public success_message;
  public error_message;
  public stock;
  public imagenesData = [];
  public margenGanancia: number = 0;
  public porcentajeGanancia: number = 0;
  public isSubmitting: boolean = false;
  public categoriaBusqueda: string = '';
  public categoriasFiltradas: any[] = [];
  public mostrarDropdownCategorias: boolean = false;
  public isLoading: boolean = true;
  public identificadorExiste: boolean = false;
  public isCheckingIdentificador: boolean = false;
  public identificadorError: string = '';
  public identificadorOriginal: string = '';

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService,
    private _router: Router,
    private toastr: ToastrService
  ) {
    this.producto = new Producto('', '', '', '1', '1', 1, '', 1, '', '', []);
  }

  ngOnInit() {
    this.isLoading = true;
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this._productoService.get_producto(this.id).subscribe(
        response => {
          this.producto = response.producto;
          this.imagenesData = (this.producto && this.producto.imagenes) ? this.producto.imagenes.map(s => s.imagen) : [];
          this.identificadorOriginal = this.producto.identificador || '';
          
          // Inicializar categoría seleccionada
          if (this.producto.idcategoria) {
            this._productoService.get_categorias().subscribe(
              response => {
                this.categorias = response.categorias;
                this.categoriasFiltradas = this.categorias || [];
                const categoria = this.categorias.find((cat: any) => cat._id === this.producto.idcategoria);
                if (categoria) {
                  this.categoriaBusqueda = categoria.titulo;
                }
                this.calcularMargen();
                this.isLoading = false;
              },
              error => {
                this.toastr.error('Error al cargar las categorías', 'Error', {
                  timeOut: 5000
                });
                this.isLoading = false;
              }
            );
          } else {
            this._productoService.get_categorias().subscribe(
              response => {
                this.categorias = response.categorias;
                this.categoriasFiltradas = this.categorias || [];
                this.calcularMargen();
                this.isLoading = false;
              },
              error => {
                this.toastr.error('Error al cargar las categorías', 'Error', {
                  timeOut: 5000
                });
                this.isLoading = false;
              }
            );
          }
        },
        error => {
          this.toastr.error('Error al cargar el producto', 'Error', {
            timeOut: 5000
          });
          this.isLoading = false;
        }
      )
    });
  }

  success_alert() {
    this.success_message = '';
  }

  error_alert() {
    this.error_message = '';
  }

  imgSelected(event: HtmlInputEvent) {
    var imagenes = [];
    var selectedFiles = event.target.files;
    for (let i = 0; i < selectedFiles.length; i++) {
      imagenes.push(selectedFiles[i]);
    }

    for (let i = 0; i < imagenes.length; i++) {
      let reader = new FileReader();
      reader.readAsDataURL(imagenes[i]);
      reader.onload = (e) => {
        this.imgSelect = reader.result;
        this.imagenesData.push(reader.result);
      };
    }
  }

  removerImagen(index: number) {
    if (this.imagenesData && this.imagenesData.length > index) {
      this.imagenesData.splice(index, 1);
    }
  }

  onSubmit(productoForm) {
    if (productoForm.valid) {
      // Validar identificador único
      if (!this.validateIdentificador()) {
        this.isSubmitting = false;
        return;
      }
      
      this.isSubmitting = true;
      
      // Validar que el precio de compra sea menor o igual al de venta
      const precioCompra = parseInt((productoForm.value.precio_compra + '').replace(/,/g, "").replace(/\D/g, '')) || 0;
      const precioVenta = parseInt((productoForm.value.precio_venta + '').replace(/,/g, "").replace(/\D/g, '')) || 0;
      
      if (precioCompra <= 0) {
        this.toastr.warning('El precio de compra debe ser mayor a 0', 'Advertencia', {
          timeOut: 5000
        });
        this.isSubmitting = false;
        return;
      }
      
      if (precioVenta <= 0) {
        this.toastr.warning('El precio de venta debe ser mayor a 0', 'Advertencia', {
          timeOut: 5000
        });
        this.isSubmitting = false;
        return;
      }
      
      this._productoService.update_producto({
        _id: this.id,
        codigo: productoForm.value.codigo,
        identificador: productoForm.value.identificador,
        titulo: productoForm.value.titulo,
        descripcion: productoForm.value.descripcion,
        imagenes: this.imagenesData,
        precio_compra: precioCompra,
        precio_venta: precioVenta,
        idcategoria: productoForm.value.idcategoria,
        puntos: productoForm.value.puntos
      }).subscribe(
        response => {
          this.isSubmitting = false;
          this.success_message = 'Se actualizó el producto correctamente';
          this.toastr.success('Producto actualizado exitosamente', 'Éxito', {
            timeOut: 3000
          });
          
          // Redirigir después de 1.5 segundos
          setTimeout(() => {
            this._router.navigate(['/productos']);
          }, 1500);
        },
        error => {
          this.isSubmitting = false;
          const errorMsg = error.error && error.error.message ? error.error.message : (error.error || 'Error desconocido');
          this.error_message = 'Error al actualizar el producto: ' + errorMsg;
          this.toastr.error('Error al actualizar el producto: ' + errorMsg, 'Error', {
            timeOut: 5000
          });
        }
      );

    } else {
      this.error_message = 'Complete correctamente el formulario';
      this.toastr.warning('Por favor complete todos los campos requeridos', 'Advertencia', {
        timeOut: 5000
      });
    }
  }

  changeNumber() {
    this.producto.precio_compra = (this.producto.precio_compra + "").replace(/\D/g, '');
    this.producto.precio_venta = (this.producto.precio_venta + "").replace(/\D/g, '');
    this.producto.precio_compra = this.changeDato(this.producto.precio_compra);
    this.producto.precio_venta = this.changeDato(this.producto.precio_venta + "");
    this.calcularMargen();
  }

  changeDato(value) {
    var chars = value.replace(/,/g, "").split("").reverse()
    var withCommas = []
    for (var i = 1; i <= chars.length; i++) {
      withCommas.push(chars[i - 1])
      if (i % 3 == 0 && i != chars.length) {
        withCommas.push(",")
      }
    }
    return withCommas.reverse().join("");
  }

  calcularMargen() {
    const precioCompra = parseInt((this.producto.precio_compra + "").replace(/,/g, "").replace(/\D/g, '')) || 0;
    const precioVenta = parseInt((this.producto.precio_venta + "").replace(/,/g, "").replace(/\D/g, '')) || 0;
    
    this.margenGanancia = precioVenta - precioCompra;
    this.porcentajeGanancia = precioCompra > 0 ? ((this.margenGanancia / precioCompra) * 100) : 0;
  }

  filtrarCategorias() {
    const busqueda = this.categoriaBusqueda ? this.categoriaBusqueda.toLowerCase().trim() : '';
    
    if (!busqueda) {
      this.categoriasFiltradas = this.categorias ? [...this.categorias] : [];
    } else {
      this.categoriasFiltradas = (this.categorias || []).filter((cat: any) => {
        const titulo = cat.titulo ? cat.titulo.toLowerCase() : '';
        const descripcion = cat.descripcion ? cat.descripcion.toLowerCase() : '';
        return titulo.includes(busqueda) || descripcion.includes(busqueda);
      });
    }
    
    this.mostrarDropdownCategorias = true;
  }

  onCategoriaFocus() {
    if (!this.categoriaBusqueda || this.categoriaBusqueda.trim() === '') {
      this.categoriasFiltradas = this.categorias ? [...this.categorias] : [];
    }
    this.mostrarDropdownCategorias = true;
  }

  seleccionarCategoria(categoria: any) {
    this.producto.idcategoria = categoria._id;
    this.categoriaBusqueda = categoria.titulo;
    this.mostrarDropdownCategorias = false;
  }

  getCategoriaNombre(): string {
    if (!this.producto.idcategoria || !this.categorias) {
      return this.categoriaBusqueda || '';
    }
    
    const categoria = this.categorias.find((cat: any) => cat._id === this.producto.idcategoria);
    return categoria ? categoria.titulo : this.categoriaBusqueda || '';
  }

  onCategoriaBlur() {
    setTimeout(() => {
      this.mostrarDropdownCategorias = false;
      
      if (this.producto.idcategoria && this.categorias) {
        const categoria = this.categorias.find((cat: any) => cat._id === this.producto.idcategoria);
        if (categoria) {
          this.categoriaBusqueda = categoria.titulo;
        } else {
          this.producto.idcategoria = '';
          this.categoriaBusqueda = '';
        }
      } else if (!this.producto.idcategoria && this.categoriaBusqueda) {
        this.categoriaBusqueda = '';
      }
    }, 200);
  }

  verificarIdentificador() {
    const identificador = this.producto.identificador ? this.producto.identificador.trim() : '';
    
    // Si el identificador no ha cambiado, no verificar
    if (identificador === this.identificadorOriginal) {
      this.identificadorExiste = false;
      this.identificadorError = '';
      this.isCheckingIdentificador = false;
      return;
    }
    
    if (!identificador || identificador.length < 1) {
      this.identificadorExiste = false;
      this.identificadorError = '';
      return;
    }

    // Validar que sea un número
    const numId = parseInt(identificador);
    if (isNaN(numId) || numId < 1) {
      this.identificadorExiste = true;
      this.identificadorError = 'El identificador debe ser un número mayor a 0';
      this.isCheckingIdentificador = false;
      return;
    }

    this.isCheckingIdentificador = true;
    this.identificadorError = '';
    
    // Usar un timeout para evitar múltiples llamadas mientras el usuario escribe
    setTimeout(() => {
      this._productoService.verificar_identificador(identificador).subscribe(
        (response) => {
          this.isCheckingIdentificador = false;
          if (response && response.productos && response.productos.length > 0) {
            // Verificar si el producto encontrado es diferente al que estamos editando
            const productoExistente = response.productos.find((p: any) => p._id !== this.id);
            if (productoExistente) {
              // El identificador ya existe en otro producto
              this.identificadorExiste = true;
              this.identificadorError = 'Este identificador ya está en uso. Por favor, use otro.';
            } else {
              // El identificador pertenece al producto actual, está disponible
              this.identificadorExiste = false;
              this.identificadorError = '';
            }
          } else {
            // El identificador está disponible
            this.identificadorExiste = false;
            this.identificadorError = '';
          }
        },
        (error) => {
          this.isCheckingIdentificador = false;
          // Si hay error, asumimos que no existe para no bloquear al usuario
          this.identificadorExiste = false;
          this.identificadorError = '';
        }
      );
    }, 500);
  }

  validateIdentificador(): boolean {
    if (this.identificadorExiste) {
      this.error_message = 'El identificador ya está en uso. Por favor, use otro identificador.';
      return false;
    }
    return true;
  }


}
