import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaldoService {

  public url;

  constructor(
    private _http: HttpClient
  ) {
    this.url = environment.urlApi;
  }

  get_saldos(): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.get(this.url + 'saldo/obtener_saldo', { headers: headers });
  }

  insert_saldo(data) {
    return this._http.post(this.url + 'saldo/registrar', data);
  }

}
