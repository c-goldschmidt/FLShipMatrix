import { ShipDetailService, CategoryService } from './services';
import { ShipDetails, CategoryDetail } from './interfaces';
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/delay';

@Injectable()
export class ShipResolver implements Resolve<ShipDetails> {
    constructor(private serv: ShipDetailService) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ShipDetails> {
        return this.serv.getShipDetails(route.params.shipId);
    }
}

@Injectable()
export class CategoryResolver implements Resolve<CategoryDetail> {
    constructor(private serv: CategoryService) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<CategoryDetail> {
        return this.serv.getCategoryDetail(route.params.categoryId);
    }
}
