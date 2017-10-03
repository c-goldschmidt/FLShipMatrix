import { CategoryService } from './services';
import { CategoryTree, Index } from './interfaces';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class ViewService {
    private currentCategoryId: number;
    private currentShipId: number;
    private tree: CategoryTree[];

    public tree$ = new ReplaySubject<CategoryTree[]>(1);
    public background$ = new ReplaySubject<string>(1);
    public logo$ = new ReplaySubject<string>(1);
    public catId$ = new Subject<number>();
    public shipId$ = new Subject<number>();

    private categoriesExpanded: Index<boolean>;
    private categoriesLocked: Index<boolean>;

    public categoriesExpanded$ = new ReplaySubject<Index<boolean>>(1);
    public categoriesLocked$ = new ReplaySubject<Index<boolean>>(1);

    constructor(private cat: CategoryService) { }

    updateFromRoute(params: Params) {
        const catId = parseInt(params.categoryId, 10);
        const shpId = parseInt(params.shipId, 10);

        if (this.currentCategoryId === catId && this.currentShipId === shpId) {
            return;
        }
        if (this.currentCategoryId !== catId && !isNaN(catId)) {
            this.currentCategoryId = catId;
            this.catId$.next(catId);
        }
        if (this.currentShipId !== shpId && !isNaN(shpId)) {
            this.currentShipId = shpId;
            this.shipId$.next(shpId);
        }

        if (!this.tree) {
            this.categoriesExpanded = {}

            this.cat.getCategoryTree().subscribe((data: CategoryTree[]) => {
                this.tree = data;
                this.tree$.next(this.tree);

                this.refreshImages();
            });
        } else {
            this.refreshImages();
        }
    }

    toggleCategory(catId: number) {
        if (this.categoriesLocked[catId]) {
            return;
        }
        this.categoriesExpanded[catId] = !this.categoriesExpanded[catId];
        this.categoriesExpanded$.next(this.categoriesExpanded);
    }

    private findCurrentInTree(entry: CategoryTree[]): [string, string, boolean] {
        for (const child of entry) {
            let currentBG: string = null;
            let currentLogo: string = null;

            if (child.background) {
                currentBG = child.background;
            }

            if (child.logo) {
                currentLogo = child.logo;
            }

            if (child.id === this.currentCategoryId) {
                this.categoriesExpanded[child.id] = true;
                this.categoriesLocked[child.id] = true;
                return [currentBG, currentLogo, true];
            } else {
                const [deeperBG, deeperLogo, found] = this.findCurrentInTree(child.children);

                if (found) {
                    this.categoriesExpanded[child.id] = true;
                    this.categoriesLocked[child.id] = true;
                    return [deeperBG || currentBG, deeperLogo || currentLogo, found];
                }
            }
        }

        return [null, null, false];
    }

    private lockChildlessParents(entry: CategoryTree[]) {
        for (const child of entry) {
            if (!child.children) {
                this.categoriesLocked[child.id] = true;
            } else {
                this.lockChildlessParents(child.children);
            }
        }
    }

    private refreshImages() {
        this.categoriesLocked = {};

        const [newBG, newLogo, found] = this.findCurrentInTree(this.tree);
        this.lockChildlessParents(this.tree);

        this.background$.next(newBG);
        this.logo$.next(newLogo);
        this.categoriesExpanded$.next(this.categoriesExpanded);
        this.categoriesLocked$.next(this.categoriesLocked);
    }

}
