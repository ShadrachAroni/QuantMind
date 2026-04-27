export class AbortManager {
  private static controllers: Set<AbortController> = new Set();

  static createController(): AbortController {
    const controller = new AbortController();
    this.controllers.add(controller);
    return controller;
  }

  static getSignal(): AbortSignal {
    const controller = this.createController();
    return controller.signal;
  }

  static removeController(controller: AbortController) {
    this.controllers.delete(controller);
  }

  static abortAll() {
    this.controllers.forEach(controller => {
      try {
        controller.abort('Session terminated due to inactivity');
      } catch (e) {
        // Ignore errors from already aborted controllers
      }
    });
    this.controllers.clear();
  }
}
