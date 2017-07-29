import { FrameworkConfiguration, Loader, Aurelia, relativeToFile } from 'aurelia-framework';
import { PipelineStep, NavigationInstruction, Next } from 'aurelia-router';

export class ConfigurationLoaderStep implements PipelineStep {
    private loader: Loader;
    constructor(private aurelia: Aurelia){
        this.loader = aurelia.loader;
    }

    run(instruction: NavigationInstruction, next: Next): Promise<any> {
        if(instruction.config.settings.hasConfiguration 
            && !instruction.config.settings.isConfigured) {
            let moduleId = relativeToFile('./configure', instruction.config.moduleId);

            return this.loader.loadModule(moduleId)
                .then(m => m.configure(new FrameworkConfiguration(this.aurelia)))
                .then(() => {
                    instruction.config.settings.isConfigured = true;
                    return next();
                });
        }

        return next();
    }
}