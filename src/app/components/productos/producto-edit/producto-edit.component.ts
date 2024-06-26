import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Producto } from 'src/app/models/Producto';
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

  public producto: Producto;
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
    this.producto = new Producto('', '', '', '1', '1', 1, '', 1, '', '', []);
  }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.id = params['id'];
      this._productoService.get_producto(this.id).subscribe(
        response => {
          this.producto = response.producto;
          this.imagenesData = (this.producto && this.producto.imagenes) ? this.producto.imagenes.map(s => s.imagen) : null;
          this._productoService.get_categorias().subscribe(
            response => {
              this.categorias = response.categorias;
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
        precio_compra: (productoForm.value.precio_compra + '').replace(/,/g, "").replace(/\D/g, ''),
        precio_venta: (productoForm.value.precio_venta + '').replace(/,/g, "").replace(/\D/g, ''),
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

  changeNumber() {
    this.producto.precio_compra = (this.producto.precio_compra + "").replace(/\D/g, '');
    this.producto.precio_venta = (this.producto.precio_venta + "").replace(/\D/g, '');
    this.producto.precio_compra = this.changeDato(this.producto.precio_compra);
    this.producto.precio_venta = this.changeDato(this.producto.precio_venta + "");
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


}
