import { Category, CategoryDetail, ShipListEntry } from './../../services/interfaces';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl: './category-detail.component.html',
    styleUrls: ['./category-detail.component.less'],
})
export class CategoryDetailComponent {
    public category: CategoryDetail;
    public sorting: keyof ShipListEntry = 'name';
    public reverse = false;
    public filteredShips: ShipListEntry[];
    public searchString: string;

    constructor(route: ActivatedRoute) {
        route.data.subscribe((data) => {
            this.category = data.category;
            this.searchString = '';
            this.sortShips(this.category.ships);
            this.filterShips();
        });
    }

    filterShips() {
        if (this.searchString === '') {
            this.filteredShips = this.category.ships;
            return;
        }

        this.filteredShips = this.category.ships.filter((entry: ShipListEntry) => {
            const rx = new RegExp(this.searchString, 'ig');
            return entry.name.match(rx) !== null;
        });
    }

    setSort(field: keyof ShipListEntry) {
        if (this.sorting === field) {
            this.reverse = !this.reverse;
        }
        this.sorting = field;
        this.sortShips(this.filteredShips)
    }

    sortShips(arrayToSort: ShipListEntry[]) {
        arrayToSort.sort((a, b) => {
            let x = a[this.sorting];
            let y = b[this.sorting];
            if (this.sorting === 'category') {
                x = (<Category>x).path;
                y = (<Category>y).path;
            }

            let sorting = 0;
            if (this.sorting === 'name' || this.sorting === 'category') {
                sorting = (<string>x).localeCompare(<string>y);
            } else {
                sorting = <number>x - <number>y;
            }

            return this.reverse ? sorting * -1 : sorting;
        });
    }
}
