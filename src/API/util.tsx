import axios, { AxiosRequestConfig } from 'axios';

export interface DecoratedRequest {
  route: string;
  handleDone: (r: any) => void;
  handleFail: (e: string) => void;
  handleFinally: () => void;
  data?: string|null,
}

export function get(request: DecoratedRequest) {
  request.route = "https://localhost:7029/" + request.route;
  let axiosSettings = createAxiosSettings(request);
  axiosSettings.method = "GET";
  axiosSettings.responseType = "json";

  send(axiosSettings, request);
}

export function post(request: DecoratedRequest) {
  request.route = "https://localhost:7029/" + request.route;
  const axiosSettings = createAxiosSettings(request);
  axiosSettings.method = "POST";
  axiosSettings.headers = {
    'Content-Type': 'application/json'
  }
  console.log("!!!json-string-data", axiosSettings)
  send(axiosSettings, request);
}

function createAxiosSettings(request: DecoratedRequest): AxiosRequestConfig {
  let settings: AxiosRequestConfig = {
    url: request.route,
  };
  if (request.data) {
    settings.data = request.data;
  }

  return settings;
}

function send(
  axiosSettings: AxiosRequestConfig,
  decoratedRequest: DecoratedRequest
) {
  let xhr = axios(axiosSettings);
  xhr
    .then((response) => {
      decoratedRequest.handleDone(response.data);
    })
    .catch((error) => {
      decoratedRequest.handleFail(error.message);
    })
    .finally(() => {
      decoratedRequest.handleFinally();
    });
  return xhr;
}
