
export interface ShaderSettings {
    [index: string]: boolean;
}

export interface PBRSettings {
    metallicRoughness?: number[];
    baseColorFactor?: number[];
    lightColor?: number[];
    scaleDiffBaseMR?: number[];
    scaleFGDSpec?: number[];
    scaleIBLAmbient?: number[];
    lightDirection?: number[];
    emissiveFactor?: number[];
    camera?: number[];
}

export interface RenderSettings {
    autoRotate: boolean;
    selectedLOD: string;
    boundingBox: boolean;
    drawTextures: boolean;
    drawLights: boolean;
    shader: 'flat' | 'pbr';
    pbrSettings: PBRSettings;
}
