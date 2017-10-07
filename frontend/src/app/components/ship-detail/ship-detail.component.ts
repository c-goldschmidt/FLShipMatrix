import { RenderSettings } from './ship-render/ship-render.component';
import { ShipDetails } from './../../services/interfaces';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl: './ship-detail.component.html',
    styleUrls: ['./ship-detail.component.less'],
})

export class ShipDetailComponent {
    public ship: ShipDetails;
    public showRender = true;

    public renderSettings: RenderSettings = {
        autoRotate: true,
        selectedLOD: '',
        boundingBox: false,
    }

    constructor(route: ActivatedRoute) {
        route.data.subscribe((data) => {
            this.renderSettings.selectedLOD = data.ship.lods.sort()[0];
            this.ship = data.ship
        });
    }

    toggleRender() {
        this.showRender = !this.showRender;
    }

    updateSettings() {
        this.renderSettings = Object.assign({}, this.renderSettings);
    }

    updateFromSettings(newSettings: RenderSettings) {
        this.renderSettings = newSettings;
    }
}
