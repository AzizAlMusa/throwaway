precision mediump float;

uniform float uTime;
uniform sampler2D uTexture;
uniform sampler2D uCanvas;

varying vec2 vUv;
varying vec2 vPUv;

float discretize(float x, float intervals){
    return floor(x * intervals) / intervals;
}

float grayscale(vec3 texture){
    return 0.21 * texture.r + 0.71 * texture.g + 0.07 * texture.b;
}

void main(){

    vec4 textureColor = texture2D(uTexture, vPUv);
    vec4 canvasColor = texture2D(uCanvas, vPUv);
    
    // circular particles
    float strength = 0.5- distance(vUv, vec2(0.5));
    float alpha = smoothstep(0.0, 0.6, strength);
   
    float gray = 1.4*grayscale(textureColor.rgb);
    strength = gray * strength * 3.0;
    vec3 finalColor = textureColor.rgb *strength * 3.0;

    gl_FragColor = vec4(finalColor, alpha);


}