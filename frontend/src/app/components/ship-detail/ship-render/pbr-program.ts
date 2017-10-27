import { ShaderSettings, PBRSettings } from './renderer.interfaces';
import { ShipDetails } from './../../../services/interfaces';
import { Textures } from './textures';
import { ShipModel } from './../../../services/ship-model';
import { StaticService, TextureService } from './../../../services/services';
import { GL } from './gl';
import { Projection } from './projection';
import { Program } from './program';

export interface PBRShaderSettings extends ShaderSettings {
    has_normals?: boolean;
    has_tangents?: boolean;
    has_uv?: boolean;
    has_basecolormap?: boolean;
    has_normalmap?: boolean;
    has_emissivemap?: boolean;
    has_metalroughnessmap?: boolean;
    has_occlusionmap?: boolean;
}

export interface FixedPBRSettings {
    metallicRoughness: number[];
    baseColorFactor: number[];
    lightColor: number[];
    scaleDiffBaseMR: number[];
    scaleFGDSpec: number[];
    scaleIBLAmbient: number[];
    lightDirection: number[];
    emissiveFactor: number[];
    camera: number[];
    normalScale: number[];
}

export class PBRProgram extends Program {
    private uProjectionMatrix: WebGLUniformLocation;
    private uModelViewMatrix: WebGLUniformLocation;
    private uNormalMatrix: WebGLUniformLocation;

    private textures: Textures;
    private _runtimeSettings: FixedPBRSettings;

    constructor(
        staticServ: StaticService,
        model: ShipModel,
        ship: ShipDetails,
        textureService: TextureService,
        settings?: PBRShaderSettings,
    ) {
        super(staticServ, settings);

        this._runtimeSettings = {
            metallicRoughness: [0.7, 0.5],
            lightColor: [1.0, 1.0, 1.0],
            lightDirection: [0.5, 0.5, 0.1],
            emissiveFactor: [0.8, 0.8, 0.8],
            baseColorFactor: [1.0, 1.0, 1.0, 1.0],
            scaleDiffBaseMR: [0, 0, 0, 0],
            scaleFGDSpec: [0, 0, 0, 0],
            scaleIBLAmbient: [0, 0, 0, 0],
            camera: [0, 0, 0],
            normalScale: [0, 0, 0],
        }

        this.textures = new Textures(this, model, ship, textureService, true);
    }

    get loaded() {
        return this._loaded && this.textures.loaded;
    }

    set runtimeSettings(rsUpdate: PBRSettings) {
        for (const key of Object.keys(rsUpdate)) {
            this._runtimeSettings[key] = rsUpdate[key];
        }
    }

    destroy() {
        super.destroy();
        this.textures.destroy();
    }

    updateSettings(settings: ShaderSettings) {
        // currently no settings to update
        // this.settings = settings;
        // super.destroy();
        // this.initialize();
    }

    use(index: number, projection: Projection) {
        GL.gl.useProgram(this.program);

        this.textures.bind(index, true);

        GL.gl.uniformMatrix4fv(this.uProjectionMatrix, false, projection.projectionMatrix);
        GL.gl.uniformMatrix4fv(this.uModelViewMatrix, false, projection.modelViewMatrix);
        GL.gl.uniformMatrix4fv(this.uNormalMatrix, false, projection.normalMatrix);

        GL.gl.uniform3fv(
            this.additionalUniforms.uLightDirection,
            this._runtimeSettings.lightDirection,
        );
        GL.gl.uniform3fv(
            this.additionalUniforms.uLightColor,
            this._runtimeSettings.lightColor,
        );
        GL.gl.uniform3fv(
            this.additionalUniforms.uCamera,
            this._runtimeSettings.camera,
        );
        GL.gl.uniform3fv(
            this.additionalUniforms.uEmissiveFactor,
            this._runtimeSettings.emissiveFactor,
        );
        GL.gl.uniform2fv(
            this.additionalUniforms.uMetallicRoughnessValues,
            this._runtimeSettings.metallicRoughness,
        );
        GL.gl.uniform4fv(
            this.additionalUniforms.uBaseColorFactor,
            this._runtimeSettings.baseColorFactor,
        );
        // this.additionalUniforms.uNormalScale
        // debug flags
        GL.gl.uniform4fv(
            this.additionalUniforms.uScaleDiffBaseMR,
            this._runtimeSettings.scaleDiffBaseMR,
        );
        GL.gl.uniform4fv(
            this.additionalUniforms.uScaleFGDSpec,
            this._runtimeSettings.scaleFGDSpec,
        );
        GL.gl.uniform4fv(
            this.additionalUniforms.uScaleIBLAmbient,
            this._runtimeSettings.scaleIBLAmbient,
        );
    }

    initialize() {
        GL.gl.getExtension('EXT_shader_texture_lod');
        GL.gl.getExtension('OES_standard_derivatives');

        this.loadingShaders = 2;
        this.fragmentShader = this.loadShader('static/shaders/pbr.frag', GL.gl.FRAGMENT_SHADER);
        this.vertexShader = this.loadShader('static/shaders/pbr.vert', GL.gl.VERTEX_SHADER);

        if (this.loadingShaders === 0) {
            this.loadProgram();
        }
    }

    protected loadUniforms() {
        this.uProjectionMatrix = GL.gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.uModelViewMatrix = GL.gl.getUniformLocation(this.program, 'uModelViewMatrix');
        this.uNormalMatrix = GL.gl.getUniformLocation(this.program, 'uNormalMatrix');

        this.additionalUniforms.uSampler = GL.gl.getUniformLocation(this.program, 'uTextureSampler');
        this.additionalUniforms.uLights = GL.gl.getUniformLocation(this.program, 'u_EmissiveSampler');
        this.additionalUniforms.uBump = GL.gl.getUniformLocation(this.program, 'u_NormalSampler');
        this.additionalUniforms.uEmissiveFactor = GL.gl.getUniformLocation(this.program, 'u_EmissiveFactor');
        this.additionalUniforms.uNormalScale = GL.gl.getUniformLocation(this.program, 'u_NormalScale');
        this.additionalUniforms.hasBump = GL.gl.getUniformLocation(this.program, 'hasBump');
        this.additionalUniforms.diffuseColor = GL.gl.getUniformLocation(this.program, 'u_DiffuseMix');
        this.additionalUniforms.mixOpacity = GL.gl.getUniformLocation(this.program, 'u_OpacityMix');

        this.additionalUniforms.uLightDirection = GL.gl.getUniformLocation(this.program, 'u_LightDirection');
        this.additionalUniforms.uLightColor = GL.gl.getUniformLocation(this.program, 'u_LightColor');
        this.additionalUniforms.uMetallicRoughnessValues = GL.gl.getUniformLocation(
            this.program, 'u_MetallicRoughnessValues');
        this.additionalUniforms.uBaseColorFactor = GL.gl.getUniformLocation(this.program, 'u_BaseColorFactor');
        this.additionalUniforms.uCamera = GL.gl.getUniformLocation(this.program, 'u_Camera');

        this.additionalUniforms.uScaleDiffBaseMR = GL.gl.getUniformLocation(this.program, 'u_ScaleDiffBaseMR');
        this.additionalUniforms.uScaleFGDSpec = GL.gl.getUniformLocation(this.program, 'u_ScaleFGDSpec');
        this.additionalUniforms.uScaleIBLAmbient = GL.gl.getUniformLocation(this.program, 'u_ScaleIBLAmbient');
    }
}
