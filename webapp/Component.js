sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";

  return UIComponent.extend("com.seeql.Component", {
    metadata: {
      manifest: "json",
      includes: ["css/style.css"]
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      jQuery.sap.includeStyleSheet("css/style.css");
      this.getRouter().initialize();

      // Forcer le plein écran après que tout soit rendu
      this._removeLimitedWidthShell();
    },

    _removeLimitedWidthShell: function () {
      // Attendre que l'UI soit rendue
      setTimeout(function () {
        const $container = document.querySelector(".sapUShellApplicationContainer");
        if ($container && $container.classList.contains("sapUShellApplicationContainerLimitedWidth")) {
          $container.classList.remove("sapUShellApplicationContainerLimitedWidth");
          console.log("[seeql] Shell width limitation removed.");
        }
      }, 0); // Suffisant pour attendre l'injection DOM
    }
  });
});
