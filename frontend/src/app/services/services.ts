import { ShipTexture } from './ship-texture';
import { ShipDetails, ShipListEntry, Category, CategoryTree, CategoryDetail, Dictionary } from './interfaces';
import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { ShipModel } from './ship-model';
import { Constants } from '../constants';

@Injectable()
export class ShipDetailService {
    constructor(private http: Http) {}

    getShipDetails(shipId: number): Observable<ShipDetails> {
        return this.http.get(`${Constants.getPrefix()}api/ships/${shipId}`).map((res: Response) => res.json());
    }

    getModel(ship: ShipDetails, lodName: string): Observable<ShipModel> {
        const options = {responseType: ResponseContentType.ArrayBuffer};
        return this.http.get(ship.static_model_paths[lodName], options).map(
            (res: Response) => new ShipModel(res.arrayBuffer()),
        )
    }
}

@Injectable()
export class CategoryService {

    constructor(private http: Http) {}

    getCategoryTree(): Observable<CategoryTree[]> {
        return this.http.get(`${Constants.getPrefix()}api/categories`).map((res: Response) => res.json());
    }

    getCategoryDetail(categoryId: number): Observable<CategoryDetail> {
        return this.http.get(`${Constants.getPrefix()}api/categories/${categoryId}`).map((res: Response) => res.json());
    }
}

@Injectable()
export class StaticService {
    private cache: Dictionary<string> = {};
    constructor(private http: Http) {}

    getStatic(path: string): Observable<string> {
        path = `${Constants.getPrefix()}${path}`;
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

@Injectable()
export class TextureService {
    constructor(private http: Http) {}

    getTexture(ship: ShipDetails, texId: number) {
        const options = {responseType: ResponseContentType.ArrayBuffer};
        return this.http.get(ship.static_texture_paths[texId], options)
            .map((data: Response) => {
                return new ShipTexture(data.arrayBuffer());
            },
        );
    }
}
