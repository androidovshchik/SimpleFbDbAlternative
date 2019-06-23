import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {BattlesGateway} from "./battles.gateway";

@Module({
    controllers: [
        AppController
    ],
    providers: [
        BattlesGateway,
        AppService
    ]
})
export class AppModule {

    static TEST = false;

    static DEBUG = false;
}
