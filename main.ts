/*
Copyright (c) 2022, Mrteathyme
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
*/


import {Plugin, TFile, Notice, TAbstractFile, normalizePath} from 'obsidian'

export default class DailyActivityTrackerPlugin extends Plugin {
    async onload() {
        this.app.workspace.onLayoutReady(() => {
            this.registerEvent(this.app.vault.on('create',this.create_event_handler));
            this.registerEvent(this.app.workspace.on('file-open',this.updateDailyNote));
        });
    }

	onunload() {

	}


    private create_event_handler = async (created: TAbstractFile) => {
        if (created instanceof TFile) {

            let today = new Date();
            let dateformatted = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
            let folderPath = normalizePath(`${dateformatted}`);
            if (created.extension !== 'md') {
                folderPath = normalizePath(folderPath + '/Attachments');
            }

            //ToDo: Find a better way than just sleeping, e.g retrieve a promise from the workspace file open event and await it maybe?
            await sleep(50);

            if (this.app.vault.getAbstractFileByPath(folderPath) == null) {
                await this.app.vault.createFolder(folderPath);
                new Notice(`created new daily folder: ${folderPath}`);
            }
            if (app.vault.getAbstractFileByPath(normalizePath(folderPath + '/' + created.basename + '.' + created.extension)) !== null) {
                new Notice(`Failed to move ${created.basename + created.extension} to ${folderPath} a note with that name already exists`);
                return;
            }
            if (folderPath + '/' + created.basename  + '.' + created.extension === created.path) {
                return;
            }
            await this.app.vault.rename(created, folderPath + '/' + created.basename  + '.' + created.extension)
            //this.updateDailyNote(created);
            new Notice(`Moved "${created.basename  + '.' + created.extension}" to ${folderPath}`);
        }
    }

    private updateDailyNote = async (file: TFile | null) => {
        if (file !== null) {
            let today = new Date();
            let dateformatted = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
            let dailyNoteName = `${dateformatted}.md`;
            let folderPath = `${dateformatted}`;
            let dailyNote = this.app.vault.getAbstractFileByPath(normalizePath(folderPath + '/' + dailyNoteName));
            if (dailyNote == null) {
                //ToDo: Add Template Settings and Tag settings, just gonna hardcode with the tags i use for now
                dailyNote = await this.app.vault.create(dailyNoteName, "---\nTags: [daily, organisation]\n---\n\n");
                new Notice(`created daily note: ${dailyNoteName}`);   
            }
            if (dailyNote instanceof TFile) {
                //ToDo: Section Formatting instead of just appending
                let text = await this.app.vault.read(dailyNote);
                if (!text.contains(`[[${file.basename}]]`) && `${file.basename}.${file.extension}` !== dailyNoteName) {
                    await this.app.vault.modify(dailyNote,text + `[[${file.basename}]]\n`)
                }
            }
        }
    }
}


/* Todo: Add Command to process existing files and create daily folders for each and move them there
Can use the ctime property of the FileStats Type that is returned from TFile.stat, api docs say its a number so im going to assume its in unixtime

So something like if (this.app.vault.getAbstractFileByPath(someFunctionThatConvertsUnixToLocalTimeZone(file.stat.ctime)) == null) createFolder then do move etc etc*/

/* Todo: Add Settings Functionality to configure further dynamic folder rules (like moving files to folders based on YAML Frontmatter. or disabling daily functionality etc)*/
