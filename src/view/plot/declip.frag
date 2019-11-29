precision highp float;

uniform sampler2D uSampler;
uniform float uRange;
uniform int uLevels;
varying vec2 vTextureCoord;
void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    // scale the big float color to something in the 0.0 - 1.0 range.
    // discretize into levels
    float fLevels = float(uLevels);
    float grayLevel = float(int(fLevels * color.r/uRange))/fLevels;
    gl_FragColor = vec4(grayLevel, grayLevel, grayLevel, 1.0);
}
