import { Textures } from './textures';
import { ShipModel } from './../../../services/ship-model';
import { StaticService, TextureService } from './../../../services/services';
import { GL } from './gl';
import { Projection } from './projection';
import { Program } from './program';

export class FlatProgram extends Program {
    private uProjectionMatrix: WebGLUniformLocation;
    private uModelViewMatrix: WebGLUniformLocation;
    private uNormalMatrix: WebGLUniformLocation;

    private textures: Textures;

    constructor(
        staticServ: StaticService,
        model: ShipModel,
        textureService: TextureService,
    ) {
        super(staticServ);
        this.loadingShaders = 2;
        this.fragmentShader = this.loadShader('/static/shaders/flat.frag', GL.gl.FRAGMENT_SHADER);
        this.vertexShader = this.loadShader('/static/shaders/flat.vert', GL.gl.VERTEX_SHADER);

        this.textures = new Textures(this, model, textureService);

        if (this.loadingShaders === 0) {
            this.loadProgram();
        }
    }

    get loaded() {
        return this._loaded && this.textures.loaded;
    }

    destroy() {
        super.destroy();
        this.textures.destroy();
    }

    use(index: number, projection: Projection) {
        GL.gl.useProgram(this.program);

        this.textures.bind(index);

        GL.gl.uniformMatrix4fv(this.uProjectionMatrix, false, projection.projectionMatrix);
        GL.gl.uniformMatrix4fv(this.uModelViewMatrix, false, projection.modelViewMatrix);
        GL.gl.uniformMatrix4fv(this.uNormalMatrix, false, projection.normalMatrix);
    }

    protected loadUniforms() {
        this.uProjectionMatrix = GL.gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.uModelViewMatrix = GL.gl.getUniformLocation(this.program, 'uModelViewMatrix');
        this.uNormalMatrix = GL.gl.getUniformLocation(this.program, 'uNormalMatrix');

        this.additionalUniforms.uSampler = GL.gl.getUniformLocation(this.program, 'uSampler');
    }
}
