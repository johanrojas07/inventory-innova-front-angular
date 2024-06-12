import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { VentaService } from 'src/app/services/venta.service';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';

@Component({
  selector: 'app-venta-index',
  templateUrl: './venta-index.component.html',
  styleUrls: ['./venta-index.component.css']
})
export class VentaIndexComponent implements OnInit {
  ventas: any[] = [];
  filteredVentas: any[] = [];
  ventasPorMes: any = {};


  isLoading = false;
  totalVentas = 0;
  totalVendido = 0;
  productosVendidos = 0;
  public identity;
  p: number = 1; // Paginación

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 15;

  // Filtros
  startDate: string;
  endDate: string;

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
      this._ventaService.get_ventas().subscribe(
        response => {
          this.isLoading = false;
          this.ventas = response.ventas.reverse();
          console.log("this.ventas", this.ventas);
          this.filteredVentas = this.ventas;
          this.calculateStadicts();
          this.calcularVentasPorMes();
        },
        error => {
          this.isLoading = false;
          this.toastr.error('No fue posible cargar las ventas: ' + error.error, 'Error', {
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
    this._ventaService.get_ventas(true).subscribe(
      response => {
        this.isLoading = false;
        this.ventas = response.ventas.reverse();
        console.log("this.ventas", this.ventas);
        this.filteredVentas = this.ventas;
        this.calculateStadicts();
        this.calcularVentasPorMes();
      },
      error => {
        this.isLoading = false;
        this.toastr.error('No fue posible cargar las ventas: ' + error.error, 'Error', {
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
      const nombreMes = moment(venta.fecha).format('MMMM YYYY');

      if (!this.ventasPorMes[mes]) {
        this.ventasPorMes[mes] = {
          nombreMes: nombreMes,
          totalVentas: 0,
          totalVendido: 0,
          productosVendidos: 0,
          ventas: []
        };
      }

      this.ventasPorMes[mes].totalVentas++;
      this.ventasPorMes[mes].totalVendido += venta.total_venta;
      this.ventasPorMes[mes].productosVendidos += venta.data_detalle.length;
      // this.ventasPorMes[mes].ventas.push({
      //   dia: moment(venta.fecha).format('D'),
      //   venta: venta
      // });
    });
    console.log("TEst", this.ventasPorMes);
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
    this.totalVendido = this.ventas.reduce((sum, venta) => sum + venta.total_venta, 0);
    this.productosVendidos = this.ventas.reduce((sum, venta) => sum + venta.data_detalle.length, 0);
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

}
