import app from './app';
import '@babel/polyfill';
import { MandatoryData } from './database/MandatoryData';
import TelegramService from './services/TelegramService';
import CheckService from './services/CheckService';
import { Checks, CheckAuthorization } from './models';
import { decrypt } from './utils/crypto';

async function main() {
  await app.listen(process.env.PORT);

  await MandatoryData();

  TelegramService.listenMessages();

  // Run again all enabled checks
  const checks = await Checks.findAll({ where: { enabled: true } });


  for (const check of checks) {
    const checkAuthorization = await CheckAuthorization.findOne({ where: { checkId: check.id } });
    const parseCheck = JSON.parse(JSON.stringify(check));

    if (checkAuthorization) {
      parseCheck.authorizationHeader = {
        name: checkAuthorization.headerName,
        token: decrypt(checkAuthorization.encryptedToken)
      };
    }

    CheckService.runCheck(parseCheck);
  }

  console.log(`Server running: http://localhost:${process.env.PORT} ✅`);
}

main();