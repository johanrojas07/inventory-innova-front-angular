import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Producto } from "../../../models/Producto";
import { ProductoService } from 'src/app/services/producto.service';
import { Router } from '@angular/router';

interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-producto-create',
  templateUrl: './producto-create.component.html',
  styleUrls: ['./producto-create.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProductoCreateComponent implements OnInit {

  public producto;
  public imgSelect: String | ArrayBuffer;
  public categorias;
  public success_message;
  public error_message;
  public imagenesData = [];
  public margenGanancia: number = 0;
  public porcentajeGanancia: number = 0;
  public isSubmitting: boolean = false;
  public identificadorExiste: boolean = false;
  public isCheckingIdentificador: boolean = false;
  public identificadorError: string = '';
  public identificadorGenerado: string = '';
  public productosSimilares: any[] = [];
  public isCheckingSimilares: boolean = false;
  public mostrarAdvertenciaSimilares: boolean = false;
  public categoriaBusqueda: string = '';
  public categoriasFiltradas: any[] = [];
  public mostrarDropdownCategorias: boolean = false;

  constructor(
    private _productoService: ProductoService,
    private _router: Router
  ) {
    this.producto = new Producto('', '', '', '', '', 0, '', 0, '', '', []);
  }

  ngOnInit() {
    // Obtener categorías
    this._productoService.get_categorias().subscribe(
      response => {
        this.categorias = response.categorias;
        this.categoriasFiltradas = this.categorias || [];
        console.log(this.categorias);
      },
      error => {

      }
    );

    // Generar identificador automático
    this.generarIdentificadorDisponible();
  }

  generarIdentificadorDisponible() {
    this._productoService.get_productos('').subscribe(
      response => {
        if (response && response.productos) {
          // Obtener todos los identificadores numéricos existentes
          const identificadoresExistentes = response.productos
            .map(p => {
              const id = p.identificador ? p.identificador.toString().trim() : '';
              // Solo considerar identificadores que sean números
              const numId = parseInt(id);
              return isNaN(numId) ? null : numId;
            })
            .filter(id => id !== null)
            .sort((a, b) => a - b);

          // Encontrar el siguiente número disponible
          let siguienteId = 1;
          for (const id of identificadoresExistentes) {
            if (id === siguienteId) {
              siguienteId++;
            } else if (id > siguienteId) {
              break;
            }
          }

          // Asignar el identificador generado
          this.identificadorGenerado = siguienteId.toString();
          this.producto.identificador = siguienteId.toString();
          this.identificadorExiste = false;
          this.identificadorError = '';
        } else {
          // Si no hay productos, empezar con 1
          this.identificadorGenerado = '1';
          this.producto.identificador = '1';
          this.identificadorExiste = false;
          this.identificadorError = '';
        }
      },
      error => {
        // En caso de error, empezar con 1
        this.identificadorGenerado = '1';
        this.producto.identificador = '1';
        this.identificadorExiste = false;
        this.identificadorError = '';
      }
    );
  }

  restaurarIdentificadorGenerado() {
    if (this.identificadorGenerado) {
      this.producto.identificador = this.identificadorGenerado;
      this.identificadorExiste = false;
      this.identificadorError = '';
      // Verificar que el identificador generado sigue disponible
      this.verificarIdentificador();
    } else {
      // Si no hay identificador generado, generar uno nuevo
      this.generarIdentificadorDisponible();
    }
  }

  buscarProductosSimilares() {
    const titulo = this.producto.titulo ? this.producto.titulo.trim() : '';
    
    // Solo buscar si el título tiene al menos 3 caracteres
    if (titulo.length < 3) {
      this.productosSimilares = [];
      this.mostrarAdvertenciaSimilares = false;
      return;
    }

    this.isCheckingSimilares = true;
    this.mostrarAdvertenciaSimilares = false;

    // Usar un timeout para evitar múltiples llamadas mientras el usuario escribe
    setTimeout(() => {
      this._productoService.get_productos(titulo).subscribe(
        (response) => {
          this.isCheckingSimilares = false;
          if (response && response.productos && response.productos.length > 0) {
            // Filtrar productos que sean realmente similares (no exactamente iguales)
            const tituloLower = titulo.toLowerCase().trim();
            this.productosSimilares = response.productos.filter((p: any) => {
              const tituloProducto = p.titulo ? p.titulo.toLowerCase().trim() : '';
              // No mostrar si es exactamente igual
              if (tituloProducto === tituloLower) {
                return false;
              }
              // Mostrar si contiene palabras similares o es similar
              return tituloProducto.includes(tituloLower) || tituloLower.includes(tituloProducto);
            });

            // Si hay productos similares, mostrar advertencia
            if (this.productosSimilares.length > 0) {
              this.mostrarAdvertenciaSimilares = true;
            } else {
              this.mostrarAdvertenciaSimilares = false;
            }
          } else {
            this.productosSimilares = [];
            this.mostrarAdvertenciaSimilares = false;
          }
        },
        (error) => {
          this.isCheckingSimilares = false;
          this.productosSimilares = [];
          this.mostrarAdvertenciaSimilares = false;
        }
      );
    }, 800); // Debounce de 800ms
  }

  cerrarAdvertenciaSimilares() {
    this.mostrarAdvertenciaSimilares = false;
  }

  filtrarCategorias() {
    const busqueda = this.categoriaBusqueda ? this.categoriaBusqueda.toLowerCase().trim() : '';
    
    if (!busqueda) {
      // Si no hay búsqueda, mostrar todas las categorías
      this.categoriasFiltradas = this.categorias ? [...this.categorias] : [];
    } else {
      // Filtrar categorías por título o descripción
      this.categoriasFiltradas = (this.categorias || []).filter((cat: any) => {
        const titulo = cat.titulo ? cat.titulo.toLowerCase() : '';
        const descripcion = cat.descripcion ? cat.descripcion.toLowerCase() : '';
        return titulo.includes(busqueda) || descripcion.includes(busqueda);
      });
    }
    
    // Mostrar el dropdown si hay categorías filtradas o si no hay búsqueda
    this.mostrarDropdownCategorias = true;
  }

  onCategoriaFocus() {
    // Al hacer focus, mostrar todas las categorías si no hay búsqueda
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
    // Esperar un poco antes de cerrar para permitir el click en las opciones
    setTimeout(() => {
      this.mostrarDropdownCategorias = false;
      
      // Si hay un ID seleccionado, asegurar que el texto coincida
      if (this.producto.idcategoria && this.categorias) {
        const categoria = this.categorias.find((cat: any) => cat._id === this.producto.idcategoria);
        if (categoria) {
          this.categoriaBusqueda = categoria.titulo;
        } else {
          // Si el ID no existe en las categorías, limpiar
          this.producto.idcategoria = '';
          this.categoriaBusqueda = '';
        }
      } else if (!this.producto.idcategoria && this.categoriaBusqueda) {
        // Si hay texto pero no hay ID seleccionado, limpiar el texto
        this.categoriaBusqueda = '';
      }
    }, 200);
  }


  success_alert() {
    this.success_message = '';
  }

  error_alert() {
    this.error_message = '';
  }

  onSubmit(productoForm) {
    if (productoForm.valid) {
      // Validar identificador único
      if (!this.validateIdentificador()) {
        return;
      }
      
      // Validar precios
      if (!this.validatePrecios()) {
        return;
      }
      
      this.isSubmitting = true;
      this.error_message = '';
      
      this._productoService.insert_producto({
        codigo: productoForm.value.codigo,
        identificador: productoForm.value.identificador ? productoForm.value.identificador.toString() : '',
        titulo: productoForm.value.titulo,
        descripcion: productoForm.value.descripcion,
        imagenes: this.imagenesData,
        precio_compra: this.getNumericValue(productoForm.value.precio_compra).toString(),
        precio_venta: this.getNumericValue(productoForm.value.precio_venta).toString(),
        stock: productoForm.value.stock,
        idcategoria: productoForm.value.idcategoria,
        puntos: productoForm.value.puntos,
      }).subscribe(
        response => {
          this.isSubmitting = false;
          this.success_message = 'Producto registrado exitosamente';
          this.error_message = '';
          this.imagenesData = [];
          this.imgSelect = '../../../../assets/img/default.jpg';
          this.producto = new Producto('', '', '', '', '', 0, '', 0, '', '', []);
          this.margenGanancia = 0;
          this.porcentajeGanancia = 0;
          
          // Limpiar formulario
          productoForm.resetForm();
          
          // Generar nuevo identificador después de registrar
          this.generarIdentificadorDisponible();
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            this._router.navigate(['/productos']);
          }, 2000);
        },
        (error) => {
          this.isSubmitting = false;
          this.success_message = '';
          const errorMsg = error.error && error.error.message ? error.error.message : 'No fue posible crear el producto';
          this.error_message = errorMsg;
        }
      );

    } else {
      this.error_message = 'Por favor complete todos los campos requeridos correctamente';
    }
  }

  changeNumber() {
    // Limpiar y formatear precio de compra
    let precioCompra = (this.producto.precio_compra + "").replace(/\./g, "").replace(/\D/g, '');
    this.producto.precio_compra = this.formatPesosColombianos(precioCompra);
    
    // Limpiar y formatear precio de venta
    let precioVenta = (this.producto.precio_venta + "").replace(/\./g, "").replace(/\D/g, '');
    this.producto.precio_venta = this.formatPesosColombianos(precioVenta);
    
    // Calcular margen de ganancia
    this.calcularMargenGanancia();
  }

  formatPesosColombianos(value: string): string {
    if (!value || value === '') return '';
    
    // Remover puntos existentes
    let cleanValue = value.replace(/\./g, '');
    
    // Formatear con puntos como separadores de miles
    let formatted = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return formatted;
  }

  calcularMargenGanancia() {
    const precioCompra = this.getNumericValue(this.producto.precio_compra);
    const precioVenta = this.getNumericValue(this.producto.precio_venta);
    
    if (precioCompra > 0 && precioVenta > 0) {
      this.margenGanancia = precioVenta - precioCompra;
      this.porcentajeGanancia = ((precioVenta - precioCompra) / precioCompra) * 100;
    } else {
      this.margenGanancia = 0;
      this.porcentajeGanancia = 0;
    }
  }

  getNumericValue(value: string): number {
    if (!value) return 0;
    return parseInt(value.toString().replace(/\./g, '')) || 0;
  }

  validatePrecios(): boolean {
    const precioCompra = this.getNumericValue(this.producto.precio_compra);
    const precioVenta = this.getNumericValue(this.producto.precio_venta);
    
    if (precioCompra < 100) {
      this.error_message = 'El precio de compra debe ser al menos $100 COP';
      return false;
    }
    
    if (precioVenta < 100) {
      this.error_message = 'El precio de venta debe ser al menos $100 COP';
      return false;
    }
    
    if (precioVenta < precioCompra) {
      this.error_message = 'El precio de venta debe ser mayor o igual al precio de compra';
      return false;
    }
    
    return true;
  }

  verificarIdentificador() {
    const identificador = this.producto.identificador ? this.producto.identificador.toString().trim() : '';
    
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
            // El identificador ya existe
            this.identificadorExiste = true;
            this.identificadorError = 'Este identificador ya está en uso. Por favor, use otro.';
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

  imgSelected(event: HtmlInputEvent) {
    this.imagenesData = [];
    var imagenes = [];
    var selectedFiles = event.target.files;
    for (let i = 0; i < selectedFiles.length; i++) {
      console.log(selectedFiles[i]);
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

  removeImage() {
    this.imgSelect = '../../../../assets/img/default.jpg';
    this.imagenesData = [];
  }



}

