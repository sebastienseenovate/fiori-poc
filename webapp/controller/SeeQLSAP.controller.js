sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "com/seeql/service/api/api"
], function (Controller, JSONModel, MessageToast, ApiService) {
  "use strict";

  return Controller.extend("com.seeql.controller.seeqlSAP", {
    onInit: function () {
      const oModel = new JSONModel({
        results: [],
        selectedColumns: [],
        availableColumns: [
          { key: "grlivarea", text: "GrLivArea" },
          { key: "totalbsmtsf", text: "TotalBsmtSF" },
          { key: "saletype", text: "SaleType" }
        ],
        universList: [],
        selectedUnivers: "",
        dictionaryData: [] // 👈 ici
      });
      this.getView().setModel(oModel);

      // Masquer le panneau avancé au démarrage
      this.byId("rightColumn").setVisible(false);
      this.byId("rightColumn").setWidth("0%");
      this.byId("leftColumn").setWidth("100%");

      // 🔄 Appel à l'API pour récupérer les univers
      ApiService.getUnivers("seenovate")
        .then((data) => {
          const universArray = data.list_univers.map((item) => ({
            key: item,
            text: item
          }));

          // On ajoute l'entrée par défaut manuellement
          universArray.unshift({
            key: "",
            text: data.default_value || "Choisir votre Univers"
          });

          oModel.setProperty("/universList", universArray);
          oModel.setProperty("/selectedUnivers", ""); // correspond au key du "placeholder"
        }).catch((err) => {
          MessageToast.show("Erreur lors du chargement des univers.");
          console.error(err);
        });
    },

    onSubmit: async function () {
      const oView = this.getView();
      const oModel = oView.getModel();
      const sQuestion = this.byId("questionInput").getValue();
      const sUnivers = oModel.getProperty("/selectedUnivers");
    
      if (!sQuestion || !sUnivers) {
        MessageToast.show("Veuillez poser une question et choisir un univers.");
        return;
      }
    
      try {
        const responseMain = await ApiService.generateSQL({
          question: sQuestion,
          univers: sUnivers,
          question_translated: false,
          columns: []
        });
    
        const sSQL = responseMain.request_generated;
        const aRows = responseMain.dataframe || [];
    
        this.byId("sqlOutput").setText(sSQL);
        this.byId("responseSection").setVisible(true);
    
        // Sauvegarde les lignes complètes
        oModel.setProperty("/fullResults", aRows);
        oModel.setProperty("/resultsPage", 1);
    
        const aColNames = aRows.length > 0 ? Object.keys(aRows[0]) : [];
        const oTable = this.byId("resultTable");
    
        oTable.removeAllColumns();
        aColNames.forEach((col) => {
          oTable.addColumn(new sap.m.Column({
            header: new sap.m.Text({ text: col })
          }));
        });
    
        // Charge les 10 premières lignes
        const aFirstRows = aRows.slice(0, 10).map(row => {
          const aCells = aColNames.map(key => new sap.m.Text({ text: row[key] }));
          return new sap.m.ColumnListItem({ cells: aCells });
        });
    
        oTable.removeAllItems();
        aFirstRows.forEach(item => oTable.addItem(item));
    
        this.byId("resultSection").setVisible(true);
    
      } catch (err) {
        MessageToast.show("Erreur lors de la génération de la requête.");
        console.error("Erreur API /main_dev :", err);
      }
    },

    onLoadMoreResults: function () {
      const oModel = this.getView().getModel();
      const aFull = oModel.getProperty("/fullResults") || [];
      const iPage = oModel.getProperty("/resultsPage") || 1;
    
      const iNext = iPage + 1;
      const aColNames = aFull.length > 0 ? Object.keys(aFull[0]) : [];
      const oTable = this.byId("resultTable");
    
      const aNextSlice = aFull.slice(iPage * 10, iNext * 10);
    
      const aItems = aNextSlice.map(row => {
        const aCells = aColNames.map(key => new sap.m.Text({ text: row[key] }));
        return new sap.m.ColumnListItem({ cells: aCells });
      });
    
      aItems.forEach(item => oTable.addItem(item));
      oModel.setProperty("/resultsPage", iNext);
    },
    
    onModeChange: function (oEvent) {
      const bAdvanced = oEvent.getParameter("state");
      const oLeft = this.byId("leftColumn");
      const oRight = this.byId("rightColumn");

      if (bAdvanced) {
        oLeft.setWidth("60%");
        oRight.setVisible(true);
        oRight.setWidth("40%");
      } else {
        oRight.setVisible(false);
        oRight.setWidth("0%");
        oLeft.setWidth("100%");
      }
    },

    onExecute: function () {
      const aCols = this.getView().getModel().getProperty("/selectedColumns");

      if (!aCols.length) {
        MessageToast.show("Veuillez sélectionner au moins une colonne.");
        return;
      }

      const sSQL = `SELECT\n  ${aCols.join(", ")}\nFROM\n  immo`;
      this.byId("sqlOutput").setText(sSQL);
      this.byId("responseSection").setVisible(true);

      const aResults = [
        { value: "854" },
        { value: "0" },
        { value: "866" },
        { value: "961" },
        { value: "1053" }
      ];

      this.getView().getModel().setProperty("/results", aResults);
      this.byId("resultSection").setVisible(true);
    },
    onOpenDictionary: function () {
      if (!this._oDialog) {
        this._oDialog = sap.ui.xmlfragment("com.seeql.view.fragment.DictionnaireDialog", this);
        this.getView().addDependent(this._oDialog);
      }

      const sUnivers = this.getView().getModel().getProperty("/selectedUnivers");
      if (sUnivers) {
        this.loadDictionaryForUnivers(sUnivers);
      }

      this._oDialog.open();
    },

    onCloseDictionary: function () {
      this._oDialog.close();
    },

    onUniversChange: function (oEvent) {
      const sUnivers = oEvent.getParameter("selectedItem").getKey();
      this.getView().getModel().setProperty("/selectedUnivers", sUnivers);
      this.loadDictionaryForUnivers(sUnivers);
    },

    loadDictionaryForUnivers: function (univers) {
      ApiService.getDictionnaire(univers)
        .then((data) => {
          const flattened = [];

          data.forEach((tableObj) => {
            const { table } = tableObj;

            const addEntries = (entries, sourceType) => {
              entries.forEach((entry) => {
                let aValues = entry.values;

                if (typeof aValues === "string") {
                  try {
                    aValues = JSON.parse(aValues);
                  } catch (e) {
                    aValues = aValues.split(',');
                  }
                }

                let sValuesString = (aValues || []).join(", ");

                flattened.push({
                  table: table,
                  name: entry.name || "",
                  explicit_column: entry.explicit_column || "",
                  description: entry.description || "",
                  values: sValuesString,
                  values_description: "",
                  source: "",
                  type: Array.isArray(aValues) && aValues.includes("Modifiable") ? 0.8 : 1,
                });
              });
            };

            addEntries(tableObj.columns || [], "Colonne");
            addEntries(tableObj.indicators || [], "Indicateur");
            addEntries(tableObj.filters || [], "Filtre");
          });

          // ✅ Ici : mise à jour du modèle dans le bon scope
          this.getView().getModel().setProperty("/dictionaryData", flattened);
          this.getView().getModel().setProperty("/dictionaryFilteredData", flattened);
        })
        .catch((err) => {
          MessageToast.show("Erreur lors du chargement du dictionnaire.");
          console.error(err);
        });
    },
    onSearchDictionary: function (oEvent) {
      const sQuery = oEvent.getParameter("newValue") || oEvent.getParameter("query") || oEvent.getSource().getValue();
      const oModel = this.getView().getModel();
      const aAllData = oModel.getProperty("/dictionaryData") || [];

      // Filtrage simple sur les propriétés table, name, explicit_column ou description
      const aFiltered = aAllData.filter((item) => {
        const sLower = sQuery.toLowerCase();
        return (
          item.table?.toLowerCase().includes(sLower) ||
          item.name?.toLowerCase().includes(sLower) ||
          item.explicit_column?.toLowerCase().includes(sLower) ||
          item.description?.toLowerCase().includes(sLower)
        );
      });

      // Mise à jour d'un nouveau tableau filtré
      oModel.setProperty("/dictionaryFilteredData", sQuery ? aFiltered : aAllData);
    }
  });
});

// Compare this snippet from webapp/view/SeeQLSAP.view.xml:
