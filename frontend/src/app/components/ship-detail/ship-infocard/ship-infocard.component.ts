import { InfocardUtils } from './utils';
import { Component, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'ship-infocard',
    templateUrl: './ship-infocard.component.html',
    styleUrls: ['./ship-infocard.component.less'],
})

export class ShipInfocardComponent implements OnChanges {
    @Input() rawData: string;
    public parsedHTML: string;

    ngOnChanges(changes: SimpleChanges): void {
        console.log(changes);
        const ut = new InfocardUtils();
        this.parsedHTML = ut.xmlToHtml(this.rawData);
        console.log(this.parsedHTML);
    }
}
