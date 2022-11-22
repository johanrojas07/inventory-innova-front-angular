import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ProductoService } from 'src/app/services/producto.service';
import { SaldoService } from 'src/app/services/saldo.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

  data = {
    num_productos: 0,
    plata_invertida: 0,
    plata_vender: 0,
    num_ventas: 0
  };
  originalSaldos= {
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

  toggleProBanner(event) {
    event.preventDefault();
    document.querySelector('body').classList.toggle('removeProbanner');
  }

  constructor(private _productoService: ProductoService,
    private toastr: ToastrService,
    private _saldoService: SaldoService) { }

  ngOnInit() {
    this._productoService.get_dashboard().subscribe(
      response => {
        console.log("Data: ", response);
        this.data = response.data;

      },
      error => {
        this.toastr.error('Error al consultar los datos: ' + error.error, 'Error', {
          timeOut: 9000
        });
      }
    );

    this._saldoService.get_saldos().subscribe(
      response => {
        console.log("Data Saldos: ", response);
        this.saldos = response.saldos;
        this.originalSaldos = {...response.saldos};
        this.originalMotif = response.saldos.motivo;
        this.saldos.total = response.saldos.nequi + response.saldos.sin_pagar + response.saldos.efectivo;
      },
      error => {
        this.toastr.error('Error al consultar los saldos: ' + error.error, 'Error', {
          timeOut: 9000
        });
      }
    );
  }

  getTotalSaldo() {
    return this.saldos.nequi + this.saldos.sin_pagar + this.saldos.efectivo;
  }

  actualizarSaldos() {

    if (this.originalMotif == this.saldos.motivo) {
      this.toastr.error('Debe cambiar el motivo o actualizarlo por uno nuevo: ', 'Warning', {
        timeOut: 9000
      });
      return;
    }

    this._saldoService.insert_saldo(this.saldos).subscribe(() => {
      this.originalSaldos = this.saldos;
      this.toastr.success('Saldos Actualizados: ', 'Success', {
        timeOut: 9000
      });
    }, (error) => {
      this.toastr.error('Error al actualizaar: ' + error, 'Success', {
        timeOut: 9000
      });
    })
  }

  date: Date = new Date();

  visitSaleChartData = [{
    label: 'CHN',
    data: [20, 40, 15, 35, 25, 50, 30, 20],
    borderWidth: 1,
    fill: false,
  },
  {
    label: 'USA',
    data: [40, 30, 20, 10, 50, 15, 35, 40],
    borderWidth: 1,
    fill: false,
  },
  {
    label: 'UK',
    data: [70, 10, 30, 40, 25, 50, 15, 30],
    borderWidth: 1,
    fill: false,
  }];

  visitSaleChartLabels = ["2013", "2014", "2014", "2015", "2016", "2017"];

  visitSaleChartOptions = {
    responsive: true,
    legend: false,
    scales: {
      yAxes: [{
        ticks: {
          display: false,
          min: 0,
          stepSize: 20,
          max: 80
        },
        gridLines: {
          drawBorder: false,
          color: 'rgba(235,237,242,1)',
          zeroLineColor: 'rgba(235,237,242,1)'
        }
      }],
      xAxes: [{
        gridLines: {
          display: false,
          drawBorder: false,
          color: 'rgba(0,0,0,1)',
          zeroLineColor: 'rgba(235,237,242,1)'
        },
        ticks: {
          padding: 20,
          fontColor: "#9c9fa6",
          autoSkip: true,
        },
        categoryPercentage: 0.4,
        barPercentage: 0.4
      }]
    }
  };

  visitSaleChartColors = [
    {
      backgroundColor: [
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
      ],
      borderColor: [
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
        'rgba(154, 85, 255, 1)',
      ]
    },
    {
      backgroundColor: [
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
      ],
      borderColor: [
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(254, 112, 150, 1)',
      ]
    },
    {
      backgroundColor: [
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
      ],
      borderColor: [
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
        'rgba(177, 148, 250, 1)',
      ]
    },
  ];

  trafficChartData = [
    {
      data: [30, 30, 40],
    }
  ];

  trafficChartLabels = ["Search Engines", "Direct Click", "Bookmarks Click"];

  trafficChartOptions = {
    responsive: true,
    animation: {
      animateScale: true,
      animateRotate: true
    },
    legend: false,
  };

  trafficChartColors = [
    {
      backgroundColor: [
        'rgba(177, 148, 250, 1)',
        'rgba(254, 112, 150, 1)',
        'rgba(132, 217, 210, 1)'
      ],
      borderColor: [
        'rgba(177, 148, 250, .2)',
        'rgba(254, 112, 150, .2)',
        'rgba(132, 217, 210, .2)'
      ]
    }
  ];

}
