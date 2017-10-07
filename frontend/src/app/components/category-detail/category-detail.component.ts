import { CategoryDetail } from './../../services/interfaces';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl: './category-detail.component.html',
    styleUrls: ['./category-detail.component.less'],
})
export class CategoryDetailComponent {
    public category: CategoryDetail;

    constructor(route: ActivatedRoute) {
        route.data.subscribe((data) => {
            this.category = data.category
        });
    }
}
