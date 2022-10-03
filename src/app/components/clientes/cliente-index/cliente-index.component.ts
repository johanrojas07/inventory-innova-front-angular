import { Component, OnInit } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-cliente-index',
  templateUrl: './cliente-index.component.html',
  styleUrls: ['./cliente-index.component.css']
})
export class ClienteIndexComponent implements OnInit {

  public clientes;
  public isLoading = false;

  constructor(
    private toastr: ToastrService,
    private _clienteService: ClienteService
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this._clienteService.get_clientes().subscribe(
      response => {
        this.isLoading = false;
        this.clientes = response.clientes;
        console.log(this.clientes);

      },
      error => {
        this.isLoading = false;
        this.toastr.error('No fue posible cargar los clientes: ' + error.error, 'Error', {
          timeOut: 9000
        });

      }
    )
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

        this._clienteService.delete_cliente(id).subscribe(
          resposen => {
            this._clienteService.get_clientes().subscribe(
              response => {
                this.clientes = response.clientes;
              },
              error => {
                this.toastr.error('No fue posible obtener los clientes: ' + error.error, 'Error', {
                  timeOut: 9000
                });
              }
            );
          },
          erro => {
            this.toastr.error('No fue posible eliminar el cliente: ' + erro.error, 'Error', {
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

}
