import { ShipDetails } from './../../services/interfaces';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { RenderSettings } from './ship-render/renderer.interfaces'

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
        drawTextures: true,
        drawLights: true,
        shader: 'flat',
        pbrSettings: {
            metallicRoughness: [0.7, 0.5],
            lightColor: [1.0, 1.0, 1.0],
            lightDirection: [0.5, 0.5, 0.1],
            emissiveFactor: [0.8, 0.8, 0.8],
            camera: [0, 0, 0],
        },
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
