import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  public url;

  constructor(
    private _http: HttpClient,
  ) {
    this.url = environment.urlApi;
  }

  get_productos(filtro): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'productos/' + filtro, { headers: headers });
  }

  get_dashboard(): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'producto/dashboard', { headers: headers });
  }

  get_categorias(): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'categorias', { headers: headers });
  }

  insert_producto(data) {
    return this._http.post(this.url + 'producto/registrar', data);
  }


  get_producto(id): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'producto/' + id, { headers: headers });
  }

  update_producto(data) {

    console.log("EDITARRR", data);
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.put(this.url + 'producto/editar/' + data._id, data, { headers: headers });
  }

  insert_categoria(data): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.post(this.url + 'categoria/registrar', data, { headers: headers });
  }

  update_categoria(id, data): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.put(this.url + 'categoria/editar/' + id, data, { headers: headers });
  }

  delete_categoria(id): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.delete(this.url + 'categoria/' + id, { headers: headers });
  }

  delete_producto(id): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.delete(this.url + 'producto/' + id, { headers: headers });
  }

  stock_producto(data): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.put(this.url + 'producto/stock/' + data._id, data, { headers: headers });
  }

  verificar_identificador(identificador: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'productos/' + identificador, { headers: headers });
  }

}
