sap.ui.define([
    "sap/ushell/services/Container"
  ], function () {
    "use strict";
  
    window["sap-ushell-config"] = {
      defaultRenderer: "fiori2",
      applications: {
        "app-tile": {
          title: "Fiori POC",
          description: "Application de test SeeQL",
          additionalInformation: "SAPUI5.Component=com.seeql",
          applicationType: "URL",
          url: "../", // Chemin vers la racine de l'app
          navigationMode: "embedded"
        }
      }
    };
  });
  