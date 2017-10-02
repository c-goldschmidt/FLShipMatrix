
export class ShipModel {
    public numMeshes: number;

    public vertexBuffer: any;
    public normalBuffer: any;
    public uvBuffer: any;
    public matBuffer: any;
    public id: number;
    public lod: string;

    constructor(shipData: ArrayBuffer) {
        this.parseData(shipData);
    }

    private parseData(buffer: ArrayBuffer) {
        let offset = 0;

        const vertLen = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;
        const normLen = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;
        const uvLen = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;
        const matLen = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;

        this.numMeshes =  new Uint32Array(buffer, offset, 1)[0];

        this.readVerices(buffer, offset, offset + vertLen);
        offset += vertLen;

        this.readNormals(buffer, offset, offset + normLen);
        offset += normLen;

        this.readUVs(buffer, offset, offset + uvLen);
        offset += uvLen;

        this.readMats(buffer, offset, matLen);
        offset += matLen;

        if (offset !== buffer.byteLength) {
            console.error(`total length missmatch! ${offset} should be at ${buffer.byteLength}`);
        }
    }

    private readVerices(buffer: ArrayBuffer, offset: number, should: number) {
        const numMeshes = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;

        this.vertexBuffer = [];
        for (let i = 0; i < numMeshes; i++) {
            const vertLen = new Uint32Array(buffer, offset, 1)[0];
            offset += Uint32Array.BYTES_PER_ELEMENT;

            this.vertexBuffer.push(
                new Float32Array(buffer, offset, vertLen),
            );

            offset += vertLen * Float32Array.BYTES_PER_ELEMENT;
        }

        if (offset !== should) {
            console.error(`vertex length missmatch! ${offset} should be at ${should}`);
        }
    }
    private readNormals(buffer: ArrayBuffer, offset: number, should: number) {
        const numMeshes = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;

        this.normalBuffer = [];
        for (let i = 0; i < numMeshes; i++) {
            const normLen = new Uint32Array(buffer, offset, 1)[0];
            offset += Uint32Array.BYTES_PER_ELEMENT;

            this.normalBuffer[i] = [];
            for (let j = 0; j < normLen; j++) {
                this.normalBuffer[i].push(
                    new Float32Array(buffer, offset, 3),
                )
                offset += Float32Array.BYTES_PER_ELEMENT * 3;
            }
        }

        if (offset !== should) {
            console.error(`normals length missmatch! ${offset} should be at ${should}`);
        }
    }
    private readUVs(buffer: ArrayBuffer, offset: number, should: number) {
        const numMeshes = new Uint32Array(buffer, offset, 1)[0];
        offset += Uint32Array.BYTES_PER_ELEMENT;

        this.uvBuffer = [];
        for (let i = 0; i < numMeshes; i++) {
            const uvLen = new Uint32Array(buffer, offset, 1)[0];
            offset += Uint32Array.BYTES_PER_ELEMENT;

            this.uvBuffer.push(
                new Float32Array(buffer, offset, uvLen),
            );

            offset += uvLen * Float32Array.BYTES_PER_ELEMENT;
        }

        if (offset !== should) {
            console.error(`UV length missmatch! ${offset} should be at ${should}`);
        }
    }
    private readMats(buffer: ArrayBuffer, offset: number, length: number) {
        this.matBuffer = new Uint32Array(buffer, offset, length / 4);
    }
}
