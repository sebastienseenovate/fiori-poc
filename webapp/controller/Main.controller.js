sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function(Controller) {
  "use strict";

  return Controller.extend("com.seeql.controller.Main", {
    onPressIframe: function () {
      this.getOwnerComponent().getRouter().navTo("iframe");
      sap.m.MessageToast.show("Bouton cliqué !");
    },

    onPressseeqlSAP: function () {
      this.getOwnerComponent().getRouter().navTo("seeqlSAP");
      sap.m.MessageToast.show("Bouton cliqué !");
    }
  });
});
