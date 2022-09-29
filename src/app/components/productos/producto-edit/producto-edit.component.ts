import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductoService } from 'src/app/services/producto.service';

interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-producto-edit',
  templateUrl: './producto-edit.component.html',
  styleUrls: ['./producto-edit.component.css']
})
export class ProductoEditComponent implements OnInit {

  public producto;
  public id;
  public categorias;
  // public file :File;
  public imgSelect: String | ArrayBuffer;
  public success_message;
  public error_message;
  public stock;
  public imagenesData = [];

  constructor(
    private _route: ActivatedRoute,
    private _productoService: ProductoService
  ) {
  }

  ngOnInit() {

    this._route.params.subscribe(params => {
      this.id = params['id'];
      this._productoService.get_producto(this.id).subscribe(
        response => {
          this.producto = response.producto;

          this._productoService.get_categorias().subscribe(
            response => {
              this.categorias = response.categorias;
              console.log(this.categorias);

            },
            error => {

            }
          );


        },
        error => {

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
        console.log("reader.result;", reader.result);
        this.imagenesData.push(reader.result);
      };
    }


    // if(event.target.files && event.target.files[0]){
    //     this.file = <File>event.target.files[0];

    //     const reader = new FileReader();
    //     reader.readAsDataURL(this.file);
    //     reader.onload = (e) => {
    //       this.imgSelect = reader.result;
    //     }
    // }
  }

  onSubmit(productoForm) {
    if (productoForm.valid) {
      this._productoService.update_producto({
        _id: this.id,
        codigo: productoForm.value.codigo,
        identificador: productoForm.value.identificador,
        titulo: productoForm.value.titulo,
        descripcion: productoForm.value.descripcion,
        imagenes: this.imagenesData,
        precio_compra: productoForm.value.precio_compra,
        precio_venta: productoForm.value.precio_venta,
        idcategoria: productoForm.value.idcategoria,
        puntos: productoForm.value.puntos
      }).subscribe(
        response => {
          console.log(response);
          this.success_message = 'Se actualizó el producto correctamente';
        },
        error => {

        }
      );

    } else {
      this.error_message = 'Complete correctamente el formulario';
    }
  }


}
