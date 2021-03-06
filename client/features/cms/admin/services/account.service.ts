import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

import { HandleErrorService } from '../../../utils';

@Injectable()
export class AccountService {

    constructor(
        private http: HttpClient,
        private _handleErrorService: HandleErrorService
    ) { }

    GetCurrent(): Observable<{}> {
        return this.http.get(environment.appBaseUrl + environment.apiBaseUrl + '/admin/accounts/current')
            .pipe(
                catchError(this._handleErrorService.handleError<any>('GetCurrentUser'))
            );
    }

    Update(account: any): Observable<{}> {
        return this.http.put(environment.appBaseUrl + environment.apiBaseUrl + '/admin/accounts/' + account._id, account)
            .pipe(
                catchError(this._handleErrorService.handleError<any>('UpdateUser'))
            );
    }

}
