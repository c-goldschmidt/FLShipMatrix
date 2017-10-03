import { Dictionary } from './../../services/interfaces';
import { ViewService } from './../../services/view-service';
import { ActivatedRoute, Params, Router, Event, NavigationEnd } from '@angular/router';
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
        router.events.subscribe((event) => this.updateRoute(event));

        view.background$.subscribe((newBG: string) => {
            this.backgroundImage = newBG;
        });
        view.logo$.subscribe((newLogo: string) => {
            this.logoImage = newLogo;
        });
    }

    updateRoute(event: Event) {
        const paramArray = this.route.children.map((child: ActivatedRoute) =>  child.snapshot.params);

        if (!(event instanceof NavigationEnd)) {
            return;
        }

        let params: Dictionary<string> = {};
        if (paramArray.length > 0) {
            params = paramArray.reduce((prev, curr) => Object.assign({}, prev, curr));
        }

        this.view.updateFromRoute(params);
    }
}
