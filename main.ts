import {
	App,
	Editor,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { clipboard } from "electron";

// Remember to rename these classes and interfaces!

interface ExternalFileFormatNormalizerSettings {
	copyToClipboard: boolean;
}

const DEFAULT_SETTINGS: ExternalFileFormatNormalizerSettings = {
	copyToClipboard: true,
};

export default class ExternalFileFormatNormalizerPlugin extends Plugin {
	settings: ExternalFileFormatNormalizerSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "apply-normalizer",
			name: "Apply Normalizer",
			editorCallback: async (editor: Editor) => {
				const currentFileText = editor.getValue();

				const normalizedText = this.normalizer(currentFileText);

				if (this.settings.copyToClipboard) {
					clipboard.writeText(normalizedText);
					new Notice("Normalized Text Copied");
				} else {
					editor.setValue(normalizedText);
					new Notice("Normalized Applied");
				}
			},
		});

		this.addCommand({
			id: "apply-normalizer-on-selection",
			name: "Apply Normalizer On Selection",
			editorCallback: async (editor: Editor) => {
				const selectionText = editor.getSelection();

				// handle images
				const normalizedText = this.normalizer(selectionText);

				if (this.settings.copyToClipboard) {
					clipboard.writeText(normalizedText);
					new Notice("Normalized Text Copied");
				} else {
					editor.replaceSelection(normalizedText);
					new Notice("Normalized Applied");
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(
			new ExternalFileFormatNormalizerSettingTab(this.app, this)
		);
	}

	onunload() {}

	normalizer(text: string) {
		// handle images
		let normalizedText = text.replace(
			/!\[\[(?:(?:[^#\n\]]+)#)?([^\]\n|]+)(?<=gif|jpe?g|tiff?|png|webp|bmp)(?:\|(?:[^\]\n]+))?\]\]/gim,
			"\n\t![$1]($1)"
		);
		// handle non-images
		normalizedText = normalizedText.replace(
			/!\[\[(?:(?:[^#\n\]]+)#)?([^\]\n|]+)(?<!gif|jpe?g|tiff?|png|webp|bmp)(?:\|(?:[^\]\n]+))?\]\]/gim,
			"\n\t[$1]($1)"
		);
		return normalizedText;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ExternalFileFormatNormalizerSettingTab extends PluginSettingTab {
	plugin: ExternalFileFormatNormalizerPlugin;

	constructor(app: App, plugin: ExternalFileFormatNormalizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "External File Format Normalizer Settings",
		});

		new Setting(containerEl)
			.setName("Copy to clipboard")
			.setDesc(
				"Copy the normalized text to the clipboard instead of applying changes in place(in editor)"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.copyToClipboard)
					.onChange(async (value) => {
						this.plugin.settings.copyToClipboard = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
