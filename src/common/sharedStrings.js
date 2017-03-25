'use strict';

const Readable = require('stream').Readable;
const _ = require('lodash');
const util = require('../util');

const spaceRE = /^\s|\s$/;

class SharedStrings {
	constructor(common) {
		this.objectId = common.uniqueId('SharedStrings');
		this._strings = Object.create(null);
		this._stringArray = [];
		this.count = 0;
	}
	add(string) {
		let stringId = this._strings[string];

		if (stringId === undefined) {
			stringId = this.count++;

			this._strings[string] = stringId;
			this._stringArray[stringId] = string;
		}

		return stringId;
	}
	isStrings() {
		return this.count > 0;
	}
	save(canStream) {
		this._strings = null;

		if (canStream) {
			return new SharedStringsStream({
				strings: this._stringArray
			});
		}
		const result = getXMLBegin(this.count) +
			this._stringArray.map(string => {
				string = _.escape(string);

				if (spaceRE.test(string)) {
					return `<si><t xml:space="preserve">${string}</t></si>`;
				}
				return `<si><t>${string}</t></si>`;
			}).join('') +
			getXMLEnd();
		this._stringArray = null;
		return result;
	}
}

class SharedStringsStream extends (Readable || null) {
	constructor(options) {
		super(options);
		this.strings = options.strings;
		this.status = 0;
		this.index = 0;
		this.len = this.strings.length;
	}
	_read(size) {
		let stop = false;

		if (this.status === 0) {
			stop = !this.push(getXMLBegin(this.len));

			this.status = 1;
		}

		if (this.status === 1) {
			while (this.index < this.len && !stop) {
				stop = !this.push(this.packChunk(size));
			}

			if (this.index === this.len) {
				this.status = 2;
			}
		}

		if (this.status === 2) {
			this.push(getXMLEnd());
			this.push(null);
		}
	}
	packChunk(size) {
		let s = '';

		while (this.index < this.len && s.length < size) {
			const str = _.escape(this.strings[this.index]);

			if (spaceRE.test(str)) {
				s += `<si><t xml:space="preserve">${str}</t></si>`;
			} else {
				s += `<si><t>${str}</t></si>`;
			}
			this.strings[this.index] = null;
			this.index++;
		}
		return s;
	}
}

function getXMLBegin(length) {
	return `${util.xmlPrefix}<sst xmlns="${util.schemas.spreadsheetml}" count="${length}" uniqueCount="${length}">`;
}

function getXMLEnd() {
	return '</sst>';
}

module.exports = SharedStrings;
