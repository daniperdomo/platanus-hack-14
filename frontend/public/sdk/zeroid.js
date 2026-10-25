/*! ZeroID SDK v1.0.0 · Inicia sesión sin entregar datos personales. */
(function (global) {
  "use strict";

  var VERSION = "1.0.0";
  var POPUP_WIDTH = 440;
  var POPUP_HEIGHT = 640;
  var CLOSED_GRACE_MS = 800;
  var script = document.currentScript;
  var baseUrl = script ? new URL(script.src).origin : global.location.origin;
  var config = { clientId: "", scopes: ["persona_real_unica"], fields: [] };

  function ZeroIDError(code, message) {
    var error = new Error(message);
    error.name = "ZeroIDError";
    error.code = code;
    return error;
  }

  function init(options) {
    if (!options || !options.clientId) {
      throw ZeroIDError("config", "ZeroID.init necesita tu clientId.");
    }
    config.clientId = options.clientId;
    if (options.scopes) config.scopes = options.scopes.slice();
    if (options.fields) config.fields = options.fields.slice();
    if (options.baseUrl) baseUrl = new URL(options.baseUrl).origin;
    return api;
  }

  function popupFeatures() {
    var left = global.screenX + Math.max(0, (global.outerWidth - POPUP_WIDTH) / 2);
    var top = global.screenY + Math.max(0, (global.outerHeight - POPUP_HEIGHT) / 2);
    return (
      "popup=yes,width=" + POPUP_WIDTH + ",height=" + POPUP_HEIGHT +
      ",left=" + Math.round(left) + ",top=" + Math.round(top)
    );
  }

  function signIn(options) {
    var scopes = (options && options.scopes) || config.scopes;
    var fields = (options && options.fields) || config.fields;
    if (!config.clientId) {
      return Promise.reject(ZeroIDError("config", "Llama a ZeroID.init({ clientId }) antes de signIn()."));
    }

    var url = new URL("/conectar", baseUrl);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("origin", global.location.origin);
    url.searchParams.set("scopes", scopes.join(","));
    if (fields.length) url.searchParams.set("fields", JSON.stringify(fields));

    var popup = global.open(url.toString(), "zeroid-sign-in", popupFeatures());
    if (!popup) {
      return Promise.reject(ZeroIDError("popup_blocked", "El navegador bloqueó la ventana de ZeroID."));
    }

    return new Promise(function (resolve, reject) {
      var settled = false;
      var closedSince = 0;

      function finish(callback, value) {
        if (settled) return;
        settled = true;
        global.removeEventListener("message", onMessage);
        global.clearInterval(watcher);
        callback(value);
      }

      function onMessage(event) {
        if (event.origin !== baseUrl || event.source !== popup) return;
        var data = event.data || {};
        if (data.source !== "zeroid") return;
        if (data.type === "approved") {
          finish(resolve, { requestId: data.requestId, clientId: config.clientId });
        } else if (data.type === "rejected") {
          finish(reject, ZeroIDError("rejected", "El usuario rechazó el inicio de sesión."));
        } else if (data.type === "expired") {
          finish(reject, ZeroIDError("expired", "La solicitud expiró."));
        } else if (data.type === "error") {
          finish(reject, ZeroIDError("server", data.message || "ZeroID no pudo completar el inicio de sesión."));
        }
      }

      var watcher = global.setInterval(function () {
        if (!popup.closed) return;
        closedSince = closedSince || Date.now();
        if (Date.now() - closedSince > CLOSED_GRACE_MS) {
          finish(reject, ZeroIDError("closed", "El usuario cerró la ventana de ZeroID."));
        }
      }, 250);

      global.addEventListener("message", onMessage);
    });
  }

  function renderButton(target, options) {
    var container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) throw ZeroIDError("config", "No encontramos el contenedor del botón.");
    options = options || {};

    var button = document.createElement("button");
    button.type = "button";
    button.textContent = options.label || "Continuar con ZeroID";
    button.setAttribute("data-zeroid-button", "");
    button.style.cssText = [
      "display:inline-flex", "align-items:center", "gap:10px", "height:44px",
      "padding:0 20px", "border-radius:9999px", "border:1px solid #2A2D35",
      "background:" + (options.theme === "light" ? "#FFFFFF" : "#0D0E11"),
      "color:" + (options.theme === "light" ? "#111111" : "#FFFFFF"),
      "font:600 15px system-ui,-apple-system,sans-serif", "cursor:pointer",
    ].join(";");

    var mark = document.createElement("span");
    mark.style.cssText = "width:12px;height:12px;border-radius:3px;background:currentColor";
    button.prepend(mark);

    button.addEventListener("click", function () {
      button.disabled = true;
      signIn({ scopes: options.scopes, fields: options.fields })
        .then(function (result) {
          if (options.onSuccess) options.onSuccess(result);
        })
        .catch(function (error) {
          if (options.onError) options.onError(error);
        })
        .finally(function () {
          button.disabled = false;
        });
    });

    container.appendChild(button);
    return button;
  }

  var api = { version: VERSION, init: init, signIn: signIn, renderButton: renderButton };
  global.ZeroID = api;
})(window);
