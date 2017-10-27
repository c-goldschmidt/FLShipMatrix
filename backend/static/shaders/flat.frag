%DEFINITIONS%

precision highp float;

uniform sampler2D uSampler;
uniform sampler2D uLight;
uniform sampler2D uBump;

uniform int hasBump;
uniform vec4 diffuseColor;
uniform vec2 mixOpacity;

varying vec3 vLighting;
varying vec2 vTextureCoord;

void main(void){
#ifdef DEBUG_LIGHTS
    vec4 color = texture2D(uLight, vTextureCoord);
#else
#ifdef TEXTURES
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec4 lightmap = texture2D(uLight, vTextureCoord);
    color = mix(color, lightmap, 0.75);
#else
    vec4 color = vec4(1.0, 1.0, 1.0, 1.0);
#endif
#endif
    color = mix(color, color * vec4(diffuseColor.rgb, 1.0), diffuseColor.a);
    color = mix(color, vec4(0, 0, 0, 0), mixOpacity.y > 0.0 ? 1.0 - mixOpacity.x : 0.0);

#ifdef LAMBERTS
    gl_FragColor = vec4((color.rgb * vLighting) * color.a, color.a);
#else
    gl_FragColor = vec4(color.rgb * color.a, color.a);
#endif
}
