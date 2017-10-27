import { Subscription } from 'rxjs/Subscription';
import { Renderer } from './renderer';
import { ShipModel } from './../../../services/ship-model';
import { ShipDetailService, StaticService, TextureService } from './../../../services/services';
import { ShipDetails } from './../../../services/interfaces';
import {
    Component,
    Input,
    ViewChild,
    ElementRef,
    OnChanges,
    DoCheck,
    OnDestroy,
    SimpleChanges,
    Output,
    EventEmitter,
} from '@angular/core';
import { RenderSettings } from './renderer.interfaces';

@Component({
    selector: 'ship-render',
    templateUrl: './ship-render.component.html',
    styleUrls: ['./ship-render.component.less'],
})
export class ShipRenderComponent implements OnChanges, DoCheck, OnDestroy {
    private model: ShipModel;
    private renderer: Renderer;
    private fpsSub: Subscription;

    @Input() ship: ShipDetails;
    @Input() settings: RenderSettings;
    @Output() changeSettings = new EventEmitter<RenderSettings>();

    public selectedLOD: string;
    public width = 1080;
    public height = 1080;
    public fps = 0;

    @ViewChild('container') container: ElementRef;
    @ViewChild('canvas') canvas: ElementRef;

    constructor(
        private shipDetais: ShipDetailService,
        private staticServ: StaticService,
        private texServ: TextureService,
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        if (this.renderer) {
            this.renderer.settings = this.settings;
        }

        if (!changes.ship && this.selectedLOD === this.settings.selectedLOD) {
            return;
        }

        this.initRender();

        this.selectedLOD = this.settings.selectedLOD;
        this.shipDetais.getModel(this.ship, this.selectedLOD).subscribe((model: ShipModel) => {
            model.id = this.ship.id;
            model.lod = this.selectedLOD;

            this.model = model;
            this.renderer.setModel(this.ship, this.model);
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
        this.fpsSub.unsubscribe();
        this.renderer.destroy();
    }

    initRender() {
        if (!this.renderer) {
            this.renderer = new Renderer(this.canvas.nativeElement, this.staticServ, this.texServ);
            this.fpsSub = this.renderer.fps$.subscribe((fps: number) => this.fps = fps);

            this.renderer.projection.autoRotateChanged.subscribe((newVal: boolean) => {
                this.settings.autoRotate = newVal;
                this.changeSettings.emit(this.settings);
            });
        }
    }
}
