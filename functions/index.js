const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// Tato funkce běží automaticky každý den v 16:00
exports.fioToFirestore = functions.pubsub.schedule("*/10 * * * *")
  .timeZone("Europe/Prague")
  .onRun(async (context) => {
    // Fio API token
    const fioToken = "QkgH1QedMIFsplqkkX8CBopvzsbEb4qhiQYmYMwNWN8vunuFskEOgGJoVFs0AnAy";
    const url = `https://www.fio.cz/ib_api/rest/periods/${fioToken}/last/30/transactions.json`;

    try {
      // 1. Stáhni pohyby z Fio účtu
      const response = await axios.get(url);
      const txs = response.data.accountStatement.transactionList.transaction;
      if (!txs) {
        console.log("Žádné transakce nenalezeny.");
        return null;
      }

      // 2. Připrav pole plateb podle VS
      let platby = {};
      txs.forEach(tx => {
        if (tx.variableSymbol) {
          const vs = tx.variableSymbol;
          if (!platby[vs]) platby[vs] = [];
          platby[vs].push({
            amount: tx.amount,
            date: tx.orderDate,
          });
        }
      });

      // 3. Ulož platby ke správnému uživateli podle VS
      const db = admin.firestore();
      for (const vs in platby) {
        // najdi uživatele podle VS
        const usersSnap = await db.collection("sporeni").where("variabilniSymbol", "==", vs).get();
        usersSnap.forEach(async docu => {
          await db.collection("sporeni").doc(docu.id).update({
            zaplacenePlatby: platby[vs], // uloží např. [{amount, date}]
          });
        });
      }

      console.log("Import z Fio hotov.");
      return null;
    } catch (e) {
      console.error("Chyba při importu z Fio: ", e);
      return null;
    }
  });
