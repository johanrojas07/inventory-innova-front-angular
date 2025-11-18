import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ProductoService } from 'src/app/services/producto.service';
import { SaldoService } from 'src/app/services/saldo.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy {

  data = {
    num_productos: 0,
    plata_invertida: 0,
    plata_vender: 0,
    num_ventas: 0
  };
  originalSaldos = {
    sin_pagar: 0,
    efectivo: 0,
    nequi: 0,
    total: 0,
    motivo: '',
    info_sin_pagar: ''
  };

  saldos = {
    sin_pagar: 0,
    efectivo: 0,
    nequi: 0,
    total: 0,
    motivo: '',
    info_sin_pagar: ''
  }
  originalMotif = '';
  nuevoMotivo = '';
  isSaving = false;
  historialSaldos: any[] = [];
  isLoadingHistorial = false;
  productos: any[] = [];

  // Gráficas de Saldos
  saldoChartData: any[] = [];
  saldoChartLabels: string[] = ['Efectivo', 'Nequi', 'Sin Pagar'];
  saldoChartOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      animateScale: true,
      animateRotate: true
    },
    legend: {
      display: false
    },
    tooltips: {
      callbacks: {
        label: (tooltipItem, data) => {
          const label = data.labels[tooltipItem.index];
          const value = data.datasets[0].data[tooltipItem.index];
          const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
        }
      }
    }
  };
  saldoChartColors: any[] = [
    {
      backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
      borderColor: ['#10b981', '#3b82f6', '#ef4444'],
      borderWidth: 2
    }
  ];

  // Gráficas de Inventario - Margen de Ganancia
  inventarioChartData: any[] = [];
  inventarioChartLabels: string[] = [];
  
  // Gráfica de Productos por Categoría
  productosCategoriaChartData: any[] = [];
  productosCategoriaChartLabels: string[] = [];
  productosPorCategoria: any[] = [];
  
  // Productos con stock bajo
  stockBajoChartData: any[] = [];
  stockBajoChartLabels: string[] = [];
  productosStockBajo: any[] = [];
  
  // Modal de productos por categoría
  categoriaSeleccionada: any = null;
  productosCategoriaSeleccionada: any[] = [];
  
  // Modal de imagen
  imagen_view: string = '';
  isLoadingImage = false;
  productoIdCargandoImagen: string = '';
  productoNombreCargandoImagen: string = '';
  
  // Precarga de imágenes
  imagenesPrecargadas: Map<string, string> = new Map();
  imagenesCargando: Set<string> = new Set();
  imagePreloadSubscriptions: Map<string, Subscription> = new Map();
  intersectionObserver: IntersectionObserver | null = null;
  inventarioChartOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          callback: (value) => {
            return this.formatCurrency(value);
          }
        },
        gridLines: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }],
      xAxes: [{
        gridLines: {
          display: false
        }
      }]
    },
    legend: {
      display: true,
      position: 'top'
    },
    tooltips: {
      callbacks: {
        label: (tooltipItem, data) => {
          const label = data.datasets[tooltipItem.datasetIndex].label;
          const value = tooltipItem.yLabel;
          return `${label}: ${this.formatCurrency(value)}`;
        }
      }
    }
  };
  inventarioChartColors: any[] = [];

  // Opciones para gráficas de productos
  productosChartOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        },
        gridLines: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }],
      xAxes: [{
        gridLines: {
          display: false
        }
      }]
    },
    legend: {
      display: true,
      position: 'top'
    }
  };
  
  productosChartColors: any[] = [];

  constructor(
    private _productoService: ProductoService,
    private toastr: ToastrService,
    private _saldoService: SaldoService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
    this.loadSaldos();
    this.loadHistorial();
    this.loadProductos();
  }

  loadDashboardData() {
    this._productoService.get_dashboard().subscribe(
      response => {
        console.log("Data: ", response);
        this.data = response.data;
        this.updateInventarioCharts();
      },
      error => {
        this.toastr.error('Error al consultar los datos: ' + (error.error || 'Error desconocido'), 'Error', {
          timeOut: 9000
        });
      }
    );
  }

  loadHistorial() {
    this.isLoadingHistorial = true;
    this._saldoService.get_historial().subscribe(
      response => {
        this.isLoadingHistorial = false;
        console.log("Historial response:", response);
        if (response && response.saldos) {
          this.historialSaldos = response.saldos;
          console.log("Historial cargado:", this.historialSaldos);
        } else {
          this.historialSaldos = [];
        }
      },
      error => {
        this.isLoadingHistorial = false;
        console.error('Error al cargar historial:', error);
        this.historialSaldos = [];
      }
    );
  }

  loadProductos() {
    this._productoService.get_productos('').subscribe(
      response => {
        if (response.productos) {
          this.productos = response.productos;
          this.updateProductosCharts();
          // Iniciar precarga lazy después de que se renderice el DOM
          setTimeout(() => {
            this.initLazyImageLoading();
          }, 300);
        }
      },
      error => {
        console.error('Error al cargar productos:', error);
      }
    );
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
            // Actualizar los arrays para reflejar la imagen precargada
            this.updateImagesInArrays();
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

  updateImagesInArrays() {
    // Actualizar imágenes en productosStockBajo
    this.productosStockBajo = this.productosStockBajo.map(p => {
      if (p._id && this.imagenesPrecargadas.has(p._id)) {
        return { ...p, imagen: this.imagenesPrecargadas.get(p._id) };
      }
      return p;
    });

    // Actualizar imágenes en productosPorCategoria
    this.productosPorCategoria = this.productosPorCategoria.map(categoria => ({
      ...categoria,
      productos: categoria.productos.map((p: any) => {
        if (p._id && this.imagenesPrecargadas.has(p._id)) {
          return { ...p, imagen: this.imagenesPrecargadas.get(p._id) };
        }
        return p;
      })
    }));

    // Actualizar imágenes en productosCategoriaSeleccionada (modal)
    this.productosCategoriaSeleccionada = this.productosCategoriaSeleccionada.map((p: any) => {
      if (p._id && this.imagenesPrecargadas.has(p._id)) {
        return { ...p, imagen: this.imagenesPrecargadas.get(p._id) };
      }
      return p;
    });
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

  loadSaldos() {
    this._saldoService.get_saldos().subscribe(
      response => {
        console.log("Data Saldos: ", response);
        if (response.saldos) {
          this.saldos = { ...response.saldos };
          this.originalSaldos = { ...response.saldos };
          this.originalMotif = response.saldos.motivo || '';
          this.nuevoMotivo = '';
          this.updateSaldoChart();
        }
      },
      error => {
        this.toastr.error('Error al consultar los saldos: ' + (error.error || 'Error desconocido'), 'Error', {
          timeOut: 9000
        });
      }
    );
  }

  updateSaldoChart() {
    const total = this.getTotalSaldo();
    if (total > 0) {
      this.saldoChartData = [{
        data: [this.saldos.efectivo, this.saldos.nequi, this.saldos.sin_pagar],
        borderWidth: 2
      }];
    } else {
      this.saldoChartData = [];
    }
  }

  updateInventarioCharts() {
    // Calcular margen de ganancia
    const margenGanancia = this.data.plata_vender - this.data.plata_invertida;
    const porcentajeGanancia = this.data.plata_invertida > 0 
      ? ((margenGanancia / this.data.plata_invertida) * 100).toFixed(1) 
      : 0;

    this.inventarioChartData = [
      {
        label: 'Inversión',
        data: [this.data.plata_invertida],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      },
      {
        label: 'Valor de Venta',
        data: [this.data.plata_vender],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2
      },
      {
        label: 'Margen de Ganancia',
        data: [margenGanancia],
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2
      }
    ];
    this.inventarioChartLabels = [`Margen: ${porcentajeGanancia}%`];
  }

  updateProductosCharts() {
    // Agrupar productos por categoría
    const categoriasMap = new Map();
    const productosPorCategoriaMap = new Map();
    
    this.productos.forEach(producto => {
      const catNombre = producto.idcategoria && producto.idcategoria.titulo 
        ? producto.idcategoria.titulo 
        : 'Sin Categoría';
      const count = categoriasMap.get(catNombre) || 0;
      categoriasMap.set(catNombre, count + 1);
      
      // Guardar productos por categoría
      if (!productosPorCategoriaMap.has(catNombre)) {
        productosPorCategoriaMap.set(catNombre, []);
      }
      productosPorCategoriaMap.get(catNombre).push(producto);
    });

    // Crear array para la lista de categorías
    this.productosPorCategoria = Array.from(categoriasMap.entries())
      .map(([nombre, cantidad]) => ({
        nombre: nombre,
        cantidad: cantidad,
        porcentaje: this.productos.length > 0 ? ((cantidad / this.productos.length) * 100).toFixed(1) : 0,
        productos: (productosPorCategoriaMap.get(nombre) || []).map(p => ({
          ...p,
          _id: p._id,
          imagen: p.imagen || (p.imagenes && p.imagenes.length > 0 ? p.imagenes[0].imagen : null),
          imagenes: p.imagenes || []
        }))
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // Reiniciar lazy loading después de actualizar el array
    setTimeout(() => {
      this.initLazyImageLoading();
    }, 200);

    this.productosCategoriaChartLabels = Array.from(categoriasMap.keys());
    this.productosCategoriaChartData = [{
      label: 'Productos por Categoría',
      data: Array.from(categoriasMap.values()),
      backgroundColor: [
        'rgba(99, 102, 241, 0.6)',
        'rgba(16, 185, 129, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(239, 68, 68, 0.6)',
        'rgba(139, 92, 246, 0.6)',
        'rgba(236, 72, 153, 0.6)'
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(236, 72, 153, 1)'
      ],
      borderWidth: 2
    }];

    // Productos con stock bajo (menos de 10 unidades)
    const stockBajo = this.productos.filter(p => p.stock < 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);
    
    this.productosStockBajo = stockBajo.map(p => ({
      _id: p._id,
      titulo: p.titulo,
      stock: p.stock,
      precio_venta: p.precio_venta || 0,
      precio_compra: p.precio_compra || 0,
      identificador: p.identificador || 'N/A',
      imagen: p.imagen || (p.imagenes && p.imagenes.length > 0 ? p.imagenes[0].imagen : null),
      imagenes: p.imagenes || []
    })).sort((a, b) => b.precio_compra - a.precio_compra); // Ordenar por precio de compra (más caros primero)
    
    // Reiniciar lazy loading después de actualizar el array
    setTimeout(() => {
      this.initLazyImageLoading();
    }, 200);

    this.stockBajoChartLabels = stockBajo.map(p => p.titulo.substring(0, 15));
    this.stockBajoChartData = [{
      label: 'Stock Actual',
      data: stockBajo.map(p => p.stock),
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 2
    }];
  }

  verProductosCategoria(categoria: any) {
    this.categoriaSeleccionada = categoria;
    
    // Primero, actualizar el array con las imágenes ya precargadas
    this.productosCategoriaSeleccionada = (categoria.productos || []).map((p: any) => {
      // Si ya tenemos la imagen precargada, usarla directamente
      if (p._id && this.imagenesPrecargadas.has(p._id)) {
        return { ...p, imagen: this.imagenesPrecargadas.get(p._id) };
      }
      // Si no está precargada pero tiene imagen en el objeto, usarla
      if (p.imagen || (p.imagenes && p.imagenes.length > 0)) {
        return p;
      }
      // Si no tiene imagen, dejarlo como está para que se precargue
      return p;
    });
    
    // Abrir modal
    if (typeof (window as any).$ !== 'undefined') {
      (window as any).$('#modalProductosCategoria').modal('show');
    } else {
      const modalElement = document.getElementById('modalProductosCategoria');
      if (modalElement) {
        const modal = (window as any).bootstrap ? new (window as any).bootstrap.Modal(modalElement) : null;
        if (modal) {
          modal.show();
        } else {
          modalElement.style.display = 'block';
          modalElement.classList.add('show');
          document.body.classList.add('modal-open');
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalBackdropCategoria';
          document.body.appendChild(backdrop);
        }
      }
    }
    
    // Iniciar lazy loading solo para las imágenes que NO están precargadas
    setTimeout(() => {
      this.initLazyImageLoadingForModal();
    }, 300);
  }

  initLazyImageLoadingForModal() {
    // Observar solo los elementos dentro del modal de categorías
    const modalElement = document.getElementById('modalProductosCategoria');
    if (!modalElement) return;

    // Si no existe el observer, crearlo
    if (!this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const productoId = entry.target.getAttribute('data-producto-id');
            // Solo precargar si NO está ya precargada y NO se está cargando
            if (productoId && !this.imagenesPrecargadas.has(productoId) && !this.imagenesCargando.has(productoId)) {
              this.preloadProductImage(productoId);
            }
            // Dejar de observar una vez que se carga o si ya está precargada
            if (this.intersectionObserver) {
              this.intersectionObserver.unobserve(entry.target);
            }
          }
        });
      }, {
        rootMargin: '50px' // Precargar 50px antes de que sea visible
      });
    }

    // Observar solo los elementos que NO tienen imagen precargada
    const imageElements = modalElement.querySelectorAll('[data-producto-id]');
    imageElements.forEach(el => {
      const productoId = el.getAttribute('data-producto-id');
      // Solo observar si NO está ya precargada
      if (productoId && !this.imagenesPrecargadas.has(productoId) && this.intersectionObserver) {
        this.intersectionObserver.observe(el);
      }
    });
  }

  cerrarModalCategoria() {
    if (typeof (window as any).$ !== 'undefined') {
      (window as any).$('#modalProductosCategoria').modal('hide');
    } else {
      const modalElement = document.getElementById('modalProductosCategoria');
      if (modalElement) {
        const modal = (window as any).bootstrap ? (window as any).bootstrap.Modal.getInstance(modalElement) : null;
        if (modal) {
          modal.hide();
        } else {
          modalElement.style.display = 'none';
          modalElement.classList.remove('show');
          document.body.classList.remove('modal-open');
          const backdrop = document.getElementById('modalBackdropCategoria');
          if (backdrop) {
            backdrop.remove();
          }
        }
      }
    }
    this.categoriaSeleccionada = null;
    this.productosCategoriaSeleccionada = [];
  }

  verImagenProducto(producto: any) {
    // Evitar múltiples clics mientras carga
    if (this.isLoadingImage) {
      return;
    }

    this.productoIdCargandoImagen = producto._id || '';
    this.productoNombreCargandoImagen = producto.titulo || 'Producto';
    this.imagen_view = '';
    this.isLoadingImage = true;
    
    // Abrir modal inmediatamente con estado de carga
    setTimeout(() => {
      const modalElement = document.getElementById('modal-ver-imagen-dashboard');
      if (modalElement) {
        const $ = (window as any).$;
        if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
          $('#modal-ver-imagen-dashboard').modal('show');
        } else {
          modalElement.style.display = 'block';
          modalElement.classList.add('show');
          document.body.classList.add('modal-open');
          let backdrop = document.getElementById('modalImagenBackdropDashboard');
          if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.id = 'modalImagenBackdropDashboard';
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', () => {
              this.closeImageModal();
            });
          }
        }
      }
    }, 50);

    // Obtener el producto completo para obtener la imagen
    if (producto._id) {
      this._productoService.get_producto(producto._id).subscribe(
        (response) => {
          this.isLoadingImage = false;
          this.productoIdCargandoImagen = '';
          if (response && response.producto && response.producto.imagenes && response.producto.imagenes.length > 0) {
            this.imagen_view = response.producto.imagenes[0].imagen;
          } else if (response && response.producto && response.producto.imagen) {
            this.imagen_view = response.producto.imagen;
          } else {
            this.toastr.error('No se encontró ninguna imagen', 'Error', {
              timeOut: 5000
            });
            this.closeImageModal();
          }
        },
        () => {
          this.isLoadingImage = false;
          this.productoIdCargandoImagen = '';
          this.toastr.error('No fue posible cargar la imagen', 'Error', {
            timeOut: 5000
          });
          this.closeImageModal();
        }
      );
    } else {
      // Si no hay _id, intentar usar la imagen directamente del producto
      if (producto.imagen) {
        this.imagen_view = producto.imagen;
        this.isLoadingImage = false;
      } else {
        this.isLoadingImage = false;
        this.toastr.error('No se encontró ninguna imagen', 'Error', {
          timeOut: 5000
        });
        this.closeImageModal();
      }
    }
  }

  closeImageModal() {
    const modalElement = document.getElementById('modal-ver-imagen-dashboard');
    if (modalElement) {
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#modal-ver-imagen-dashboard').modal('hide');
      } else {
        const modal = (window as any).bootstrap ? (window as any).bootstrap.Modal.getInstance(modalElement) : null;
        if (modal) {
          modal.hide();
        } else {
          modalElement.style.display = 'none';
          modalElement.classList.remove('show');
          document.body.classList.remove('modal-open');
          const backdrop = document.getElementById('modalImagenBackdropDashboard');
          if (backdrop) {
            backdrop.remove();
          }
        }
      }
    }
    this.imagen_view = '';
    this.isLoadingImage = false;
    this.productoIdCargandoImagen = '';
    this.productoNombreCargandoImagen = '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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

  getRelativeTime(fecha: Date | string): string {
    if (!fecha) return '';
    
    const fechaMovimiento = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaMovimiento.getTime();
    const diffSegundos = Math.floor(diffMs / 1000);
    const diffMinutos = Math.floor(diffSegundos / 60);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);
    const diffMeses = Math.floor(diffDias / 30);
    const diffAnos = Math.floor(diffDias / 365);

    // Menos de 1 minuto
    if (diffSegundos < 60) {
      return 'Hace unos momentos';
    }
    // Menos de 1 hora
    else if (diffMinutos < 60) {
      return diffMinutos === 1 ? 'Hace 1 minuto' : `Hace ${diffMinutos} minutos`;
    }
    // Menos de 1 día
    else if (diffHoras < 24) {
      const horas = diffHoras;
      const minutos = diffMinutos % 60;
      if (minutos === 0) {
        return horas === 1 ? 'Hace 1 hora' : `Hace ${horas} horas`;
      } else {
        return horas === 1 
          ? `Hace 1 hora y ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
          : `Hace ${horas} horas y ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
      }
    }
    // Menos de 1 mes
    else if (diffDias < 30) {
      const dias = diffDias;
      const horas = diffHoras % 24;
      if (horas === 0) {
        return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
      } else {
        return dias === 1
          ? `Hace 1 día y ${horas} ${horas === 1 ? 'hora' : 'horas'}`
          : `Hace ${dias} días y ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
      }
    }
    // Menos de 1 año
    else if (diffMeses < 12) {
      const meses = diffMeses;
      const dias = diffDias % 30;
      if (dias === 0) {
        return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
      } else {
        return meses === 1
          ? `Hace 1 mes y ${dias} ${dias === 1 ? 'día' : 'días'}`
          : `Hace ${meses} meses y ${dias} ${dias === 1 ? 'día' : 'días'}`;
      }
    }
    // 1 año o más
    else {
      const anos = diffAnos;
      const meses = Math.floor((diffDias % 365) / 30);
      if (meses === 0) {
        return anos === 1 ? 'Hace 1 año' : `Hace ${anos} años`;
      } else {
        return anos === 1
          ? `Hace 1 año y ${meses} ${meses === 1 ? 'mes' : 'meses'}`
          : `Hace ${anos} años y ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
      }
    }
  }

  getTotalSaldo() {
    return this.saldos.nequi + this.saldos.sin_pagar + this.saldos.efectivo;
  }

  hasChanges(): boolean {
    return this.originalSaldos.efectivo !== this.saldos.efectivo ||
           this.originalSaldos.nequi !== this.saldos.nequi ||
           this.originalSaldos.sin_pagar !== this.saldos.sin_pagar;
  }

  openUpdateModal() {
    // Resetear el nuevo motivo
    this.nuevoMotivo = '';
    
    // Abrir modal usando jQuery o Bootstrap nativo
    if (typeof (window as any).$ !== 'undefined') {
      (window as any).$('#modalActualizarSaldos').modal('show');
    } else {
      // Fallback para Bootstrap 5
      const modalElement = document.getElementById('modalActualizarSaldos');
      if (modalElement) {
        const modal = (window as any).bootstrap ? new (window as any).bootstrap.Modal(modalElement) : null;
        if (modal) {
          modal.show();
        } else {
          modalElement.style.display = 'block';
          modalElement.classList.add('show');
          document.body.classList.add('modal-open');
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalBackdrop';
          document.body.appendChild(backdrop);
        }
      }
    }
  }

  closeUpdateModal() {
    // Cerrar modal
    if (typeof (window as any).$ !== 'undefined') {
      (window as any).$('#modalActualizarSaldos').modal('hide');
    } else {
      const modalElement = document.getElementById('modalActualizarSaldos');
      if (modalElement) {
        const modal = (window as any).bootstrap ? (window as any).bootstrap.Modal.getInstance(modalElement) : null;
        if (modal) {
          modal.hide();
        } else {
          modalElement.style.display = 'none';
          modalElement.classList.remove('show');
          document.body.classList.remove('modal-open');
          const backdrop = document.getElementById('modalBackdrop');
          if (backdrop) {
            backdrop.remove();
          }
        }
      }
    }
    
    // Restaurar valores originales si se cancela
    this.saldos = { ...this.originalSaldos };
    this.nuevoMotivo = '';
  }

  actualizarSaldos() {
    // Validar que el motivo sea diferente
    if (!this.nuevoMotivo || this.nuevoMotivo.trim() === '') {
      this.toastr.warning('Debe ingresar un motivo para el cambio', 'Advertencia', {
        timeOut: 5000
      });
      return;
    }

    if (this.nuevoMotivo.trim() === this.originalMotif) {
      this.toastr.warning('El motivo debe ser diferente al anterior', 'Advertencia', {
        timeOut: 5000
      });
      return;
    }

    this.isSaving = true;

    // Actualizar el motivo en los saldos
    const saldosToSave = {
      ...this.saldos,
      motivo: this.nuevoMotivo.trim()
    };

    this._saldoService.insert_saldo(saldosToSave).subscribe(
      (response) => {
        this.isSaving = false;
        this.originalSaldos = { ...this.saldos };
        this.originalMotif = this.nuevoMotivo.trim();
        this.saldos.motivo = this.nuevoMotivo.trim();
        this.updateSaldoChart();
        this.loadHistorial();
        this.closeUpdateModal();
        this.toastr.success('Saldos actualizados correctamente', 'Éxito', {
          timeOut: 5000
        });
      },
      (error) => {
        this.isSaving = false;
        const errorMsg = error.error && error.error.message ? error.error.message : (error.error || 'Error desconocido');
        this.toastr.error('Error al actualizar los saldos: ' + errorMsg, 'Error', {
          timeOut: 9000
        });
      }
    );
  }

}
