//ray marching fragment shader
#include <common>

uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform int       iFrame;                // shader playback frame
// uniform float     iChannelTime[4];       // channel playback time (in seconds)
// uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
uniform vec4      iMouse;  // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec4      resolution;
uniform vec2 mouse;
uniform vec3 keyboard; 
//uniform sampler2D matcap;           
// uniform samplerXX iChannel0..3;          // input channel. XX = 2D/Cube
// uniform vec4      iDate;                 // (year, month, day, time in seconds)
// uniform float     iSampleRate;           // sound sample rate (i.e., 44100)

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

float smin( float a, float b, float k ){
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}
float pmin( float a, float b, float k )
{
    a = pow( a, k ); b = pow( b, k );
    return pow( (a*b)/(a+b), 1.0/k );
}
float sdSphere( vec3 p, float s){
    //return length(p) - s;
    float l = length(p);
    s = 4.0;
    vec4 sphere = vec4(0.0, 0.0, 1.0, 1.0);

    float sphereDistance = length(mod(sphere.xyz - p, s) - vec3(s/2.0)) - sphere.w;
    return sphereDistance;
}

float sdBox( vec3 p, vec3 b ){
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}
float sdCylinder( vec3 p, vec3 c )
{
  return length(p.yz-c.xy)-c.z;
}
float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}
float opTwist( vec3 p )
{
    const float k = 10.0; // or some other amount
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    return sdBox(q,vec3(0.145));
}
float sdf(vec3 p){
    vec3 p1 = rotate(p,vec3(1.),iTime/5.);
    // float box = sdBox(p1,vec3(0.15));
    float box = opTwist(p1);
    float mSphere = sdSphere(p - vec3(mouse*5.,0.),0.45);
    float sphere2 = sdSphere(p,0.46);
    float cylinder = sdCylinder(p, vec3(0.2));
    float torus = sdTorus(p1,vec2(0.6,0.1));
    float res = smin(box,torus,0.6);
    res = smin(res,sphere2,0.6);
    res = smin(res,mSphere,0.6);
    return res;
    //float plane = p.x;
    //return min(mSphere,plane);
    //return plane;
}

vec3 calcNormal( in vec3 p ) // for function f(p)
{
    const float eps = 0.0001; // or some other value
    const vec2 h = vec2(eps,0);
    return normalize( vec3(sdf(p+h.xyy) - sdf(p-h.xyy),
                           sdf(p+h.yxy) - sdf(p-h.yxy),
                           sdf(p+h.yyx) - sdf(p-h.yyx) ) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    // Normalized pixel coordinates (from 0 to 1)
    //vec2 uv = fragCoord/iResolution.xy;
    vec2 uv = (2.0*(fragCoord+vec2(1.0,0.0))-iResolution.xy)/iResolution.y;

    float dist = length(uv);

    vec3 bg = mix(vec3(0.3),vec3(0),dist);
    
    vec3 camPos = vec3(keyboard.x,keyboard.y,keyboard.z);
    vec3 ray = normalize(vec3((uv),-1));

    //vec3 rayPos = normalize(camPos - camDir);

    float t=0.;
    float tMax = 10.;
    for(int i=0;i<200;i++){
        vec3 pos = camPos + t*ray;
        float h = sdf(pos);
        if(h<0.0001 || t>tMax) break;
        t += h;
    }
    vec3 col = bg;
    float fresnel;
    if(t<tMax){
        vec3 pos = camPos + t*ray;
        col = vec3(1.);
        vec3 normal = calcNormal(pos);
        col = normal;
    }

    // Output to screen
    fragColor = vec4(col,1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}