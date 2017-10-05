import { Index } from './../../../services/interfaces';
import { RenderConstants } from './constants';
import { ShipTexture } from './../../../services/ship-texture';
import { TextureService } from './../../../services/services';
import { ShipModel } from './../../../services/ship-model';
import { Program } from './program';
import { GL } from './gl';

export class Textures {
    private textures: Index<WebGLTexture>;

    public loaded = false;

    constructor(private program: Program, private model: ShipModel, private textureService: TextureService) {
        this.textures = {};
        this.loadTextures();
    }

    bind(index: number) {
        const texId = this.model.matBuffer[index];
        GL.gl.activeTexture(GL.gl.TEXTURE0);
        GL.gl.bindTexture(GL.gl.TEXTURE_2D, this.textures[texId]);

        GL.gl.uniform1i(this.program.getAdditionalUniform('uSampler'), 0);
    }

    destroy() {
        this.loaded = false;
        for (const texId of Object.keys(this.textures)) {
            GL.gl.deleteTexture(this.textures[texId]);
        }
        this.textures = [];
    }

    private loadTextures() {
        this.textures = [];

        const alreadyLoading: number[] = [];

        for (const texId of this.model.matBuffer) {
            if (alreadyLoading.find(x => x === texId)) {
                continue;
            }
            alreadyLoading.push(texId);

            // create temporary texture
            this.createEmptyTexture(texId);

            this.textureService.getTexture(this.model.id, texId).subscribe((data: ShipTexture) => {
                this.loadTexture(texId, data);
            }, () => {
                console.error('error loading texture', texId);
                this.createEmptyTexture(texId, new Uint8Array([0, 0, 0, 220]));
            });
        }

        this.loaded = true;
    }

    private createEmptyTexture(texId: number, color: Uint8Array = new Uint8Array([0, 0, 255, 255])) {
        const tex = GL.gl.createTexture();
        GL.gl.bindTexture(GL.gl.TEXTURE_2D, tex);

        GL.gl.texImage2D(
            GL.gl.TEXTURE_2D,                   // target
            0,                                  // level
            GL.gl.RGBA,                         // internalFormat: RGBA
            1,                                  // width
            1,                                  // height
            0,                                  // border
            GL.gl.RGBA,                         // format (must be same as internalFormat)
            GL.gl.UNSIGNED_BYTE,                // type (same as internal)
            color,                              // pixels
        );

        GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_MAG_FILTER, GL.gl.LINEAR);
        GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_MIN_FILTER, GL.gl.LINEAR_MIPMAP_NEAREST);
        GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_WRAP_S, GL.gl.CLAMP_TO_EDGE);
        GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_WRAP_T, GL.gl.CLAMP_TO_EDGE);
        GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_MIN_FILTER, GL.gl.LINEAR);
        GL.gl.bindTexture(GL.gl.TEXTURE_2D, null);

        this.textures[texId] = tex;
    }

    private loadTexture(texId: number, data: ShipTexture) {
        const tex = GL.gl.createTexture();
        GL.gl.bindTexture(GL.gl.TEXTURE_2D, tex);
        GL.gl.pixelStorei(GL.gl.UNPACK_FLIP_Y_WEBGL, data.inversion);

        GL.gl.texImage2D(
            GL.gl.TEXTURE_2D,       // target
            0,                      // level
            GL.gl.RGBA,             // internalFormat: RGBA
            data.width,             // width
            data.height,            // height
            0,                      // border
            GL.gl.RGBA,             // format (must be same as internalFormat)
            GL.gl.UNSIGNED_BYTE,    // type (same as internal)
            data.rgbMatrix,         // pixels (...finally)
        );

        GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_MAG_FILTER, GL.gl.LINEAR);
        GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_MIN_FILTER, GL.gl.LINEAR_MIPMAP_NEAREST);

        if (this.isPowerOf2(data.width)) {
            GL.gl.generateMipmap(GL.gl.TEXTURE_2D);
        } else {
            GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_WRAP_S, GL.gl.CLAMP_TO_EDGE);
            GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_WRAP_T, GL.gl.CLAMP_TO_EDGE);
            GL.gl.texParameteri(GL.gl.TEXTURE_2D, GL.gl.TEXTURE_MIN_FILTER, GL.gl.LINEAR);
        }
        GL.gl.bindTexture(GL.gl.TEXTURE_2D, null);

        if (this.textures[texId]) {
            // remove temp texture
            GL.gl.deleteTexture(this.textures[texId]);
        }
        this.textures[texId] = tex;
    }

    private isPowerOf2(value: number): boolean {
      return (value & (value - 1)) === 0;
    }
}
