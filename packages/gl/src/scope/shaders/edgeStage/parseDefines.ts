export function parseDefines(shader: any) {
  if (!shader || typeof shader !== 'object') {
    console.error('Invalid shader object');
    return shader;
  }

  if (!shader.defines || typeof shader.defines !== 'object') {
    shader.defines = {};
  }

  const defines: string[] = [];
  for (const key in shader.defines) {
    if (Object.prototype.hasOwnProperty.call(shader.defines, key)) {
      const val = shader.defines[key];
      defines.push(`#define ${key} ${val}`);
    }
  }

  const definesString = defines.join('\n') + '\n';

  if (typeof shader.fragmentShader === 'string') {
    shader.fragmentShader = definesString + shader.fragmentShader;
  }

  if (typeof shader.vertexShader === 'string') {
    shader.vertexShader = definesString + shader.vertexShader;
  }

  return shader;
}
