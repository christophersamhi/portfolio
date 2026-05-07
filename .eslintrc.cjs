module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es2021: true,
	},
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:import/recommended",
		"plugin:import/typescript",
		"plugin:promise/recommended",
		"plugin:n/recommended",
		"plugin:prettier/recommended",
	],
	plugins: ["@typescript-eslint"],
	rules: {
		"no-console": "off",
		semi: ["error", "always"],
		"prettier/prettier": ["error", { tabWidth: 4, useTabs: false }],
		"n/no-unpublished-import": ["off"],
		"import/no-extraneous-dependencies": ["off"],
	},
	settings: {
		"import/resolver": {
			node: {
				extensions: [".js", ".ts", ".jsx", ".tsx"],
				moduleDirectory: ["node_modules", "app"],
			},
		},
	},
	ignorePatterns: ["node_modules/**/*.d.ts", "app/styles/**/*.scss"],
};
