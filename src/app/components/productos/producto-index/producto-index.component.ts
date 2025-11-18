import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ProductoService } from 'src/app/services/producto.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

declare var jQuery: any;
declare var $: any;

@Component({
  selector: 'app-producto-index',
  templateUrl: './producto-index.component.html',
  styleUrls: ['./producto-index.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProductoIndexComponent implements OnInit, OnDestroy {

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
  public productoEditando: any = {};
  public isSavingStock = false;
  public isEditing = false;
  public productoIdEditando: string = '';
  public productoStockSeleccionado: any = null;
  public tipoOperacionStock: 'aumentar' | 'reducir' = 'aumentar';
  public nuevoStockCalculado: number = 0;
  public categoriaEditando: any = {
    titulo: '',
    descripcion: ''
  };
  public isSavingCategoria = false;
  public categoriaBusqueda: string = '';
  public categoriasFiltradas: any[] = [];

  constructor(
    private toastr: ToastrService,
    private _productoService: ProductoService,
  ) {
    this.categoriaEditando = {
      titulo: '',
      descripcion: ''
    };
  }

  ngOnInit() {
    this.isLoading = true;
    this._productoService.get_productos('').subscribe(
      response => {
        this.productos = response.productos;
        this.filtroProductos = this.productos;
        console.log(this.productos);
        this.isLoading = false;
        
        // Iniciar precarga lazy después de que se renderice el DOM
        setTimeout(() => {
          this.initLazyImageLoading();
        }, 300);
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
        this.categoriasFiltradas = this.categorias || [];
        this.categoriaBusqueda = '';
      },
      error => {
        this.toastr.error('No fue posible cargar las categorias: ' + error.error, 'Error', {
          timeOut: 9000
        });
      }
    );
  }

  public isLoadingImage = false;
  public productoIdCargandoImagen: string = '';
  
  // Precarga de imágenes lazy
  imagenesPrecargadas: Map<string, string> = new Map();
  imagenesCargando: Set<string> = new Set();
  imagePreloadSubscriptions: Map<string, Subscription> = new Map();
  intersectionObserver: IntersectionObserver | null = null;

  swipe(idProducto: string) {
    // Evitar múltiples clics mientras carga
    if (this.isLoadingImage) {
      return;
    }

    this.productoIdCargandoImagen = idProducto;
    this.imagen_view = '';
    this.isLoadingImage = true;
    
    // Abrir modal inmediatamente con estado de carga
    setTimeout(() => {
      const modalElement = document.getElementById('modal-ver-imagen');
      if (modalElement) {
        const $ = (window as any).$;
        if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
          $('#modal-ver-imagen').modal('show');
        } else {
          modalElement.style.display = 'block';
          modalElement.classList.add('show');
          document.body.classList.add('modal-open');
          let backdrop = document.getElementById('modalImagenBackdrop');
          if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.id = 'modalImagenBackdrop';
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', () => {
              this.closeImageModal();
            });
          }
        }
      }
    }, 50);

    this._productoService.get_producto(idProducto).subscribe(
      (response) => {
        this.isLoadingImage = false;
        this.productoIdCargandoImagen = '';
        if (response && response.producto && response.producto.imagenes && response.producto.imagenes.length > 0) {
          this.imagen_view = response.producto.imagenes[0].imagen;
        } else {
          this.toastr.error('No se encontró ninguna imagen', 'Error', {
            timeOut: 5000
          });
          this.closeImageModal();
        }
      }, () => {
        this.isLoadingImage = false;
        this.productoIdCargandoImagen = '';
        this.toastr.error('No fue posible cargar la imagen', 'Error', {
          timeOut: 5000
        });
        this.closeImageModal();
      })
  }

  closeImageModal() {
    const modalElement = document.getElementById('modal-ver-imagen');
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modal-ver-imagen').modal('hide');
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
      const backdropElements = document.querySelectorAll('.modal-backdrop');
      backdropElements.forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  initLazyImageLoading() {
    // Limpiar observer anterior si existe
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Crear Intersection Observer para precargar solo imágenes visibles
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const productoId = entry.target.getAttribute('data-producto-id');
          if (productoId && !this.imagenesPrecargadas.has(productoId) && !this.imagenesCargando.has(productoId)) {
            this.preloadProductImage(productoId);
          }
          // Dejar de observar una vez que se carga
          if (this.intersectionObserver) {
            this.intersectionObserver.unobserve(entry.target);
          }
        }
      });
    }, {
      rootMargin: '50px' // Precargar 50px antes de que sea visible
    });

    // Observar todos los elementos con data-producto-id
    setTimeout(() => {
      const imageElements = document.querySelectorAll('[data-producto-id]');
      imageElements.forEach(el => {
        if (this.intersectionObserver) {
          this.intersectionObserver.observe(el);
        }
      });
    }, 100);
  }

  preloadProductImage(productoId: string) {
    if (this.imagenesCargando.has(productoId) || this.imagenesPrecargadas.has(productoId)) {
      return;
    }

    this.imagenesCargando.add(productoId);

    const subscription = this._productoService.get_producto(productoId).subscribe(
      (response) => {
        let imagenUrl = null;
        if (response && response.producto) {
          if (response.producto.imagenes && response.producto.imagenes.length > 0) {
            imagenUrl = response.producto.imagenes[0].imagen;
          } else if (response.producto.imagen) {
            imagenUrl = response.producto.imagen;
          }
        }

        if (imagenUrl) {
          // Verificar que la imagen se pueda cargar
          const img = new Image();
          img.onload = () => {
            this.imagenesPrecargadas.set(productoId, imagenUrl);
            this.imagenesCargando.delete(productoId);
            this.imagePreloadSubscriptions.delete(productoId);
          };
          img.onerror = () => {
            this.imagenesCargando.delete(productoId);
            this.imagePreloadSubscriptions.delete(productoId);
          };
          img.src = imagenUrl;
        } else {
          this.imagenesCargando.delete(productoId);
          this.imagePreloadSubscriptions.delete(productoId);
        }
      },
      () => {
        this.imagenesCargando.delete(productoId);
        this.imagePreloadSubscriptions.delete(productoId);
      }
    );

    this.imagePreloadSubscriptions.set(productoId, subscription);
  }

  getProductImage(producto: any): string | null {
    if (producto._id && this.imagenesPrecargadas.has(producto._id)) {
      return this.imagenesPrecargadas.get(producto._id) || null;
    }
    return producto.imagen || (producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0].imagen : null);
  }

  isImageLoading(producto: any): boolean {
    return producto._id ? this.imagenesCargando.has(producto._id) : false;
  }

  ngOnDestroy() {
    // Limpiar todas las suscripciones de precarga
    this.imagePreloadSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.imagePreloadSubscriptions.clear();

    // Desconectar el Intersection Observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Limpiar los sets y maps
    this.imagenesCargando.clear();
    this.imagenesPrecargadas.clear();
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
      this.isSavingCategoria = true;
      const categoriaData = {
        titulo: categoriaForm.value.titulo_cat,
        descripcion: categoriaForm.value.descripcion_cat,
      };

      if (this.categoriaEditando._id) {
        // Actualizar categoría existente
        this._productoService.update_categoria(this.categoriaEditando._id, categoriaData).subscribe(
          response => {
            this.isSavingCategoria = false;
            this.toastr.success('Categoría actualizada exitosamente', 'Éxito', {
              timeOut: 3000
            });
            this._productoService.get_categorias().subscribe(
              response => {
                this.categorias = response.categorias;
                this.closeNuevaCategoriaModal();
                // Asegurar que el modal de listado siga abierto
                setTimeout(() => {
                  this.ensureCategoriasModalOpen();
                }, 350);
              },
              error => {
                this.toastr.error('No fue posible obtener las categorías', 'Error', {
                  timeOut: 5000
                });
              }
            );
          },
          error => {
            this.isSavingCategoria = false;
            const errorMessage = (error.error && error.error.message) ? error.error.message : 'Error desconocido';
            this.toastr.error('No fue posible actualizar la categoría: ' + errorMessage, 'Error', {
              timeOut: 9000
            });
          }
        );
      } else {
        // Crear nueva categoría
        this._productoService.insert_categoria(categoriaData).subscribe(
          response => {
            this.isSavingCategoria = false;
            this.toastr.success('Categoría registrada exitosamente', 'Éxito', {
              timeOut: 3000
            });
            this._productoService.get_categorias().subscribe(
              response => {
                this.categorias = response.categorias;
                this.closeNuevaCategoriaModal();
                // Asegurar que el modal de listado siga abierto
                setTimeout(() => {
                  this.ensureCategoriasModalOpen();
                }, 350);
              },
              error => {
                this.toastr.error('No fue posible obtener las categorías', 'Error', {
                  timeOut: 5000
                });
              }
            );
          },
          error => {
            this.isSavingCategoria = false;
            const errorMessage = (error.error && error.error.message) ? error.error.message : 'Error desconocido';
            this.toastr.error('No fue posible crear la categoría: ' + errorMessage, 'Error', {
              timeOut: 9000
            });
          }
        );
      }
    } else {
      this.toastr.info('Por favor completa todos los campos requeridos', 'Información', {
        timeOut: 5000
      });
    }
  }

  filtrarCategorias() {
    if (!this.categoriaBusqueda || this.categoriaBusqueda.trim() === '') {
      this.categoriasFiltradas = this.categorias || [];
    } else {
      const busqueda = this.categoriaBusqueda.toLowerCase().trim();
      this.categoriasFiltradas = (this.categorias || []).filter((categoria: any) => {
        const titulo = (categoria.titulo || '').toLowerCase();
        const descripcion = (categoria.descripcion || '').toLowerCase();
        return titulo.includes(busqueda) || descripcion.includes(busqueda);
      });
    }
  }

  limpiarBusquedaCategorias() {
    this.categoriaBusqueda = '';
    this.categoriasFiltradas = this.categorias || [];
  }

  openCategoriasModal() {
    // Asegurar que categoriasFiltradas esté inicializado
    if (!this.categoriasFiltradas || this.categoriasFiltradas.length === 0) {
      this.categoriasFiltradas = this.categorias || [];
      this.categoriaBusqueda = '';
    }
    
    const modalElement = document.getElementById('modal-data-categoria');
    if (modalElement) {
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#modal-data-categoria').modal('show');
      } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        let backdrop = document.getElementById('modalCategoriasBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalCategoriasBackdrop';
          document.body.appendChild(backdrop);
          backdrop.addEventListener('click', () => {
            this.closeCategoriasModal();
          });
        }
      }
    }
  }

  openNuevaCategoriaModal() {
    this.categoriaEditando = {
      titulo: '',
      descripcion: ''
    };
    // No cerrar el modal de listado, solo abrir el modal de agregar encima
    setTimeout(() => {
      const modalElement = document.getElementById('modal-save-categoria');
      if (modalElement) {
        const $ = (window as any).$;
        if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
          $('#modal-save-categoria').modal('show');
        } else {
          modalElement.style.display = 'block';
          modalElement.classList.add('show');
          // No agregar modal-open si ya está abierto
          if (!document.body.classList.contains('modal-open')) {
            document.body.classList.add('modal-open');
          }
          let backdrop = document.getElementById('modalSaveCategoriaBackdrop');
          if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.id = 'modalSaveCategoriaBackdrop';
            backdrop.style.zIndex = '1055'; // Encima del primer modal
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', () => {
              this.closeNuevaCategoriaModal();
            });
          }
        }
      }
    }, 100);
  }

  closeNuevaCategoriaModal() {
    const modalElement = document.getElementById('modal-save-categoria');
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modal-save-categoria').modal('hide');
      setTimeout(() => {
        // Solo eliminar el backdrop del modal de agregar/editar
        const backdrop = document.getElementById('modalSaveCategoriaBackdrop');
        if (backdrop) {
          backdrop.remove();
        }
        // Si no hay más modales abiertos, limpiar el body
        const categoriasModal = document.getElementById('modal-data-categoria');
        if (!categoriasModal || !categoriasModal.classList.contains('show')) {
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      }, 300);
    } else {
      if (modalElement) {
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
      }
      // Solo eliminar el backdrop del modal de agregar/editar
      const backdrop = document.getElementById('modalSaveCategoriaBackdrop');
      if (backdrop) {
        backdrop.remove();
      }
      // Si no hay más modales abiertos, limpiar el body
      const categoriasModal = document.getElementById('modal-data-categoria');
      if (!categoriasModal || !categoriasModal.classList.contains('show')) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }
    this.categoriaEditando = {
      titulo: '',
      descripcion: ''
    };
  }

  openEditarCategoriaModal(categoria: any) {
    this.categoriaEditando = {
      _id: categoria._id,
      titulo: categoria.titulo || '',
      descripcion: categoria.descripcion || ''
    };
    // No cerrar el modal de listado, solo abrir el modal de editar encima
    setTimeout(() => {
      const modalElement = document.getElementById('modal-save-categoria');
      if (modalElement) {
        const $ = (window as any).$;
        if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
          $('#modal-save-categoria').modal('show');
        } else {
          modalElement.style.display = 'block';
          modalElement.classList.add('show');
          // No agregar modal-open si ya está abierto
          if (!document.body.classList.contains('modal-open')) {
            document.body.classList.add('modal-open');
          }
          let backdrop = document.getElementById('modalSaveCategoriaBackdrop');
          if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.id = 'modalSaveCategoriaBackdrop';
            backdrop.style.zIndex = '1055'; // Encima del primer modal
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', () => {
              this.closeNuevaCategoriaModal();
            });
          }
        }
      }
    }, 100);
  }

  closeCategoriasModal() {
    const modalElement = document.getElementById('modal-data-categoria');
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modal-data-categoria').modal('hide');
      setTimeout(() => {
        // Eliminar todos los backdrops y limpiar
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
      // Eliminar todos los backdrops y limpiar
      const backdropElements = document.querySelectorAll('.modal-backdrop');
      backdropElements.forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  ensureCategoriasModalOpen() {
    const modalElement = document.getElementById('modal-data-categoria');
    if (modalElement && !modalElement.classList.contains('show') && modalElement.style.display !== 'block') {
      // Si el modal de listado no está abierto, abrirlo
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#modal-data-categoria').modal('show');
      } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        let backdrop = document.getElementById('modalCategoriasBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalCategoriasBackdrop';
          backdrop.style.zIndex = '1050'; // Debajo del modal de agregar/editar
          document.body.appendChild(backdrop);
          backdrop.addEventListener('click', () => {
            this.closeCategoriasModal();
          });
        }
      }
    }
  }

  eliminarCategoria(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this._productoService.delete_categoria(id).subscribe(
          response => {
            this.toastr.success('Categoría eliminada exitosamente', 'Éxito', {
              timeOut: 3000
            });
            this._productoService.get_categorias().subscribe(
              response => {
                this.categorias = response.categorias;
              },
              error => {
                this.toastr.error('No fue posible obtener las categorías', 'Error', {
                  timeOut: 5000
                });
              }
            );
          },
          error => {
            const errorMessage = (error.error && error.error.message) ? error.error.message : 'Error desconocido';
            this.toastr.error('No fue posible eliminar la categoría: ' + errorMessage, 'Error', {
              timeOut: 9000
            });
          }
        );
      }
    });
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
        this._productoService.delete_producto(id).subscribe(
          response => {
            Swal.fire(
              'Registro eliminado!',
              'Se elimino correctamente.',
              'success'
            )    
            this.isLoading = true;
            this._productoService.get_productos('').subscribe(
              response => {
                this.isLoading = false;
                this.productos = response.productos;
                this.filtroProductos = this.productos;
                // Reiniciar lazy loading después de actualizar productos
                setTimeout(() => {
                  this.initLazyImageLoading();
                }, 200);
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
    const producto = this.productos.find(p => p._id === id);
    if (producto) {
      this.openStockModal(producto);
    }
  }

  close_alert() {
    this.success_message = '';
  }

  getStockNumber(value: string): number {
    return parseInt(value) || 0;
  }

  calcularNuevoStock() {
    if (this.productoStockSeleccionado && this.producto_stockText) {
      const cantidad = parseInt(this.producto_stockText) || 0;
      if (this.tipoOperacionStock === 'aumentar') {
        this.nuevoStockCalculado = this.productoStockSeleccionado.stock + cantidad;
      } else {
        this.nuevoStockCalculado = Math.max(0, this.productoStockSeleccionado.stock - cantidad);
      }
    } else {
      this.nuevoStockCalculado = this.productoStockSeleccionado ? this.productoStockSeleccionado.stock : 0;
    }
  }

  setCantidadRapida(cantidad: number) {
    this.producto_stockText = cantidad.toString();
    this.calcularNuevoStock();
  }

  aumentar_stock(stockForm) {
    if (stockForm.valid) {
      if (this.producto_id && this.productoStockSeleccionado) {
        const cantidad = parseInt(this.producto_stockText) || 0;
        if (cantidad <= 0) {
          this.toastr.warning('La cantidad debe ser mayor a 0', 'Advertencia', {
            timeOut: 3000
          });
          return;
        }

        // Validar que no se reduzca más stock del disponible
        if (this.tipoOperacionStock === 'reducir' && cantidad > this.productoStockSeleccionado.stock) {
          this.toastr.warning('No se puede reducir más stock del disponible', 'Advertencia', {
            timeOut: 3000
          });
          return;
        }

        this.isSavingStock = true;
        
        const nuevoStock = this.tipoOperacionStock === 'aumentar' 
          ? this.productoStockSeleccionado.stock + cantidad
          : this.productoStockSeleccionado.stock - cantidad;

        this._productoService.stock_producto({
          _id: this.producto_id,
          stock: nuevoStock,
        }).subscribe(
          response => {
            this.isSavingStock = false;
            const mensaje = this.tipoOperacionStock === 'aumentar' 
              ? `Stock aumentado en ${cantidad} unidades`
              : `Stock reducido en ${cantidad} unidades`;
            this.toastr.success(mensaje, 'Éxito', {
              timeOut: 3000
            });
            this._productoService.get_productos('').subscribe(
              response => {
                this.isLoading = false;
                this.productos = response.productos;
                this.filtroProductos = this.productos;
                this.closeStockModal();
                // Reiniciar lazy loading después de actualizar productos
                setTimeout(() => {
                  this.initLazyImageLoading();
                }, 200);
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
            this.isSavingStock = false;
            const accion = this.tipoOperacionStock === 'aumentar' ? 'aumentar' : 'reducir';
            this.toastr.error(`No fue posible ${accion} el stock del producto: ` + error.error, 'Error', {
              timeOut: 9000
            });
          }
        );
      }
    }
  }

  openStockModal(producto: any) {
    this.producto_id = producto._id;
    this.productoStockSeleccionado = producto;
    this.producto_stockText = '';
    this.tipoOperacionStock = 'aumentar';
    this.nuevoStockCalculado = producto.stock || 0;
    
    // Obtener el producto completo para tener toda la información
    if (producto._id) {
      this._productoService.get_producto(producto._id).subscribe(
        response => {
          if (response && response.producto) {
            this.productoStockSeleccionado = response.producto;
            this.nuevoStockCalculado = response.producto.stock || 0;
          }
        },
        error => {
          console.error('Error al obtener producto:', error);
        }
      );
    }
    
    const modalElement = document.getElementById('modalStock');
    if (modalElement) {
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#modalStock').modal('show');
      } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        let backdrop = document.getElementById('modalStockBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalStockBackdrop';
          document.body.appendChild(backdrop);
          backdrop.addEventListener('click', () => {
            this.closeStockModal();
          });
        }
      }
    }
  }

  closeStockModal() {
    const modalElement = document.getElementById('modalStock');
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modalStock').modal('hide');
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
      const backdropElements = document.querySelectorAll('.modal-backdrop');
      backdropElements.forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    this.producto_id = null;
    this.producto_stockText = '';
    this.productoStockSeleccionado = null;
    this.tipoOperacionStock = 'aumentar';
    this.nuevoStockCalculado = 0;
  }

}
