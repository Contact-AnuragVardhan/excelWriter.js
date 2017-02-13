'use strict';

const _ = require('lodash');
const SheetView = require('./sheetView');

class PrepareSave extends SheetView {
	_prepare() {
		this._prepareTables();
		this._prepareColumns();
		this._prepareRows();
		this._prepareData();
	}
	_prepareColumns() {
		this.preparedColumns = _.map(this.columns, column => {
			if (column) {
				const preparedColumn = _.clone(column);

				if (column.style) {
					const style = this.styles.addFormat(column.style);
					preparedColumn.style = style;

					const columnStyle = this.styles._addFillOutFormat(style);
					preparedColumn.styleId = this.styles._getId(columnStyle);
				}
				return preparedColumn;
			}
		});
		this.columns = null;
	}
	_prepareRows() {
		this.preparedRows = _.map(this.rows, row => {
			if (row) {
				const preparedRow = _.clone(row);

				if (row.style) {
					preparedRow.style = this.styles.addFormat(row.style);
				}
				return preparedRow;
			}
		});
		this.rows = null;
	}
	_prepareData() {
		this.maxX = 0;
		this.preparedData = [];
		for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
			const preparedDataRow = this._prepareDataRow(rowIndex);

			this.preparedData[rowIndex] = preparedDataRow;
			this.maxX = Math.max(this.maxX, preparedDataRow.length);
		}
		this.maxY = this.preparedData.length;
		this.data = null;
	}
	_prepareDataRow(rowIndex) {
		const preparedDataRow = [];
		let row = this.preparedRows[rowIndex];
		let dataRow = this.data[rowIndex];

		if (dataRow) {
			let rowStyle = null;
			let skipColumnsStyle = false;
			let inserts = [];

			if (!_.isArray(dataRow)) {
				row = this._mergeDataRowToRow(row, dataRow);
				if (dataRow.inserts) {
					inserts = dataRow.inserts;
					dataRow = _.clone(dataRow.data);
				} else {
					dataRow = dataRow.data;
				}
			}
			if (row) {
				rowStyle = row.style || null;
				skipColumnsStyle = row.skipColumnsStyle;
			}
			dataRow = this._splitDataRow(row, dataRow, rowIndex);

			for (let colIndex = 0, dataIndex = 0; dataIndex < dataRow.length || colIndex < inserts.length; colIndex++) {
				const column = this.preparedColumns[colIndex];
				const columnStyle = !skipColumnsStyle && column ? column.style : null;

				let value;
				if (inserts[colIndex]) {
					value = {style: inserts[colIndex].style, type: 'empty'};
				} else {
					value = dataRow[dataIndex];
					dataIndex++;
				}

				const {cellValue, cellType, cellStyle, isObject} = this._readCellValue(value);

				if (isObject) {
					this._insertHyperlink(colIndex, rowIndex, value.hyperlink);
					this._insertDrawing(colIndex, rowIndex, value.image);
					dataRow = this._mergeCells(dataRow, colIndex, rowIndex, value);
				}

				preparedDataRow[colIndex] = this._getPreparedCell(
					this.styles._getId(this.styles._merge(columnStyle, rowStyle, cellStyle)),
					this._getCellType(cellType, cellValue, row, column),
					cellValue
				);
			}
		}

		if (row) {
			this._setRowStyleId(row);
			this.preparedRows[rowIndex] = row;
		}

		return preparedDataRow;
	}
	_mergeDataRowToRow(row = {}, dataRow) {
		row.height = dataRow.height || row.height;
		row.outlineLevel = dataRow.outlineLevel || row.outlineLevel;
		row.type = dataRow.type || row.type;
		row.style = dataRow.style ? this.styles.addFormat(dataRow.style) : row.style;
		row.skipColumnsStyle = dataRow.skipColumnsStyle || row.skipColumnsStyle;

		return row;
	}
	_splitDataRow(row = {}, dataRow, rowIndex) {
		const count = this._calcDataRowHeight(dataRow);

		if (count === 0) {
			return dataRow;
		}

		const newRows = _.times(count, () => {
			const result = _.clone(row);
			result.data = [];
			return result;
		});
		_.forEach(dataRow, value => {
			let list;
			let style = null;

			if (_.isArray(value)) {
				list = value;
			} else if (_.isObject(value) && !_.isDate(value) && _.isArray(value.value)) {
				list = value.value;
				style = value.style;
			}

			if (list) {
				_(list)
					.initial()
					.forEach((value, index) => {
						newRows[index].data.push({value, style});
					});

				const lastValue = {value: _.last(list), style};
				const listLength = list.length;
				const value = listLength < count
					? this._addRowspan(lastValue, count - listLength + 1)
					: lastValue;
				newRows[list.length - 1].data.push(value);
			} else {
				newRows[0].data.push(this._addRowspan(value, count));
			}
		});
		this.data.splice(rowIndex, 1, ...newRows);

		return newRows[0].data;
	}
	_calcDataRowHeight(dataRow) {
		let count = 0;
		_.forEach(dataRow, value => {
			if (_.isArray(value)) {
				count = Math.max(value.length, count);
			} else if (_.isObject(value) && !_.isDate(value) && _.isArray(value.value)) {
				count = Math.max(value.value.length, count);
			}
		});
		return count;
	}
	_addRowspan(value, rowspan) {
		if (_.isObject(value) && !_.isDate(value)) {
			value = _.clone(value);
			value.rowspan = rowspan;
			value.style = this.styles._merge({vertical: 'top'}, value.style);
			return value;
		}
		return {
			value,
			rowspan,
			style: {vertical: 'top'}
		};
	}
	_readCellValue(value) {
		let cellValue;
		let cellType = null;
		let cellStyle = null;
		let isObject = false;

		if (_.isDate(value)) {
			cellValue = value;
			cellType = 'date';
		} else if (value && typeof value === 'object') {
			isObject = true;

			if (value.style) {
				cellStyle = value.style;
			}

			if (value.formula) {
				cellValue = value.formula;
				cellType = 'formula';
			} else if (value.date) {
				cellValue = value.date;
				cellType = 'date';
			} else if (value.time) {
				cellValue = value.time;
				cellType = 'time';
			} else if (_.isDate(value.value)) {
				cellValue = value.value;
				cellType = 'date';
			} else {
				cellValue = value.value;
				cellType = value.type;
			}
		} else {
			cellValue = value;
		}

		return {
			cellValue,
			cellType,
			cellStyle,
			isObject
		};
	}
	_mergeCells(dataRow, colIndex, rowIndex, value) {
		if (value.colspan || value.rowspan) {
			const colSpan = (value.colspan || 1) - 1;
			const rowSpan = (value.rowspan || 1) - 1;

			if (colSpan || rowSpan) {
				this.mergeCells(
					{c: colIndex + 1, r: rowIndex + 1},
					{c: colIndex + 1 + colSpan, r: rowIndex + 1 + rowSpan}
				);
				return this._insertMergeCells(dataRow, colIndex, rowIndex, colSpan, rowSpan, value.style);
			}
		}
		return dataRow;
	}
	_getCellType(cellType, cellValue, row, column) {
		if (cellType) {
			return cellType;
		} else if (row && row.type) {
			return row.type;
		} else if (column && column.type) {
			return column.type;
		} else if (typeof cellValue === 'number') {
			return 'number';
		} else if (typeof cellValue === 'string') {
			return 'string';
		}
	}
	_getPreparedCell(styleId, cellType, cellValue) {
		const result = {
			styleId,
			value: null,
			formula: null,
			isString: false
		};

		if (cellType === 'string') {
			result.value = this.common.strings.add(cellValue);
			result.isString = true;
		} else if (cellType === 'date' || cellType === 'time') {
			const dateValue = _.isDate(cellValue) ? cellValue.valueOf() : cellValue;
			const date = 25569.0 + (dateValue - this.timezoneOffset) / (60 * 60 * 24 * 1000);

			if (_.isFinite(date)) {
				result.value = date;
			} else {
				result.value = this.common.strings.add(String(cellValue));
				result.isString = true;
			}
		} else if (cellType === 'formula') {
			result.formula = _.escape(cellValue);
		} else {
			result.value = cellValue;
		}

		return result;
	}
	_setRowStyleId(row) {
		if (row.style) {
			const rowStyle = this.styles._addFillOutFormat(row.style);
			row.styleId = this.styles._getId(rowStyle);
		}
	}
}

module.exports = PrepareSave;
