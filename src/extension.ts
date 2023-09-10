import * as vscode from 'vscode';
import * as deepl from 'deepl-node';
import { Option, removeLineBreak } from './TextFormatter';

const ID = 'DeepLR';
const NAME = "DeepLR";

// ----------------------------------------------------
//  DeepL
// ----------------------------------------------------


const languageMapping: { [key: string]: string } = {
	'bg': 'Bulgarian',
	'cs': 'Czech',
	'da': 'Danish',
	'de': 'German',
	'el': 'Greek',
	'es': 'Spanish',
	'et': 'Estonian',
	'fi': 'Finnish',
	'fr': 'French',
	'hu': 'Hungarian',
	'id': 'Indonesian',
	'it': 'Italian',
	'ja': 'Japanese',
	'ko': 'Korean',
	'lt': 'Lithuanian',
	'lv': 'Latvian',
	'nb': 'Norwegian Bokmål',
	'nl': 'Dutch',
	'pl': 'Polish',
	'ro': 'Romanian',
	'ru': 'Russian',
	'sk': 'Slovak',
	'sl': 'Slovenian',
	'sv': 'Swedish',
	'tr': 'Turkish',
	'uk': 'Ukrainian',
	'zh': 'Chinese',
	'en-GB': 'English (UK)',
	'en-US': 'English (US)',
	'pt-BR': 'Portuguese (Brazil)',
	'pt-PT': 'Portuguese (Portugal)'
};
async function selectLanguage(): Promise<string | undefined> {
	const languageNames = Object.values(languageMapping);
	const selectedLanguageName = await vscode.window.showQuickPick(languageNames, {
		placeHolder: 'Target language',
	});
	return Object.keys(languageMapping).find(key => languageMapping[key] === selectedLanguageName);
}


function getTranslator() {
	const config = vscode.workspace.getConfiguration(ID);
	const key = config.get("apiKey", "");

	if (key.length === 0) {
		vscode.window.showErrorMessage(`${NAME}: DeepL API authorized key is not configured.`);
		return undefined;
	}
	return new deepl.Translator(key);
}

let lastLang: string | null = null;

async function translate(text: string, srcLang: any, targetLang: any) {
	const t = getTranslator();
	lastLang = targetLang;
	if (!t) { return; }
	try {
		return (await t.translateText(text, srcLang, targetLang)).text;
	} catch (error) {
		if (error instanceof Error) {
			const e = error as Error;
			vscode.window.showErrorMessage(NAME + ": " + e.message);
		} else {
			vscode.window.showErrorMessage(NAME + ": " + error);
		}
	}
}

async function translate1(text: string) {
	const config = vscode.workspace.getConfiguration(ID);
	const lang = config.get("language1", "");
	if (lang.length === 0) {
		vscode.window.showErrorMessage(`${NAME}: Language1 is not configured.`);
		return;
	}
	return await translate(text, null, lang);
}

async function translate2(text: string) {
	const config = vscode.workspace.getConfiguration(ID);
	const lang = config.get("language2", "");
	if (lang.length === 0) {
		vscode.window.showErrorMessage(`${NAME}: Language2 is not configured.`);
		return;
	}
	return await translate(text, null, lang);
}

async function translate3(text: string) {
	const config = vscode.workspace.getConfiguration(ID);
	const lang = await selectLanguage();
	if (!lang) { return; }
	return await translate(text, null, lang);
}

function translate4(text: string) {
	if (lastLang) { return translate(text, null, lastLang); }
	else { return translate3(text); }
}
// -------------------------------------------------------------------

function getEditorLineBreak(editor: vscode.TextEditor): '\r\n' | '\r' | '\n' {
	const eol = editor.document.eol;
	return eol === vscode.EndOfLine.LF ? '\n' :
		eol === vscode.EndOfLine.CRLF ? '\r\n' : '\r';
}

function getTFOption(editor: vscode.TextEditor) {
	const config = vscode.workspace.getConfiguration(ID);
	return new Option(
		config.get('treatBlankLinesAsBreaks', true),
		config.get('retainHyphenation', false),
		config.get('preserveBreaksAfterDots', true),
		config.get('listStartingCharacters', "•-"),
		getEditorLineBreak(editor)
	);
}

function removeLineBreakCmd() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { return; }
	const selection = editor.selection;
	if (selection.isEmpty) {
		vscode.window.showWarningMessage(`${NAME}: No Selection`);
		return;
	}
	const text = editor.document.getText(selection);
	const newText = removeLineBreak(text, getTFOption(editor));
	editor.edit(builder => {
		builder.replace(selection, newText);
	});
}


function concat(origin: string, translated: string, lb: string) {
	const config = vscode.workspace.getConfiguration(ID);
	let str = "";
	if (config.get("preserveOriginalText", true)) {
		str = origin + lb.repeat(3);
	}

	return str + translated;
}

function translateCmd(num: number) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { return; }
	const selection = editor.selection;
	if (selection.isEmpty) {
		vscode.window.showWarningMessage(`${NAME}: No Selection`);
		return;
  }
	const text = editor.document.getText(selection);
	const lb = getEditorLineBreak(editor);
	vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: `${NAME}: translate` }, async progress => {
		progress.report({ message: "Translate." });
		const t = text;
		const t2 = await (
			num === 1 ? translate1(t) :
				num === 2 ? translate2(t) :
					num === 3 ? translate3(t) : translate4(t));
		if (!t2) { return; }
		const newText = concat(t, t2, lb);
		await editor.edit(builder => {
			builder.replace(selection, newText);
		});
	});
}


function translateCondensedCmd(num: number) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { return; }
	const selection = editor.selection;
	if (selection.isEmpty) {
		vscode.window.showWarningMessage(`${NAME}: No Selection`);
		return;
  }
	const text = editor.document.getText(selection);
	const option = getTFOption(editor);
	const text2 = removeLineBreak(text, option);
	vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: `${NAME}: translate` }, async progress => {
		progress.report({ message: "Translate." });
		const t = text2;
		const t2 = await (
			num === 1 ? translate1(t) :
				num === 2 ? translate2(t) :
					num === 3 ? translate3(t) : translate4(t));
		if (!t2) { return; }
		const newText = concat(t, t2, option.linebreak);
		await editor.edit(builder => {
			builder.replace(selection, newText);
		});
	});
}


function register(context: vscode.ExtensionContext, name: string, callback: (...args: any[]) => any, thisArgs?: any) {
	const disposable = vscode.commands.registerCommand(ID + "." + name, callback, thisArgs);
	context.subscriptions.push(disposable);
}

export function activate(context: vscode.ExtensionContext) {
	register(context, "removeLineBreak", removeLineBreakCmd);

	register(context, "translate1", () => translateCmd(1));
	register(context, "translate2", () => translateCmd(2));
	register(context, "translate3", () => translateCmd(3));
	register(context, "translate4", () => translateCmd(4));

	register(context, "translate1C", () => translateCondensedCmd(1));
	register(context, "translate2C", () => translateCondensedCmd(2));
	register(context, "translate3C", () => translateCondensedCmd(3));
	register(context, "translate4C", () => translateCondensedCmd(4));
}

export function deactivate() { }
