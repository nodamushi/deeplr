import * as assert from 'assert';
import * as vscode from 'vscode';
import * as tf from '../../TextFormatter';

// import * as myExtension from '../../extension';

// suite('Extension Test Suite', () => {
// 	vscode.window.showInformationMessage('Start all tests.');

// 	test('Sample test', () => {
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
// 	});
// });

suite('TextFormatter', () => {
	test('parseLine', () => {
		const text = "\n\rabc\r\nABC\r123\n\n@";
		const lines = tf.toLines(text);
		assert.strictEqual(7, lines.length);
		assert.strictEqual("", lines[0].text);
		assert.strictEqual("", lines[1].text);
		assert.strictEqual("abc", lines[2].text);
		assert.strictEqual("ABC", lines[3].text);
		assert.strictEqual("123", lines[4].text);
		assert.strictEqual("", lines[5].text);
		assert.strictEqual("@", lines[6].text);
	});


	test('removeLineBreak', () => {
		const text = "\naa\nbb-\ncc-\ndd.\nAA.\n\nBB\n\nCC\n-a\n-b\n•c\nee";
		// default
		assert.strictEqual(
			"aa bbccdd.\nAA.\nBB\nCC\n-a\n-b\n•c ee",
			tf.removeLineBreak(text, new tf.Option(
				true,
				false,
				true,
				"•-",
				"\n"
			)));
		// disable emptly line => linebreak
		assert.strictEqual(
			"aa bbccdd.\nAA.\nBB CC\n-a\n-b\n•c ee",
			tf.removeLineBreak(text, new tf.Option(
				false,
				false,
				true,
				"•-",
				"\n"
			)));
		// + disable remove hyphen
		assert.strictEqual(
			"aa bb- cc- dd.\nAA.\nBB CC\n-a\n-b\n•c ee",
			tf.removeLineBreak(text, new tf.Option(
				false,
				true,
				true,
				"•-",
				"\n"
			)));
		// + disable dot
		assert.strictEqual(
			"aa bb- cc- dd. AA. BB CC\n-a\n-b\n•c ee",
			tf.removeLineBreak(text, new tf.Option(
				false,
				true,
				false,
				"•-",
				"\n"
			)));
		// default + disable dot
		assert.strictEqual(
			"aa bbccdd. AA.\nBB\nCC\n-a\n-b\n•c ee",
			tf.removeLineBreak(text, new tf.Option(
				true,
				false,
				false,
				"•-",
				"\n"
			)));
		// + disable start •
		assert.strictEqual(
			"aa bb- cc- dd. AA. BB CC\n-a\n-b •c ee",
			tf.removeLineBreak(text, new tf.Option(
				false,
				true,
				false,
				"-",
				"\n"
			)));

		// + disable start hyphen
		assert.strictEqual(
			"aa bb- cc- dd. AA. BB CC -a -b •c ee",
			tf.removeLineBreak(text, new tf.Option(
				false,
				true,
				false,
				"",
				"\n"
			)));
		});
});
