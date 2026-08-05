const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.Blockly = require('blockly');
global.window = global;
global.document = { getElementById: () => null };

const projectRoot = path.resolve(__dirname, '..');
const blockSources = [
    'blocks/custom_blocks.js',
    'ai/ai_blocks.js',
].map(file => fs.readFileSync(path.join(projectRoot, file), 'utf8')).join('\n');

global.PROJECT_BLOCK_TYPES = [
    ...blockSources.matchAll(/Blockly\.Blocks\[['"]([^'"]+)/g),
].map(match => match[1]);
const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
global.TOOLBOX_BLOCK_TYPES = [
    ...indexHtml.matchAll(/<block\s+type=["']([^"']+)/g),
].map(match => match[1]);

const sources = blockSources + [
    'generator/arduino_generator.js',
    'generator/micropython_generator.js',
].map(file => fs.readFileSync(path.join(projectRoot, file), 'utf8')).join('\n');

const assertions = `
const testWorkspace = new Blockly.Workspace();

function makeNumber(value) {
    const block = testWorkspace.newBlock('math_number');
    block.setFieldValue(String(value), 'NUM');
    return block;
}

function generateValue(generator, block) {
    generator.init(testWorkspace);
    const result = generator.blockToCode(block);
    if (!Array.isArray(result)) {
        throw new Error(block.type + ' did not return a value tuple');
    }
    return result[0];
}

for (const type of ['wifi_http_get', 'wifi_http_post']) {
    const block = testWorkspace.newBlock(type);
    for (const generator of [arduinoGenerator, micropythonGenerator]) {
        const code = generateValue(generator, block);
        if (!code.includes(type === 'wifi_http_get' ? 'httpGet' : 'httpPost') &&
            !code.includes(type === 'wifi_http_get' ? 'http_get' : 'http_post')) {
            throw new Error('Wrong HTTP value output for ' + type + ': ' + code);
        }
    }
}

const mathBlock = testWorkspace.newBlock('math_operation');
mathBlock.setFieldValue('MINUS', 'OP');
mathBlock.getInput('A').connection.connect(makeNumber(8).outputConnection);
mathBlock.getInput('B').connection.connect(makeNumber(3).outputConnection);
for (const generator of [arduinoGenerator, micropythonGenerator]) {
    const code = generateValue(generator, mathBlock);
    if (code !== '(8 - 3)') throw new Error('Wrong subtraction output: ' + code);
}

const mapBlock = testWorkspace.newBlock('map_value');
mapBlock.setFieldValue('10', 'IN_MIN');
mapBlock.setFieldValue('900', 'IN_MAX');
mapBlock.setFieldValue('20', 'OUT_MIN');
mapBlock.setFieldValue('200', 'OUT_MAX');
mapBlock.getInput('VALUE').connection.connect(makeNumber(50).outputConnection);
for (const generator of [arduinoGenerator, micropythonGenerator]) {
    const code = generateValue(generator, mapBlock);
    for (const expected of ['10', '900', '20', '200']) {
        if (!code.includes(expected)) throw new Error('Map output omitted ' + expected + ': ' + code);
    }
}

for (const type of [
    'electromagnet_on',
    'electromagnet_off',
    'magnetic_sensor_read',
    'magnetic_sensor_detected',
]) {
    const block = testWorkspace.newBlock(type);
    arduinoGenerator.init(testWorkspace);
    if (!arduinoGenerator.forBlock[type](block, arduinoGenerator)) {
        throw new Error('Arduino generator returned no output for ' + type);
    }
}

const reverseFor = testWorkspace.newBlock('for_loop');
reverseFor.setFieldValue('5', 'FROM');
reverseFor.setFieldValue('0', 'TO');
reverseFor.setFieldValue('-1', 'STEP');
arduinoGenerator.init(testWorkspace);
const arduinoFor = arduinoGenerator.blockToCode(reverseFor);
if (!arduinoFor.includes('>= 0') || !arduinoFor.includes('+= -1')) {
    throw new Error('Arduino reverse for-loop is invalid: ' + arduinoFor);
}
micropythonGenerator.init(testWorkspace);
const micropythonFor = micropythonGenerator.blockToCode(reverseFor);
if (!micropythonFor.includes('range(5, -1, -1)')) {
    throw new Error('MicroPython reverse for-loop is invalid: ' + micropythonFor);
}

for (const generator of [arduinoGenerator, micropythonGenerator]) {
    const missing = [...new Set(PROJECT_BLOCK_TYPES)]
        .filter(type => typeof generator.forBlock[type] !== 'function');
    if (missing.length) throw new Error('Missing block generators: ' + missing.join(', '));
}

const missingToolboxDefinitions = [...new Set(TOOLBOX_BLOCK_TYPES)]
    .filter(type => !Blockly.Blocks[type]);
if (missingToolboxDefinitions.length) {
    throw new Error('Toolbox references undefined blocks: ' + missingToolboxDefinitions.join(', '));
}
`;

try {
    vm.runInThisContext(`${sources}\n${assertions}`, {
        filename: 'bharatblocks-generator-integration.js',
    });
    console.log(
        `Generator integration checks passed for ${new Set(PROJECT_BLOCK_TYPES).size} custom block types.`,
    );
    process.exit(0);
} catch (error) {
    console.error(error.stack);
    process.exit(1);
}
