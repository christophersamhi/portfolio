module.exports = {
	extends: "stylelint-config-standard-scss",
	plugins: ["stylelint-scss"],
	rules: {
		"scss/dollar-variable-colon-space-after": "always",
		"scss/dollar-variable-pattern": "^[a-z][a-zA-Z0-9-]*$",
		"custom-property-pattern": null,
		"selector-class-pattern": "^[a-z][a-zA-Z0-9-]*$",
	},
	customSyntax: "postcss-scss",
	ignoreFiles: ["**/*.js", "**/*.ts"],
};
