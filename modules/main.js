/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

load('lib/WindowManager');
load('lib/prefs');

var bundle = require('lib/locale')
				.get('chrome://open-local-file/locale/open-local-file.properties');

var PREF_BASE     = 'extensions.open-local-file@piro.sakura.ne.jp.';
var PREF_LAST_DIR = PREF_BASE + 'lastDir';

prefs.setDefaultPref(PREF_LAST_DIR, '');

Cu.import('resource://gre/modules/Services.jsm');

const TYPE_BROWSER = 'navigator:browser';

var menuIDs = new WeakMap();

function onCommand() {
	var browserWindow = WindowManager.getWindow(TYPE_BROWSER);
	var picker = Cc['@mozilla.org/filepicker;1']
					.createInstance(Ci.nsIFilePicker);
	picker.init(browserWindow, bundle.getString('picker.title'), picker.modeOpen);
	try {
		var dir = prefs.getPref(PREF_LAST_DIR, Ci.nsIFile);
		if (dir)
			picker.displayDirectory = dir;
	}
	catch(error) {
		// Cu.reportError(error);
	}
	picker.appendFilters(picker.filterAll);
	picker.open({ done: function(aResult) {
		if (aResult != picker.returnOK)
			return;
		var file = picker.file.QueryInterface(Ci.nsIFile);
		if (!file.exists())
			return;
		prefs.setPref(PREF_LAST_DIR, file.parent, Ci.nsIFile);
		var url = Services.io.newFileURI(file);
		browserWindow.BrowserApp.addTab(url.spec);
	}});
}

function handleWindow(aWindow)
{
	var doc = aWindow.document;
	if (doc.documentElement.getAttribute('windowtype') != TYPE_BROWSER)
		return;

	var id = aWindow.NativeWindow.menu.add({
		name     : bundle.getString('menu.label'),
		icon     : '',
		parent   : aWindow.NativeWindow.menu.toolsMenuID,
		callback : onCommand
	});
	menuIDs.set(aWindow, id);
}

WindowManager.getWindows(TYPE_BROWSER).forEach(handleWindow);
WindowManager.addHandler(handleWindow);

function shutdown()
{
	WindowManager.getWindows(TYPE_BROWSER).forEach(function(aWindow) {
		var id = menuIDs.get(aWindow);
		aWindow.NativeWindow.menu.remove(id);
	});
	WindowManager = undefined;
	prefs = undefined;
	config = undefined;
	bundle = undefined;
	menuIDs = undefined;
}
