
module.exports = {
	root: true,
	parser: '@babel/eslint-parser',
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
		requireConfigFile: false,
	},
	env: {
		es2022: true,
		browser: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'xo',
		'plugin:import/recommended',
		'plugin:promise/recommended',
		'plugin:unicorn/recommended',
		'plugin:node/recommended',
	],
	plugins: [
		'import',
		'promise',
		'unicorn',
		'node',
	],
	rules: {
		'array-bracket-spacing': [
			'error',
			'always',
			{
				arraysInArrays: false,
				objectsInArrays: false,
			},
		],
		'arrow-parens': [
			'warn',
			'always',
		],
		'brace-style': [
			'error',
			'stroustrup',
		],
		'camelcase': 'off',
		'capitalized-comments': 'off',
		'import/extensions': [
			'error',
			'always',
		],
		'indent': [
			'error',
			'tab',
			{
				ImportDeclaration: 'off',
				SwitchCase: 1,
			},
		],
		'new-cap': [
			'error',
			{
				newIsCap: true,
				capIsNew: true,
				properties: false,
			},
		],
		'no-multi-spaces': [
			'error',
			{
				exceptions: {
					Property: true,
					ImportDeclaration: true,
				},
			},
		],
		'no-promise-executor-return': 'off',
		'no-unused-vars': 'warn',
		'node/no-unpublished-import': 'off',
		'object-curly-spacing': [
			'warn',
			'always',
			{
				arraysInObjects: true,
				objectsInObjects: true,
			},
		],
		'padding-line-between-statements': [
			'error',
			{
				blankLine: 'never',
				prev: 'case',
				next: 'break',
			},
		],
		'quote-props': [
			'error',
			'consistent-as-needed',
			{
				numbers: true,
			},
		],
		'quotes': [
			'error',
			'single',
		],
		'unicorn/no-null': 'off',
		'unicorn/numeric-separators-style': [
			'warn',
			{
				onlyIfContainsSeparator: true,
			},
		],
		'unicorn/prefer-ternary': [
			'error',
			'only-single-line',
		],
		'unicorn/prevent-abbreviations': [
			'error',
			{
				allowList: {
					args: true,
					env: true,
					fn: true,
					Props: true,
				},
			},
		],
		'unicorn/switch-case-braces': [
			'warn',
			'avoid',
		],
		'node/no-unsupported-features/es-syntax': 'off',
	},
};
