'use strict';

module.exports = function (excel) {
	const workbook = excel.createWorkbook();
	workbook.addFontFormat({bold: true, underline: true, color: {theme: 3}}, 'font');
	const headerBorder = workbook.addBorderFormat({color: '#FF0000', style: excel.borderStyle.thin});
	const greenFill = workbook.addPatternFormat({color: '#00FF00'});
	const currency = workbook.addNumberFormat('$ #,##0.00;$ #,##0.00;-', 'currency');
	const header = workbook.addFormat({
		font: 'font',
		border: headerBorder,
		pattern: greenFill,
		format: currency,
		horizontal: 'center'
	});
	const fillFormat = workbook.addFormat({
		font: {
			italic: true,
			color: '#FF0000'
		},
		border: {
			right: {color: 'FF8888FF', style: excel.borderStyle.thin}
		},
		pattern: {type: 'darkHorizontal', color: '#88FF88', backColor: '#8888F0'},
		locked: false,
		hidden: true
	});
	const columns = [
		{
			width: 12,
			style: header
		},
		{
			width: 50,
			style: {
				fillOut: true,
				gradient: {left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, start: '#FFFF00', end: '#5B9BD5'}
			}
		},
		{style: {format: 'currency'}},
		{width: 25}
	];
	const worksheetData = [
		{
			outlineLevel: 0,
			height: 30,
			style: fillFormat,
			data: [
				2541,
				{value: 'Nullam aliquet mi et nunc tempus rutrum.', style: {pattern: {color: '#999999'}}},
				undefined,
				'__proto__',
				1342372604000,
				{date: 1342977404000}
			]
		},
		{
			outlineLevel: 1,
			data: [
				2542,
				'Labore duis cillum dolor adipisicing cillum dolore.',
				205,
				{value: 'Dolore anim', style: {font: {bold: true}}},
				'not date',
				{date: 1342977404000}
			]
		},
		[
			2543,
			'Irure duis sit cupidatat culpa adipisicing nisi.',
			59,
			' String with header space',
			1342372604000,
			{time: 1342977404000}
		],
		[
			2544,
			'Est sunt esse elit reprehenderit exercitation irure.',
			145,
			'String with trailing space ',
			1342372604000,
			{time: 1342977404000}
		]
	];

	workbook.addWorksheet()
		.setData(worksheetData)
		.setData(2, worksheetData)
		.setColumns(columns)
		.setColumn(5, {
			width: 12,
			style: {format: 'date', horizontal: 'right', indent: 1},
			type: 'date'
		})
		.setColumn(6, {
			width: 15
		})
		.setRow(2, {height: 25})
		.setRows(3, [{height: 20}, {height: 15}]);

	return workbook;
};
