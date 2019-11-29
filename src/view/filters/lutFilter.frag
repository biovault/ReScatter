precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D colorSampler;
uniform vec3 background;

void main(void)
{
    vec4 original = texture2D(uSampler, vTextureCoord);
    float scaled = floor((original.r * 255.0) + 0.5);
    // The textures are 16x16 LUTs where each texture pixel represents a mapping from
    // a gray value to a color
    float ycoord = scaled/16.0;
    float xcoord = mod(scaled, 16.0);
    vec2 colorCoord = vec2(clamp(xcoord/16.0, 0.0, 1.0), clamp(ycoord/16.0, 0.0, 1.0));
    if ((xcoord <= 0.0) && (ycoord <= 0.0)) {
        gl_FragColor = vec4(background.x,background.y, background.z, 1.0); //force 0 background to background
    } else {
        gl_FragColor = texture2D(colorSampler, colorCoord);
    }
}
