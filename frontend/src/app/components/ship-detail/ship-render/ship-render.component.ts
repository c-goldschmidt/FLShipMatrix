import { Renderer } from './renderer';
import { ShipModel } from './../../../services/ship-model';
import { ShipDetailService, StaticService } from './../../../services/services';
import { ShipDetails } from './../../../services/interfaces';
import { Component, Input, ViewChild, ElementRef, OnChanges, DoCheck, OnDestroy } from '@angular/core';

@Component({
    selector: 'ship-render',
    templateUrl: './ship-render.component.html',
    styleUrls: ['./ship-render.component.less'],
})

export class ShipRenderComponent implements OnChanges, DoCheck, OnDestroy {
    private model: ShipModel;
    private renderer: Renderer;

    @Input() ship: ShipDetails;

    public selectedLOD: string;
    public width = 1080;
    public height = 1080;

    @ViewChild('container') container: ElementRef;
    @ViewChild('canvas') canvas: ElementRef;

    constructor(private shipDetais: ShipDetailService, private staticServ: StaticService) { }

    ngOnChanges() {
        this.initRender();

        this.selectedLOD = this.ship.lods.sort()[0];
        this.shipDetais.getModel(this.ship.id, this.selectedLOD).subscribe((model: ShipModel) => {
            model.id = this.ship.id;
            model.lod = this.selectedLOD;
            console.log(model.id);

            this.model = model;
            this.renderer.model = this.model;
        });
    }

    ngDoCheck() {
        const newWidth = this.container.nativeElement.offsetWidth;
        const newHeight = this.container.nativeElement.offsetHeight;

        if (this.width !== newWidth || this.height !== newHeight) {
            this.width = newWidth;
            this.height = newHeight;
            this.renderer.resize(this.height, this.width);
        }
    }

    ngOnDestroy() {
        this.renderer.destroy();
    }

    initRender() {
        if (!this.renderer) {
            this.renderer = new Renderer(this.canvas.nativeElement, this.staticServ);
        }
    }
}
