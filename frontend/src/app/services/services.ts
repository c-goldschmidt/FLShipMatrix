import { Filter, ShipDetails, ShipListEntry, Category, CategoryTree, CategoryDetail, Dictionary } from './interfaces';
import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { ShipModel } from './ship-model';

@Injectable()
export class ShipDetailService {
    constructor(private http: Http) {}

    getShipDetails(shipId: number): Observable<ShipDetails> {
        return this.http.get(`/api/ships/${shipId}`).map((res: Response) => res.json());
    }

    getModel(shipId: number, lodName: string): Observable<ShipModel> {
        const options = {responseType: ResponseContentType.ArrayBuffer};
        return this.http.get(`/api/ships/${shipId}/model/${lodName}`, options).map(
            (res: Response) => new ShipModel(res.arrayBuffer()),
        )
    }
}

@Injectable()
export class CategoryService {

    constructor(private http: Http) {}

    getCategoryTree(): Observable<CategoryTree[]> {
        return this.http.get(`/api/categories`).map((res: Response) => res.json());
    }

    getCategoryDetail(categoryId: number): Observable<CategoryDetail> {
        return this.http.get(`/api/categories/${categoryId}`).map((res: Response) => res.json());
    }
}

@Injectable()
export class StaticService {
    private cache: Dictionary<string> = {};
    constructor(private http: Http) {}

    getStatic(path: string): Observable<string> {
        if (this.cache[path]) {
            return Observable.of(this.cache[path]);
        } else {
            return this.http.get(path).map((res: Response) => {
                this.cache[path] = res.text();
                return this.cache[path];
            });
        }
    }
}
