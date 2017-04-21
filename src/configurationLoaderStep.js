import { FrameworkConfiguration, Loader, Aurelia } from 'aurelia-framework';
import { PipelineStep, NavigationInstruction, Next } from 'aurelia-router';

export class ConfigurationLoaderStep implements PipelineStep {
    private loader: Loader;
    constructor(private aurelia: Aurelia){
        this.loader = aurelia.loader;
    }

    run(instruction: NavigationInstruction, next: Next): Promise<any> {
        if(instruction.config.settings.hasConfiguration) {
            if(!instruction.config.settings.isConfigured){
                let path = instruction.config.moduleId;
                let paths = path.split('/');
                paths[paths.length - 1] = 'configure';
                let moduleId = paths.join('/');

                return this.loader.loadModule(moduleId)
                    .then(m => m.configure(new FrameworkConfiguration(this.aurelia)))
                    .then(() => {
                        instruction.config.settings.isConfigured = true;
                        return next();
                    });
            }
        }

        return next();
    }
}
