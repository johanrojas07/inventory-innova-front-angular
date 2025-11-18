import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { VentaService } from 'src/app/services/venta.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-venta-index',
  templateUrl: './venta-index.component.html',
  styleUrls: ['./venta-index.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class VentaIndexComponent implements OnInit, OnDestroy {
  ventas: any[] = [];
  filteredVentas: any[] = [];
  ventasPorMes: any = {};

  isLoading = true; // Iniciar en true para mostrar loading al entrar
  isLoadingError = false;
  errorMessage = '';
  totalVentas = 0;
  totalVendido = 0;
  productosVendidos = 0;
  public identity;
  p: number = 1; // Paginación

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 15;

  // Tabs
  activeTab: string = 'ventas';

  // Filtros
  startDate: string;
  endDate: string;

  // Modal productos
  selectedProductosText: string = '';
  selectedVentaProductos: any[] = [];
  selectedVentaProductosFiltrados: any[] = [];
  selectedVentaInfo: any = null;
  busquedaProductosModal: string = '';

  // Modal detalle venta
  ventaDetalleSeleccionada: any = null;
  detalleVentaSeleccionada: any[] = [];
  isLoadingDetalleVenta: boolean = false;
  errorDetalleVenta: string = '';
  productoImagenSeleccionado: any = null;
  imagenProductoSeleccionada: string = '';

  // Lazy loading imágenes
  imagenesPrecargadasProductos: Map<string, string> = new Map();
  imagenesCargandoProductos: Set<string> = new Set();
  imagePreloadSubscriptionsProductos: Map<string, Subscription> = new Map();
  intersectionObserverProductos: IntersectionObserver | null = null;

  // Nuevas métricas del dashboard
  promedioVenta = 0;
  ventaMasAlta = 0;
  ventaMasBaja = 0;
  ventasHoy = 0;
  totalHoy = 0;
  ventasSemana = 0;
  totalSemana = 0;
  ventasMes = 0;
  totalMes = 0;
  ventasMesAnterior = 0;
  totalMesAnterior = 0;
  porcentajeCambio = 0;
  topProductos: any[] = [];
  topClientes: any[] = [];
  metodoPagoMasUsado = '';
  vendedorMasActivo = '';
  ventasPorDia: any[] = [];

  constructor(
    private toastr: ToastrService,
    private _userService: UserService,
    private _ventaService: VentaService,
    private _router: Router,
  ) {
    this.identity = this._userService.getIdentity();
  }

  getProductosName(productos) {
    if (productos) {
      let names = '';
      productos.forEach((element) => {
        if (element && element.idproducto) {
          names = names + element.idproducto.titulo + ' - ';
        }
      });
      return names;
    } else {
      return 'Debes ir al detalle'
    }
  }


  ngOnInit() {
    if (this.identity) {
      this.isLoading = true;
      this.isLoadingError = false;
      this.errorMessage = '';
      this._ventaService.get_ventas().subscribe(
        response => {
          this.isLoading = false;
          this.isLoadingError = false;
          this.ventas = response.ventas.reverse();
          console.log("this.ventas", this.ventas);
          this.filteredVentas = this.ventas;
          this.calculateStadicts();
          this.calcularVentasPorMes();
        },
        error => {
          this.isLoading = false;
          this.isLoadingError = true;
          const errorMsg = error.error && error.error.message ? error.error.message : (error.error || 'Error desconocido al cargar las ventas');
          this.errorMessage = errorMsg;
          this.toastr.error('No fue posible cargar las ventas: ' + errorMsg, 'Error', {
            timeOut: 9000
          });
        }
      );
    } else {
      this._router.navigate(['']);
    }
  }

  fetchAllSales() {
    this.isLoading = true;
    this.isLoadingError = false;
    this.errorMessage = '';
    this._ventaService.get_ventas(true).subscribe(
      response => {
        this.isLoading = false;
        this.isLoadingError = false;
        this.ventas = response.ventas.reverse();
        console.log("this.ventas", this.ventas);
        this.filteredVentas = this.ventas;
        this.calculateStadicts();
        this.calcularVentasPorMes();
        this.toastr.success('Ventas cargadas exitosamente', 'Éxito', {
          timeOut: 3000
        });
      },
      error => {
        this.isLoading = false;
        this.isLoadingError = true;
        const errorMsg = error.error && error.error.message ? error.error.message : (error.error || 'Error desconocido al cargar las ventas');
        this.errorMessage = errorMsg;
        this.toastr.error('No fue posible cargar las ventas: ' + errorMsg, 'Error', {
          timeOut: 9000
        });
      }
    );
  }

  calcularVentasPorMes() {
    this.ventasPorMes = {};
    // Filtrar las ventas de los últimos 6 meses
    const ventasFiltradas = this.ventas.filter(venta => {
      const fechaVenta = moment(venta.fecha);
      return fechaVenta.isSameOrAfter(moment().subtract(6, 'months'));
    });

    ventasFiltradas.forEach(venta => {
      const mes = moment(venta.fecha).format('YYYY-MM');
      // Formato de mes en español
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesNum = moment(venta.fecha).month();
      const año = moment(venta.fecha).year();
      const nombreMes = `${meses[mesNum]} ${año}`;

      if (!this.ventasPorMes[mes]) {
        this.ventasPorMes[mes] = {
          nombreMes: nombreMes,
          fechaOrden: mes, // Para ordenar
          totalVentas: 0,
          totalVendido: 0,
          productosVendidos: 0,
          ventas: []
        };
      }

      this.ventasPorMes[mes].totalVentas++;
      this.ventasPorMes[mes].totalVendido += venta.total_venta;
      this.ventasPorMes[mes].productosVendidos += venta.data_detalle.length;
    });
    
    // Ordenar los meses por fecha (más reciente primero)
    const ventasPorMesOrdenadas: any = {};
    Object.keys(this.ventasPorMes)
      .sort((a, b) => b.localeCompare(a)) // Orden descendente (más reciente primero)
      .forEach(key => {
        ventasPorMesOrdenadas[key] = this.ventasPorMes[key];
      });
    
    this.ventasPorMes = ventasPorMesOrdenadas;
    console.log("Ventas por mes:", this.ventasPorMes);
  }

  filtrarPorFecha() {
    const start = moment(this.startDate);
    const end = moment(this.endDate);
    this.filteredVentas = this.ventas.filter(venta => {
      const fechaVenta = moment(venta.fecha);
      return fechaVenta.isBetween(start, end, 'days', '[]');
    });
    this.currentPage = 1;
    this.calculateStadicts(); // Recalcular estadísticas para las ventas filtradas
  }

  calculateStadicts() {
    this.totalVentas = this.ventas.length;
    this.totalVendido = this.ventas.reduce((sum, venta) => sum + (venta.total_venta || 0), 0);
    this.productosVendidos = this.ventas.reduce((sum, venta) => sum + (venta.data_detalle ? venta.data_detalle.length : 0), 0);
    
    // Calcular promedio de venta
    this.promedioVenta = this.totalVentas > 0 ? this.totalVendido / this.totalVentas : 0;
    
    // Calcular venta más alta y más baja
    if (this.ventas.length > 0) {
      const montos = this.ventas.map(v => v.total_venta || 0);
      this.ventaMasAlta = Math.max(...montos);
      this.ventaMasBaja = Math.min(...montos);
    }
    
    // Calcular ventas de hoy
    const hoy = moment().startOf('day');
    const ventasHoyArray = this.ventas.filter(v => moment(v.fecha).isSameOrAfter(hoy));
    this.ventasHoy = ventasHoyArray.length;
    this.totalHoy = ventasHoyArray.reduce((sum, v) => sum + (v.total_venta || 0), 0);
    
    // Calcular ventas de esta semana
    const inicioSemana = moment().startOf('week');
    const ventasSemanaArray = this.ventas.filter(v => moment(v.fecha).isSameOrAfter(inicioSemana));
    this.ventasSemana = ventasSemanaArray.length;
    this.totalSemana = ventasSemanaArray.reduce((sum, v) => sum + (v.total_venta || 0), 0);
    
    // Calcular ventas de este mes
    const inicioMes = moment().startOf('month');
    const ventasMesArray = this.ventas.filter(v => moment(v.fecha).isSameOrAfter(inicioMes));
    this.ventasMes = ventasMesArray.length;
    this.totalMes = ventasMesArray.reduce((sum, v) => sum + (v.total_venta || 0), 0);
    
    // Calcular ventas del mes anterior
    const inicioMesAnterior = moment().subtract(1, 'month').startOf('month');
    const finMesAnterior = moment().subtract(1, 'month').endOf('month');
    const ventasMesAnteriorArray = this.ventas.filter(v => {
      const fecha = moment(v.fecha);
      return fecha.isSameOrAfter(inicioMesAnterior) && fecha.isSameOrBefore(finMesAnterior);
    });
    this.ventasMesAnterior = ventasMesAnteriorArray.length;
    this.totalMesAnterior = ventasMesAnteriorArray.reduce((sum, v) => sum + (v.total_venta || 0), 0);
    
    // Calcular porcentaje de cambio
    if (this.totalMesAnterior > 0) {
      this.porcentajeCambio = ((this.totalMes - this.totalMesAnterior) / this.totalMesAnterior) * 100;
    } else if (this.totalMes > 0) {
      this.porcentajeCambio = 100;
    } else {
      this.porcentajeCambio = 0;
    }
    
    // Calcular top productos
    this.calcularTopProductos();
    
    // Calcular top clientes
    this.calcularTopClientes();
    
    // Calcular método de pago más usado
    this.calcularMetodoPagoMasUsado();
    
    // Calcular vendedor más activo
    this.calcularVendedorMasActivo();
    
    // Calcular ventas por día (últimos 7 días)
    this.calcularVentasPorDia();
  }

  calcularTopProductos() {
    const productosMap = new Map();
    
    this.ventas.forEach(venta => {
      if (venta.data_detalle && Array.isArray(venta.data_detalle)) {
        venta.data_detalle.forEach(detalle => {
          if (detalle.idproducto) {
            const productoId = detalle.idproducto._id || detalle.idproducto;
            const productoNombre = detalle.idproducto.titulo || detalle.producto || 'Producto desconocido';
            const cantidad = detalle.cantidad || 0;
            
            if (productosMap.has(productoId)) {
              const actual = productosMap.get(productoId);
              productosMap.set(productoId, {
                id: productoId,
                nombre: productoNombre,
                cantidad: actual.cantidad + cantidad,
                ventas: actual.ventas + 1
              });
            } else {
              productosMap.set(productoId, {
                id: productoId,
                nombre: productoNombre,
                cantidad: cantidad,
                ventas: 1
              });
            }
          }
        });
      }
    });
    
    this.topProductos = Array.from(productosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  calcularTopClientes() {
    const clientesMap = new Map();
    
    this.ventas.forEach(venta => {
      if (venta.idcliente) {
        const clienteId = venta.idcliente._id || venta.idcliente;
        const clienteNombre = venta.idcliente.nombres || 'Cliente desconocido';
        const total = venta.total_venta || 0;
        
        if (clientesMap.has(clienteId)) {
          const actual = clientesMap.get(clienteId);
          clientesMap.set(clienteId, {
            id: clienteId,
            nombre: clienteNombre,
            total: actual.total + total,
            ventas: actual.ventas + 1
          });
        } else {
          clientesMap.set(clienteId, {
            id: clienteId,
            nombre: clienteNombre,
            total: total,
            ventas: 1
          });
        }
      }
    });
    
    this.topClientes = Array.from(clientesMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  calcularMetodoPagoMasUsado() {
    const metodosMap = new Map();
    
    this.ventas.forEach(venta => {
      if (venta.tipo_pago) {
        const metodo = venta.tipo_pago;
        metodosMap.set(metodo, (metodosMap.get(metodo) || 0) + 1);
      }
    });
    
    if (metodosMap.size > 0) {
      const metodoMasUsado = Array.from(metodosMap.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      // Mapear códigos a nombres
      const nombresMetodos: any = {
        '1': 'Efectivo',
        '2': 'Tarjeta',
        '3': 'Transferencia',
        '4': 'Cheque',
        '5': 'Otro'
      };
      
      this.metodoPagoMasUsado = nombresMetodos[metodoMasUsado[0]] || `Método ${metodoMasUsado[0]}`;
    } else {
      this.metodoPagoMasUsado = 'N/A';
    }
  }

  calcularVendedorMasActivo() {
    const vendedoresMap = new Map();
    
    this.ventas.forEach(venta => {
      if (venta.iduser) {
        const vendedorId = venta.iduser._id || venta.iduser;
        const vendedorNombre = `${venta.iduser.nombres || ''} ${venta.iduser.apellidos || ''}`.trim() || 'Vendedor desconocido';
        
        if (vendedoresMap.has(vendedorId)) {
          const actual = vendedoresMap.get(vendedorId);
          vendedoresMap.set(vendedorId, {
            id: vendedorId,
            nombre: vendedorNombre,
            ventas: actual.ventas + 1,
            total: actual.total + (venta.total_venta || 0)
          });
        } else {
          vendedoresMap.set(vendedorId, {
            id: vendedorId,
            nombre: vendedorNombre,
            ventas: 1,
            total: venta.total_venta || 0
          });
        }
      }
    });
    
    if (vendedoresMap.size > 0) {
      const vendedorMasActivo = Array.from(vendedoresMap.values())
        .sort((a, b) => b.ventas - a.ventas)[0];
      this.vendedorMasActivo = vendedorMasActivo.nombre;
    } else {
      this.vendedorMasActivo = 'N/A';
    }
  }

  calcularVentasPorDia() {
    const ventasPorDiaMap = new Map();
    
    // Inicializar últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = moment().subtract(i, 'days');
      const fechaKey = fecha.format('YYYY-MM-DD');
      const nombreDia = fecha.format('ddd D');
      ventasPorDiaMap.set(fechaKey, {
        fecha: fechaKey,
        nombre: nombreDia,
        ventas: 0,
        total: 0
      });
    }
    
    // Agregar ventas de los últimos 7 días
    const ultimos7Dias = moment().subtract(6, 'days').startOf('day');
    this.ventas.filter(v => moment(v.fecha).isSameOrAfter(ultimos7Dias)).forEach(venta => {
      const fechaKey = moment(venta.fecha).format('YYYY-MM-DD');
      if (ventasPorDiaMap.has(fechaKey)) {
        const actual = ventasPorDiaMap.get(fechaKey);
        ventasPorDiaMap.set(fechaKey, {
          ...actual,
          ventas: actual.ventas + 1,
          total: actual.total + (venta.total_venta || 0)
        });
      }
    });
    
    this.ventasPorDia = Array.from(ventasPorDiaMap.values());
  }

  getBarHeight(total: number): number {
    if (!this.ventasPorDia || this.ventasPorDia.length === 0) return 0;
    const maxTotal = Math.max(...this.ventasPorDia.map(d => d.total));
    if (maxTotal === 0) return 0;
    return (total / maxTotal) * 100;
  }

  filterVentas(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredVentas = this.ventas.filter(venta =>
      venta.idcliente.nombres.toLowerCase().includes(searchTerm) ||
      venta.iduser.nombres.toLowerCase().includes(searchTerm) ||
      venta.iduser.apellidos.toLowerCase().includes(searchTerm) ||
      this.getProductosName(venta.data_detalle).toLowerCase().includes(searchTerm)
    );
    this.currentPage = 1; // Reiniciar a la primera página cuando se filtra
  }

  get paginatedVentas() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredVentas.slice(start, end);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  totalPages() {
    return Math.ceil(this.filteredVentas.length / this.itemsPerPage);
  }

  showProductosModal(item: any) {
    this.selectedVentaInfo = item;
    this.selectedProductosText = this.getProductosName(item.data_detalle);
    this.busquedaProductosModal = '';
    // Limpiar imágenes precargadas
    this.imagenesPrecargadasProductos.clear();
    this.imagenesCargandoProductos.clear();
    
    // Obtener los productos completos
    if (item.data_detalle && Array.isArray(item.data_detalle)) {
      this.selectedVentaProductos = item.data_detalle.map((detalle: any) => {
        return {
          producto: detalle.idproducto || {},
          cantidad: detalle.cantidad || 0,
          precio_venta: detalle.precio_venta || 0,
          subtotal: (detalle.cantidad || 0) * (detalle.precio_venta || 0)
        };
      });
      this.selectedVentaProductosFiltrados = [...this.selectedVentaProductos];
    } else {
      this.selectedVentaProductos = [];
      this.selectedVentaProductosFiltrados = [];
    }
    
    // Abrir modal usando Bootstrap
    const modalElement = document.getElementById('productosModal');
    if (modalElement) {
      // Usar jQuery si está disponible
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#productosModal').modal('show');
      } else {
        // Fallback: mostrar directamente usando clases de Bootstrap
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        // Agregar backdrop si no existe
        let backdrop = document.getElementById('productosModalBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'productosModalBackdrop';
          document.body.appendChild(backdrop);
          // Cerrar al hacer clic en el backdrop
          backdrop.addEventListener('click', () => {
            this.closeProductosModal();
          });
        }
      }
      
      // Iniciar lazy loading después de que el modal se abra
      setTimeout(() => {
        this.initLazyImageLoadingDetalleVenta();
      }, 300);
    }
  }

  getTotalVentaProductos() {
    let total = 0;
    this.selectedVentaProductosFiltrados.forEach((item: any) => {
      total += item.subtotal || 0;
    });
    return total;
  }

  hasVentasPorMes(): boolean {
    return this.ventasPorMes && Object.keys(this.ventasPorMes).length > 0;
  }

  getRelativeTime(fecha: Date | string): string {
    if (!fecha) return 'Fecha no disponible';
    
    const ahora = new Date();
    const fechaVenta = new Date(fecha);
    const diffMs = ahora.getTime() - fechaVenta.getTime();
    const diffSegundos = Math.floor(diffMs / 1000);
    const diffMinutos = Math.floor(diffSegundos / 60);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);
    const diffMeses = Math.floor(diffDias / 30);
    const diffAnios = Math.floor(diffDias / 365);

    if (diffSegundos < 60) {
      return 'Hace unos segundos';
    } else if (diffMinutos < 60) {
      if (diffMinutos === 1) {
        return 'Hace 1 minuto';
      }
      return `Hace ${diffMinutos} minutos`;
    } else if (diffHoras < 24) {
      const horas = diffHoras;
      const minutosRestantes = diffMinutos % 60;
      if (minutosRestantes === 0) {
        if (horas === 1) {
          return 'Hace 1 hora';
        }
        return `Hace ${horas} horas`;
      } else {
        if (horas === 1) {
          return `Hace 1 hora y ${minutosRestantes} minutos`;
        }
        return `Hace ${horas} horas y ${minutosRestantes} minutos`;
      }
    } else if (diffDias < 30) {
      const dias = diffDias;
      const horasRestantes = diffHoras % 24;
      if (horasRestantes === 0) {
        if (dias === 1) {
          return 'Hace 1 día';
        }
        return `Hace ${dias} días`;
      } else {
        if (dias === 1) {
          return `Hace 1 día y ${horasRestantes} horas`;
        }
        return `Hace ${dias} días y ${horasRestantes} horas`;
      }
    } else if (diffMeses < 12) {
      const meses = diffMeses;
      const diasRestantes = diffDias % 30;
      if (diasRestantes === 0) {
        if (meses === 1) {
          return 'Hace 1 mes';
        }
        return `Hace ${meses} meses`;
      } else {
        if (meses === 1) {
          if (diasRestantes === 1) {
            return 'Hace 1 mes y 1 día';
          }
          return `Hace 1 mes y ${diasRestantes} días`;
        }
        if (diasRestantes === 1) {
          return `Hace ${meses} meses y 1 día`;
        }
        return `Hace ${meses} meses y ${diasRestantes} días`;
      }
    } else {
      const anios = diffAnios;
      const mesesRestantes = diffMeses % 12;
      if (mesesRestantes === 0) {
        if (anios === 1) {
          return 'Hace 1 año';
        }
        return `Hace ${anios} años`;
      } else {
        if (anios === 1) {
          if (mesesRestantes === 1) {
            return 'Hace 1 año y 1 mes';
          }
          return `Hace 1 año y ${mesesRestantes} meses`;
        }
        if (mesesRestantes === 1) {
          return `Hace ${anios} años y 1 mes`;
        }
        return `Hace ${anios} años y ${mesesRestantes} meses`;
      }
    }
  }

  filtrarProductosModal() {
    if (!this.busquedaProductosModal || this.busquedaProductosModal.trim() === '') {
      this.selectedVentaProductosFiltrados = [...this.selectedVentaProductos];
    } else {
      const busqueda = this.busquedaProductosModal.toLowerCase().trim();
      this.selectedVentaProductosFiltrados = this.selectedVentaProductos.filter((item: any) => {
        const titulo = (item.producto && item.producto.titulo) ? item.producto.titulo.toLowerCase() : '';
        const identificador = (item.producto && item.producto.identificador) ? item.producto.identificador.toLowerCase() : '';
        return titulo.includes(busqueda) || identificador.includes(busqueda);
      });
    }
  }

  limpiarBusquedaProductosModal() {
    this.busquedaProductosModal = '';
    this.selectedVentaProductosFiltrados = [...this.selectedVentaProductos];
  }

  closeProductosModal() {
    this.selectedVentaProductos = [];
    this.selectedVentaProductosFiltrados = [];
    this.selectedVentaInfo = null;
    this.selectedProductosText = '';
    this.busquedaProductosModal = '';
    
    const modalElement = document.getElementById('productosModal');
    const backdrop = document.getElementById('productosModalBackdrop');
    
    // Intentar usar jQuery si está disponible
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#productosModal').modal('hide');
      // Asegurarse de remover el backdrop después de que el modal se cierre
      setTimeout(() => {
        const backdropElements = document.querySelectorAll('.modal-backdrop');
        backdropElements.forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 300);
    } else {
      // Fallback: limpiar manualmente
      if (modalElement) {
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
      }
      
      // Remover todos los backdrops
      const backdropElements = document.querySelectorAll('.modal-backdrop');
      backdropElements.forEach(el => el.remove());
      
      // Limpiar clases y estilos del body
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // Asegurarse de que no queden elementos bloqueando
      const allBackdrops = document.querySelectorAll('[class*="backdrop"]');
      allBackdrops.forEach(el => el.remove());
    }
  }

  verDetalleVenta(ventaId: string) {
    // Inicializar estados
    this.isLoadingDetalleVenta = true;
    this.errorDetalleVenta = '';
    this.ventaDetalleSeleccionada = null;
    this.detalleVentaSeleccionada = [];
    
    // Abrir modal inmediatamente para mostrar skeleton loader
    const modalElement = document.getElementById('modalDetalleVenta');
    if (modalElement) {
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#modalDetalleVenta').modal('show');
      } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        let backdrop = document.getElementById('modalDetalleVentaBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalDetalleVentaBackdrop';
          backdrop.style.zIndex = '1040';
          document.body.appendChild(backdrop);
          backdrop.addEventListener('click', () => {
            this.cerrarModalDetalleVenta();
          });
        }
      }
    }
    
    // Cargar datos
    this._ventaService.data_venta(ventaId).subscribe(
      response => {
        if (response && response.data) {
          this.ventaDetalleSeleccionada = response.data.venta;
          this.detalleVentaSeleccionada = response.data.detalles || [];
          this.isLoadingDetalleVenta = false;
          
          // Iniciar lazy loading de imágenes después de cargar los datos
          setTimeout(() => {
            this.initLazyImageLoadingDetalleVenta();
          }, 100);
        } else {
          this.errorDetalleVenta = 'No se recibieron datos válidos';
          this.isLoadingDetalleVenta = false;
        }
      },
      error => {
        this.errorDetalleVenta = (error.error && error.error.message) ? error.error.message : 'Error al cargar la información de la venta';
        this.isLoadingDetalleVenta = false;
        this.toastr.error(this.errorDetalleVenta, 'Error', {
          timeOut: 5000
        });
      }
    );
  }

  cerrarModalDetalleVenta() {
    this.ventaDetalleSeleccionada = null;
    this.detalleVentaSeleccionada = [];
    this.errorDetalleVenta = '';
    this.productoImagenSeleccionado = null;
    this.imagenProductoSeleccionada = '';
    
    const modalElement = document.getElementById('modalDetalleVenta');
    const backdrop = document.getElementById('modalDetalleVentaBackdrop');
    
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modalDetalleVenta').modal('hide');
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

  getTotalDetalleVenta() {
    let total = 0;
    this.detalleVentaSeleccionada.forEach((item: any) => {
      total = total + (parseInt(item.precio_venta) * parseInt(item.cantidad));
    });
    return total;
  }

  getTotalCantidadDetalleVenta() {
    let total = 0;
    this.detalleVentaSeleccionada.forEach((item: any) => {
      total = total + parseInt(item.cantidad);
    });
    return total;
  }

  getMargenGananciaDetalle(item: any) {
    const precioCompra = (item.idproducto && item.idproducto.precio_compra) ? item.idproducto.precio_compra : 0;
    const precioVenta = item.precio_venta || 0;
    const cantidad = item.cantidad || 0;
    return (precioVenta - precioCompra) * cantidad;
  }

  getTotalGananciaDetalleVenta() {
    let total = 0;
    this.detalleVentaSeleccionada.forEach((item: any) => {
      total = total + this.getMargenGananciaDetalle(item);
    });
    return total;
  }

  verImagenProductoDetalle(producto: any) {
    if (!producto) return;
    
    this.productoImagenSeleccionado = producto;
    if (producto && producto.imagenes && producto.imagenes.length > 0 && producto.imagenes[0] && producto.imagenes[0].imagen) {
      this.imagenProductoSeleccionada = producto.imagenes[0].imagen;
    } else {
      this.imagenProductoSeleccionada = '';
    }
    
    // Abrir modal usando jQuery o Bootstrap
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modalImagenProductoDetalle').modal('show');
    } else {
      const modal = document.getElementById('modalImagenProductoDetalle');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        let backdrop = document.getElementById('modalImagenProductoDetalleBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalImagenProductoDetalleBackdrop';
          backdrop.style.zIndex = '1060';
          document.body.appendChild(backdrop);
          backdrop.addEventListener('click', () => {
            this.cerrarModalImagenProductoDetalle();
          });
        }
      }
    }
  }

  cerrarModalImagenProductoDetalle() {
    if ((window as any).jQuery) {
      (window as any).jQuery('#modalImagenProductoDetalle').modal('hide');
    } else {
      const modal = document.getElementById('modalImagenProductoDetalle');
      const backdrop = document.getElementById('modalImagenProductoDetalleBackdrop');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
      if (backdrop) {
        backdrop.remove();
      }
      document.body.classList.remove('modal-open');
    }
    this.productoImagenSeleccionado = null;
    this.imagenProductoSeleccionada = '';
  }

  initLazyImageLoadingDetalleVenta() {
    // Limpiar observer anterior si existe
    if (this.intersectionObserverProductos) {
      this.intersectionObserverProductos.disconnect();
    }

    // Crear nuevo observer para productos en la modal
    this.intersectionObserverProductos = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const productoId = element.getAttribute('data-producto-id');
          
          if (productoId && !this.imagenesCargandoProductos.has(productoId) && !this.imagenesPrecargadasProductos.has(productoId)) {
            this.preloadProductImageModal(productoId);
          }
          
          if (this.intersectionObserverProductos) {
            this.intersectionObserverProductos.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1
    });

    // Observar elementos de imagen en la modal de productos
    setTimeout(() => {
      const imageElements = document.querySelectorAll('#productosModal [data-producto-id]');
      imageElements.forEach((el: any) => {
        if (this.intersectionObserverProductos) {
          this.intersectionObserverProductos.observe(el);
        }
      });
    }, 200);
  }

  preloadProductImageModal(productoId: string) {
    if (this.imagenesCargandoProductos.has(productoId) || this.imagenesPrecargadasProductos.has(productoId)) {
      return;
    }

    this.imagenesCargandoProductos.add(productoId);

    // Buscar el producto en selectedVentaProductos
    const productoItem = this.selectedVentaProductos.find((item: any) => {
      return item.producto && item.producto._id === productoId;
    });

    if (productoItem && productoItem.producto) {
      // Verificar si ya tiene imágenes en el objeto
      let imagenUrl = null;
      
      if (productoItem.producto.imagenes && productoItem.producto.imagenes.length > 0 && productoItem.producto.imagenes[0].imagen) {
        imagenUrl = productoItem.producto.imagenes[0].imagen;
      } else if (productoItem.producto.imagen && typeof productoItem.producto.imagen === 'string') {
        // Si la imagen está directamente en el objeto producto
        imagenUrl = productoItem.producto.imagen;
      }
      
      if (imagenUrl) {
        // Precargar imagen
        const img = new Image();
        img.onload = () => {
          this.imagenesPrecargadasProductos.set(productoId, imagenUrl);
          this.imagenesCargandoProductos.delete(productoId);
          this.updateImagesInProductosModal(productoId, imagenUrl);
        };
        img.onerror = () => {
          this.imagenesCargandoProductos.delete(productoId);
        };
        img.src = imagenUrl;
      } else {
        // Si no hay imagen, intentar obtenerla del servicio
        this.imagenesCargandoProductos.delete(productoId);
      }
    } else {
      this.imagenesCargandoProductos.delete(productoId);
    }
  }

  updateImagesInProductosModal(productoId: string, imagenUrl: string) {
    // Actualizar imágenes en selectedVentaProductos y selectedVentaProductosFiltrados
    this.selectedVentaProductos.forEach((item: any) => {
      if (item.producto && item.producto._id === productoId) {
        if (!item.producto.imagenes || item.producto.imagenes.length === 0) {
          item.producto.imagenes = [{ imagen: imagenUrl }];
        }
      }
    });

    this.selectedVentaProductosFiltrados.forEach((item: any) => {
      if (item.producto && item.producto._id === productoId) {
        if (!item.producto.imagenes || item.producto.imagenes.length === 0) {
          item.producto.imagenes = [{ imagen: imagenUrl }];
        }
      }
    });
  }

  getProductImageModal(producto: any): string {
    if (!producto) return '';
    
    const productoId = producto._id;
    if (this.imagenesPrecargadasProductos.has(productoId)) {
      return this.imagenesPrecargadasProductos.get(productoId) || '';
    }
    
    if (producto.imagenes && producto.imagenes.length > 0 && producto.imagenes[0].imagen) {
      return producto.imagenes[0].imagen;
    }
    
    return '';
  }

  isImageLoadingModal(producto: any): boolean {
    if (!producto) return false;
    const productoId = producto._id;
    return this.imagenesCargandoProductos.has(productoId) && !this.imagenesPrecargadasProductos.has(productoId);
  }

  ngOnDestroy() {
    // Limpiar subscriptions
    this.imagePreloadSubscriptionsProductos.forEach(sub => {
      if (sub) {
        sub.unsubscribe();
      }
    });
    this.imagePreloadSubscriptionsProductos.clear();

    // Desconectar observer
    if (this.intersectionObserverProductos) {
      this.intersectionObserverProductos.disconnect();
      this.intersectionObserverProductos = null;
    }
  }

}
