import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';

@Component({
    selector: 'image-switcher',
    templateUrl: './image-switcher.component.html',
    styleUrls: ['./image-switcher.component.less'],
})

export class ImageSwitcherComponent implements OnChanges {
    public currentImage: SafeStyle;
    public nextImage: SafeStyle;
    public changed: boolean;

    @Input() image: string;
    @Input() size: string;

    private changeTimer: number;

    constructor(private sanitizer: DomSanitizer) { }

    ngOnChanges(changes: SimpleChanges) {
        this.nextImage = this.sanitizer.bypassSecurityTrustStyle(`url(${this.image})`);
        this.changed = true;

        window.clearTimeout(this.changeTimer);
        this.changeTimer = window.setTimeout(() => {
            this.currentImage = this.nextImage;
            this.changed = false;
        }, 1500);
    }
}
