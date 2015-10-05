import {activationStrategy} from './navigation-plan';
import {DOM} from 'aurelia-pal';

export class NavigationContext {
  constructor(router: Router, nextInstruction: NavigationInstruction) {
    this.router = router;
    this.nextInstruction = nextInstruction;
    this.currentInstruction = router.currentInstruction;
    this.prevInstruction = router.currentInstruction;
  }

  getAllContexts(acc?: Array<NavigationContext> = []): Array<NavigationContext> {
    acc.push(this);
    if (this.plan) {
      for (let key in this.plan) {
        this.plan[key].childNavigationContext && this.plan[key].childNavigationContext.getAllContexts(acc);
      }
    }
    return acc;
  }

  get nextInstructions(): Array<NavigationInstruction> {
    return this.getAllContexts().map(c => c.nextInstruction).filter(c => c);
  }

  get currentInstructions(): Array<NavigationInstruction> {
    return this.getAllContexts().map(c => c.currentInstruction).filter(c => c);
  }

  get prevInstructions(): Array<NavigationInstruction> {
    return this.getAllContexts().map(c => c.prevInstruction).filter(c => c);
  }

  commitChanges(waitToSwap: boolean) {
    let next = this.nextInstruction;
    let prev = this.prevInstruction;
    let viewPortInstructions = next.viewPortInstructions;
    let router = this.router;
    let loads = [];
    let delaySwaps = [];

    router.currentInstruction = next;

    if (prev) {
      prev.config.navModel.isActive = false;
    }

    next.config.navModel.isActive = true;

    router.refreshBaseUrl();
    router.refreshNavigation();

    for (let viewPortName in viewPortInstructions) {
      let viewPortInstruction = viewPortInstructions[viewPortName];
      let viewPort = router.viewPorts[viewPortName];

      if (!viewPort) {
        throw new Error(`There was no router-view found in the view for ${viewPortInstruction.moduleId}.`);
      }

      if (viewPortInstruction.strategy === activationStrategy.replace) {
        if (waitToSwap) {
          delaySwaps.push({viewPort, viewPortInstruction});
        }

        loads.push(viewPort.process(viewPortInstruction, waitToSwap).then((x) => {
          if ('childNavigationContext' in viewPortInstruction) {
            return viewPortInstruction.childNavigationContext.commitChanges();
          }
        }));
      } else {
        if ('childNavigationContext' in viewPortInstruction) {
          loads.push(viewPortInstruction.childNavigationContext.commitChanges(waitToSwap));
        }
      }
    }

    return Promise.all(loads).then(() => {
      delaySwaps.forEach(x => x.viewPort.swap(x.viewPortInstruction));
    });
  }

  updateTitle(): void {
    let title = this.buildTitle();
    if (title) {
      DOM.title = title;
    }
  }

  buildTitle(separator: string = ' | '): string {
    let next = this.nextInstruction;
    let title = next.config.navModel.title || '';
    let viewPortInstructions = next.viewPortInstructions;
    let childTitles = [];

    for (let viewPortName in viewPortInstructions) {
      let viewPortInstruction = viewPortInstructions[viewPortName];

      if ('childNavigationContext' in viewPortInstruction) {
        let childTitle = viewPortInstruction.childNavigationContext.buildTitle(separator);
        if (childTitle) {
          childTitles.push(childTitle);
        }
      }
    }

    if (childTitles.length) {
      title = childTitles.join(separator) + (title ? separator : '') + title;
    }

    if (this.router.title) {
      title += (title ? separator : '') + this.router.title;
    }

    return title;
  }
}

export class CommitChangesStep {
  run(navigationContext: NavigationContext, next: Function) {
    return navigationContext.commitChanges(true).then(() => {
      navigationContext.updateTitle();
      return next();
    });
  }
}
