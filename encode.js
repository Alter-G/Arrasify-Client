const JavascriptObfuscator = require("javascript-obfuscator");
const fs = require("fs");
const path = require("path");

const clientCode = fs.readFileSync(path.join(__dirname, "client.js"));
const obfuscationResult = JavascriptObfuscator.obfuscate(clientCode.toString("utf-8"), {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1.0,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1.0,
    selfDefending: true,
    debugProtection: false,
    disableConsoleOutput: true,
    splitStrings: true,
    splitStringsChunkLength: 3,
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: true,
    transformObjectKeys: true
});

fs.writeFileSync(path.join(__dirname, "script.js"), obfuscationResult.getObfuscatedCode(), "utf-8");