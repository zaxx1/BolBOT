const {
  delay,
  profileSumary,
  profile,
  loadConfig,
  setCurrentProfile,
  setCurrentProject,
  errors,
} = require('./base');
const colors = require('colors');
const { processAccount: processBool } = require('./modules/bool');
const CONSTANT = require('./constant');
let runTheFirst = true;

async function startSession() {
  for await (const project of profile.keys()) {
    console.log('');
    const isRunningAllow = CONSTANT.PROJECT_REPEAT.includes(project);
    if (!runTheFirst && !isRunningAllow) {
      errors(
        `Telah mengatur project ${colors.cyan(
          project,
        )} telah disetel untuk berhenti setelah dijalankan pertama kali !`,
      );
      return;
    }

    await setCurrentProject(project);
    if (project === 'bool') {
      console.log(
        colors.red(
          `[ WARNING ]: Harus query_id yang dimulai dengan query_id atau menyalin payload dari API "strict" agar aplikasi bisa berjalan !`,
        ),
      );
      console.log();
      await delay(2);
    }
    const listAccount = profile.get(project);

    if (!listAccount.length) return;

    for await (const account of listAccount) {
      await setCurrentProfile(account);
      switch (project) {
        case 'bool':
          await processBool(project, account);
          break;
         default:
          break;
      }
      console.log('');
      console.log(
        '-------------------------------[ ©©© ]-------------------------------',
      );
      console.log('');
      await delay(2);
    }
  }
  runTheFirst = false;
  await delay(CONSTANT.TIME_REPEAT_AGAIN, true);
  console.log('');
  await startSession();
}

(async function main() {
  console.log();
  await loadConfig('data.json');
  profileSumary();
  await startSession();
})();
