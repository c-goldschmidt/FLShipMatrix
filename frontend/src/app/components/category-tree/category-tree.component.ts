import { ViewService } from './../../services/view-service';
import { CategoryTree, Index } from './../../services/interfaces';
import { Component, Input, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'category-tree',
    templateUrl: './category-tree.component.html',
    styleUrls: ['./category-tree.component.less'],
})

export class CategoryTreeComponent implements AfterViewInit {
    @Input() tree?: CategoryTree[] = null;
    public expanded: {[index: number]: boolean} = {};
    public locked: {[index: number]: boolean} = {};

    constructor(private view: ViewService, private router: Router) {
        this.view.categoriesExpanded$.subscribe((expanded: Index<boolean>) => {
            this.expanded = expanded;
        });
        this.view.categoriesLocked$.subscribe((locked: Index<boolean>) => {
            this.locked = locked;
        });
    }

    ngAfterViewInit(): void {
        if (this.tree === null) {
            this.view.tree$.subscribe((tree: CategoryTree[]) => {
                this.tree = tree;
            });
        }
    }

    toggleCategory(catId: number) {
        this.view.toggleCategory(catId);
    }

    navigateTo(catId: number) {
        this.router.navigate(['/fl/category', catId]);
    }
}
