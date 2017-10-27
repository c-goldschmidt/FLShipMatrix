%DEFINITIONS%

attribute vec4 aVertexPosition;
#ifdef HAS_NORMALS
attribute vec4 aVertexNormal;
#endif
#ifdef HAS_TANGENTS
attribute vec4 a_Tangent;
#endif
#ifdef HAS_UV
attribute vec2 aTextureCoord;
#endif

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

varying vec3 v_Position;
varying vec2 v_UV;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
varying mat3 v_TBN;
#else
varying vec3 v_Normal;
#endif
#endif

void main()
{
  vec4 pos = uModelViewMatrix * aVertexPosition;
  v_Position = vec3(pos.xyz) / pos.w;

  #ifdef HAS_NORMALS
  #ifdef HAS_TANGENTS
  vec3 normalW = normalize(vec3(uModelViewMatrix * vec4(aVertexNormal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(uModelViewMatrix * vec4(a_Tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * a_Tangent.w;
  v_TBN = mat3(tangentW, bitangentW, normalW);
  #else // HAS_TANGENTS != 1
  v_Normal = normalize(vec3(uModelViewMatrix * vec4(aVertexNormal.xyz, 0.0)));
  #endif
  #endif

  #ifdef HAS_UV
  v_UV = aTextureCoord;
  #else
  v_UV = vec2(0.,0.);
  #endif

  //gl_Position = uProjectionMatrix * aVertexPosition; // needs w for proper perspective correction
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}


