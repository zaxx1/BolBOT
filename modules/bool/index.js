const { errors, logs, callApi, getCurrentProfile, delay } = require('../../base');
const colors = require('colors');
const readline = require('readline');

async function genBody() {
  const user = await getCurrentProfile();

  if (!user?.userId) {
    return user;
  }

  const data = {
    auth_date: user?.auth_date,
    query_id: user?.query_id_decode,
    user: user?.user
  };

  const dataConvertToString = Object.keys(data)
    .map((key) => {
      let value = data[key];
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      return `${key}=${value}`;
    })
    .join('\n');

  const body = {
    hash: user?.hash,
    data: dataConvertToString
  };

  return body;
}

async function strictAuth(body, isAll = true) {
  const url = 'https://bot-api.bool.network/bool-tg-interface/user/user/strict';
  const res = await callApi({
    url: url,
    method: 'POST',
    isAuth: false,
    body: body
  });

  if (res.message !== 'success') {
    errors('Query telah kedaluwarsa!');
    return;
  }

  const { evmAddress, rank, rewardValue, username } = res?.data;

  if (isAll) {
    logs('Login berhasil 😎');
    logs(`Alamat EVM: ${colors.yellow(evmAddress)} ☠`);
    logs(`Peringkat: ${colors.yellow(rank)}`);
    logs(`Nama Pengguna: ${colors.yellow(username)}`);
  }
  logs(`Saldo ${colors.yellow(rewardValue)} BOOL`);
  return true;
}

async function doQuest(bodyAuth) {
  const url = 'https://bot-api.bool.network/bool-tg-interface/assignment/list';
  const res = await callApi({
    url: url,
    method: 'POST',
    isAuth: false,
    body: bodyAuth
  });

  const { data } = res;
  const idExclude = [48];
  const listQuestUnFinish = data?.filter(
    (e) => !e.done && !idExclude.includes(e?.assignmentId)
  );
  if (listQuestUnFinish.length) {
    logs(
      `Mulai mengerjakan ${colors.cyan(listQuestUnFinish.length)} quest...`
        .white
    );
  } else {
    logs('Semua quest sudah dikerjakan'.white);
    return;
  }

  const { username } = await getCurrentProfile();

  for await (const task of listQuestUnFinish) {
    const { assignmentId, title } = task;
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `[ ${colors.magenta(`${username ? username : 'QUEST'}`)} ]` +
        colors.yellow(` Quest : ${colors.white(title)} `) +
        colors.red('Sedang dikerjakan... ')
    );
    await delay(2);
    const isFinish = await finishQuest(bodyAuth, assignmentId);
    readline.cursorTo(process.stdout, 0);
    if (isFinish) {
      process.stdout.write(
        `[ ${colors.magenta(`${username ? username : 'QUEST'}`)} ]` +
          colors.yellow(` Quest : ${colors.white(title)} `) +
          colors.green('Selesai !                  ')
      );
    } else {
      process.stdout.write(
        `[ ${colors.magenta(`${username ? username : 'QUEST'}`)} ]` +
          colors.yellow(` Quest : ${colors.white(title)} `) +
          colors.red('Gagal !                  ')
      );
    }
    console.log();
  }
  logs('Semua quest telah selesai dikerjakan!');
  return true;
}

async function finishQuest(bodyAuth, id) {
  const url = `https://bot-api.bool.network/bool-tg-interface/assignment/do`;
  const res = await callApi({
    url: url,
    method: 'POST',
    isAuth: false,
    body: {
      ...bodyAuth,
      assignmentId: id
    }
  });
  const { message } = res;
  return message === 'success';
}

async function processAccount(type, account) {
  if (type !== 'bool') {
    return;
  }

  if (!account) {
    errors('', 'Akun tidak valid!');
    return;
  }

  logs(colors.yellow('Memulai BOL!'));
  const bodyAuth = await genBody();
  const isAuth = await strictAuth(bodyAuth);
  if (!isAuth) return;
  const isShowBalance = await doQuest(bodyAuth);
  if (!isShowBalance) return;
  await strictAuth(bodyAuth, false);
  try {
  } catch (e) {
    errors('', e);
  }
}

const exportModules = {
  processAccount
};

module.exports = exportModules;
