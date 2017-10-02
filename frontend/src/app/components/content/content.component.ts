import { ViewService } from './../../services/view-service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/combineLatest'

@Component({
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.less'],
})

export class ContentComponent {
    public backgroundImage: string;
    public logoImage: string;

    private sub: Subscription;

    constructor(private route: ActivatedRoute, private router: Router, private view: ViewService) {
        router.events.subscribe(() => this.updateRoute());

        view.background$.subscribe((newBG: string) => {
            this.backgroundImage = newBG;
        });
        view.logo$.subscribe((newLogo: string) => {
            this.logoImage = newLogo;
        });
    }

    updateRoute() {
        const params = this.route.children.map((child: ActivatedRoute) =>  child.params);

        if (this.sub) {
            this.sub.unsubscribe();
        }

        this.sub = Observable.combineLatest(this.route.params, ...params).subscribe((paramArray) => {
            const params = paramArray.reduce((prev, curr) => Object.assign({}, prev, curr));
            this.view.updateFromRoute(params);
        });
    }
}
