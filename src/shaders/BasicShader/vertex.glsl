#define NUM_OCTAVES 5

precision mediump float;

uniform float uTime;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uCanvas;
uniform float uRandomness;
uniform vec2 uMouse;


attribute vec3 position;
attribute vec2 uv;

attribute float aScale;
attribute vec3 aOffset;
attribute float aPindex;

varying vec2 vUv;
varying vec2 vPUv;


float random(float n){return fract(sin(n) * 43758.5453123);}

float random(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}



float noise(float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(random(fl), random(fl + 1.0), fc);
}
	
float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(random(b), random(b + d.yx), f.x), mix(random(b + d.xy), random(b + d.yy), f.x), f.y);
}


float fbm(float x) {
	float v = 0.0;
	float a = 0.5;
	float shift = float(100);
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * noise(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

float fbm(vec2 x) {
	float v = 0.0;
	float a = 0.5;
	vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * noise(x);
		x = rot * x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

void main(){


    vUv = uv;

    //puv is the uv coordinates of the big image as a single element
    vec2 puv = aOffset.xy / uTextureSize; 
	vPUv = puv;

    
    //scale as per texture
    float scaleFactor = 0.8;
    vec4 textureColor = texture2D(uTexture, puv);
    //grayscale luminosity method
    float gray = 0.21 * textureColor.r + 0.71 * textureColor.g + 0.07 * textureColor.b ;

    //Size noise
     float psize = (noise(vec2(uTime*0.2, aPindex) * 20.0) +12.0);
    psize *= max(0.2, gray);
    psize *= 0.25;
 
    
    
    //Mouse canvas texture
    float mouseTexture = texture2D(uCanvas, puv).r;
    //Noise and random movement
    vec3 randomMovement = aOffset;
    
    
    //Mouse handling
    randomMovement.x += (fbm(aOffset.x + aPindex + uTime * 0.1)-0.5) * 5.0 * uRandomness  * (1.0 + 10.0* (mouseTexture));//(1.0 + mouseDistance*10.0);
    randomMovement.y += (fbm(aOffset.y + aPindex + uTime * 0.1)-0.5) * 5.0 * uRandomness * (1.0 + 10.0* (mouseTexture));//(1.0 + mouseDistance* 10.0);
  
    float rndz = (random(aPindex) + noise(vec2(aPindex * 0.1, uTime * 0.3)));
    randomMovement.z += rndz * (random(aPindex) * 1.0 * 4.0);

    
    //Displacement and scaling (normalizing)
    vec3 displacement = position * psize+ randomMovement; 
    displacement.xy -= uTextureSize * 0.5;


    vec4 modelPosition = modelMatrix * vec4( displacement , 1.0); 
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
   
    


}