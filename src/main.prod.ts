import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {NestExpressApplication} from '@nestjs/platform-express';

console.log = () => {
};

Date.prototype.toJSON = function () {
    return this.getTime();
};

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bodyParser: true
    });
    await app.listen(3210, '0.0.0.0');
}

bootstrap()
    .catch(error => {
        console.error(error)
    });
