sap.ui.define([
    "sap/ushell/services/Container"
  ], function () {
    "use strict";
  
    sap.ushell.Container = {
      createRenderer: function () {
        return {
          placeAt: function (sId) {
            sap.ui.require(["sap/m/App", "sap/ui/core/ComponentContainer"], function (App, ComponentContainer) {
              new App({
                pages: [
                  new ComponentContainer({
                    name: "com.seeql",
                    async: true,
                    height: "100%"
                  })
                ]
              }).placeAt(sId);
            });
          }
        };
      }
    };
  });
  