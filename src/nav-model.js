/**
* Class for storing and interacting with a route's navigation settings.
*/
export class NavModel {

  /**
  * True if this nav item is currently active.
  */
  isActive: boolean = false;

  /**
  * The title.
  */
  title: string = null;

  /**
  * This nav item's absolute href.
  */
  href: string = null;

  /**
  * This nav item's relative href.
  */
  relativeHref: string = null;

  /**
  * Data attached to the route at configuration time.
  */
  settings: any = {};

  /**
  * The route config.
  */
  config: RouteConfig = null;

  /**
  * The router associated with this navigation model.
  */
  router: Router;

  constructor(router: Router, relativeHref: string) {
    this.router = router;
    this.relativeHref = relativeHref;
  }

  /**
  * Sets the route's title and updates document.title.
  *  If the a navigation is in progress, the change will be applied
  *  to document.title when the navigation completes.
  *
  * @param title The new title.
  */
  setTitle(title: string): void {
    this.title = title;

    if (this.isActive) {
      this.router.updateTitle();
    }
  }
}
