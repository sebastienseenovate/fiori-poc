sap.ui.define([], function () {
  "use strict";

  const BASE_URL = "/api"; // <-- le proxy redirige vers https://backend.seesql.seenovate.com/api

  const _handleResponse = async (response) => {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.detail || "Erreur réseau");
    }
    return response.json();
  };

  return {
    /**
     * Récupère la liste des univers disponibles
     * @param {string} company
     * @returns {Promise<{ default_value: string, list_univers: string[] }> }
     */
    getUnivers: async function (company = "seenovate") {
      const response = await fetch(`${BASE_URL}/get_univers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ company })
      });
      return _handleResponse(response);
    },

    /**
     * Récupère le dictionnaire de données pour un univers donné
     * @param {string} univers
     * @returns {Promise<Array>} tableau d’objets dictionnaire
     */
    getDictionnaire: async function (univers) {
      const response = await fetch("/api/get_dico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ univers })
      });
      const data = await response.json();
      return data.dico_donnee || [];
    },

    /**
     * Envoie une question à l'API principale pour générer une requête SQL
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    generateSQL: async function (payload) {
      const response = await fetch(`${BASE_URL}/main_dev`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      return _handleResponse(response);
    },

    /**
     * Extrait les colonnes d'une requête SQL
     * @param {"select"|"query"} type
     * @param {string} sql
     * @param {string} table
     * @returns {Promise<Object>}
     */
    extractColumns: async function (type, sql, table) {
      const endpoint =
        type === "select"
          ? "/extract_select_columns"
          : "/extract_columns_from_query";

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sql_request: sql,
          table: table
        })
      });
      return _handleResponse(response);
    }


    // D'autres endpoints peuvent être ajoutés ici
  };
});
