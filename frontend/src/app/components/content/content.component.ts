import { Dictionary } from './../../services/interfaces';
import { ViewService } from './../../services/view-service';
import {
    ActivatedRoute,
    Params,
    Router,
    Event,
    NavigationEnd,
    NavigationStart,
    NavigationCancel,
    NavigationError,
} from '@angular/router';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.less'],
})

export class ContentComponent {
    public backgroundImage: string;
    public logoImage: string;
    public isLoading: boolean;

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
        if (event instanceof NavigationStart) {
            this.isLoading = true;
        }

        if (event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError) {
            this.isLoading = false;
        }

        if (!(event instanceof NavigationEnd)) {
            return;
        }

        const paramArray = this.route.children.map((child: ActivatedRoute) =>  child.snapshot.params);
        let params: Dictionary<string> = {};
        if (paramArray.length > 0) {
            params = paramArray.reduce((prev, curr) => Object.assign({}, prev, curr));
        }

        this.view.updateFromRoute(params);
    }
}
