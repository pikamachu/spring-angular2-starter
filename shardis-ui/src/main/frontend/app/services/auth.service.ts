import {Injectable} from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {LocalStorage} from 'ng2-webstorage/index';

@Injectable()
export class AuthService {

  private authenticated:boolean = false;
  private tokenExpirationDate:Date = null;
  private userData:any = null;

  @LocalStorage()
  private tokenData:Oauth2TokenData = new Oauth2TokenData();

  constructor(public http:Http) {
    if (this.tokenData && this.tokenData.access_token) {
      this.authenticated = true;
      this.userData = this.decodeAccessToken(this.tokenData.access_token);
      this.tokenExpirationDate = new Date(this.userData.exp * 1000);
      if (this.tokenExpirationDate < new Date()) {
        console.log('Session timeout');
        this.logout();
      }
    }
  }

  isAuthenticated():boolean {
    return this.authenticated;
  }

  public authenticate(username: string, password: string) :Observable<Response> {
    console.log('Authentication pending...');

    var basicAuthHeader = btoa(`acme:acmesecret`);

    var headers = new Headers();
    headers.append('Authorization', `Basic  ${basicAuthHeader}`);
    headers.append('Accept', `application/json`);
    headers.append('Content-Type', `application/x-www-form-urlencoded`);

    var data = 'username=' + encodeURIComponent(username) + '&password='
      + encodeURIComponent(password) + '&grant_type=password';

    var response: Observable<Response> = this.http.post('/auth/oauth/token', data, {headers: headers});

    response.subscribe(
        data => {
          this.tokenData = data.json();
          this.authenticated = true;
          this.userData = this.decodeAccessToken(this.tokenData.access_token);
          this.tokenExpirationDate = new Date(this.userData.exp * 1000);
        },
        err => {
          console.log(err);
        }
      );

    return response;
  }

  public logout():any {
    this.tokenData = new Oauth2TokenData();
    this.userData = null;
    this.authenticated = false;
  }

  public getUserData():any {
    return this.userData;
  }

  public getTokenExpirationDate():Date {
    return this.tokenExpirationDate;
  }

  public getAuthorizationHeaders():Headers {
    var authorizationHeaders = new Headers();
    if (this.authenticated) {
      authorizationHeaders.append('Authorization', `Bearer ${this.tokenData.access_token}`);
    }
    return authorizationHeaders;
  }

  private fetchUserData() {
    this.http.get('/api/user', {headers: this.getAuthorizationHeaders()})
      .subscribe(
        data => {
          this.userData = data.json();
        },
        err => this.authenticated = false
      );
  }

  private decodeAccessToken(access_token:string) {
    return JSON.parse(window.atob(access_token.split('.')[1]));
  }
}

class Oauth2TokenData {
  access_token:string = null;
  token_type:string = null;
  expires_in:number = null;
  scope:string = null;
  jti:string = null;
  refresh_token:string = null;

  constructor() {
  }
}
