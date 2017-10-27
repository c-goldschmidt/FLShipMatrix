import { Index, ShipDetails, Dictionary } from './../../../services/interfaces';
import { RenderConstants } from './constants';
import { ShipTexture, ShipTexturePack } from './../../../services/ship-texture';
import { TextureService } from './../../../services/services';
import { ShipModel } from './../../../services/ship-model';
import { Program } from './program';
import { GL } from './gl';

export class Textures {
    private textures: Index<Dictionary<WebGLTexture>>;
    private diffuseIndex: Index<number[]>;
    private opacityIndex: Index<number[]>;
    public loaded = false;

    constructor(
        private program: Program,
        private model: ShipModel,
        private ship: ShipDetails,
        private textureService: TextureService,
        loadFeatures = false,
    ) {
        this.textures = {};
        this.loadTextures(loadFeatures);
    }

    bind(index: number, bindFeatures = false) {
        const texId = this.model.matBuffer[index];
        GL.gl.activeTexture(GL.gl.TEXTURE0);
        GL.gl.bindTexture(GL.gl.TEXTURE_2D, this.textures[texId].base);

        GL.gl.uniform1i(this.program.getAdditionalUniform('uSampler'), 0);

        if (bindFeatures) {
            if (!this.textures[texId].light) {
                console.log(texId, 'is null');
            }

            GL.gl.activeTexture(GL.gl.TEXTURE1);
            GL.gl.bindTexture(GL.gl.TEXTURE_2D, this.textures[texId].light);

            GL.gl.uniform1i(this.program.getAdditionalUniform('uLights'), 1);

            if (this.textures[texId].bump) {
                GL.gl.activeTexture(GL.gl.TEXTURE2);
                GL.gl.bindTexture(GL.gl.TEXTURE_2D, this.textures[texId].bump);

                GL.gl.uniform1i(this.program.getAdditionalUniform('uBump'), 2);
                GL.gl.uniform1i(this.program.getAdditionalUniform('hasBump'), 1);
            } else {
                GL.gl.uniform1i(this.program.getAdditionalUniform('hasBump'), 0);
            }

            if (this.diffuseIndex[texId]) {
                this.diffuseIndex[texId][3] = 1.0;
                GL.gl.uniform4fv(this.program.getAdditionalUniform('diffuseColor'), this.diffuseIndex[texId]);
            } else {
                GL.gl.uniform4fv(this.program.getAdditionalUniform('diffuseColor'), [0, 0, 0, 0]);
            }
            if (this.opacityIndex[texId]) {
                this.opacityIndex[texId][1] = 1.0;
                GL.gl.uniform2fv(this.program.getAdditionalUniform('mixOpacity'), this.opacityIndex[texId]);
            } else {
                GL.gl.uniform2fv(this.program.getAdditionalUniform('mixOpacity'), [0, 0]);
            }
        }
    }

    destroy() {
        this.loaded = false;
        for (const texId of Object.keys(this.textures)) {
            for (const type of Object.keys(this.textures[texId])) {
                GL.gl.deleteTexture(this.textures[texId][type]);
            }
        }
        this.textures = [];
    }

    private loadTextures(loadFeatures = false) {
        this.textures = [];
        this.diffuseIndex = [];
        this.opacityIndex = [];

        const alreadyLoading: number[] = [];

        for (const texId of this.model.matBuffer) {
            if (alreadyLoading.find(x => x === texId)) {
                continue;
            }
            alreadyLoading.push(texId);

            // create temporary texture
            this.createEmptyTexture(texId);
            if (loadFeatures) {
                this.createEmptyTexture(texId, new Uint8Array([0, 0, 0, 255]), 'light');
            }

            this.textureService.getTexture(this.ship, texId).subscribe((data: ShipTexturePack) => {
                this.loadTexture(texId, data.base);
                if (data.meta && data.meta.diffuse_color) {
                    this.diffuseIndex[texId] = data.meta.diffuse_color;
                }
                if (data.meta && data.meta.opacity) {
                    this.opacityIndex[texId] = data.meta.opacity;
                }

                if (data.light && loadFeatures) {
                    this.loadTexture(texId, data.light, 'light');
                }

                if (data.bump && loadFeatures) {
                    this.loadTexture(texId, data.bump, 'bump');
                }

            }, (error: Error) => {
                console.error('error loading texture:', texId, error.message);
                this.createEmptyTexture(texId, new Uint8Array([0, 0, 0, 220]));
                if (loadFeatures) {
                    this.createEmptyTexture(texId, new Uint8Array([0, 0, 0, 1]), 'light');
                }
            });
        }

        this.loaded = true;
    }

    private createEmptyTexture(
        texId: number,
        color = new Uint8Array([0, 0, 255, 255]),
        type = 'base',
    ) {
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

        if (!this.textures[texId]) {
            this.textures[texId] = {};
        }
        this.textures[texId][type] = tex;
    }

    private loadTexture(texId: number, data: ShipTexture, type = 'base') {
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

        if (this.textures[texId] && this.textures[texId][type]) {
            // remove temp texture
            GL.gl.deleteTexture(this.textures[texId][type]);
        } else if (!this.textures[texId]) {
            this.textures[texId] = {};
        }
        this.textures[texId][type] = tex;
    }

    private isPowerOf2(value: number): boolean {
      return (value & (value - 1)) === 0;
    }
}
