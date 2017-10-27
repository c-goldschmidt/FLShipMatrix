import { ShipTexture, ShipTexturePack } from './ship-texture';
import {
    ShipDetails,
    ShipListEntry,
    Category,
    CategoryTree,
    CategoryDetail,
    Dictionary,
    TextureMeta,
} from './interfaces';
import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/forkJoin';

import { ShipModel } from './ship-model';
import { Constants } from '../constants';
import { Subscriber } from 'rxjs/Subscriber';

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

    getTexture(ship: ShipDetails, texId: number): Observable<ShipTexturePack> {
        const options = {responseType: ResponseContentType.ArrayBuffer};
        if (ship.texture_info[texId]) {
            const path = ship.texture_info[texId].path;
            const toLoad = [this.http.get(path, options)];
            const flags = {
                light: false,
                bump: false,
                meta: false,
            }

            if (ship.texture_info[texId].light_path) {
                toLoad.push(this.http.get(ship.texture_info[texId].light_path, options));
                flags.light = true;
            }
            if (ship.texture_info[texId].bump_path) {
                toLoad.push(this.http.get(ship.texture_info[texId].bump_path, options));
                flags.bump = true;
            }
            if (ship.texture_info[texId].meta_path) {
                toLoad.push(this.http.get(ship.texture_info[texId].meta_path));
                flags.meta = true;
            }

            return new Observable<ShipTexturePack>((subscriber: Subscriber<ShipTexturePack>) => {
                Observable.forkJoin(...toLoad).subscribe((result: Response[]) => {
                    const base = result.shift().arrayBuffer();
                    let light: ArrayBuffer;
                    let bump: ArrayBuffer;
                    let meta: TextureMeta;

                    if (flags.light) {
                        light = result.shift().arrayBuffer();
                    }

                    if (flags.bump) {
                        bump = result.shift().arrayBuffer();
                    }
                    if (flags.meta) {
                        meta = result.shift().json();
                    }

                    subscriber.next(new ShipTexturePack(base, light, bump, meta));
                    subscriber.complete();
                }, (error: any) => {
                    subscriber.error(error);
                    subscriber.complete();
                });

                return subscriber;
            });
        } else {
            return Observable.throw(new Error('Texture does not exist'));
        }
    }
}
