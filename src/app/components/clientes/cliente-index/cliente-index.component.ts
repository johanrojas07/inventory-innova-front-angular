import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ClienteService } from 'src/app/services/cliente.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-cliente-index',
  templateUrl: './cliente-index.component.html',
  styleUrls: ['./cliente-index.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ClienteIndexComponent implements OnInit {

  public clientes;
  public isLoading = false;
  public paginator;
  public clienteEditando: any = {
    nombres: '',
    correo: '',
    dni: ''
  };
  public clienteNuevo: any = {
    nombres: '',
    correo: '',
    dni: ''
  };
  public isSaving = false;
  public isEditing = false;
  public clienteIdEditando: string = '';

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
      title: '¿Estás seguro de eliminarlo?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (result.value) {
        this._clienteService.delete_cliente(id).subscribe(
          response => {
            this.toastr.success('Cliente eliminado correctamente', 'Éxito', {
              timeOut: 3000
            });
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
          error => {
            this.toastr.error('No fue posible eliminar el cliente: ' + error.error, 'Error', {
              timeOut: 9000
            });
          }
        );
      }
    })
  }

  openNuevoClienteModal() {
    this.clienteNuevo = {
      nombres: '',
      correo: '',
      dni: ''
    };
    const modalElement = document.getElementById('modalNuevoCliente');
    if (modalElement) {
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#modalNuevoCliente').modal('show');
      } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        let backdrop = document.getElementById('modalNuevoClienteBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalNuevoClienteBackdrop';
          document.body.appendChild(backdrop);
          backdrop.addEventListener('click', () => {
            this.closeNuevoClienteModal();
          });
        }
      }
    }
  }

  closeNuevoClienteModal() {
    const modalElement = document.getElementById('modalNuevoCliente');
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modalNuevoCliente').modal('hide');
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

  onSubmitNuevoCliente(clienteForm) {
    if (clienteForm.valid) {
      this.isSaving = true;
      this._clienteService.insert_cliente({
        nombres: clienteForm.value.nombres,
        dni: clienteForm.value.dni,
        correo: clienteForm.value.correo
      }).subscribe(
        response => {
          this.isSaving = false;
          this.toastr.success('Cliente registrado exitosamente', 'Éxito', {
            timeOut: 3000
          });
          this._clienteService.get_clientes().subscribe(
            clientesResponse => {
              this.clientes = clientesResponse.clientes;
              this.closeNuevoClienteModal();
            },
            error => {
              this.toastr.error('Error al cargar los clientes', 'Error', {
                timeOut: 5000
              });
            }
          );
        },
        error => {
          this.isSaving = false;
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

  openEditarClienteModal(cliente: any) {
    this.clienteIdEditando = cliente._id;
    this.clienteEditando = {
      nombres: cliente.nombres || '',
      correo: cliente.correo || '',
      dni: cliente.dni || ''
    };
    const modalElement = document.getElementById('modalEditarCliente');
    if (modalElement) {
      const $ = (window as any).$;
      if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
        $('#modalEditarCliente').modal('show');
      } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
        let backdrop = document.getElementById('modalEditarClienteBackdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modalEditarClienteBackdrop';
          document.body.appendChild(backdrop);
          backdrop.addEventListener('click', () => {
            this.closeEditarClienteModal();
          });
        }
      }
    }
  }

  closeEditarClienteModal() {
    const modalElement = document.getElementById('modalEditarCliente');
    const $ = (window as any).$;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#modalEditarCliente').modal('hide');
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

  onSubmitEditarCliente(clienteForm) {
    if (clienteForm.valid) {
      this.isEditing = true;
      this._clienteService.update_cliente({
        _id: this.clienteIdEditando,
        nombres: clienteForm.value.nombres,
        correo: clienteForm.value.correo,
        dni: clienteForm.value.dni,
      }).subscribe(
        response => {
          this.isEditing = false;
          this.toastr.success('Cliente actualizado exitosamente', 'Éxito', {
            timeOut: 3000
          });
          this._clienteService.get_clientes().subscribe(
            clientesResponse => {
              this.clientes = clientesResponse.clientes;
              this.closeEditarClienteModal();
            },
            error => {
              this.toastr.error('Error al cargar los clientes', 'Error', {
                timeOut: 5000
              });
            }
          );
        },
        error => {
          this.isEditing = false;
          const errorMessage = (error.error && error.error.message) ? error.error.message : 'Error desconocido';
          this.toastr.error('Error al actualizar el cliente: ' + errorMessage, 'Error', {
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
