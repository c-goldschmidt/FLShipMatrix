import { ShaderSettings } from './renderer.interfaces';
import { ShipDetails } from './../../../services/interfaces';
import { Textures } from './textures';
import { ShipModel } from './../../../services/ship-model';
import { StaticService, TextureService } from './../../../services/services';
import { GL } from './gl';
import { Projection } from './projection';
import { Program } from './program';

export interface FlatShaderSettings extends ShaderSettings {
    lamberts: boolean;
    textures: boolean;
    debug_lights: boolean;
}

export class FlatProgram extends Program {
    private uProjectionMatrix: WebGLUniformLocation;
    private uModelViewMatrix: WebGLUniformLocation;
    private uNormalMatrix: WebGLUniformLocation;

    private textures: Textures;

    constructor(
        staticServ: StaticService,
        model: ShipModel,
        ship: ShipDetails,
        textureService: TextureService,
        settings?: FlatShaderSettings,
    ) {
        super(staticServ, settings);
        this.textures = new Textures(this, model, ship, textureService, true);
    }

    get loaded() {
        return this._loaded && this.textures.loaded;
    }

    destroy() {
        super.destroy();
        this.textures.destroy();
    }

    updateSettings(settings: ShaderSettings) {
        this.settings = settings;
        super.destroy();
        this.initialize();
    }

    use(index: number, projection: Projection) {
        GL.gl.useProgram(this.program);

        this.textures.bind(index, true);

        GL.gl.uniformMatrix4fv(this.uProjectionMatrix, false, projection.projectionMatrix);
        GL.gl.uniformMatrix4fv(this.uModelViewMatrix, false, projection.modelViewMatrix);
        GL.gl.uniformMatrix4fv(this.uNormalMatrix, false, projection.normalMatrix);
    }

    initialize() {
        this.loadingShaders = 2;
        this.fragmentShader = this.loadShader('static/shaders/flat.frag', GL.gl.FRAGMENT_SHADER);
        this.vertexShader = this.loadShader('static/shaders/flat.vert', GL.gl.VERTEX_SHADER);

        if (this.loadingShaders === 0) {
            this.loadProgram();
        }
    }

    protected loadUniforms() {
        this.uProjectionMatrix = GL.gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.uModelViewMatrix = GL.gl.getUniformLocation(this.program, 'uModelViewMatrix');
        this.uNormalMatrix = GL.gl.getUniformLocation(this.program, 'uNormalMatrix');

        this.additionalUniforms.uSampler = GL.gl.getUniformLocation(this.program, 'uSampler');
        this.additionalUniforms.uLights = GL.gl.getUniformLocation(this.program, 'uLight');
        this.additionalUniforms.uBump = GL.gl.getUniformLocation(this.program, 'uBump');
        this.additionalUniforms.hasBump = GL.gl.getUniformLocation(this.program, 'hasBump');
        this.additionalUniforms.diffuseColor = GL.gl.getUniformLocation(this.program, 'diffuseColor');
        this.additionalUniforms.mixOpacity = GL.gl.getUniformLocation(this.program, 'mixOpacity');
    }
}
