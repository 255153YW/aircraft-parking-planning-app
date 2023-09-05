import * as $ from "jquery";

export interface DecoratedRequest {
  route: string;
  handleDone: (r: any) => void;
  handleFail: (e: string) => void;
}
export function get(request: DecoratedRequest): JQueryXHR {
  request.route = "https://localhost:7029/" + request.route;
  let jquerySettings = createJQuerySettings(request);
  jquerySettings.method = "GET";
  jquerySettings.dataType = "json";

  return send(jquerySettings, request);
}

function createJQuerySettings(request: DecoratedRequest): JQueryAjaxSettings {
  let settings: JQueryAjaxSettings = {
    xhrFields: {
      withCredentials: false,
    },
    headers: {},
    crossDomain: false,
    url: request.route,
  };
  settings.crossDomain = true;
  return settings;
}

function send(
  jquerySettings: JQueryAjaxSettings,
  decoratedRequest: DecoratedRequest
) {
  let xhr = $.ajax(jquerySettings);
  xhr
    .done((response) => {
      decoratedRequest.handleDone(response);
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      decoratedRequest.handleFail(textStatus.toString());
    });
  return xhr;
}
