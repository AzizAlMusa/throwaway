
uniform float uTime;

attribute vec3 aOffsets;

varying vec2 vUv;

void main(){

    vec4 modelPosition = modelMatrix * vec4(position + aOffsets, 1.0);
   
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;

    vUv = uv;

}