precision highp float;

attribute vec2 aVertexPosition;
uniform vec2 bounds;
uniform float uFourSigma;
void main(void)
{
    vec2 xy = (aVertexPosition/bounds * vec2(2.0, -2.0)) + vec2(-1.0, 1.0);
    gl_Position = vec4(xy, 0.0, 1.0);
    gl_PointSize = uFourSigma;
}
