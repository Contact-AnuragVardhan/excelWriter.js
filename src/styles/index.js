'use strict';

var _ = require('lodash');
var numberFormats = require('./numberFormats');
var fonts = require('./fonts');
var fills = require('./fills');
var borders = require('./borders');
var cells = require('./cells');
var tables = require('./tables');
var tableElements = require('./tableElements');
var toXMLString = require('../XMLString');

function Styles() {
	this.objectId = _.uniqueId('Styles');
	this.numberFormats = new numberFormats.NumberFormats(this);
	this.fonts = new fonts.Fonts(this);
	this.fills = new fills.Fills(this);
	this.borders = new borders.Borders(this);
	this.cells = new cells.Cells(this);
	this.tableElements = new tableElements.TableElements(this);
	this.tables = new tables.Tables(this);
	this.defaultTableStyle = '';
}

Styles.prototype.addFormat = function (format, name) {
	return this.cells.add(format, null, name);
};

Styles.prototype.addFontFormat = function (format, name) {
	return this.fonts.add(format, null, name);
};

Styles.prototype.addBorderFormat = function (format, name) {
	return this.borders.add(format, null, name);
};

Styles.prototype.addPatternFormat = function (format, name) {
	return this.fills.add(format, 'pattern', name);
};

Styles.prototype.addGradientFormat = function (format, name) {
	return this.fills.add(format, 'gradient', name);
};

Styles.prototype.addNumberFormat = function (format, name) {
	return this.numberFormats.add(format, null, name);
};

Styles.prototype.addTableFormat = function (format, name) {
	return this.tables.add(format, null, name);
};

Styles.prototype.addTableElementFormat = function (format, name) {
	return this.tableElements.add(format, null, name);
};

Styles.prototype.setDefaultTableStyle = function (name) {
	this.tables.defaultTableStyle = name;
};

Styles.prototype._export = function () {
	return toXMLString({
		name: 'styleSheet',
		ns: 'spreadsheetml',
		children: [
			this.numberFormats.export(),
			this.fonts.export(),
			this.fills.export(),
			this.borders.export(),
			this.cells.export(),
			this.tableElements.export(),
			this.tables.export()
		]
	});
};

module.exports = Styles;