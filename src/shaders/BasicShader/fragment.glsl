

uniform float uTime;

varying vec2 vUv;


float discretize(float x, float intervals){
    return floor(x * intervals) / intervals;
}



void main(){

    float x = vUv.x;
    float y = vUv.y;

    float color = 1.0; //discretize(x, 10.0);


    gl_FragColor = vec4(color, 0.0, 0.0, 1.0);
}