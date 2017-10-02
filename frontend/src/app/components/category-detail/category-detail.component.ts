import { Observable } from 'rxjs/Observable';
import { CategoryDetail } from './../../services/interfaces';
import { CategoryService } from './../../services/services';
import { Subscription } from 'rxjs/Subscription';
import { ViewService } from './../../services/view-service';
import { Component, OnDestroy } from '@angular/core';

@Component({
    templateUrl: './category-detail.component.html',
    styleUrls: ['./category-detail.component.less'],
})
export class CategoryDetailComponent implements OnDestroy {
    private sub: Subscription;
    public category: CategoryDetail;
    public loading = true;

    constructor(private view: ViewService, serv: CategoryService) {
        this.sub = view.catId$.subscribe((catId) => {
            console.log('new cat: ', catId);

            this.loading = true;
            serv.getCategoryDetail(catId).subscribe((category) => {
                this.category = category;
                this.loading = false;
            });
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

}
