import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-index',
  templateUrl: './user-index.component.html',
  styleUrls: ['./user-index.component.css']
})
export class UserIndexComponent implements OnInit {

  public url;
  public usuarios;
  public identity;
  public paginator;

  constructor(
    private _userService : UserService,
    private _router : Router,
  ) {
    this.identity = _userService.getIdentity();
   }

  ngOnInit() {
    
    if(this.identity.role === 'ADMIN'){
      this._userService.get_users().subscribe(
        response =>{
          console.log(response);
            this.usuarios = response.usuarios;
        },
        error=>{
  
        }
      );
    }else{
      this._router.navigate(['dashboard']);
    }
  }

  eliminar(data) {
    console.log("ELIMINAR", data);
  }

}
