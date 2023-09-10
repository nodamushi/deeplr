export class Option {
	constructor(
		public blankline: boolean,           // 空行を改行と見なす。
		public keepHyphen: boolean,          // アルファベット直後のハイフンを削除せずに維持
		public keepDotNewline: boolean,      // 「.」で終わる行の改行を維持
		public keepListNewline: string,      // 最初の文字が '•' である場合、改行を維持
		public linebreak: "\r\n" | "\r" | "\n"   // 改行文字
	) { }
}

export function removeLineBreak(text: string, option: Option): string {
	return joinLines(toLines(text), option);
}

// export for test
export class Line {
	private _src: string;
	private _from: number;
	private _end: number;

	constructor(src: string, from: number, end: number) {
		this._src = src;
		this._from = from; this._end = end;
	}

	get src(): string { return this._src; }
	get from(): number { return this._from; }
	get end(): number { return this._end; }
	get length(): number { return this.end - this.from; }
	get empty(): boolean { return this.length === 0; }
	get text(): string { return this._src.substring(this.from, this.end); }

	substring(from: number, end: number): string {
		return this._src.substring(this.from + from, this.from + end);
	}

	at(index: number): string {
		return (index < 0 || index >= this.length) ? "" : this.src.charAt(this.from + index);
	}

	get last(): string {
		return this.at(this.length - 1);
	}

	get first(): string {
		return this.at(0);
	}

}


// export for test
export function toLines(text: string): Line[] {
	if (text.length === 0) { return []; }

	const reg = /\n|\r\n?/g;
	const len = text.length;

	let lines: Line[] = [];
	let from = 0;
	while (true) {
		const m = reg.exec(text);
		let [end, _from] = m ? [m.index, m.index + m[0].length] : [len, len];
		lines.push(new Line(text, from, end));
		if (end === len) {
			return lines;
		}
		reg.lastIndex = from = _from;
	}
}


function joinLines(lines: Line[], option: Option): string {
	if (lines.length === 0) { return ""; }
	if (lines.length === 1) { return lines[0].text; }

	let str: string = "";

	let index = 0;
	let linebreakEnable = false;
	while (index < lines.length) {
		const l = lines[index++];

		if (l.empty) {
			if (linebreakEnable && option.blankline) {
				str += option.linebreak;
				linebreakEnable = false;
			} else {
				linebreakEnable = true;
			}
			while (index < lines.length && lines[index].empty) {
				index++;
			}
			continue;
		}

		const len = l.length;
		const first = l.first;
		const last = l.last;

		if (linebreakEnable &&
			(option.keepListNewline.length !== 0 && option.keepListNewline.indexOf(first) !== -1)) {
			str += option.linebreak;
		}


		const removeHyphen = !option.keepHyphen && len > 2 && last === "-" && /[a-zA-Z]/.test(l.at(len - 2));
		str += l.substring(0, removeHyphen ? len - 1 : len);

		if (index !== lines.length && option.keepDotNewline && last === ".") {
			str += option.linebreak;
			linebreakEnable = false;
		} else {
			linebreakEnable = true;
		}
	}
	return str;
}