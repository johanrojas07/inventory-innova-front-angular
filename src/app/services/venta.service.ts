import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  public url;

  constructor(
    private _http : HttpClient
  ) { 
    this.url = environment.urlApi;
  }

  get_ventas():Observable<any>{
    let headers = new HttpHeaders().set('Content-Type','application/json');
    return this._http.get(this.url+'ventas',{headers:headers});
  }

  save_data(data):Observable<any>{
    let headers = new HttpHeaders().set('Content-Type','application/json');
    return this._http.post(this.url+'venta/registrar',data,{headers:headers});
  }

  data_venta(id):Observable<any>{
    let headers = new HttpHeaders().set('Content-Type','application/json');
    return this._http.get(this.url+'venta/'+id,{headers:headers});
  }
}
