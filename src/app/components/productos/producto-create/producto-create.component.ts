import { Component, OnInit } from '@angular/core';
import { Producto } from "../../../models/Producto";
import { ProductoService } from 'src/app/services/producto.service';

interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-producto-create',
  templateUrl: './producto-create.component.html',
  styleUrls: ['./producto-create.component.css']
})
export class ProductoCreateComponent implements OnInit {

  public producto;
  public imgSelect: String | ArrayBuffer;
  public categorias;
  public success_message;
  public error_message;
  public imagenesData = [];

  constructor(
    private _productoService: ProductoService,
  ) {
    this.producto =  new Producto('', '', '', 1, 1, 1, '', 1,'','',[]);
  }

  ngOnInit() {

    this._productoService.get_categorias().subscribe(
      response => {
        this.categorias = response.categorias;
        console.log(this.categorias);

      },
      error => {

      }
    );
  }


  success_alert() {
    this.success_message = '';
  }

  error_alert() {
    this.error_message = '';
  }

  onSubmit(productoForm) {
    if (productoForm.valid) {
      this._productoService.insert_producto({
        codigo: productoForm.value.codigo,
        identificador: productoForm.value.identificador,
        titulo: productoForm.value.titulo,
        descripcion: productoForm.value.descripcion,
        imagenes: this.imagenesData,
        precio_compra: productoForm.value.precio_compra,
        precio_venta: productoForm.value.precio_venta,
        stock: productoForm.value.stock,
        idcategoria: productoForm.value.idcategoria,
        puntos: productoForm.value.puntos,
      }).subscribe(
        response => {
          this.success_message = 'Se registro el producto correctamente';
          this.imagenesData = [];
          this.imgSelect = '../../../../assets/img/default.jpg';
        },
        error => {

        }
      );

    } else {
      this.error_message = 'Complete correctamente el formulario';

    }
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


  }



}
