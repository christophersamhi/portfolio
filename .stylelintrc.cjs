module.exports = {
	extends: "stylelint-config-standard-scss",
	plugins: ["stylelint-scss"],
	rules: {
		"selector-class-pattern": null,
    	"no-descending-specificity": null
	},
	customSyntax: "postcss-scss",
	ignoreFiles: ["**/*.js", "**/*.ts"],
};
