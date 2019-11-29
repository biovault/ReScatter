module.exports = {
    "extends": "../.eslintrc.js",
    "env": {
        "mocha": true,
        "node": true,
        "es6": true
    },
    "globals": {
        "ReScatter": false,
        "DimRS": false,
        "expect": false,
        "assert": false,
        "TestGlobals": false,
        "browser": false,
        "$": false
    },
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module"
    },
    "ecmaFeatures": {
        "modules": true
    },
    "rules": {
        "func-names": 0,
        "no-var": 0,
        "no-magic-numbers": 0,
        "no-unused-expressions": 0
    }
};
