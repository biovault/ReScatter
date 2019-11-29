module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "jquery": true,
        "node": true
    },
    "globals": {
        "ReScatter": {},
        "webix": {},
        "PubSub": {},
        "PIXI": "readonly"
    },
    "extends": "eslint:recommended",
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 8,
        "sourceType": "module"
    },
    "rules": {
        "no-console":0,
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
