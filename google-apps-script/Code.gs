const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const ACCESS_TOKEN = 'REPLACE_WITH_A_LONG_RANDOM_TOKEN';
const TASKS_SHEET_NAME = 'Tasks';

function doGet(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  const callback = parameters.callback || '';

  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput('Invalid callback')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    requireToken_(parameters.token);
    if (parameters.action !== 'read') {
      throw new Error('Unsupported action');
    }

    const tasks = readTasks_();
    return jsonp_(callback, { tasks: tasks });
  } catch (error) {
    return jsonp_(callback, { error: error.message });
  }
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents);
    requireToken_(payload.token);
    if (!Array.isArray(payload.tasks)) {
      throw new Error('Invalid task list');
    }

    const tasks = payload.tasks.map(function(task) {
      if (!task || typeof task.id !== 'string' ||
          typeof task.title !== 'string' || !task.title.trim()) {
        throw new Error('Invalid task');
      }

      return {
        id: task.id,
        title: task.title.trim(),
        completed: Boolean(task.completed)
      };
    });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getTasksSheet_();
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
      }
      if (tasks.length > 0) {
        sheet.getRange(2, 1, tasks.length, 3).setValues(tasks.map(function(task) {
          return [task.id, task.title, task.completed];
        }));
      }
    } finally {
      lock.releaseLock();
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function setupTasksSheet() {
  const sheet = getTasksSheet_();
  sheet.getRange(1, 1, 1, 3).setValues([['id', 'title', 'completed']]);
  sheet.setFrozenRows(1);
}

function readTasks_() {
  const sheet = getTasksSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, 3).getValues()
    .filter(function(row) {
      return row[0] !== '' && row[1] !== '';
    })
    .map(function(row) {
      return {
        id: String(row[0]),
        title: String(row[1]),
        completed: row[2] === true || String(row[2]).toLowerCase() === 'true'
      };
    });
}

function getTasksSheet_() {
  if (SPREADSHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') {
    throw new Error('Set SPREADSHEET_ID in Code.gs before deploying.');
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(TASKS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(TASKS_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([['id', 'title', 'completed']]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function requireToken_(providedToken) {
  if (!ACCESS_TOKEN ||
      ACCESS_TOKEN === 'REPLACE_WITH_A_LONG_RANDOM_TOKEN' ||
      providedToken !== ACCESS_TOKEN) {
    throw new Error('Unauthorized');
  }
}

function jsonp_(callback, payload) {
  const output = callback + '(' + JSON.stringify(payload) + ');';
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
