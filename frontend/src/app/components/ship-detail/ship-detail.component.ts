import { Observable } from 'rxjs/Observable';
import { ShipDetails } from './../../services/interfaces';
import { Subscription } from 'rxjs/Subscription';
import { ShipDetailService } from './../../services/services';
import { ViewService } from './../../services/view-service';
import { Component, OnDestroy } from '@angular/core';
import 'rxjs/add/observable/combineLatest'

@Component({
    templateUrl: './ship-detail.component.html',
    styleUrls: ['./ship-detail.component.less'],
})

export class ShipDetailComponent implements OnDestroy {
    private sub: Subscription;
    private ship: ShipDetails;

    public loading = true;
    public showRender = true;

    constructor(private view: ViewService, serv: ShipDetailService) {

        this.sub = view.shipId$.subscribe((shipId) => {
            this.loading = true;
            serv.getShipDetails(shipId).subscribe((ship) => {
                this.ship = ship;
                this.loading = false;
            });
        });
    }

    toggleRender() {
        this.showRender = !this.showRender;
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}
