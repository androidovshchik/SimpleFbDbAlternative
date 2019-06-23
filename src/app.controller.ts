import {Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Req, Res} from '@nestjs/common';
import {AppService} from './app.service';
import {Request, Response} from 'express';
import {Folder} from './folder';
import {AppModule} from './app.module';
import ip from 'ip';

@Controller()
export class AppController {

    // blocking browser requests
    static readonly USER_AGENT = 'Battle-Server';

    constructor(private readonly appService: AppService) {
    }

    @Get()
    getIp(): string {
        return ip.address();
    }

    /**
     * @param body assuming plain object
     */
    @Post('db/:db/doc/:path(*)')
    insertDocument(@Req() req: Request, @Param('db') db: string, @Param('path') path: string, @Body() body, @Res() res: Response) {
        if (req.get('user-agent') == AppController.USER_AGENT) {
            this.appService.insertDocument(db, new Folder(path), body, error => {
                res.status(HttpStatus.OK).json({
                    _error: error
                })
            });
        } else {
            res.status(HttpStatus.BAD_REQUEST).send()
        }
    }

    /**
     * @param body assuming plain object
     */
    @Put('db/:db/doc/:path(*)')
    updateDocument(@Req() req: Request, @Param('db') db: string, @Param('path') path: string, @Body() body, @Res() res: Response) {
        if (req.get('user-agent') == AppController.USER_AGENT) {
            this.appService.updateDocument(db, new Folder(path), body, error => {
                res.status(HttpStatus.OK).json({
                    _error: error
                })
            });
        } else {
            res.status(HttpStatus.BAD_REQUEST).send()
        }
    }

    @Get('db/:db/doc/:path(*)')
    getDocument(@Req() req: Request, @Param('db') db: string, @Param('path') path: string, @Res() res: Response) {
        if (req.get('user-agent') == AppController.USER_AGENT) {
            this.appService.getDocument(db, new Folder(path), (error, document?) => {
                if (AppModule.TEST) {
                    res.status(HttpStatus.OK).json(JSON.parse(JSON.stringify(document, (k, v) => {
                        return k === '_id' ? undefined : v;
                    })))
                } else {
                    res.status(HttpStatus.OK).json({
                        ...document,
                        _error: error
                    })
                }
            });
        } else {
            res.status(HttpStatus.BAD_REQUEST).send()
        }
    }

    @Get('db/:db/collection/:path(*)')
    getCollection(@Req() req: Request, @Param('db') db: string, @Param('path') path: string, @Res() res: Response) {
        if (req.get('user-agent') == AppController.USER_AGENT) {
            this.appService.getCollection(db, new Folder(path), (error, documents) => {
                if (AppModule.TEST) {
                    res.status(HttpStatus.OK).json(JSON.parse(JSON.stringify(documents, (k, v) => {
                        return k === '_id' ? undefined : v;
                    })))
                } else {
                    res.status(HttpStatus.OK).json({
                        docs: documents,
                        _error: error
                    })
                }
            });
        } else {
            res.status(HttpStatus.BAD_REQUEST).send()
        }
    }

    @Delete('db/:db/doc/:path(*)')
    removeDocument(@Req() req: Request, @Param('db') db: string, @Param('path') path: string, @Res() res: Response) {
        if (req.get('user-agent') == AppController.USER_AGENT) {
            this.appService.removeDocument(db, new Folder(path), error => {
                res.status(HttpStatus.OK).json({
                    _error: error
                })
            });
        } else {
            res.status(HttpStatus.BAD_REQUEST).send()
        }
    }
}
