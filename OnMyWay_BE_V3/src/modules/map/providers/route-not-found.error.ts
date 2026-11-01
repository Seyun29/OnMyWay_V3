export class RouteNotFoundError extends Error {
  constructor(message = 'No route found') {
    super(message);
    this.name = 'RouteNotFoundError';
  }
}
