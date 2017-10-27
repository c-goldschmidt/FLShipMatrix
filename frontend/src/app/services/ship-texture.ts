import { TextureMeta } from './interfaces';

export class ShipTexture {
    public rgbMatrix: Uint8Array;
    public width: number;
    public height: number;
    public inversion: boolean;

    constructor(textureData: ArrayBuffer) {
        this.parseData(textureData);
    }

    private parseData(buffer: ArrayBuffer) {
        let offset = 0;

        this.width = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;
        this.height = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;

        this.inversion = new Uint8Array(buffer, offset, 1)[0] === 1;
        offset += Uint8Array.BYTES_PER_ELEMENT;

        // width * height * channel count (RGBA = 4)
        const matrixLength = this.width * this.height * 4;
        this.rgbMatrix = new Uint8Array(buffer, offset, matrixLength);
        offset += matrixLength;
    }
}

export class ShipTexturePack {
    public base: ShipTexture;
    public light: ShipTexture;
    public bump: ShipTexture;

    constructor(
        base: ArrayBuffer,
        light: ArrayBuffer,
        bump: ArrayBuffer,
        public meta: TextureMeta,
    ) {
        this.base = new ShipTexture(base);

        if (light) {
            this.light = new ShipTexture(light);
        }
        if (bump) {
            this.bump = new ShipTexture(bump);
        }
    }
}
