import {OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer,} from '@nestjs/websockets';
import {Server} from 'ws';
import {AppService} from './app.service';
import {Note, NoteEvent} from './app.models';
import {Socket} from 'socket.io';
import {Folder} from './folder';
import _ from 'lodash';

@WebSocketGateway()
export class BattlesGateway implements OnGatewayInit {

    @WebSocketServer()
    server: Server;

    private paths = new Set<string>();

    constructor(private readonly appService: AppService) {
    }

    afterInit(server: Server) {
        server.on("error", (socket: WebSocket, error: Error) => {
            if (error) {
                console.error(error);
            }
        });
        this.appService.onFight$
            .asObservable()
            .subscribe((note: Note) => {
                const folder = new Folder(note._path);
                this.paths.forEach(_path => {
                    if (folder.includes(_path)) {
                        const event = Folder.format(`db/battles/doc/${_path}`);
                        if (note._event == NoteEvent.REMOVE) {
                            server.emit(event, null);
                        } else {
                            const doc = folder.extractDoc(note, _path);
                            server.emit(event, doc ? {
                                ...doc,
                                _event: note._event
                            } : null);
                        }
                    }
                });
            });
    }

    @SubscribeMessage('subscribe')
    onSubscribe(client: Socket, data) {
        try {
            data = JSON.parse(data);
            if (_.isPlainObject(data)) {
                if (_.isString(data.path)) {
                    this.paths.add(Folder.format(data.path));
                }
            }
        } catch (e) {
        }
    }

    @SubscribeMessage('unsubscribe')
    onUnsubscribe(client: Socket, data) {
        try {
            data = JSON.parse(data);
            if (_.isPlainObject(data)) {
                if (_.isString(data.path)) {
                    this.paths.delete(Folder.format(data.path));
                }
            }
        } catch (e) {
        }
    }
}
